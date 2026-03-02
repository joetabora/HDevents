import { NextResponse, type NextRequest } from 'next/server';
import { getAllowedAppPasswords } from '@/lib/utils/auth-passwords';

const AUTH_COOKIE_NAME = 'hd_app_auth';

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowedPasswords = getAllowedAppPasswords();
  const submittedPassword = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(submittedPassword && allowedPasswords.includes(submittedPassword));

  if (allowedPasswords.length === 0) {
    return new NextResponse('APP_PASSWORD or APP_PASSWORDS is not configured', { status: 500 });
  }

  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    if (pathname.startsWith('/api')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
