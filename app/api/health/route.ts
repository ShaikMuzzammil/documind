import { NextResponse } from 'next/server';
import { usingPostgres } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    storage: usingPostgres() ? 'postgres' : 'local',
    ai: Boolean(process.env.GEMINI_API_KEY),
  });
}
