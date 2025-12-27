/**
 * Request Status Transition API
 * POST /api/requests/[id]/transition - Change request status
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  getAuthenticatedSession,
  withErrorHandler,
  parseBody,
} from '@/lib/api-utils';
import { statusTransitionSchema } from '@/lib/validations';
import { validateTransition, getEquipmentStatusForRequest } from '@/lib/state-machine';
import { EquipmentStatus } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/requests/[id]/transition
 * Transition request to new status with state machine validation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const { status, durationMinutes, repairNotes } = statusTransitionSchema.parse(body);

    // Get existing request with team info
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

    // Validate the transition
    const validation = validateTransition(existing.status, status, durationMinutes);
    if (!validation.isValid) {
      return errorResponse(validation.error!, 400);
    }

    // Technicians can only transition their assigned requests
    if (session!.user.role === 'TECHNICIAN') {
      // Must be in the assigned team
      const isMember = existing.team?.members.some(
        (m) => m.userId === session!.user.id
      );
      if (!isMember) {
        return errorResponse(
          'You can only work on requests assigned to your team',
          403
        );
      }

      // Must be assigned to work on it (or can self-assign when moving to IN_PROGRESS)
      if (status === 'IN_PROGRESS' && !existing.technicianId) {
        // Auto-assign technician when they start work
        await prisma.maintenanceRequest.update({
          where: { id },
          data: { technicianId: session!.user.id },
        });
      } else if (existing.technicianId && existing.technicianId !== session!.user.id) {
        return errorResponse('You can only update requests assigned to you', 403);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { status };

    // Set timestamps based on transition
    if (status === 'IN_PROGRESS' && !existing.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'REPAIRED' || status === 'SCRAP') {
      updateData.completedAt = new Date();
    }

    // Add repair details
    if (durationMinutes) updateData.durationMinutes = durationMinutes;
    if (repairNotes) updateData.repairNotes = repairNotes;

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
      },
    });

    // Handle SCRAP - mark equipment as scrapped
    if (status === 'SCRAP') {
      await prisma.equipment.update({
        where: { id: existing.equipmentId },
        data: { status: EquipmentStatus.SCRAPPED },
      });
    }

    // Log the transition
    await prisma.requestLog.create({
      data: {
        requestId: id,
        userId: session!.user.id,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({
          from: existing.status,
          to: status,
          durationMinutes,
          equipmentScrapped: status === 'SCRAP',
        }),
      },
    });

    return successResponse(updated);
  });
}
