/**
 * Equipment Detail Page
 * Shows equipment details with Maintenance button (badge for open requests)
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
} from '@/components/ui';
import { formatDate, formatDateTime, isDateInPast } from '@/lib/date-utils';
import { getCategoryLabel, getPriorityLabel, getStatusLabel, getTypeLabel } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import toast from 'react-hot-toast';

interface MaintenanceRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  createdAt: string;
  technician: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  department: string;
  location: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry: string | null;
  notes: string | null;
  defaultTeam: {
    id: string;
    name: string;
    color: string;
  } | null;
  assignedEmployee: {
    id: string;
    name: string;
    email: string;
  } | null;
  maintenanceRequests: MaintenanceRequest[];
  _count: {
    maintenanceRequests: number;
  };
}

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const equipmentId = params.id as string;

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchEquipment = useCallback(async () => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`);
      const result = await response.json();

      if (result.success) {
        setEquipment(result.data);
      } else {
        toast.error('Equipment not found');
        router.push('/equipment');
      }
    } catch (error) {
      toast.error('Failed to load equipment');
      router.push('/equipment');
    } finally {
      setLoading(false);
    }
  }, [equipmentId, router]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/equipment/${equipmentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Equipment deleted successfully');
        router.push('/equipment');
      } else {
        toast.error(result.error || 'Failed to delete equipment');
      }
    } catch (error) {
      toast.error('Failed to delete equipment');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const canEdit = session?.user && hasPermission(session.user.role, 'equipment:update');
  const canDelete = session?.user && hasPermission(session.user.role, 'equipment:delete');
  const canCreateRequest = session?.user && hasPermission(session.user.role, 'requests:create');

  // Count open (non-terminal) requests
  const openRequestsCount = equipment?.maintenanceRequests.filter(
    (r) => r.status === 'NEW' || r.status === 'IN_PROGRESS'
  ).length || 0;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (!equipment) {
    return null;
  }

  const warrantyExpired = equipment.warrantyExpiry && isDateInPast(equipment.warrantyExpiry);

  return (
    <div>
      <Header
        title={equipment.name}
        description={equipment.serialNumber}
        showBack
        backHref="/equipment"
        action={
          canCreateRequest ? (
            <Link href={`/requests/new?equipmentId=${equipment.id}`}>
              <Button className="relative">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Maintenance
                {openRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                    {openRequestsCount}
                  </span>
                )}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Info */}
          <Card>
            <div className="flex items-start justify-between mb-6">
              <div>
                <StatusBadge status={equipment.status} size="lg" />
              </div>
              {(canEdit || canDelete) && (
                <div className="flex gap-2">
                  {canEdit && (
                    <Link href={`/equipment/${equipment.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </Button>
                    </Link>
                  )}
                  {canDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1">
                  <Badge variant="default">{getCategoryLabel(equipment.category)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{equipment.serialNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{equipment.location}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(equipment.purchaseDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Warranty Expiry</dt>
                <dd className="mt-1 text-sm">
                  {equipment.warrantyExpiry ? (
                    <span className={warrantyExpired ? 'text-red-600' : 'text-gray-900'}>
                      {formatDate(equipment.warrantyExpiry)}
                      {warrantyExpired && (
                        <span className="ml-2 text-xs text-red-500">(Expired)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not specified</span>
                  )}
                </dd>
              </div>
            </dl>

            {equipment.notes && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{equipment.notes}</p>
              </div>
            )}
          </Card>

          {/* Maintenance History */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Maintenance History
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({equipment.maintenanceRequests.length} total)
                </span>
              </h3>
              {canCreateRequest && (
                <Link href={`/requests/new?equipmentId=${equipment.id}`}>
                  <Button variant="secondary" size="sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Request
                  </Button>
                </Link>
              )}
            </div>

            {equipment.maintenanceRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No maintenance requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {equipment.maintenanceRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className="block p-4 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={request.status} size="sm" />
                          <Badge
                            variant={request.type === 'CORRECTIVE' ? 'danger' : 'success'}
                            size="sm"
                          >
                            {getTypeLabel(request.type)}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">
                          {request.title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>Created {formatDate(request.createdAt)}</span>
                          {request.scheduledDate && (
                            <span>Scheduled {formatDate(request.scheduledDate)}</span>
                          )}
                        </div>
                      </div>
                      {request.technician && (
                        <div className="ml-4 flex items-center gap-2">
                          <Avatar
                            name={request.technician.name}
                            size="sm"
                          />
                          <span className="text-sm text-gray-600 hidden sm:inline">
                            {request.technician.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Team */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Default Team</h3>
            {equipment.defaultTeam ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: equipment.defaultTeam.color }}
                >
                  {equipment.defaultTeam.name.charAt(0)}
                </div>
                <div>
                  <Link
                    href={`/teams/${equipment.defaultTeam.id}`}
                    className="font-medium text-gray-900 hover:text-brand-600"
                  >
                    {equipment.defaultTeam.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Auto-assigned for maintenance requests
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No default team assigned</p>
            )}
          </Card>

          {/* Assigned Employee */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Assigned To</h3>
            {equipment.assignedEmployee ? (
              <div className="flex items-center gap-3">
                <Avatar name={equipment.assignedEmployee.name} />
                <div>
                  <p className="font-medium text-gray-900">
                    {equipment.assignedEmployee.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {equipment.assignedEmployee.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Not assigned to any employee</p>
            )}
          </Card>

          {/* Quick Stats */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Total Requests</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {equipment._count.maintenanceRequests}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Open Requests</dt>
                <dd className="text-sm font-medium text-amber-600">{openRequestsCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Completed</dt>
                <dd className="text-sm font-medium text-green-600">
                  {equipment.maintenanceRequests.filter((r) => r.status === 'REPAIRED').length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Scrapped</dt>
                <dd className="text-sm font-medium text-red-600">
                  {equipment.maintenanceRequests.filter((r) => r.status === 'SCRAP').length}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Equipment"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{equipment.name}</strong>? This action cannot
          be undone.
        </p>
        {equipment.maintenanceRequests.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-amber-800">Warning</h4>
                <p className="text-sm text-amber-700">
                  This equipment has {equipment.maintenanceRequests.length} maintenance request(s).
                  Deleting it will affect maintenance history.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Equipment
          </Button>
        </div>
      </Modal>
    </div>
  );
}
