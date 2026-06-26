import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body     = await req.json().catch(() => ({}));
  const messages = body.messages ?? [];
  const title    = (body.title ?? 'chat').toString().replace(/[^a-z0-9-_]/gi, '_');

  if (!messages.length) return NextResponse.json({ error: 'No messages provided' }, { status: 400 });

  const lines: string[] = [`# DocuMind Chat Export\n_Exported: ${new Date().toLocaleString()}_\n`];
  for (const msg of messages) {
    const role = msg.role === 'user' ? '**You**' : '**DocuMind**';
    lines.push(`## ${role}\n${msg.content}`);
    if (msg.citations?.length) {
      lines.push(`\n> *Sources: ${msg.citations.map((c: { documentName: string }, i: number) => `[${i + 1}] ${c.documentName}`).join(', ')}*`);
    }
  }

  const md = lines.join('\n\n');
  return new NextResponse(md, {
    headers: {
      'Content-Type':        'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${title}-export.md"`,
    },
  });
}
