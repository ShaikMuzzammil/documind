import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search, addChatMessage, updateChatSession } from '@/lib/store';
import { buildMessages, streamChat } from '@/lib/llm';
import { generateId } from '@/lib/utils';
import { ChatSessionMessage } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const question    = (body.question || '').toString().trim();
  const collectionId = body.collectionId ? body.collectionId.toString() : undefined;
  const sessionId   = body.sessionId ? body.sessionId.toString() : undefined;

  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1) Retrieve relevant chunks.
  const queryEmbedding = await embedOne(question);
  const citations = await search(queryEmbedding, { userId: user.id, collectionId, topK: 6 });

  // 2) Save user message to session if sessionId provided.
  if (sessionId) {
    const userMsg: ChatSessionMessage = {
      id: generateId(), sessionId, userId: user.id,
      role: 'user', content: question, createdAt: new Date().toISOString(),
    };
    await addChatMessage(userMsg).catch(() => undefined);
  }

  // 3) Stream a grounded answer.
  const messages = buildMessages(question, citations);
  const answerStream = await streamChat(messages);

  // 4) Collect the full answer then save assistant message & update session.
  const encoder = new TextEncoder();
  let fullAnswer = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // First line: JSON citations header.
      controller.enqueue(encoder.encode(JSON.stringify({ citations }) + '\n'));

      const reader = answerStream.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        fullAnswer += chunk;
        controller.enqueue(value);
      }
      controller.close();

      // 5) Persist assistant message + update session metadata.
      if (sessionId) {
        const assistantMsg: ChatSessionMessage = {
          id: generateId(), sessionId, userId: user.id,
          role: 'assistant', content: fullAnswer, citations,
          createdAt: new Date().toISOString(),
        };
        await addChatMessage(assistantMsg).catch(() => undefined);
        // Update session with new message count estimate & timestamp
        await updateChatSession(user.id, sessionId, { updatedAt: new Date().toISOString() }).catch(() => undefined);
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
