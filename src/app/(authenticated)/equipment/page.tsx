/**
 * Equipment List Page
 * Displays all equipment with filtering and search
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
} from '@/components/ui';
import { formatDate } from '@/lib/date-utils';
import { getCategoryLabel } from '@/lib/utils';
import { EquipmentCategory, EquipmentStatus } from '@prisma/client';
import toast from 'react-hot-toast';
import { debounce } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  department: string;
  location: string;
  status: EquipmentStatus;
  purchaseDate: string;
  warrantyExpiry: string | null;
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
  _count: {
    maintenanceRequests: number;
  };
}

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'MACHINERY', label: 'Machinery' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'VEHICLES', label: 'Vehicles' },
  { value: 'IT_EQUIPMENT', label: 'IT Equipment' },
  { value: 'SAFETY_EQUIPMENT', label: 'Safety Equipment' },
  { value: 'OFFICE_EQUIPMENT', label: 'Office Equipment' },
  { value: 'OTHER', label: 'Other' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SCRAPPED', label: 'Scrapped' },
];

export default function EquipmentListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page.toString());
      params.set('limit', pagination.limit.toString());
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (status) params.set('status', status);

      const response = await fetch(`/api/equipment?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setEquipment(result.data.items);
        setPagination((prev) => ({
          ...prev,
          ...result.data.pagination,
        }));
      } else {
        toast.error('Failed to load equipment');
      }
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, category, status]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

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
        title="Equipment"
        description="Manage all your equipment and assets"
        action={{
          label: 'Add Equipment',
          href: '/equipment/new',
        }}
      />

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search equipment..."
              defaultValue={search}
              onChange={(e) => debouncedSearch(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-48">
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
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
        </div>
      </Card>

      {/* Equipment Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8">
            <PageLoading />
          </div>
        ) : equipment.length === 0 ? (
          <EmptyState
            icon={<NoDataIcon />}
            title="No equipment found"
            description={
              search || category || status
                ? 'Try adjusting your filters'
                : 'Get started by adding your first piece of equipment'
            }
            action={
              !search && !category && !status ? (
                <Link href="/equipment/new">
                  <Button>Add Equipment</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Open Requests</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        href={`/equipment/${item.id}`}
                        className="hover:text-brand-600"
                      >
                        <div className="font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.serialNumber}
                        </div>
                      </Link>
                    </td>
                    <td>
                      <Badge variant="default">
                        {getCategoryLabel(item.category)}
                      </Badge>
                    </td>
                    <td className="text-gray-600">{item.location}</td>
                    <td>
                      {item.defaultTeam ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.defaultTeam.color }}
                          />
                          <span className="text-gray-600">
                            {item.defaultTeam.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      {item._count.maintenanceRequests > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          {item._count.maintenanceRequests}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/equipment/${item.id}`}
                        className="btn-ghost btn-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
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
