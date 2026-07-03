import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollections, getDocuments } from '@/lib/store';
import { buildWorkspaceStats } from '@/lib/analytics';
import { llmConfigured } from '@/lib/llm';
import { usingPostgres } from '@/lib/storage';
import { emailConfigured } from '@/lib/mail';

// Force Node.js runtime – this route uses crypto (auth) and fs (json-adapter)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const [collections, documents] = await Promise.all([
    getCollections(user.id),
    getDocuments(user.id),
  ]);

  const stats = buildWorkspaceStats(collections, documents);

  return NextResponse.json({
    stats,
    capabilities: {
      aiAnswers: llmConfigured(),
      database: usingPostgres() ? 'postgres' : 'local',
      email: emailConfigured(),
    },
  });
}
