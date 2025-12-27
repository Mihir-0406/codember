/**
 * Maintenance Requests List Page
 * Displays all maintenance requests with filtering
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout';
import {
  Card,
  Input,
  Select,
  Button,
  StatusBadge,
  Badge,
  PageLoading,
  EmptyState,
  NoDataIcon,
  Avatar,
} from '@/components/ui';
import { formatDate, isDateInPast } from '@/lib/date-utils';
import { getPriorityLabel, getTypeLabel } from '@/lib/utils';
import toast from 'react-hot-toast';
import { debounce } from '@/lib/utils';

interface MaintenanceRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  createdAt: string;
  equipment: {
    id: string;
    name: string;
    serialNumber: string;
    location: string;
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
  } | null;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'CORRECTIVE', label: 'Corrective' },
  { value: 'PREVENTIVE', label: 'Preventive' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REPAIRED', label: 'Repaired' },
  { value: 'SCRAP', label: 'Scrap' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export default function RequestsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);

      const response = await fetch(`/api/requests?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setRequests(result.data.items);
        setPagination((prev) => ({
          ...prev,
          ...result.data.pagination,
        }));
      } else {
        toast.error('Failed to load requests');
      }
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, type, status, priority]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  return (
    <div>
      <Header
        title="Maintenance Requests"
        description="Manage all maintenance requests"
        action={{
          label: 'New Request',
          href: '/requests/new',
        }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search requests..."
              defaultValue={search}
              onChange={(e) => debouncedSearch(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-36">
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
          <div className="w-36">
            <Select
              options={priorityOptions}
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            />
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8">
            <PageLoading />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<NoDataIcon />}
            title="No requests found"
            description={
              search || type || status || priority
                ? 'Try adjusting your filters'
                : 'Get started by creating your first maintenance request'
            }
            action={
              !search && !type && !status && !priority ? (
                <Link href="/requests/new">
                  <Button>New Request</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Scheduled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const isOverdue =
                    request.scheduledDate &&
                    isDateInPast(request.scheduledDate) &&
                    !['REPAIRED', 'SCRAP'].includes(request.status);

                  return (
                    <tr key={request.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td>
                        <Link
                          href={`/requests/${request.id}`}
                          className="hover:text-brand-600"
                        >
                          <div className="font-medium text-gray-900">
                            {request.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(request.createdAt)}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <Link
                          href={`/equipment/${request.equipment.id}`}
                          className="text-gray-600 hover:text-brand-600"
                        >
                          {request.equipment.name}
                        </Link>
                        <div className="text-xs text-gray-400">
                          {request.equipment.location}
                        </div>
                      </td>
                      <td>
                        <Badge
                          variant={request.type === 'CORRECTIVE' ? 'danger' : 'success'}
                        >
                          {getTypeLabel(request.type)}
                        </Badge>
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                      <td>
                        {request.technician ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={request.technician.name} size="sm" />
                            <span className="text-gray-600 text-sm">
                              {request.technician.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {request.scheduledDate ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                            {formatDate(request.scheduledDate)}
                            {isOverdue && (
                              <span className="block text-xs text-red-500">Overdue</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/requests/${request.id}`}
                          className="btn-ghost btn-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
