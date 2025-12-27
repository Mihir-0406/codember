/**
 * Reports Page
 * Analytics and reporting dashboard
 */

'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui';

type TimeRange = '7d' | '30d' | '90d' | '1y';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Mock data for reports
  const summaryStats = [
    { label: 'Total Requests', value: 247, change: '+12%', trend: 'up' },
    { label: 'Completed', value: 189, change: '+8%', trend: 'up' },
    { label: 'Avg. Resolution Time', value: '4.2 days', change: '-15%', trend: 'down' },
    { label: 'Equipment Uptime', value: '94.5%', change: '+2%', trend: 'up' },
  ];

  const requestsByStatus = [
    { status: 'Completed', count: 189, percentage: 76, color: 'bg-green-500' },
    { status: 'In Progress', count: 32, percentage: 13, color: 'bg-blue-500' },
    { status: 'Pending', count: 18, percentage: 7, color: 'bg-yellow-500' },
    { status: 'Cancelled', count: 8, percentage: 4, color: 'bg-red-500' },
  ];

  const requestsByPriority = [
    { priority: 'Critical', count: 12, color: 'bg-red-500' },
    { priority: 'High', count: 45, color: 'bg-orange-500' },
    { priority: 'Medium', count: 98, color: 'bg-yellow-500' },
    { priority: 'Low', count: 92, color: 'bg-green-500' },
  ];

  const topEquipment = [
    { name: 'Industrial Press #1', requests: 24, uptime: '92%' },
    { name: 'CNC Machine A', requests: 18, uptime: '95%' },
    { name: 'Conveyor Belt System', requests: 15, uptime: '89%' },
    { name: 'HVAC Unit - Building A', requests: 12, uptime: '97%' },
    { name: 'Assembly Robot #3', requests: 10, uptime: '94%' },
  ];

  const teamPerformance = [
    { team: 'Mechanical Team', completed: 78, avgTime: '3.2 days', efficiency: '95%' },
    { team: 'Electrical Team', completed: 54, avgTime: '4.1 days', efficiency: '88%' },
    { team: 'HVAC Team', completed: 32, avgTime: '5.5 days', efficiency: '82%' },
    { team: 'General Maintenance', completed: 25, avgTime: '2.8 days', efficiency: '91%' },
  ];

  const monthlyTrend = [
    { month: 'Jan', requests: 42 },
    { month: 'Feb', requests: 38 },
    { month: 'Mar', requests: 55 },
    { month: 'Apr', requests: 48 },
    { month: 'May', requests: 62 },
    { month: 'Jun', requests: 58 },
  ];

  const maxRequests = Math.max(...monthlyTrend.map(m => m.requests));

  return (
    <div className="space-y-6">
      <Header
        title="Reports & Analytics"
        subtitle="Track maintenance performance and trends"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {(['7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
                </button>
              ))}
            </div>
            <Button variant="outline">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Requests by Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests by Status</h3>
          <div className="space-y-4">
            {requestsByStatus.map((item) => (
              <div key={item.status}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.status}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requests by Priority */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Requests by Priority</h3>
          <div className="flex items-end justify-between h-48 gap-4">
            {requestsByPriority.map((item) => (
              <div key={item.priority} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.count}</span>
                  <div
                    className={`w-full ${item.color} rounded-t-lg transition-all duration-500`}
                    style={{ height: `${(item.count / 100) * 120}px` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Request Trend</h3>
        <div className="flex items-end justify-between h-48 gap-4 px-4">
          {monthlyTrend.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white mb-2">{item.requests}</span>
              <div
                className="w-full bg-brand-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(item.requests / maxRequests) * 140}px` }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Equipment */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Equipment by Requests</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topEquipment.map((item, index) => (
              <div key={item.name} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.requests} requests</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.uptime} uptime</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Performance */}
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Performance</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {teamPerformance.map((team) => (
              <div key={team.team} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{team.team}</span>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">{team.efficiency}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{team.completed} completed</span>
                  <span>•</span>
                  <span>Avg. {team.avgTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate Reports</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { name: 'Equipment Report', icon: EquipmentIcon, description: 'Equipment status and maintenance history' },
            { name: 'Team Report', icon: TeamIcon, description: 'Team performance and workload' },
            { name: 'Cost Analysis', icon: CostIcon, description: 'Maintenance costs and budget' },
            { name: 'SLA Report', icon: SLAIcon, description: 'Service level agreement compliance' },
          ].map((report) => (
            <button
              key={report.name}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 flex items-center justify-center mb-3 transition-colors">
                <report.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-brand-600 dark:group-hover:text-brand-400" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{report.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Icons
function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SLAIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
