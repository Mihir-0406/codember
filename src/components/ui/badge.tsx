/**
 * Badge Component
 * Displays status, priority, and other categorical information
 */

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'teal';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  teal: 'bg-teal-100 text-teal-700',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  dot,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-gray-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Status-specific badges
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    NEW: { label: 'New', variant: 'info' },
    IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
    REPAIRED: { label: 'Repaired', variant: 'success' },
    SCRAP: { label: 'Scrapped', variant: 'error' },
    ACTIVE: { label: 'Active', variant: 'success' },
    SCRAPPED: { label: 'Scrapped', variant: 'error' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'default' };

  return <Badge variant={variant} dot>{label}</Badge>;
}

// Priority-specific badges
export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant']; className?: string }> = {
    LOW: { label: 'Low', variant: 'default' },
    MEDIUM: { label: 'Medium', variant: 'info' },
    HIGH: { label: 'High', variant: 'warning' },
    CRITICAL: { label: 'Critical', variant: 'error', className: 'animate-pulse-slow' },
  };

  const { label, variant, className } = config[priority] || { label: priority, variant: 'default' };

  return <Badge variant={variant} className={className}>{label}</Badge>;
}

// Type-specific badges
export function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    CORRECTIVE: { label: 'Corrective', variant: 'purple' },
    PREVENTIVE: { label: 'Preventive', variant: 'teal' },
  };

  const { label, variant } = config[type] || { label: type, variant: 'default' };

  return <Badge variant={variant}>{label}</Badge>;
}

// Count badge (for notifications)
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5',
        'text-xs font-bold text-white bg-red-500 rounded-full',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
