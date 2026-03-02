import { NextResponse } from 'next/server';
import { getAllowedAppPasswords } from '@/lib/utils/auth-passwords';

const AUTH_COOKIE_NAME = 'hd_app_auth';

export async function POST(request: Request) {
  const allowedPasswords = getAllowedAppPasswords();

  if (allowedPasswords.length === 0) {
    return NextResponse.json({ message: 'APP_PASSWORD or APP_PASSWORDS is not configured' }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const submittedPassword = body?.password?.trim();

  if (!submittedPassword || !allowedPasswords.includes(submittedPassword)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: submittedPassword,
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
