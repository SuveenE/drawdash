import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to /create and its assets
  if (pathname === '/create' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow static files (images, fonts, etc.)
  if (
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo.png') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // Redirect all other routes to /create
  const url = request.nextUrl.clone();
  url.pathname = '/create';
  return NextResponse.redirect(url);
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
