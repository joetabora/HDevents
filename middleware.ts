import { NextResponse, type NextRequest } from 'next/server';

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

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse('APP_PASSWORD is not configured', { status: 500 });
  }

  const submittedPassword = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (submittedPassword !== expectedPassword) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
