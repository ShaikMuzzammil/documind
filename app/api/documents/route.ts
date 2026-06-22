import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments } from '@/lib/store';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const collectionId = req.nextUrl.searchParams.get('collectionId') || undefined;
  const docs = await getDocuments(user.id, collectionId);
  return NextResponse.json({ documents: docs });
}
