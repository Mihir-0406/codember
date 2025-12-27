/**
 * Maintenance Request Detail Page
 * Shows request details with status transitions and activity log
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout';
import {
  Card,
  Button,
  StatusBadge,
  Badge,
  PageLoading,
  Avatar,
  Modal,
  Input,
  Select,
} from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { getPriorityLabel, getTypeLabel, getCategoryLabel } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { getValidTransitions, getTransitionLabel, isValidTransition } from '@/lib/state-machine';
import toast from 'react-hot-toast';

interface RequestLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TeamMember {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  repairDuration: number | null;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  equipment: {
    id: string;
    name: string;
    serialNumber: string;
    category: string;
    department: string;
    location: string;
    status: string;
  };
  team: {
    id: string;
    name: string;
    color: string;
    members: TeamMember[];
  } | null;
  technician: {
    id: string;
    name: string;
    email: string;
  } | null;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  logs: RequestLog[];
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const requestId = params.id as string;

  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);
  const [transitionData, setTransitionData] = useState({
    duration: '',
    notes: '',
  });
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}`);
      const result = await response.json();

      if (result.success) {
        setRequest(result.data);
      } else {
        toast.error('Request not found');
        router.push('/requests');
      }
    } catch (error) {
      toast.error('Failed to load request');
      router.push('/requests');
    } finally {
      setLoading(false);
    }
  }, [requestId, router]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleTransition = async () => {
    if (!targetStatus) return;

    if (targetStatus === 'REPAIRED' && !transitionData.duration) {
      toast.error('Repair duration is required');
      return;
    }

    setProcessing(true);
    try {
      const payload: any = {
        newStatus: targetStatus,
      };

      if (targetStatus === 'REPAIRED') {
        payload.duration = parseInt(transitionData.duration);
        if (transitionData.notes) {
          payload.notes = transitionData.notes;
        }
      }

      const response = await fetch(`/api/requests/${requestId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Request moved to ${getTransitionLabel(targetStatus)}`);
        setShowTransitionModal(false);
        setTransitionData({ duration: '', notes: '' });
        setTargetStatus(null);
        fetchRequest();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTechnician) {
      toast.error('Please select a technician');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selectedTechnician }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Technician assigned successfully');
        setShowAssignModal(false);
        setSelectedTechnician('');
        fetchRequest();
      } else {
        toast.error(result.error || 'Failed to assign technician');
      }
    } catch (error) {
      toast.error('Failed to assign technician');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Request deleted successfully');
        router.push('/requests');
      } else {
        toast.error(result.error || 'Failed to delete request');
      }
    } catch (error) {
      toast.error('Failed to delete request');
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
    }
  };

  const initiateTransition = (status: string) => {
    setTargetStatus(status);
    if (status === 'REPAIRED' || status === 'SCRAP') {
      setShowTransitionModal(true);
    } else {
      // For IN_PROGRESS, transition directly
      handleDirectTransition(status);
    }
  };

  const handleDirectTransition = async (status: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: status }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Request moved to ${getTransitionLabel(status)}`);
        fetchRequest();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const canEdit = session?.user && hasPermission(session.user.role, 'requests:update');
  const canDelete = session?.user && hasPermission(session.user.role, 'requests:delete');
  const canAssign = session?.user && hasPermission(session.user.role, 'requests:assign');

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const validTransitions = getValidTransitions(request.status);
  const isTerminal = ['REPAIRED', 'SCRAP'].includes(request.status);
  const teamTechnicians = request.team?.members.filter(
    (m) => m.user.role === 'TECHNICIAN' || m.user.role === 'MANAGER'
  ) || [];

  return (
    <div>
      <Header
        title={request.title}
        description={`Request #${request.id.slice(0, 8).toUpperCase()}`}
        showBack
        backHref="/requests"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={request.status} size="lg" />
                <Badge
                  variant={request.type === 'CORRECTIVE' ? 'danger' : 'success'}
                >
                  {getTypeLabel(request.type)}
                </Badge>
                <Badge
                  variant={
                    request.priority === 'CRITICAL'
                      ? 'danger'
                      : request.priority === 'HIGH'
                      ? 'warning'
                      : 'default'
                  }
                >
                  {getPriorityLabel(request.priority)}
                </Badge>
              </div>

              {/* Status Transition Buttons */}
              {canEdit && validTransitions.length > 0 && (
                <div className="flex gap-2">
                  {validTransitions.map((status) => (
                    <Button
                      key={status}
                      variant={status === 'SCRAP' ? 'danger' : status === 'REPAIRED' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => initiateTransition(status)}
                      disabled={processing}
                    >
                      {getTransitionLabel(status)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>

            {request.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </Card>

          {/* Equipment Info */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Equipment</h3>
                <p className="text-sm text-gray-500">Related equipment information</p>
              </div>
              <Link href={`/equipment/${request.equipment.id}`}>
                <Button variant="ghost" size="sm">View Equipment</Button>
              </Link>
            </div>

            <dl className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.equipment.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {request.equipment.serialNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1">
                  <Badge variant="default">{getCategoryLabel(request.equipment.category)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{request.equipment.location}</dd>
              </div>
            </dl>
          </Card>

          {/* Activity Log */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h3>
            {request.logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            ) : (
              <div className="relative">
                <div className="absolute top-0 left-5 h-full w-0.5 bg-gray-100"></div>
                <div className="space-y-4">
                  {request.logs.map((log, index) => (
                    <div key={log.id} className="relative flex gap-4">
                      <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-gray-200">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {log.action === 'CREATED' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          )}
                          {log.action === 'STATUS_CHANGED' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          )}
                          {log.action === 'ASSIGNED' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          )}
                          {log.action === 'UPDATED' && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          )}
                          {!['CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'UPDATED'].includes(log.action) && (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{log.user.name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(log.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {log.action === 'CREATED' && 'Created this request'}
                          {log.action === 'STATUS_CHANGED' && `Changed status${log.details ? `: ${log.details}` : ''}`}
                          {log.action === 'ASSIGNED' && `Assigned technician${log.details ? `: ${log.details}` : ''}`}
                          {log.action === 'UPDATED' && `Updated request${log.details ? `: ${log.details}` : ''}`}
                          {!['CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'UPDATED'].includes(log.action) && log.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {(canEdit || canDelete) && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                {canEdit && !isTerminal && (
                  <Link href={`/requests/${request.id}/edit`} className="block">
                    <Button variant="secondary" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Request
                    </Button>
                  </Link>
                )}
                {canAssign && !isTerminal && request.team && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowAssignModal(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assign Technician
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Request
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Technician */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assigned Technician</h3>
            {request.technician ? (
              <div className="flex items-center gap-3">
                <Avatar name={request.technician.name} />
                <div>
                  <p className="font-medium text-gray-900">{request.technician.name}</p>
                  <p className="text-xs text-gray-500">{request.technician.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No technician assigned</p>
            )}
          </Card>

          {/* Team */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Maintenance Team</h3>
            {request.team ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: request.team.color }}
                >
                  {request.team.name.charAt(0)}
                </div>
                <div>
                  <Link
                    href={`/teams/${request.team.id}`}
                    className="font-medium text-gray-900 hover:text-brand-600"
                  >
                    {request.team.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {request.team.members.length} member(s)
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No team assigned</p>
            )}
          </Card>

          {/* Requested By */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Requested By</h3>
            <div className="flex items-center gap-3">
              <Avatar name={request.requestedBy.name} />
              <div>
                <p className="font-medium text-gray-900">{request.requestedBy.name}</p>
                <p className="text-xs text-gray-500">{request.requestedBy.email}</p>
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dates</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm text-gray-900">{formatDate(request.createdAt)}</dd>
              </div>
              {request.scheduledDate && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Scheduled</dt>
                  <dd className="text-sm text-gray-900">{formatDate(request.scheduledDate)}</dd>
                </div>
              )}
              {request.closedAt && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Closed</dt>
                  <dd className="text-sm text-gray-900">{formatDate(request.closedAt)}</dd>
                </div>
              )}
              {request.repairDuration && (
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Repair Duration</dt>
                  <dd className="text-sm text-gray-900">{request.repairDuration} hours</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>

      {/* Transition Modal */}
      <Modal
        isOpen={showTransitionModal}
        onClose={() => {
          setShowTransitionModal(false);
          setTargetStatus(null);
          setTransitionData({ duration: '', notes: '' });
        }}
        title={targetStatus === 'REPAIRED' ? 'Complete Repair' : 'Mark as Scrap'}
      >
        {targetStatus === 'REPAIRED' ? (
          <div className="space-y-4">
            <Input
              type="number"
              label="Repair Duration (hours)"
              placeholder="Enter hours spent"
              value={transitionData.duration}
              onChange={(e) =>
                setTransitionData((prev) => ({ ...prev, duration: e.target.value }))
              }
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Add any notes about the repair..."
                value={transitionData.notes}
                onChange={(e) =>
                  setTransitionData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-800">Warning</h4>
                <p className="text-sm text-red-700">
                  Marking this request as scrap will also mark the equipment as <strong>SCRAPPED</strong>.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowTransitionModal(false);
              setTargetStatus(null);
              setTransitionData({ duration: '', notes: '' });
            }}
          >
            Cancel
          </Button>
          <Button
            variant={targetStatus === 'SCRAP' ? 'danger' : 'primary'}
            onClick={handleTransition}
            loading={processing}
          >
            {targetStatus === 'REPAIRED' ? 'Complete Repair' : 'Mark as Scrap'}
          </Button>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedTechnician('');
        }}
        title="Assign Technician"
      >
        <Select
          label="Select Technician"
          options={[
            { value: '', label: 'Select a technician' },
            ...teamTechnicians.map((m) => ({
              value: m.userId,
              label: m.user.name,
            })),
          ]}
          value={selectedTechnician}
          onChange={(e) => setSelectedTechnician(e.target.value)}
        />
        {teamTechnicians.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            No technicians available in this team. Add team members first.
          </p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAssignModal(false);
              setSelectedTechnician('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            loading={processing}
            disabled={!selectedTechnician}
          >
            Assign Technician
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Request"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this maintenance request? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={processing}>
            Delete Request
          </Button>
        </div>
      </Modal>
    </div>
  );
}
