/**
 * Maintenance Request Form Page (New/Edit)
 * Create or edit a maintenance request
 * Supports auto-fill from equipment selection
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout';
import {
  Card,
  Input,
  Select,
  Button,
  PageLoading,
  Badge,
} from '@/components/ui';
import toast from 'react-hot-toast';
import { getCategoryLabel } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  department: string;
  location: string;
  defaultTeam: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
  color: string;
}

const typeOptions = [
  { value: 'CORRECTIVE', label: 'Corrective - Fix a breakdown or issue' },
  { value: 'PREVENTIVE', label: 'Preventive - Scheduled maintenance' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface RequestFormData {
  title: string;
  description: string;
  type: string;
  priority: string;
  equipmentId: string;
  teamId: string;
  scheduledDate: string;
  notes: string;
}

export default function RequestFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const requestId = params?.id as string | undefined;
  const isEditing = !!requestId && requestId !== 'new';
  const preselectedEquipmentId = searchParams.get('equipmentId');
  const preselectedDate = searchParams.get('date');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    type: 'CORRECTIVE',
    priority: 'MEDIUM',
    equipmentId: preselectedEquipmentId || '',
    teamId: '',
    scheduledDate: preselectedDate || '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({});

  // Fetch equipment and teams for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipmentRes, teamsRes] = await Promise.all([
          fetch('/api/equipment?limit=100'),
          fetch('/api/teams'),
        ]);

        const equipmentData = await equipmentRes.json();
        const teamsData = await teamsRes.json();

        if (equipmentData.success) {
          // Filter out scrapped equipment
          const activeEquipment = (equipmentData.data.items || []).filter(
            (e: Equipment) => e.category !== 'SCRAPPED'
          );
          setEquipment(activeEquipment);

          // If preselected equipment, find and set it
          if (preselectedEquipmentId) {
            const preselected = activeEquipment.find(
              (e: Equipment) => e.id === preselectedEquipmentId
            );
            if (preselected) {
              setSelectedEquipment(preselected);
              if (preselected.defaultTeam) {
                setFormData((prev) => ({
                  ...prev,
                  teamId: preselected.defaultTeam!.id,
                }));
              }
            }
          }
        }

        if (teamsData.success) {
          setTeams(teamsData.data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        if (!isEditing) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [preselectedEquipmentId, isEditing]);

  // Fetch request data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchRequest = async () => {
        try {
          const response = await fetch(`/api/requests/${requestId}`);
          const result = await response.json();

          if (result.success) {
            const data = result.data;
            setFormData({
              title: data.title,
              description: data.description,
              type: data.type,
              priority: data.priority,
              equipmentId: data.equipmentId,
              teamId: data.teamId || '',
              scheduledDate: data.scheduledDate?.split('T')[0] || '',
              notes: data.notes || '',
            });

            // Set selected equipment
            if (data.equipment) {
              setSelectedEquipment(data.equipment);
            }
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
      };

      fetchRequest();
    }
  }, [requestId, isEditing, router]);

  // Handle equipment selection change (auto-fill team)
  const handleEquipmentChange = (equipmentId: string) => {
    const selected = equipment.find((e) => e.id === equipmentId);
    setSelectedEquipment(selected || null);
    
    setFormData((prev) => ({
      ...prev,
      equipmentId,
      // Auto-fill team from equipment's default team
      teamId: selected?.defaultTeam?.id || prev.teamId,
    }));

    if (errors.equipmentId) {
      setErrors((prev) => ({ ...prev, equipmentId: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RequestFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Equipment is required';
    }
    if (formData.type === 'PREVENTIVE' && !formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required for preventive maintenance';
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
        teamId: formData.teamId || null,
        scheduledDate: formData.scheduledDate || null,
        notes: formData.notes || null,
      };

      const url = isEditing ? `/api/requests/${requestId}` : '/api/requests';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          isEditing ? 'Request updated successfully' : 'Request created successfully'
        );
        router.push(`/requests/${result.data.id}`);
      } else {
        if (result.errors) {
          const fieldErrors: Partial<Record<keyof RequestFormData, string>> = {};
          result.errors.forEach((err: { path: string[]; message: string }) => {
            const field = err.path[0] as keyof RequestFormData;
            fieldErrors[field] = err.message;
          });
          setErrors(fieldErrors);
        }
        toast.error(result.error || 'Failed to save request');
      }
    } catch (error) {
      toast.error('Failed to save request');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof RequestFormData, value: string) => {
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
        title={isEditing ? 'Edit Request' : 'New Maintenance Request'}
        description={isEditing ? 'Update request details' : 'Create a new maintenance request'}
        showBack
        backHref={isEditing ? `/requests/${requestId}` : '/requests'}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Information</h3>
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Brief description of the issue or maintenance"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className={`input w-full h-32 resize-none ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Provide detailed information about the issue or maintenance needed..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Type"
                    options={typeOptions}
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    required
                  />
                  <Select
                    label="Priority"
                    options={priorityOptions}
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Equipment Selection */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment</h3>
              <Select
                label="Select Equipment"
                options={[
                  { value: '', label: 'Select equipment' },
                  ...equipment.map((e) => ({
                    value: e.id,
                    label: `${e.name} (${e.serialNumber})`,
                  })),
                ]}
                value={formData.equipmentId}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                error={errors.equipmentId}
                required
              />

              {/* Equipment Details (auto-filled) */}
              {selectedEquipment && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Equipment Details</h4>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Category</dt>
                      <dd className="font-medium text-gray-900">
                        <Badge variant="default" size="sm">
                          {getCategoryLabel(selectedEquipment.category)}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Department</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedEquipment.department}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-gray-500">Location</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedEquipment.location}
                      </dd>
                    </div>
                    {selectedEquipment.defaultTeam && (
                      <div className="col-span-2">
                        <dt className="text-gray-500 mb-1">Default Team (auto-assigned)</dt>
                        <dd className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedEquipment.defaultTeam.color }}
                          />
                          <span className="font-medium text-gray-900">
                            {selectedEquipment.defaultTeam.name}
                          </span>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </Card>

            {/* Notes */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Add any additional notes or comments..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Assignment */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
              <Select
                label="Maintenance Team"
                options={[
                  { value: '', label: 'Select a team' },
                  ...teams.map((team) => ({
                    value: team.id,
                    label: team.name,
                  })),
                ]}
                value={formData.teamId}
                onChange={(e) => handleChange('teamId', e.target.value)}
              />
              {selectedEquipment?.defaultTeam && formData.teamId === selectedEquipment.defaultTeam.id && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Auto-filled from equipment's default team
                </p>
              )}
            </Card>

            {/* Schedule */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h3>
              <Input
                type="date"
                label="Scheduled Date"
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                error={errors.scheduledDate}
                required={formData.type === 'PREVENTIVE'}
              />
              {formData.type === 'PREVENTIVE' && (
                <p className="text-xs text-gray-500 mt-1">
                  Required for preventive maintenance
                </p>
              )}
            </Card>

            {/* Actions */}
            <Card>
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  loading={saving}
                >
                  {isEditing ? 'Update Request' : 'Create Request'}
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

            {/* Help */}
            <Card className="bg-blue-50 border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                💡 Tips
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Select equipment to auto-fill the maintenance team</li>
                <li>• Use "Corrective" for breakdowns and issues</li>
                <li>• Use "Preventive" for scheduled maintenance</li>
                <li>• Critical priority requests should be handled immediately</li>
              </ul>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
