import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { detectPII, redactPII, piiSummary, maskValue } from '@/lib/pii';

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body   = await req.json().catch(() => ({}));
  const text   = (body.text ?? '').toString();
  const redact = Boolean(body.redact ?? false);
  const types  = Array.isArray(body.types) ? body.types : undefined;

  if (!text.trim()) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  if (text.length > 100_000) {
    return NextResponse.json({ error: 'Text too large (max 100KB)' }, { status: 413 });
  }

  const matches = detectPII(text);
  const summary = piiSummary(matches);

  const masked = matches.map((m) => ({
    type:   m.type,
    risk:   m.risk,
    masked: maskValue(m.value, m.type),
    start:  m.start,
    end:    m.end,
  }));

  let redacted: string | null = null;
  let redactedCount = 0;

  if (redact) {
    const result = redactPII(text, types);
    redacted      = result.redacted;
    redactedCount = result.count;
  }

  const riskScore =
    matches.reduce((s, m) => s + (m.risk === 'high' ? 3 : m.risk === 'medium' ? 2 : 1), 0);

  return NextResponse.json({
    totalMatches: matches.length,
    riskScore,
    riskLevel: riskScore >= 10 ? 'high' : riskScore >= 4 ? 'medium' : riskScore > 0 ? 'low' : 'none',
    summary,
    matches: masked,
    redacted,
    redactedCount,
  });
}
