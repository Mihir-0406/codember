/**
 * Equipment Form Page (New/Edit)
 * Create or edit equipment
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import {
  Card,
  Input,
  Select,
  Button,
  PageLoading,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { EquipmentCategory, EquipmentStatus } from '@prisma/client';

interface Team {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

const categoryOptions = [
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
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SCRAPPED', label: 'Scrapped' },
];

interface EquipmentFormData {
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  department: string;
  location: string;
  purchaseDate: string;
  warrantyExpiry: string;
  defaultTeamId: string;
  assignedEmployeeId: string;
  notes: string;
  status?: EquipmentStatus;
}

export default function EquipmentFormPage() {
  const params = useParams();
  const router = useRouter();
  const equipmentId = params?.id as string | undefined;
  const isEditing = !!equipmentId && equipmentId !== 'new';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    serialNumber: '',
    category: 'OTHER',
    department: '',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: '',
    defaultTeamId: '',
    assignedEmployeeId: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EquipmentFormData, string>>>({});

  // Fetch teams and users for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, usersRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/users'),
        ]);

        const teamsData = await teamsRes.json();
        const usersData = await usersRes.json();

        if (teamsData.success) {
          setTeams(teamsData.data.items || []);
        }
        if (usersData.success) {
          setUsers(usersData.data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch equipment data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchEquipment = async () => {
        try {
          const response = await fetch(`/api/equipment/${equipmentId}`);
          const result = await response.json();

          if (result.success) {
            const data = result.data;
            setFormData({
              name: data.name,
              serialNumber: data.serialNumber,
              category: data.category,
              department: data.department,
              location: data.location,
              purchaseDate: data.purchaseDate.split('T')[0],
              warrantyExpiry: data.warrantyExpiry?.split('T')[0] || '',
              defaultTeamId: data.defaultTeamId || '',
              assignedEmployeeId: data.assignedEmployeeId || '',
              notes: data.notes || '',
              status: data.status,
            });
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
      };

      fetchEquipment();
    }
  }, [equipmentId, isEditing, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EquipmentFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Serial number is required';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        warrantyExpiry: formData.warrantyExpiry || null,
        defaultTeamId: formData.defaultTeamId || null,
        assignedEmployeeId: formData.assignedEmployeeId || null,
      };

      const url = isEditing ? `/api/equipment/${equipmentId}` : '/api/equipment';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEditing ? 'Equipment updated successfully' : 'Equipment created successfully');
        router.push(`/equipment/${result.data.id}`);
      } else {
        if (result.errors) {
          const fieldErrors: Partial<Record<keyof EquipmentFormData, string>> = {};
          result.errors.forEach((err: { path: string[]; message: string }) => {
            const field = err.path[0] as keyof EquipmentFormData;
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
        }
        toast.error(result.error || 'Failed to save equipment');
      }
    } catch (error) {
      toast.error('Failed to save equipment');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  return (
    <div>
      <Header
        title={isEditing ? 'Edit Equipment' : 'Add Equipment'}
        description={isEditing ? 'Update equipment details' : 'Add a new piece of equipment'}
        showBack
        backHref={isEditing ? `/equipment/${equipmentId}` : '/equipment'}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Equipment Name"
                    placeholder="Enter equipment name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={errors.name}
                    required
                  />
                </div>
                <Input
                  label="Serial Number"
                  placeholder="Enter serial number"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  error={errors.serialNumber}
                  required
                />
                <Select
                  label="Category"
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  required
                />
                <Input
                  label="Department"
                  placeholder="Enter department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  error={errors.department}
                  required
                />
                <Input
                  label="Location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  error={errors.location}
                  required
                />
              </div>
            </Card>

            {/* Dates */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase & Warranty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Purchase Date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                  error={errors.purchaseDate}
                  required
                />
                <Input
                  type="date"
                  label="Warranty Expiry"
                  value={formData.warrantyExpiry}
                  onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                  error={errors.warrantyExpiry}
                />
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <textarea
                className="input w-full h-32 resize-none"
                placeholder="Add any additional notes about this equipment..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status (only for editing) */}
            {isEditing && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                <Select
                  options={statusOptions}
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                />
              </Card>
            )}

            {/* Assignments */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h3>
              <div className="space-y-4">
                <Select
                  label="Default Maintenance Team"
                  options={[
                    { value: '', label: 'Select a team' },
                    ...teams.map((team) => ({
                      value: team.id,
                      label: team.name,
                    })),
                  ]}
                  value={formData.defaultTeamId}
                  onChange={(e) => handleChange('defaultTeamId', e.target.value)}
                />
                <Select
                  label="Assigned Employee"
                  options={[
                    { value: '', label: 'Select an employee' },
                    ...users.map((user) => ({
                      value: user.id,
                      label: user.name,
                    })),
                  ]}
                  value={formData.assignedEmployeeId}
                  onChange={(e) => handleChange('assignedEmployeeId', e.target.value)}
                />
              </div>
            </Card>

            {/* Actions */}
            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  loading={saving}
                >
                  {isEditing ? 'Update Equipment' : 'Create Equipment'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
