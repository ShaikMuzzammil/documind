import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/utils';
import { hashPassword, createSession } from '@/lib/auth';
import { getUserByEmail, saveUser } from '@/lib/store';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name     = (body.name     ?? '').toString().trim();
  const email    = (body.email    ?? '').toString().trim().toLowerCase();
  const password = (body.password ?? '').toString();

  if (!name)                 return NextResponse.json({ error: 'Name is required.' },  { status: 400 });
  if (!email || !email.includes('@'))
                             return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
  if (password.length < 8)  return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });

  const existing = await getUserByEmail(email);
  if (existing) return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 409 });

  const user = {
    id:           generateId(),
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt:    new Date().toISOString(),
  };
  await saveUser(user);
  await createSession(user.id);

  // Optional welcome email
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          from:    process.env.EMAIL_FROM,
          to:      email,
          subject: 'Welcome to DocuMind',
          html:    `<p>Hi ${name}, welcome to DocuMind! Start by uploading your first document.</p>`,
        }),
      });
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ success: true });
}
