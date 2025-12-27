/**
 * Single Request API Routes
 * GET /api/requests/[id] - Get request by ID
 * PATCH /api/requests/[id] - Update request
 * DELETE /api/requests/[id] - Delete request
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
import { updateRequestSchema } from '@/lib/validations';
import {
  validateTransition,
  getEquipmentStatusForRequest,
} from '@/lib/state-machine';
import { EquipmentStatus, RequestStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]
 * Get single request with all details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        equipment: {
          include: {
            defaultTeam: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true, role: true },
                },
              },
            },
          },
        },
        technician: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!maintenanceRequest) {
      return errorResponse('Request not found', 404);
    }

    // Check access for requesters
    if (
      session!.user.role === 'REQUESTER' &&
      maintenanceRequest.createdById !== session!.user.id
    ) {
      return errorResponse('Forbidden', 403);
    }

    return successResponse(maintenanceRequest);
  });
}

/**
 * PATCH /api/requests/[id]
 * Update request (with state machine enforcement)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    // Get existing request
    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existing) {
      return errorResponse('Request not found', 404);
    }

    // Parse body
    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = updateRequestSchema.parse(body);
    const updateData: Record<string, unknown> = { ...data };
    const logDetails: Record<string, unknown> = {};

    // Handle status transition
    if (data.status && data.status !== existing.status) {
      // Validate transition
      const validation = validateTransition(
        existing.status,
        data.status,
        data.durationMinutes
      );

      if (!validation.isValid) {
        return errorResponse(validation.error!, 400);
      }

      // If moving to IN_PROGRESS, set startedAt
      if (data.status === 'IN_PROGRESS' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }

      // If completing, set completedAt
      if (data.status === 'REPAIRED' || data.status === 'SCRAP') {
        updateData.completedAt = new Date();
      }

      logDetails.statusChange = { from: existing.status, to: data.status };

      // Handle SCRAP - mark equipment as scrapped
      if (data.status === 'SCRAP') {
        await prisma.equipment.update({
          where: { id: existing.equipmentId },
          data: { status: EquipmentStatus.SCRAPPED },
        });
        logDetails.equipmentScrapped = true;
      }
    }

    // Handle technician assignment
    if (data.technicianId !== undefined) {
      // Verify technician is in the assigned team
      if (data.technicianId && existing.teamId) {
        const isMember = existing.team?.members.some(
          (m) => m.userId === data.technicianId
        );
        if (!isMember) {
          return errorResponse(
            'Technician must be a member of the assigned maintenance team',
            400
          );
        }
      }

      // Self-assignment check for technicians
      if (session!.user.role === 'TECHNICIAN') {
        if (data.technicianId && data.technicianId !== session!.user.id) {
          return errorResponse('Technicians can only assign themselves', 403);
        }
        // Verify technician is in the team
        const isMember = existing.team?.members.some(
          (m) => m.userId === session!.user.id
        );
        if (!isMember) {
          return errorResponse(
            'You can only work on requests assigned to your team',
            403
          );
        }
      }

      logDetails.assignmentChange = {
        from: existing.technicianId,
        to: data.technicianId,
      };
    }

    // Update request
    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        equipment: {
          select: { id: true, name: true, serialNumber: true, status: true },
        },
        team: {
          select: { id: true, name: true, color: true },
        },
        technician: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Create activity log
    if (Object.keys(logDetails).length > 0) {
      await prisma.requestLog.create({
        data: {
          requestId: id,
          userId: session!.user.id,
          action: data.status ? 'STATUS_CHANGED' : 'UPDATED',
          details: JSON.stringify(logDetails),
        },
      });
    }

    return successResponse(updated);
  });
}

/**
 * DELETE /api/requests/[id]
 * Delete request (only NEW requests)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'requests:delete');
    if (permError) return permError;

    const { id } = await params;

    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('Request not found', 404);
    }

    // Only allow deleting NEW requests
    if (existing.status !== 'NEW') {
      return errorResponse('Can only delete requests in NEW status', 400);
    }

    // Delete logs first, then request
    await prisma.requestLog.deleteMany({ where: { requestId: id } });
    await prisma.maintenanceRequest.delete({ where: { id } });

    return successResponse({ message: 'Request deleted successfully' });
  });
}
