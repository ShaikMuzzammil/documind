import { createHmac, randomBytes, timingSafeEqual, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getUser } from '@/lib/store';

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-in-production';
const COOKIE  = 'dm_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string): string {
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verify(token: string): string | null {
  const last = token.lastIndexOf('.');
  if (last < 0) return null;
  const payload = token.slice(0, last);
  const sig     = token.slice(last + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  return payload;
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + pw).digest('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  const attempt = createHash('sha256').update(salt + pw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
  } catch {
    return false;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = sign(`${userId}:${Date.now()}`);
  const jar   = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   MAX_AGE,
    path:     '/',
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser(req?: NextRequest) {
  let token: string | undefined;
  if (req) {
    token = req.cookies.get(COOKIE)?.value;
  } else {
    const jar = await cookies();
    token = jar.get(COOKIE)?.value;
  }
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const userId = payload.split(':')[0];
  return getUser(userId);
}

export async function requireCurrentUser(req?: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) throw new Error('Unauthorized');
  return user;
}
