/**
 * Single Team API Routes
 * GET /api/teams/[id] - Get team by ID
 * PATCH /api/teams/[id] - Update team
 * DELETE /api/teams/[id] - Delete team
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
import { updateTeamSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id]
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    const team = await prisma.maintenanceTeam.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                department: true,
              },
            },
          },
        },
        defaultEquipment: {
          select: { id: true, name: true, serialNumber: true, category: true },
        },
        maintenanceRequests: {
          where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
          include: {
            equipment: { select: { name: true } },
            technician: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { priority: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    return successResponse(team);
  });
}

/**
 * PATCH /api/teams/[id]
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'teams:write');
    if (permError) return permError;

    const { id } = await params;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = updateTeamSchema.parse(body);

    const team = await prisma.maintenanceTeam.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    return successResponse(team);
  });
}

/**
 * DELETE /api/teams/[id]
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'teams:delete');
    if (permError) return permError;

    const { id } = await params;

    // Check for active requests
    const activeRequests = await prisma.maintenanceRequest.count({
      where: { teamId: id, status: { in: ['NEW', 'IN_PROGRESS'] } },
    });

    if (activeRequests > 0) {
      return errorResponse(
        'Cannot delete team with active maintenance requests',
        400
      );
    }

    // Soft delete by setting isActive to false
    await prisma.maintenanceTeam.update({
      where: { id },
      data: { isActive: false },
    });

    return successResponse({ message: 'Team deactivated successfully' });
  });
}
