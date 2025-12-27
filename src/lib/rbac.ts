/**
 * Role-Based Access Control Utilities
 * Defines permissions for each user role
 */

import { UserRole } from '@prisma/client';

// Permission types
export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'teams:read'
  | 'teams:write'
  | 'teams:delete'
  | 'equipment:read'
  | 'equipment:write'
  | 'equipment:delete'
  | 'requests:read'
  | 'requests:read:own'
  | 'requests:write'
  | 'requests:assign'
  | 'requests:work'
  | 'requests:delete'
  | 'dashboard:view'
  | 'reports:view';

// Role-permission mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  ADMIN: [
    'users:read',
    'users:write',
    'users:delete',
    'teams:read',
    'teams:write',
    'teams:delete',
    'equipment:read',
    'equipment:write',
    'equipment:delete',
    'requests:read',
    'requests:write',
    'requests:assign',
    'requests:work',
    'requests:delete',
    'dashboard:view',
    'reports:view',
  ],
  MANAGER: [
    'users:read',
    'teams:read',
    'teams:write',
    'equipment:read',
    'equipment:write',
    'requests:read',
    'requests:write',
    'requests:assign',
    'dashboard:view',
    'reports:view',
  ],
  TECHNICIAN: [
    'teams:read',
    'equipment:read',
    'requests:read',
    'requests:write',
    'requests:work',
    'dashboard:view',
  ],
  REQUESTER: [
    'equipment:read',
    'requests:read:own',
    'requests:write',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

/**
 * Role hierarchy for comparison
 * Higher number = higher privilege
 */
const roleHierarchy: Record<UserRole, number> = {
  REQUESTER: 1,
  TECHNICIAN: 2,
  MANAGER: 3,
  ADMIN: 4,
};

/**
 * Check if role A is higher or equal to role B
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
  return roleHierarchy[roleA] >= roleHierarchy[roleB];
}

/**
 * Check if user can access admin features
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user can manage (admin or manager)
 */
export function isManager(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

/**
 * Check if user is a technician
 */
export function isTechnician(role: UserRole): boolean {
  return role === 'TECHNICIAN';
}
