import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = (body.email || '').toString().trim().toLowerCase();
  const password = (body.password || '').toString();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await getStorage().getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
  const response = NextResponse.json({ user: safeUser });
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: createSessionToken(user.id),
  });
  return response;
}
