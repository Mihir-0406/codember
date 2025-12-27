/**
 * Next.js Middleware
 * Protects routes and handles authentication
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If no token and trying to access protected routes
    if (!token && !path.startsWith('/login') && !path.startsWith('/forgot-password') && !path.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based route protection
    if (token) {
      const role = token.role as string;

      // Admin-only routes
      if (path.startsWith('/users')) {
        if (role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }

      // Manager and Admin routes
      if (path.startsWith('/teams/new') || path.includes('/teams/') && path.includes('/edit')) {
        if (role !== 'ADMIN' && role !== 'MANAGER') {
          return NextResponse.redirect(new URL('/teams', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow public routes
        if (
          path.startsWith('/login') ||
          path.startsWith('/forgot-password') ||
          path.startsWith('/api/auth') ||
          path === '/'
        ) {
          return true;
        }

        // Require token for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
