import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { updateUser } from '@/lib/store';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};

  if (body.name && typeof body.name === 'string') {
    patch.name = body.name.trim();
  }

  if (body.newPassword) {
    if (!body.currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    const ok = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    if (body.newPassword.length < 8) return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    patch.passwordHash = await hashPassword(body.newPassword);
  }

  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  await updateUser(user.id, patch);
  return NextResponse.json({ success: true });
}
