/**
 * Equipment API Routes
 * GET /api/equipment - List all equipment
 * POST /api/equipment - Create new equipment
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  getAuthenticatedSession,
  checkPermission,
  withErrorHandler,
  parseBody,
  getQueryParams,
} from '@/lib/api-utils';
import { createEquipmentSchema, equipmentQuerySchema } from '@/lib/validations';
import { EquipmentStatus } from '@prisma/client';

/**
 * GET /api/equipment
 * List equipment with optional filters
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // Check authentication
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    // Parse query parameters
    const params = getQueryParams(request);
    const query = equipmentQuerySchema.parse(Object.fromEntries(params));

    // Build where clause
    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { serialNumber: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.teamId) where.defaultTeamId = query.teamId;

    // Get total count
    const total = await prisma.equipment.count({ where });

    // Get paginated results
    const equipment = await prisma.equipment.findMany({
      where,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        defaultTeam: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: {
            maintenanceRequests: {
              where: {
                status: { in: ['NEW', 'IN_PROGRESS'] },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return successResponse({
      items: equipment,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  });
}

/**
 * POST /api/equipment
 * Create new equipment
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    // Check authentication and permissions
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'equipment:write');
    if (permError) return permError;

    // Parse and validate body
    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = createEquipmentSchema.parse(body);

    // Check for duplicate serial number
    const existing = await prisma.equipment.findUnique({
      where: { serialNumber: data.serialNumber },
    });
    if (existing) {
      return errorResponse('Equipment with this serial number already exists', 409);
    }

    // Create equipment
    const equipment = await prisma.equipment.create({
      data,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true },
        },
        defaultTeam: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return successResponse(equipment, 201);
  });
}
