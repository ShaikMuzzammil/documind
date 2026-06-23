import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { ChatMessage } from '@/lib/types';

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const messages: ChatMessage[] = body.messages || [];
  const collectionName: string = body.collectionName || 'All collections';

  if (!messages.length) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
  }

  const lines: string[] = [
    '# DocuMind — Chat Export',
    '',
    `> **Exported:** ${new Date().toLocaleString()}  `,
    `> **Account:** ${user.email}  `,
    `> **Scope:** ${collectionName}  `,
    `> **Messages:** ${messages.length}`,
    '',
    '---',
    '',
  ];

  for (const msg of messages) {
    if (msg.role === 'user') {
      lines.push('## 🧑 You');
      lines.push('');
      lines.push(msg.content);
    } else {
      lines.push('## 🤖 DocuMind');
      lines.push('');
      lines.push(msg.content || '_No response generated._');
      if (msg.citations && msg.citations.length > 0) {
        lines.push('');
        lines.push('**Sources cited:**');
        msg.citations.forEach((c, i) => {
          lines.push(`- **[${i + 1}]** \`${c.documentName}\` — score \`${c.score.toFixed(3)}\``);
          lines.push(`  > ${c.text.slice(0, 250)}${c.text.length > 250 ? '…' : ''}`);
        });
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const markdown = lines.join('\n');
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="chat-export-${Date.now()}.md"`,
    },
  });
}
