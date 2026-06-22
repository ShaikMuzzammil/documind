import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/mail';
import { getStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const storage = getStorage();
  const existing = await storage.getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 });
  }

  const user = {
    id: generateId(),
    email,
    name,
    createdAt: new Date().toISOString(),
  };
  const passwordHash = await bcrypt.hash(password, 12);
  await storage.createUser(user, passwordHash);

  sendWelcomeEmail(user).catch((err) => console.warn('welcome email failed', err));

  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: createSessionToken(user.id),
  });
  return response;
}
