/**
 * Maintenance Request State Machine
 * Enforces valid state transitions and business rules
 */

import { RequestStatus, EquipmentStatus } from '@prisma/client';

/**
 * Valid state transitions
 * Key = current state, Value = array of valid next states
 */
const validTransitions: Record<RequestStatus, RequestStatus[]> = {
  NEW: ['IN_PROGRESS'],
  IN_PROGRESS: ['REPAIRED', 'SCRAP'],
  REPAIRED: [], // Terminal state
  SCRAP: [], // Terminal state
};

/**
 * Check if a state transition is valid
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns True if transition is allowed
 */
export function isValidTransition(
  fromStatus: RequestStatus,
  toStatus: RequestStatus
): boolean {
  // Same status is always allowed (no change)
  if (fromStatus === toStatus) return true;
  
  return validTransitions[fromStatus]?.includes(toStatus) ?? false;
}

/**
 * Get valid next states for a given status
 * @param currentStatus - Current status
 * @returns Array of valid next states
 */
export function getValidNextStates(currentStatus: RequestStatus): RequestStatus[] {
  return validTransitions[currentStatus] ?? [];
}

/**
 * Check if status is a terminal state (no further transitions)
 */
export function isTerminalState(status: RequestStatus): boolean {
  return validTransitions[status]?.length === 0;
}

/**
 * Validation errors for state transitions
 */
export interface TransitionValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a state transition with business rules
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @param durationMinutes - Duration logged (required for REPAIRED)
 * @returns Validation result
 */
export function validateTransition(
  fromStatus: RequestStatus,
  toStatus: RequestStatus,
  durationMinutes?: number | null
): TransitionValidation {
  // Check basic transition validity
  if (!isValidTransition(fromStatus, toStatus)) {
    const validStates = getValidNextStates(fromStatus);
    if (validStates.length === 0) {
      return {
        isValid: false,
        error: `Cannot change status from ${fromStatus}. This is a terminal state.`,
      };
    }
    return {
      isValid: false,
      error: `Invalid transition from ${fromStatus} to ${toStatus}. Valid transitions: ${validStates.join(', ')}`,
    };
  }

  // Business rule: REPAIRED requires duration
  if (toStatus === 'REPAIRED' && (!durationMinutes || durationMinutes <= 0)) {
    return {
      isValid: false,
      error: 'Cannot mark as REPAIRED without logging repair duration.',
    };
  }

  return { isValid: true };
}

/**
 * Get equipment status after request state change
 * @param requestStatus - New request status
 * @returns Equipment status to set, or null if no change needed
 */
export function getEquipmentStatusForRequest(
  requestStatus: RequestStatus
): EquipmentStatus | null {
  if (requestStatus === 'SCRAP') {
    return EquipmentStatus.SCRAPPED;
  }
  return null;
}

/**
 * Status display information
 */
export const statusInfo: Record<
  RequestStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  NEW: {
    label: 'New',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Request created, awaiting assignment',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    description: 'Technician is working on this request',
  },
  REPAIRED: {
    label: 'Repaired',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Successfully repaired and closed',
  },
  SCRAP: {
    label: 'Scrapped',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Equipment scrapped, request closed',
  },
};

/**
 * Priority display information
 */
export const priorityInfo = {
  LOW: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  CRITICAL: { label: 'Critical', color: 'text-red-600', bgColor: 'bg-red-100' },
};

/**
 * Request type display information
 */
export const typeInfo = {
  CORRECTIVE: {
    label: 'Corrective',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Fix something that is broken',
  },
  PREVENTIVE: {
    label: 'Preventive',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    description: 'Scheduled maintenance to prevent issues',
  },
};
