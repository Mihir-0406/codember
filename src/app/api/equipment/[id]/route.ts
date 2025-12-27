/**
 * Single Equipment API Routes
 * GET /api/equipment/[id] - Get equipment by ID
 * PATCH /api/equipment/[id] - Update equipment
 * DELETE /api/equipment/[id] - Delete equipment
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
} from '@/lib/api-utils';
import { updateEquipmentSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/equipment/[id]
 * Get single equipment with all details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, email: true, avatar: true, department: true },
        },
        defaultTeam: {
          select: {
            id: true,
            name: true,
            color: true,
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            technician: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        _count: {
          select: {
            maintenanceRequests: {
              where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
            },
          },
        },
      },
    });

    if (!equipment) {
      return errorResponse('Equipment not found', 404);
    }

    return successResponse(equipment);
  });
}

/**
 * PATCH /api/equipment/[id]
 * Update equipment
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'equipment:write');
    if (permError) return permError;

    const { id } = await params;

    // Check equipment exists
    const existing = await prisma.equipment.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Equipment not found', 404);
    }

    // Parse and validate body
    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = updateEquipmentSchema.parse(body);

    // If updating serial number, check for duplicates
    if (data.serialNumber && data.serialNumber !== existing.serialNumber) {
      const duplicate = await prisma.equipment.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (duplicate) {
        return errorResponse('Equipment with this serial number already exists', 409);
      }
    }

    // Update equipment
    const equipment = await prisma.equipment.update({
      where: { id },
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

    return successResponse(equipment);
  });
}

/**
 * DELETE /api/equipment/[id]
 * Delete equipment (only if no maintenance requests)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'equipment:delete');
    if (permError) return permError;

    const { id } = await params;

    // Check for existing maintenance requests
    const requestCount = await prisma.maintenanceRequest.count({
      where: { equipmentId: id },
    });

    if (requestCount > 0) {
      return errorResponse(
        'Cannot delete equipment with maintenance history. Consider marking it as scrapped instead.',
        400
      );
    }

    await prisma.equipment.delete({ where: { id } });

    return successResponse({ message: 'Equipment deleted successfully' });
  });
}
