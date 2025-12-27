/**
 * Kanban Board Page
 * Drag-and-drop interface for managing maintenance request states
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Header } from '@/components/layout';
import { PageLoading, Modal, Input, Textarea, Button } from '@/components/ui';
import { KanbanColumn, KanbanCard, RequestCardData } from '@/components/kanban';
import { RequestStatus } from '@prisma/client';
import { getValidNextStates, validateTransition } from '@/lib/state-machine';
import toast from 'react-hot-toast';

const columns: { id: RequestStatus; title: string; color: string }[] = [
  { id: 'NEW', title: 'New', color: 'bg-blue-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-amber-500' },
  { id: 'REPAIRED', title: 'Repaired', color: 'bg-green-500' },
  { id: 'SCRAP', title: 'Scrapped', color: 'bg-red-500' },
];

export default function KanbanPage() {
  const [requests, setRequests] = useState<RequestCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showScrapModal, setShowScrapModal] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{
    requestId: string;
    targetStatus: RequestStatus;
  } | null>(null);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/requests?limit=100');
      const result = await response.json();

      if (result.success) {
        setRequests(result.data.items);
      } else {
        toast.error('Failed to load requests');
      }
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const getRequestsByStatus = (status: RequestStatus) => {
    return requests.filter((r) => r.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const requestId = active.id as string;
    const targetStatus = over.id as RequestStatus;

    // Find the request
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    // Check if dropped in a different column
    if (request.status === targetStatus) return;

    // Validate the transition
    const validation = validateTransition(request.status, targetStatus);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid status transition');
      return;
    }

    // If moving to REPAIRED, show modal to collect duration
    if (targetStatus === 'REPAIRED') {
      setPendingTransition({ requestId, targetStatus });
      setShowCompleteModal(true);
      return;
    }

    // If moving to SCRAP, show confirmation
    if (targetStatus === 'SCRAP') {
      setPendingTransition({ requestId, targetStatus });
      setShowScrapModal(true);
      return;
    }

    // Perform the transition
    await performTransition(requestId, targetStatus);
  };

  const performTransition = async (
    requestId: string,
    targetStatus: RequestStatus,
    duration?: number,
    notes?: string
  ) => {
    setTransitioning(true);

    // Optimistic update
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: targetStatus } : r
      )
    );

    try {
      const body: Record<string, unknown> = { status: targetStatus };
      if (duration) body.durationMinutes = duration;
      if (notes) body.repairNotes = notes;

      const response = await fetch(`/api/requests/${requestId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        // Revert optimistic update
        fetchRequests();
        toast.error(result.error || 'Failed to update status');
      } else {
        toast.success(`Request moved to ${targetStatus.replace('_', ' ')}`);
        
        if (targetStatus === 'SCRAP') {
          toast.success('Equipment has been marked as scrapped');
        }
      }
    } catch (error) {
      fetchRequests();
      toast.error('Failed to update status');
    } finally {
      setTransitioning(false);
      setShowCompleteModal(false);
      setShowScrapModal(false);
      setPendingTransition(null);
      setDurationMinutes('');
      setRepairNotes('');
    }
  };

  const handleCompleteSubmit = () => {
    if (!pendingTransition) return;

    const duration = parseInt(durationMinutes);
    if (!duration || duration <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }

    performTransition(
      pendingTransition.requestId,
      pendingTransition.targetStatus,
      duration,
      repairNotes
    );
  };

  const handleScrapConfirm = () => {
    if (!pendingTransition) return;
    performTransition(pendingTransition.requestId, pendingTransition.targetStatus);
  };

  const activeRequest = activeId
    ? requests.find((r) => r.id === activeId)
    : null;

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <Header
        title="Kanban Board"
        description="Drag and drop requests to update their status"
        action={{
          label: 'New Request',
          href: '/requests/new',
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6 -mx-8 px-8">
          {columns.map((column) => {
            const columnRequests = getRequestsByStatus(column.id);
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                count={columnRequests.length}
              >
                <SortableContext
                  items={columnRequests.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnRequests.map((request) => (
                    <KanbanCard
                      key={request.id}
                      request={request}
                      isDragging={request.id === activeId}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeRequest && (
            <KanbanCard request={activeRequest} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => {
          setShowCompleteModal(false);
          setPendingTransition(null);
        }}
        title="Complete Repair"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please enter the repair duration and any notes before marking this request as repaired.
          </p>

          <Input
            label="Repair Duration (minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="e.g., 120"
            required
            min={1}
          />

          <Textarea
            label="Repair Notes"
            value={repairNotes}
            onChange={(e) => setRepairNotes(e.target.value)}
            placeholder="Describe what was done to repair the equipment..."
            rows={4}
          />

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCompleteModal(false);
                setPendingTransition(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSubmit}
              loading={transitioning}
            >
              Mark as Repaired
            </Button>
          </div>
        </div>
      </Modal>

      {/* Scrap Confirmation Modal */}
      <Modal
        isOpen={showScrapModal}
        onClose={() => {
          setShowScrapModal(false);
          setPendingTransition(null);
        }}
        title="Scrap Equipment"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 font-medium">Warning</p>
            <p className="text-red-600 text-sm mt-1">
              This action will mark the equipment as scrapped. No new maintenance requests
              can be created for scrapped equipment. This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowScrapModal(false);
                setPendingTransition(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleScrapConfirm}
              loading={transitioning}
            >
              Confirm Scrap
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
