/**
 * Activity Page
 * User activity history and audit log
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

type ActivityType = 'login' | 'logout' | 'request_created' | 'request_updated' | 'equipment_updated' | 'password_changed' | 'profile_updated';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ip?: string;
  device?: string;
}

// Mock activity data
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'login',
    description: 'Signed in to account',
    timestamp: new Date(),
    ip: '192.168.1.1',
    device: 'Chrome on Windows',
  },
  {
    id: '2',
    type: 'request_created',
    description: 'Created maintenance request "HVAC System Check"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    metadata: { requestId: 'REQ-001' },
  },
  {
    id: '3',
    type: 'request_updated',
    description: 'Updated request status to "In Progress"',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    metadata: { requestId: 'REQ-001' },
  },
  {
    id: '4',
    type: 'equipment_updated',
    description: 'Updated equipment "Industrial Press #1"',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    metadata: { equipmentId: 'EQ-001' },
  },
  {
    id: '5',
    type: 'profile_updated',
    description: 'Updated profile information',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    type: 'password_changed',
    description: 'Changed account password',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '7',
    type: 'login',
    description: 'Signed in to account',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ip: '192.168.1.2',
    device: 'Safari on iPhone',
  },
  {
    id: '8',
    type: 'request_created',
    description: 'Created maintenance request "Conveyor Belt Repair"',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    metadata: { requestId: 'REQ-002' },
  },
];

export default function ActivityPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');

  const filteredActivities = filter === 'all' 
    ? mockActivities 
    : mockActivities.filter(a => a.type === filter);

  const activityFilters: { label: string; value: ActivityType | 'all' }[] = [
    { label: 'All Activity', value: 'all' },
    { label: 'Logins', value: 'login' },
    { label: 'Requests', value: 'request_created' },
    { label: 'Security', value: 'password_changed' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track your recent actions and account activity
              </p>
            </div>
            <Button variant="outline" size="sm">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Log
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-2">
            {activityFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f.value
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="card">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredActivities.map((activity, index) => (
            <div key={activity.id} className="p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityIconBg(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                  {activity.ip && (
                    <>
                      <span>•</span>
                      <span>{activity.ip}</span>
                    </>
                  )}
                  {activity.device && (
                    <>
                      <span>•</span>
                      <span>{activity.device}</span>
                    </>
                  )}
                </div>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <DotsIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" className="w-full">
            Load More Activity
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <LoginIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Logins</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <RequestIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Requests Created</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <EditIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Updates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getActivityIconBg(type: ActivityType): string {
  switch (type) {
    case 'login':
    case 'logout':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'request_created':
    case 'request_updated':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'equipment_updated':
      return 'bg-orange-100 dark:bg-orange-900/30';
    case 'password_changed':
    case 'profile_updated':
      return 'bg-purple-100 dark:bg-purple-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-800';
  }
}

function getActivityIcon(type: ActivityType) {
  const iconClass = 'w-5 h-5';
  switch (type) {
    case 'login':
      return <LoginIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    case 'logout':
      return <LogoutIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
    case 'request_created':
    case 'request_updated':
      return <RequestIcon className={`${iconClass} text-green-600 dark:text-green-400`} />;
    case 'equipment_updated':
      return <EquipmentIcon className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
    case 'password_changed':
      return <ShieldIcon className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
    case 'profile_updated':
      return <UserIcon className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
    default:
      return <DotsIcon className={`${iconClass} text-gray-400`} />;
  }
}

// Icons
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function RequestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function EquipmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}
