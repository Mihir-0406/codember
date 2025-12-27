/**
 * Team Detail Page
 * Shows team details and member management
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
  PageLoading,
  Avatar,
  Badge,
  Modal,
  Select,
} from '@/components/ui';
import { hasPermission } from '@/lib/rbac';
import toast from 'react-hot-toast';

interface TeamMember {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Team {
  id: string;
  name: string;
  color: string;
  description: string | null;
  members: TeamMember[];
  _count: {
    equipment: number;
    maintenanceRequests: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MEMBER');
  const [processing, setProcessing] = useState(false);

  const fetchTeam = useCallback(async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const result = await response.json();

      if (result.success) {
        setTeam(result.data);
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
  }, [teamId, router]);

  const fetchAvailableUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success) {
        // Filter out users already in the team
        const currentMemberIds = team?.members.map((m) => m.userId) || [];
        const available = (result.data.items || []).filter(
          (u: User) =>
            !currentMemberIds.includes(u.id) &&
            ['TECHNICIAN', 'MANAGER'].includes(u.role)
        );
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, [team?.members]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (showAddMemberModal) {
      fetchAvailableUsers();
    }
  }, [showAddMemberModal, fetchAvailableUsers]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          role: selectedRole,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Member added successfully');
        setShowAddMemberModal(false);
        setSelectedUserId('');
        setSelectedRole('MEMBER');
        fetchTeam();
      } else {
        toast.error(result.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Member removed successfully');
        fetchTeam();
      } else {
        toast.error(result.error || 'Failed to remove member');
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleDeleteTeam = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Team deleted successfully');
        router.push('/teams');
      } else {
        toast.error(result.error || 'Failed to delete team');
      }
    } catch (error) {
      toast.error('Failed to delete team');
    } finally {
      setProcessing(false);
      setShowDeleteModal(false);
    }
  };

  const canEdit = session?.user && hasPermission(session.user.role, 'teams:update');
  const canDelete = session?.user && hasPermission(session.user.role, 'teams:delete');

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div>
      <Header
        title={team.name}
        description={team.description || 'Maintenance team'}
        showBack
        backHref="/teams"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Members */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Team Members
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({team.members.length})
                </span>
              </h3>
              {canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Member
                </Button>
              )}
            </div>

            {team.members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>No members in this team yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {team.members.map((member) => (
                  <div
                    key={member.userId}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={member.user.name} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.user.name}
                        </p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          member.role === 'LEAD'
                            ? 'success'
                            : 'default'
                        }
                      >
                        {member.role}
                      </Badge>
                      <Badge variant="default">{member.user.role}</Badge>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: team.color }}
              >
                {team.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                {team.description && (
                  <p className="text-sm text-gray-500">{team.description}</p>
                )}
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Equipment</dt>
                <dd className="font-medium text-gray-900">{team._count.equipment}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Requests</dt>
                <dd className="font-medium text-gray-900">{team._count.maintenanceRequests}</dd>
              </div>
            </dl>
          </Card>

          {/* Actions */}
          {(canEdit || canDelete) && (
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                {canEdit && (
                  <Link href={`/teams/${team.id}/edit`} className="block">
                    <Button variant="secondary" className="w-full">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Team
                    </Button>
                  </Link>
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
                    Delete Team
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedUserId('');
          setSelectedRole('MEMBER');
        }}
        title="Add Team Member"
      >
        <div className="space-y-4">
          <Select
            label="Select User"
            options={[
              { value: '', label: 'Select a user' },
              ...availableUsers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role})`,
              })),
            ]}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          />
          {availableUsers.length === 0 && (
            <p className="text-sm text-amber-600">
              No available users to add. All eligible users are already members.
            </p>
          )}

          <Select
            label="Team Role"
            options={[
              { value: 'MEMBER', label: 'Member' },
              { value: 'LEAD', label: 'Lead' },
            ]}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddMemberModal(false);
              setSelectedUserId('');
              setSelectedRole('MEMBER');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            loading={processing}
            disabled={!selectedUserId}
          >
            Add Member
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Team"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{team.name}</strong>? This action cannot be undone.
        </p>
        {(team._count.equipment > 0 || team._count.maintenanceRequests > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-amber-800">Warning</h4>
                <p className="text-sm text-amber-700">
                  This team has {team._count.equipment} equipment and {team._count.maintenanceRequests} requests assigned.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteTeam} loading={processing}>
            Delete Team
          </Button>
        </div>
      </Modal>
    </div>
  );
}
