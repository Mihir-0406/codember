/**
 * Calendar Page
 * Displays preventive maintenance schedule with date selection
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, PageLoading, Modal, Button, Badge, Avatar } from '@/components/ui';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CalendarRequest {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string;
  equipment: {
    id: string;
    name: string;
    serialNumber: string;
  };
  team: {
    id: string;
    name: string;
    color: string;
  } | null;
  technician: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [requests, setRequests] = useState<CalendarRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    fetchPreventiveRequests();
  }, [currentMonth]);

  const fetchPreventiveRequests = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const response = await fetch(
        `/api/requests?type=PREVENTIVE&startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=100`
      );
      const result = await response.json();

      if (result.success) {
        setRequests(result.data.items);
      } else {
        toast.error('Failed to load calendar events');
      }
    } catch (error) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getRequestsForDate = useCallback(
    (date: Date) => {
      return requests.filter((request) => {
        if (!request.scheduledDate) return false;
        return isSameDay(parseISO(request.scheduledDate), date);
      });
    },
    [requests]
  );

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  const handleCreateRequest = () => {
    if (selectedDate) {
      // Navigate to new request form with pre-filled date
      router.push(`/requests/new?scheduledDate=${selectedDate.toISOString()}&type=PREVENTIVE`);
    }
  };

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedDateRequests = selectedDate ? getRequestsForDate(selectedDate) : [];

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <Header
        title="Maintenance Calendar"
        description="View and schedule preventive maintenance"
        action={{
          label: 'Schedule Maintenance',
          href: '/requests/new?type=PREVENTIVE',
        }}
      />

      <Card padding={false}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayRequests = getRequestsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={idx}
                className={cn(
                  'min-h-[120px] p-2 border-b border-r border-gray-100 cursor-pointer transition-colors',
                  'hover:bg-gray-50',
                  !isCurrentMonth && 'bg-gray-50 text-gray-400',
                  isCurrentDay && 'bg-brand-50'
                )}
                onClick={() => handleDateClick(day)}
              >
                <div
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                    isCurrentDay && 'bg-brand-600 text-white font-semibold'
                  )}
                >
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className={cn(
                        'text-xs px-2 py-1 rounded truncate',
                        request.status === 'NEW' && 'bg-blue-100 text-blue-700',
                        request.status === 'IN_PROGRESS' && 'bg-amber-100 text-amber-700',
                        request.status === 'REPAIRED' && 'bg-green-100 text-green-700'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/requests/${request.id}`);
                      }}
                      title={request.title}
                    >
                      {request.title}
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-gray-500 px-2">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-100" />
          <span>New</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-100" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-100" />
          <span>Repaired</span>
        </div>
      </div>

      {/* Date Detail Modal */}
      <Modal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title={selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select Date'}
        size="md"
      >
        <div className="space-y-4">
          {selectedDateRequests.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {selectedDateRequests.length} scheduled maintenance{selectedDateRequests.length > 1 ? 's' : ''}
              </p>
              {selectedDateRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/requests/${request.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  onClick={() => setShowDateModal(false)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {request.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {request.equipment.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            request.status === 'NEW'
                              ? 'info'
                              : request.status === 'IN_PROGRESS'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {request.status.replace('_', ' ')}
                        </Badge>
                        {request.team && (
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: request.team.color }}
                            />
                            <span className="text-xs text-gray-500">
                              {request.team.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {request.technician && (
                      <Avatar
                        name={request.technician.name}
                        src={request.technician.avatar}
                        size="sm"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No maintenance scheduled for this date</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowDateModal(false)}
            >
              Close
            </Button>
            <Button className="flex-1" onClick={handleCreateRequest}>
              Schedule Maintenance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
