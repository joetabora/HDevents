import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const HASH_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const normalized = password.trim();
  if (!normalized) {
    throw new Error('Password is required');
  }

  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(normalized, salt, HASH_KEY_LENGTH).toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const computed = scryptSync(password.trim(), salt, HASH_KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');

  if (computed.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(computed, stored);
}
