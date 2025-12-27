/**
 * Teams List Page
 * Display all maintenance teams
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout';
import {
  Card,
  Button,
  PageLoading,
  EmptyState,
  NoDataIcon,
  Avatar,
} from '@/components/ui';
import { hasPermission } from '@/lib/rbac';
import toast from 'react-hot-toast';

interface TeamMember {
  userId: string;
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

export default function TeamsListPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/teams');
      const result = await response.json();

      if (result.success) {
        setTeams(result.data.items || []);
      } else {
        toast.error('Failed to load teams');
      }
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const canCreate = session?.user && hasPermission(session.user.role, 'teams:create');

  return (
    <div>
      <Header
        title="Maintenance Teams"
        description="Manage your maintenance teams and members"
        action={
          canCreate
            ? {
                label: 'New Team',
                href: '/teams/new',
              }
            : undefined
        }
      />

      {loading ? (
        <PageLoading />
      ) : teams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<NoDataIcon />}
            title="No teams yet"
            description="Get started by creating your first maintenance team"
            action={
              canCreate ? (
                <Link href="/teams/new">
                  <Button>Create Team</Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="h-full hover:border-brand-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {team.members.length} members
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {team._count.maintenanceRequests} requests
                    </div>
                  </div>
                </div>

                {/* Members Preview */}
                {team.members.length > 0 && (
                  <div className="mt-4">
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map((member) => (
                        <Avatar
                          key={member.userId}
                          name={member.user.name}
                          size="sm"
                          className="ring-2 ring-white"
                        />
                      ))}
                      {team.members.length > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 ring-2 ring-white">
                          +{team.members.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
