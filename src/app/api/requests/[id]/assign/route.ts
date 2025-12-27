/**
 * Request Assignment API
 * POST /api/requests/[id]/assign - Assign technician to request
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
import { assignTechnicianSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/requests/[id]/assign
 * Assign or unassign technician
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const { id } = await params;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const { technicianId } = assignTechnicianSchema.parse(body);

    // Get request with team members
    const existingRequest = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existingRequest) {
      return errorResponse('Request not found', 404);
    }

    // Cannot assign to completed requests
    if (existingRequest.status === 'REPAIRED' || existingRequest.status === 'SCRAP') {
      return errorResponse('Cannot modify assignment for completed requests', 400);
    }

    // If assigning, verify technician is in the team
    if (technicianId && existingRequest.teamId) {
      const isMember = existingRequest.team?.members.some(
        (m) => m.userId === technicianId
      );
      if (!isMember) {
        return errorResponse(
          'Technician must be a member of the assigned maintenance team',
          400
        );
      }

      // Verify the user is a technician
      const techMember = existingRequest.team?.members.find(
        (m) => m.userId === technicianId
      );
      if (techMember?.user.role !== 'TECHNICIAN') {
        return errorResponse('Can only assign to users with TECHNICIAN role', 400);
      }
    }

    // Technicians can only self-assign
    if (session!.user.role === 'TECHNICIAN') {
      if (technicianId && technicianId !== session!.user.id) {
        return errorResponse('Technicians can only assign themselves', 403);
      }

      // Verify technician is in the team
      const isMember = existingRequest.team?.members.some(
        (m) => m.userId === session!.user.id
      );
      if (!isMember) {
        return errorResponse(
          'You can only work on requests assigned to your team',
          403
        );
      }
    }

    // Update assignment
    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: { technicianId },
      include: {
        technician: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Log the assignment
    await prisma.requestLog.create({
      data: {
        requestId: id,
        userId: session!.user.id,
        action: technicianId ? 'ASSIGNED' : 'UNASSIGNED',
        details: JSON.stringify({
          technicianId,
          assignedBy: session!.user.id,
        }),
      },
    });

    return successResponse(updated);
  });
}
