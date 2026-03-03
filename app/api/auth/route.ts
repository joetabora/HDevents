import { NextResponse } from 'next/server';
import { createSessionToken, AUTH_COOKIE_NAME, getSessionMaxAgeSeconds } from '@/modules/users/session';
import { ensureBootstrapAdmin, getUserCount, verifyUserCredentials } from '@/modules/users/services';

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string; name?: string } | null;
  const submittedEmail = normalizeEmail(String(body?.email ?? ''));
  const submittedPassword = String(body?.password ?? '').trim();

  if (!submittedEmail || !submittedPassword) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
  }

  const userCount = await getUserCount();
  const bootstrapEmail = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? submittedEmail);
  const bootstrapPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD ?? process.env.APP_PASSWORD ?? '').trim();
  const bootstrapName = String(process.env.BOOTSTRAP_ADMIN_NAME ?? process.env.ADMIN_NAME ?? body?.name ?? 'Admin').trim();

  if (userCount === 0) {
    const canBootstrap =
      bootstrapPassword.length > 0 &&
      submittedPassword === bootstrapPassword &&
      submittedEmail === bootstrapEmail;

    if (!canBootstrap) {
      return NextResponse.json(
        {
          message:
            'No users exist yet. Sign in with BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD (or ADMIN_EMAIL + APP_PASSWORD).'
        },
        { status: 401 }
      );
    }

    await ensureBootstrapAdmin({
      name: bootstrapName,
      email: bootstrapEmail,
      password: bootstrapPassword
    });
  }

  const user = await verifyUserCredentials(submittedEmail, submittedPassword);

  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    role: user.role,
    department: user.department,
    email: user.email,
    name: user.name
  });

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getSessionMaxAgeSeconds()
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
