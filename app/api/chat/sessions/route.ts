import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getChatSessions, createChatSession } from '@/lib/store';
import { generateId } from '@/lib/utils';
import { ChatSession } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sessions = await getChatSessions(user.id);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const session: ChatSession = {
    id: generateId(),
    userId: user.id,
    title: (body.title as string) || 'New conversation',
    collectionId: body.collectionId || undefined,
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const created = await createChatSession(session);
    return NextResponse.json({ session: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
