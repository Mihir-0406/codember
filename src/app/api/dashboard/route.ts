/**
 * Dashboard Stats API
 * GET /api/dashboard - Get dashboard statistics
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  successResponse,
  getAuthenticatedSession,
  withErrorHandler,
} from '@/lib/api-utils';
import { startOfDay, endOfDay, addDays, startOfMonth, endOfMonth } from '@/lib/date-utils';

/**
 * GET /api/dashboard
 * Get dashboard statistics and recent activity
 */
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const { session, error } = await getAuthenticatedSession();
    if (error) return error;

    const now = new Date();
    const today = startOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Base where clause for requesters
    const baseWhere =
      session!.user.role === 'REQUESTER'
        ? { createdById: session!.user.id }
        : {};

    // Get request counts by status
    const [newCount, inProgressCount, repairedCount, scrapCount] =
      await Promise.all([
        prisma.maintenanceRequest.count({
          where: { ...baseWhere, status: 'NEW' },
        }),
        prisma.maintenanceRequest.count({
          where: { ...baseWhere, status: 'IN_PROGRESS' },
        }),
        prisma.maintenanceRequest.count({
          where: { ...baseWhere, status: 'REPAIRED' },
        }),
        prisma.maintenanceRequest.count({
          where: { ...baseWhere, status: 'SCRAP' },
        }),
      ]);

    // Get overdue count
    const overdueCount = await prisma.maintenanceRequest.count({
      where: {
        ...baseWhere,
        status: { in: ['NEW', 'IN_PROGRESS'] },
        scheduledDate: { lt: today },
      },
    });

    // Get this month's completed count
    const completedThisMonth = await prisma.maintenanceRequest.count({
      where: {
        ...baseWhere,
        status: { in: ['REPAIRED', 'SCRAP'] },
        completedAt: { gte: monthStart, lte: monthEnd },
      },
    });

    // Get equipment stats
    const [activeEquipment, scrappedEquipment] = await Promise.all([
      prisma.equipment.count({ where: { status: 'ACTIVE' } }),
      prisma.equipment.count({ where: { status: 'SCRAPPED' } }),
    ]);

    // Get team stats (for managers/admins)
    let teamStats = null;
    if (session!.user.role !== 'REQUESTER') {
      teamStats = await prisma.maintenanceTeam.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              maintenanceRequests: {
                where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
              },
              members: true,
            },
          },
        },
      });
    }

    // Get recent requests
    const recentRequests = await prisma.maintenanceRequest.findMany({
      where: baseWhere,
      include: {
        equipment: { select: { name: true, serialNumber: true } },
        technician: { select: { name: true, avatar: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Get upcoming scheduled maintenance (next 7 days)
    const upcomingMaintenance = await prisma.maintenanceRequest.findMany({
      where: {
        ...baseWhere,
        type: 'PREVENTIVE',
        status: { in: ['NEW', 'IN_PROGRESS'] },
        scheduledDate: {
          gte: today,
          lte: addDays(today, 7),
        },
      },
      include: {
        equipment: { select: { name: true } },
        team: { select: { name: true, color: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      take: 5,
    });

    return successResponse({
      requests: {
        new: newCount,
        inProgress: inProgressCount,
        repaired: repairedCount,
        scrap: scrapCount,
        overdue: overdueCount,
        completedThisMonth,
        total: newCount + inProgressCount + repairedCount + scrapCount,
      },
      equipment: {
        active: activeEquipment,
        scrapped: scrappedEquipment,
        total: activeEquipment + scrappedEquipment,
      },
      teams: teamStats,
      recentRequests,
      upcomingMaintenance,
    });
  });
}
