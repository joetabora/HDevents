import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'hd_app_auth';

export async function POST(request: Request) {
  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json({ message: 'APP_PASSWORD is not configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const submittedPassword = body?.password?.trim();

  if (!submittedPassword || submittedPassword !== expectedPassword) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: expectedPassword,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0
  });

  return response;
}
