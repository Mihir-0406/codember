/**
 * Team Members API
 * POST /api/teams/[id]/members - Add member to team
 * DELETE /api/teams/[id]/members - Remove member from team
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
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const addMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  isLeader: z.boolean().default(false),
});

const removeMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
});

/**
 * POST /api/teams/[id]/members
 * Add member to team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'teams:write');
    if (permError) return permError;

    const { id: teamId } = await params;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const { userId, isLeader } = addMemberSchema.parse(body);

    // Check if already a member
    const existing = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });

    if (existing) {
      return errorResponse('User is already a member of this team', 409);
    }

    // Verify user exists and is a technician
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.role !== 'TECHNICIAN') {
      return errorResponse('Only technicians can be added to maintenance teams', 400);
    }

    const member = await prisma.teamMember.create({
      data: { userId, teamId, isLeader },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return successResponse(member, 201);
  });
}

/**
 * DELETE /api/teams/[id]/members
 * Remove member from team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'teams:write');
    if (permError) return permError;

    const { id: teamId } = await params;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const { userId } = removeMemberSchema.parse(body);

    // Check if member exists
    const member = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });

    if (!member) {
      return errorResponse('Member not found in this team', 404);
    }

    // Check if member has active requests
    const activeRequests = await prisma.maintenanceRequest.count({
      where: {
        teamId,
        technicianId: userId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
      },
    });

    if (activeRequests > 0) {
      return errorResponse(
        'Cannot remove member with active maintenance requests. Reassign requests first.',
        400
      );
    }

    await prisma.teamMember.delete({
      where: { userId_teamId: { userId, teamId } },
    });

    return successResponse({ message: 'Member removed from team' });
  });
}
