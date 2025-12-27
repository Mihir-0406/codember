/**
 * Maintenance Requests API Routes
 * GET /api/requests - List all requests
 * POST /api/requests - Create new request
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
  getAuthenticatedSession,
  withErrorHandler,
  parseBody,
  getQueryParams,
} from '@/lib/api-utils';
import { createRequestSchema, requestQuerySchema } from '@/lib/validations';
import { EquipmentStatus, Prisma } from '@prisma/client';
import { startOfDay } from '@/lib/date-utils';

/**
 * GET /api/requests
 * List requests with optional filters
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const params = getQueryParams(request);
    const query = requestQuerySchema.parse(Object.fromEntries(params));

    // Build where clause
    const where: Prisma.MaintenanceRequestWhereInput = {};

    // Requesters can only see their own requests
    if (session!.user.role === 'REQUESTER') {
      where.createdById = session!.user.id;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { equipment: { name: { contains: query.search } } },
        { equipment: { serialNumber: { contains: query.search } } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.equipmentId) where.equipmentId = query.equipmentId;
    if (query.teamId) where.teamId = query.teamId;
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.createdById) where.createdById = query.createdById;

    // Filter for overdue requests
    if (query.overdue) {
      where.scheduledDate = { lt: startOfDay(new Date()) };
      where.status = { in: ['NEW', 'IN_PROGRESS'] };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.scheduledDate = {};
      if (query.startDate) {
        where.scheduledDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.scheduledDate.lte = new Date(query.endDate);
      }
    }

    const total = await prisma.maintenanceRequest.count({ where });

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        equipment: {
          select: { id: true, name: true, serialNumber: true, location: true, status: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        team: {
          select: { id: true, name: true, color: true },
        },
        technician: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledDate: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return successResponse({
      items: requests,
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
 * POST /api/requests
 * Create new maintenance request
 */
export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const body = await parseBody(request);
    if (!body) return errorResponse('Invalid request body', 400);

    const data = createRequestSchema.parse(body);

    // Get equipment to auto-fill fields
    const equipment = await prisma.equipment.findUnique({
      where: { id: data.equipmentId },
      include: {
        defaultTeam: true,
      },
    });

    if (!equipment) {
      return errorResponse('Equipment not found', 404);
    }

    // Check if equipment is scrapped
    if (equipment.status === EquipmentStatus.SCRAPPED) {
      return errorResponse('Cannot create requests for scrapped equipment', 400);
    }

    // Create request with auto-filled fields
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        scheduledDate: data.scheduledDate,
        // Auto-fill from equipment
        category: equipment.category,
        equipmentId: equipment.id,
        teamId: equipment.defaultTeamId,
        createdById: session!.user.id,
      },
      include: {
        equipment: {
          select: { id: true, name: true, serialNumber: true },
        },
        team: {
          select: { id: true, name: true, color: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Create activity log
    await prisma.requestLog.create({
      data: {
        requestId: maintenanceRequest.id,
        userId: session!.user.id,
        action: 'CREATED',
        details: JSON.stringify({
          title: maintenanceRequest.title,
          type: maintenanceRequest.type,
        }),
      },
    });

    return successResponse(maintenanceRequest, 201);
  });
}
