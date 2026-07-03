export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { emailConfigured } from '@/lib/mail';
import { usingPostgres } from '@/lib/storage';
import { getStorage } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user,
    capabilities: {
      email: emailConfigured(),
      postgres: usingPostgres(),
      ai: Boolean(process.env.LLM_API_KEY),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;
  if (name !== undefined && (!name || name.length > 80)) {
    return NextResponse.json({ error: 'Name must be between 1 and 80 characters.' }, { status: 400 });
  }

  const updated = await getStorage().updateUser(user.id, { name });
  if (!updated) return NextResponse.json({ error: 'Could not update profile.' }, { status: 500 });
  return NextResponse.json({ user: updated });
}
