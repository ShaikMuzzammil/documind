import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { emailConfigured } from '@/lib/mail';
import { usingPostgres } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user,
    capabilities: {
      email: emailConfigured(),
      postgres: usingPostgres(),
      ai: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}
