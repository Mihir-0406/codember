/**
 * Kanban Components
 * Column and Card components for the Kanban board
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, StatusBadge, PriorityBadge, TypeBadge, Badge } from '@/components/ui';
import { formatDate, formatRelative, isOverdue } from '@/lib/date-utils';
import { RequestStatus, RequestPriority, RequestType } from '@prisma/client';

export interface RequestCardData {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  type: RequestType;
  scheduledDate: string | null;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    serialNumber: string;
    location: string;
    status: string;
  };
  team: {
    id: string;
    name: string;
    color: string;
  } | null;
  technician: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ id, title, color, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-80 bg-gray-100 rounded-xl flex flex-col transition-colors',
        isOver && 'bg-gray-200 ring-2 ring-brand-500 ring-inset'
      )}
    >
      {/* Column Header */}
      <div className="p-4 flex items-center gap-3">
        <span className={cn('w-3 h-3 rounded-full', color)} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-2 pt-0 space-y-3 overflow-y-auto min-h-[200px] max-h-[calc(100vh-280px)]">
        {children}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  request: RequestCardData;
  isDragging?: boolean;
}

export function KanbanCard({ request, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue =
    isOverdue(request.scheduledDate) &&
    request.status !== 'REPAIRED' &&
    request.status !== 'SCRAP';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white rounded-lg p-4 shadow-sm border cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow',
        isDragging && 'shadow-xl ring-2 ring-brand-500 opacity-90',
        overdue ? 'border-red-200 overdue-pulse' : 'border-gray-200'
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={`/requests/${request.id}`}
          className="font-medium text-gray-900 hover:text-brand-600 line-clamp-2"
          onClick={(e) => e.stopPropagation()}
        >
          {request.title}
        </Link>
        {overdue && (
          <Badge variant="error" size="sm">
            Overdue
          </Badge>
        )}
      </div>

      {/* Equipment Info */}
      <p className="text-sm text-gray-500 truncate mb-3">
        {request.equipment.name}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <PriorityBadge priority={request.priority} />
        <TypeBadge type={request.type} />
      </div>

      {/* Scheduled Date */}
      {request.scheduledDate && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(request.scheduledDate)}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        {/* Team */}
        {request.team ? (
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: request.team.color }}
            />
            <span className="text-xs text-gray-500 truncate max-w-[100px]">
              {request.team.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">No team</span>
        )}

        {/* Technician */}
        {request.technician ? (
          <Avatar
            name={request.technician.name}
            src={request.technician.avatar}
            size="sm"
          />
        ) : (
          <span className="text-xs text-gray-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}
