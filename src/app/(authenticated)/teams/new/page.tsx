/**
 * Team Form Page (New/Edit)
 * Create or edit a maintenance team
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import {
  Card,
  Input,
  Button,
  PageLoading,
} from '@/components/ui';
import toast from 'react-hot-toast';

const colorOptions = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#10B981', label: 'Emerald' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#64748B', label: 'Slate' },
  { value: '#6B7280', label: 'Gray' },
];

interface TeamFormData {
  name: string;
  color: string;
  description: string;
}

export default function TeamFormPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.id as string | undefined;
  const isEditing = !!teamId && teamId !== 'new';

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    color: '#6366F1',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormData, string>>>({});

  useEffect(() => {
    if (isEditing) {
      const fetchTeam = async () => {
        try {
          const response = await fetch(`/api/teams/${teamId}`);
          const result = await response.json();

          if (result.success) {
            setFormData({
              name: result.data.name,
              color: result.data.color,
              description: result.data.description || '',
            });
          } else {
            toast.error('Team not found');
            router.push('/teams');
          }
        } catch (error) {
          toast.error('Failed to load team');
          router.push('/teams');
        } finally {
          setLoading(false);
        }
      };

      fetchTeam();
    }
  }, [teamId, isEditing, router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TeamFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
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
        description: formData.description || null,
      };

      const url = isEditing ? `/api/teams/${teamId}` : '/api/teams';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEditing ? 'Team updated successfully' : 'Team created successfully');
        router.push(`/teams/${result.data.id}`);
      } else {
        toast.error(result.error || 'Failed to save team');
      }
    } catch (error) {
      toast.error('Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TeamFormData, value: string) => {
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
        title={isEditing ? 'Edit Team' : 'New Team'}
        description={isEditing ? 'Update team details' : 'Create a new maintenance team'}
        showBack
        backHref={isEditing ? `/teams/${teamId}` : '/teams'}
      />

      <form onSubmit={handleSubmit}>
        <div className="max-w-2xl">
          <Card>
            <div className="space-y-6">
              {/* Team Preview */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold transition-colors"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.name.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.name || 'Team Name'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.description || 'Team description'}
                  </p>
                </div>
              </div>

              <Input
                label="Team Name"
                placeholder="Enter team name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                required
              />

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange('color', color.value)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="input w-full h-24 resize-none"
                  placeholder="Brief description of the team's responsibilities..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" loading={saving}>
                  {isEditing ? 'Update Team' : 'Create Team'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
