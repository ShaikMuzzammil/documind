import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search } from '@/lib/store';
import { buildMessages, streamChat } from '@/lib/llm';

export const runtime     = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status:  401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body         = await req.json().catch(() => ({}));
  const question     = (body.question ?? '').toString().trim();
  const collectionId = body.collectionId ? body.collectionId.toString() : undefined;
  const topK         = Math.min(Number(body.topK ?? 5), 10);

  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status:  400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const queryEmbedding = await embedOne(question);
  const citations      = await search(queryEmbedding, { userId: user.id, collectionId, topK });
  const messages       = buildMessages(question, citations);
  const answerStream   = await streamChat(messages);

  const encoder = new TextEncoder();
  const stream  = new ReadableStream<Uint8Array>({
    async start(controller) {
      // First line: citations JSON header
      controller.enqueue(encoder.encode(JSON.stringify({ citations }) + '\n'));
      const reader = answerStream.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
