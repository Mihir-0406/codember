/**
 * Users API Routes
 * GET /api/users - List users
 * POST /api/users - Create user (admin only)
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
import { createUserSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth-utils';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const userQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
  teamId: z.string().optional(),
});

/**
 * GET /api/users
 * List users with optional filters
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const params = getQueryParams(request);
    const query = userQuerySchema.parse(Object.fromEntries(params));

    const where: Record<string, unknown> = { isActive: true };

    if (query.role) where.role = query.role;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    // Filter by team membership
    if (query.teamId) {
      where.teamMemberships = {
        some: { teamId: query.teamId },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        teamMemberships: {
          include: {
            team: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(users);
  });
}

/**
 * POST /api/users
 * Create new user (admin only)
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const permError = checkPermission(session!.user.role, 'users:write');
    if (permError) return permError;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = createUserSchema.parse(body);

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        createdAt: true,
      },
    });

    return successResponse(user, 201);
  });
}
