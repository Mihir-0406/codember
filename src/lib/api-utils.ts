/**
 * API Utilities
 * Common functions for API route handlers
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ZodError } from 'zod';
import { UserRole } from '@prisma/client';
import { hasPermission, Permission } from '@/lib/rbac';

/**
 * Standard API response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error, errors }, { status });
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse<ApiResponse> {
  const errors: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) errors[path] = [];
    errors[path].push(err.message);
  });
  return errorResponse('Validation failed', 400, errors);
}

/**
 * Get authenticated session or return error response
 */
export async function getAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: errorResponse('Unauthorized', 401) };
  }
  return { session, error: null };
}

/**
 * Check if user has required permission
 */
export function checkPermission(
  role: UserRole,
  permission: Permission
): NextResponse<ApiResponse> | null {
  if (!hasPermission(role, permission)) {
    return errorResponse('Forbidden: Insufficient permissions', 403);
  }
  return null;
}

/**
 * Wrap async handler with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error) => {
    console.error('API Error:', error);
    
    if (error instanceof ZodError) {
      return handleZodError(error);
    }
    
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return errorResponse(`A record with this ${field} already exists`, 409);
    }
    
    // Prisma record not found
    if (error.code === 'P2025') {
      return errorResponse('Record not found', 404);
    }
    
    return errorResponse(
      process.env.NODE_ENV === 'development'
        ? error.message
        : 'Internal server error',
      500
    );
  });
}

/**
 * Parse JSON body with error handling
 */
export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Extract query parameters from URL
 */
export function getQueryParams(request: Request): URLSearchParams {
  const url = new URL(request.url);
  return url.searchParams;
}
