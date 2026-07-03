import { createHmac, timingSafeEqual } from 'crypto';
import { User } from './types';
import { getStorage } from './storage';

export const SESSION_COOKIE = 'documind_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

export class AuthError extends Error {
  status = 401;

  constructor(message = 'Authentication required') {
    super(message);
  }
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'documind-dev-session-secret';
  throw new Error('AUTH_SECRET is required in production');
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

function sign(value: string): string {
  return createHmac('sha256', getAuthSecret()).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie') || '';
  const cookies = header.split(';').map((part) => part.trim());
  const match = cookies.find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function createSessionToken(userId: string): string {
  const payload = encodeJson({
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  } satisfies SessionPayload);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | null): SessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null;

  const session = decodeJson<SessionPayload>(payload);
  if (!session || !session.userId || session.expiresAt < Date.now()) return null;
  return session;
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export async function getCurrentUser(req: Request): Promise<User | null> {
  const token = readCookie(req, SESSION_COOKIE);
  const session = verifySessionToken(token);
  if (!session) return null;
  return getStorage().getUserById(session.userId);
}

export async function requireCurrentUser(req: Request): Promise<User> {
  const user = await getCurrentUser(req);
  if (!user) throw new AuthError();
  return user;
}
