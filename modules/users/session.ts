import type { UserDepartment, UserRole } from './constants';

export const AUTH_COOKIE_NAME = 'hd_user_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 10;

type SessionTokenPayload = {
  userId: string;
  role: UserRole;
  department: UserDepartment;
  email: string;
  name: string;
  exp: number;
};

function getSessionSecret(): string {
  return process.env.SESSION_SECRET?.trim() || 'local-dev-session-secret';
}

function bytesToBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padding);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function encodeJsonToBase64Url(value: object): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

function decodeJsonFromBase64Url<T>(value: string): T | null {
  try {
    const bytes = base64UrlToBytes(value);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(params: {
  userId: string;
  role: UserRole;
  department: UserDepartment;
  email: string;
  name: string;
}): Promise<string> {
  const payload: SessionTokenPayload = {
    ...params,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  };

  const payloadPart = encodeJsonToBase64Url(payload);
  const signature = await sign(payloadPart);

  return `${payloadPart}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionTokenPayload | null> {
  if (!token) {
    return null;
  }

  const [payloadPart, signature] = token.split('.');

  if (!payloadPart || !signature) {
    return null;
  }

  const expected = await sign(payloadPart);
  if (signature !== expected) {
    return null;
  }

  const payload = decodeJsonFromBase64Url<SessionTokenPayload>(payloadPart);
  if (!payload) {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_DURATION_SECONDS;
}
