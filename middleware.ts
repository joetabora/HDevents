import { NextResponse, type NextRequest } from 'next/server';
import { canAccessPage } from '@/modules/users/permissions';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/modules/users/session';

const EVENTS_ONLY_REDIRECT_PREFIXES = ['/contacts', '/documents', '/executive', '/social', '/tasks', '/users', '/settings'];

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth')
  );
}

function isMutationMethod(method: string): boolean {
  return method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
}

function isEventsOnlyRedirectPath(pathname: string): boolean {
  return EVENTS_ONLY_REDIRECT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  const isAuthenticated = Boolean(session);

  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/events', request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated || !session) {
    if (pathname.startsWith('/api')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPage(session.role, pathname)) {
    if (pathname.startsWith('/api')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    return NextResponse.redirect(new URL('/events', request.url));
  }

  if (!pathname.startsWith('/api')) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/events', request.url));
    }

    if (isEventsOnlyRedirectPath(pathname)) {
      return NextResponse.redirect(new URL('/events', request.url));
    }
  }

  if (pathname.startsWith('/api') && isMutationMethod(request.method)) {
    if (session.role === 'VIEWER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (session.role === 'EDITOR') {
      if (request.method === 'DELETE') {
        return new NextResponse('Forbidden', { status: 403 });
      }

      if (pathname.startsWith('/api/users')) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  const isServerAction = request.method === 'POST' && request.headers.has('next-action');
  if (isServerAction) {
    if (session.role === 'VIEWER') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (session.role === 'EDITOR' && pathname.startsWith('/users')) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
