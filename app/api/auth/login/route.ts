import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession } from '@/lib/auth';
import { getUserByEmail } from '@/lib/store';

export async function POST(req: NextRequest) {
  const body     = await req.json().catch(() => ({}));
  const email    = (body.email    ?? '').toString().trim().toLowerCase();
  const password = (body.password ?? '').toString();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: 'No account found with this email. Please register first.' },
      { status: 401 },
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
