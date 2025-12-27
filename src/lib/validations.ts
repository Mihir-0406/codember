/**
 * Validation Schemas using Zod
 * Centralized validation for all API inputs
 */

import { z } from 'zod';
import {
  UserRole,
  EquipmentCategory,
  EquipmentStatus,
  RequestType,
  RequestStatus,
  RequestPriority,
} from '@prisma/client';

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.nativeEnum(UserRole).default('REQUESTER'),
  department: z.string().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// =============================================================================
// TEAM SCHEMAS
// =============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#3b82f6'),
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  teamId: z.string().cuid('Invalid team ID'),
  isLeader: z.boolean().default(false),
});

// =============================================================================
// EQUIPMENT SCHEMAS
// =============================================================================

export const createEquipmentSchema = z.object({
  name: z.string().min(2, 'Equipment name must be at least 2 characters'),
  serialNumber: z.string().min(3, 'Serial number must be at least 3 characters'),
  category: z.nativeEnum(EquipmentCategory),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)),
  warrantyExpiry: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  assignedEmployeeId: z.string().cuid().optional().nullable(),
  defaultTeamId: z.string().cuid().optional().nullable(),
  defaultTechnicianId: z.string().cuid().optional().nullable(),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  status: z.nativeEnum(EquipmentStatus).optional(),
});

// =============================================================================
// MAINTENANCE REQUEST SCHEMAS
// =============================================================================

export const createRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.nativeEnum(RequestType),
  priority: z.nativeEnum(RequestPriority).default('MEDIUM'),
  equipmentId: z.string().cuid('Invalid equipment ID'),
  scheduledDate: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  // These will be auto-filled from equipment
  teamId: z.string().cuid().optional().nullable(),
  category: z.nativeEnum(EquipmentCategory).optional(),
});

export const updateRequestSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  scheduledDate: z.string().or(z.date()).transform((val) => new Date(val)).optional().nullable(),
  status: z.nativeEnum(RequestStatus).optional(),
  technicianId: z.string().cuid().optional().nullable(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  repairNotes: z.string().optional().nullable(),
  partsUsed: z.string().optional().nullable(),
  cost: z.number().positive().optional().nullable(),
});

// Schema for status transition with required fields
export const statusTransitionSchema = z.object({
  status: z.nativeEnum(RequestStatus),
  durationMinutes: z.number().int().positive().optional().nullable(),
  repairNotes: z.string().optional().nullable(),
});

// Schema for technician assignment
export const assignTechnicianSchema = z.object({
  technicianId: z.string().cuid('Invalid technician ID').nullable(),
});

// =============================================================================
// QUERY PARAMETER SCHEMAS
// =============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const equipmentQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  category: z.nativeEnum(EquipmentCategory).optional(),
  status: z.nativeEnum(EquipmentStatus).optional(),
  department: z.string().optional(),
  teamId: z.string().cuid().optional(),
});

export const requestQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  status: z.nativeEnum(RequestStatus).optional(),
  type: z.nativeEnum(RequestType).optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  equipmentId: z.string().cuid().optional(),
  teamId: z.string().cuid().optional(),
  technicianId: z.string().cuid().optional(),
  createdById: z.string().cuid().optional(),
  overdue: z.coerce.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;
export type EquipmentQueryInput = z.infer<typeof equipmentQuerySchema>;
export type RequestQueryInput = z.infer<typeof requestQuerySchema>;
