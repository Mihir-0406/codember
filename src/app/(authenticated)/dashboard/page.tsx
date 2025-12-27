/**
 * Dashboard Page
 * Main overview with statistics and recent activity
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Header } from '@/components/layout';
import {
  Card,
  StatsCard,
  Badge,
  StatusBadge,
  PriorityBadge,
  Avatar,
  PageLoading,
} from '@/components/ui';
import { formatRelative, formatDate, isOverdue } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DashboardData {
  requests: {
    new: number;
    inProgress: number;
    repaired: number;
    scrap: number;
    overdue: number;
    completedThisMonth: number;
    total: number;
  };
  equipment: {
    active: number;
    scrapped: number;
    total: number;
  };
  teams: Array<{
    id: string;
    name: string;
    color: string;
    _count: {
      maintenanceRequests: number;
      members: number;
    };
  }> | null;
  recentRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    scheduledDate: string | null;
    equipment: { name: string; serialNumber: string };
    technician: { name: string; avatar: string | null } | null;
    createdBy: { name: string };
  }>;
  upcomingMaintenance: Array<{
    id: string;
    title: string;
    scheduledDate: string;
    equipment: { name: string };
    team: { name: string; color: string } | null;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (!data) {
    return <div>Failed to load dashboard</div>;
  }

  return (
    <div>
      <Header
        title={`Welcome back, ${session?.user?.name?.split(' ')[0]}!`}
        description="Here's what's happening with your maintenance operations"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Open Requests"
          value={data.requests.new + data.requests.inProgress}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Overdue"
          value={data.requests.overdue}
          color={data.requests.overdue > 0 ? 'red' : 'green'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Completed This Month"
          value={data.requests.completedThisMonth}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Active Equipment"
          value={data.equipment.active}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Requests */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
              <Link
                href="/requests"
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-4">
              {data.recentRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent requests</p>
              ) : (
                data.recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/requests/${request.id}`}
                    className={cn(
                      'block p-4 rounded-lg border transition-all hover:shadow-md',
                      isOverdue(request.scheduledDate) &&
                        request.status !== 'REPAIRED' &&
                        request.status !== 'SCRAP'
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {request.title}
                          </h4>
                          {isOverdue(request.scheduledDate) &&
                            request.status !== 'REPAIRED' &&
                            request.status !== 'SCRAP' && (
                              <Badge variant="error" size="sm">
                                Overdue
                              </Badge>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {request.equipment.name} • {request.equipment.serialNumber}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusBadge status={request.status} />
                          <PriorityBadge priority={request.priority} />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-500">
                          {formatRelative(request.createdAt)}
                        </p>
                        {request.technician && (
                          <div className="mt-2 flex justify-end">
                            <Avatar
                              name={request.technician.name}
                              src={request.technician.avatar}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Maintenance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upcoming Preventive
            </h3>
            <div className="space-y-3">
              {data.upcomingMaintenance.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming maintenance</p>
              ) : (
                data.upcomingMaintenance.map((item) => (
                  <Link
                    key={item.id}
                    href={`/requests/${item.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.equipment.name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(item.scheduledDate)}
                      </span>
                      {item.team && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.team.color }}
                        />
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/calendar"
              className="block mt-4 text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              View Calendar →
            </Link>
          </Card>

          {/* Teams Overview */}
          {data.teams && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Workload
              </h3>
              <div className="space-y-3">
                {data.teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {team.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {team._count.members} members
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {team._count.maintenanceRequests}
                      </p>
                      <p className="text-xs text-gray-500">open</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/requests/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Request</p>
                  <p className="text-xs text-gray-500">Create maintenance request</p>
                </div>
              </Link>
              <Link
                href="/kanban"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Kanban Board</p>
                  <p className="text-xs text-gray-500">Manage request workflow</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
