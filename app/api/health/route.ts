import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getStorage } from '@/lib/storage/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const usingPostgres = !!process.env.DATABASE_URL;

  if (!usingPostgres) {
    return NextResponse.json({
      ok: true, mode: 'json', pgvector: false,
      tables: [], message: 'Running in file-based JSON mode (no DATABASE_URL set).',
    });
  }

  try {
    const storage = await getStorage();
    // PostgresAdapter exposes healthCheck(); JsonAdapter doesn't.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (storage as any).healthCheck === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hc = await (storage as any).healthCheck() as { ok: boolean; pgvector: boolean; tables: string[]; error?: string };
      const requiredTables = ['users', 'collections', 'documents', 'chunks', 'chat_sessions', 'chat_messages'];
      const missingTables  = requiredTables.filter(t => !hc.tables.includes(t));
      return NextResponse.json({
        ok: hc.ok && hc.pgvector && missingTables.length === 0,
        mode: 'postgres',
        pgvector: hc.pgvector,
        tables: hc.tables,
        missingTables,
        error: hc.error,
        message: !hc.pgvector
          ? 'pgvector extension is not enabled. Enable it in your Neon/Supabase dashboard under Extensions.'
          : missingTables.length
            ? `Missing tables: ${missingTables.join(', ')}. Upload a document to trigger schema init.`
            : 'Database is healthy.',
      });
    }
    return NextResponse.json({ ok: true, mode: 'json', pgvector: false, tables: [] });
  } catch (err) {
    return NextResponse.json({
      ok: false, mode: 'postgres', pgvector: false, tables: [],
      error: err instanceof Error ? err.message : String(err),
      message: 'Database connectivity check failed.',
    });
  }
}
