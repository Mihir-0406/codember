/**
 * Maintenance Teams API Routes
 * GET /api/teams - List all teams
 * POST /api/teams - Create new team
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
import { createTeamSchema } from '@/lib/validations';

/**
 * GET /api/teams
 * List all teams with member counts
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const teams = await prisma.maintenanceTeam.findMany({
      where: { isActive: true },
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
              },
            },
          },
        },
        _count: {
          select: {
            maintenanceRequests: {
              where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
            },
            defaultEquipment: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(teams);
  });
}

/**
 * POST /api/teams
 * Create new maintenance team
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'teams:write');
    if (permError) return permError;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = createTeamSchema.parse(body);

    // Check for duplicate name
    const existing = await prisma.maintenanceTeam.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      return errorResponse('Team with this name already exists', 409);
    }

    const team = await prisma.maintenanceTeam.create({
      data,
      include: {
        members: true,
        _count: {
          select: { maintenanceRequests: true },
        },
      },
    });

    return successResponse(team, 201);
  });
}
