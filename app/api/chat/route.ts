import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search, addChatMessage, updateChatSession } from '@/lib/store';
import { buildMessages, buildGeneralMessages, streamChat, GeneralMessage } from '@/lib/llm';
import { generateId } from '@/lib/utils';
import { ChatSessionMessage } from '@/lib/types';

export const runtime    = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await req.json().catch(() => ({}));
  const question     = (body.question    || '').toString().trim();
  const collectionId  = body.collectionId ? body.collectionId.toString() : undefined;
  const sessionId     = body.sessionId    ? body.sessionId.toString()    : undefined;
  const mode          = body.mode === 'general' ? 'general' : 'documents';
  const history       = Array.isArray(body.history) ? (body.history as GeneralMessage[]) : [];

  if (!question) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── General AI mode: skip document search entirely ────────────────────────
  if (mode === 'general') {
    const messages = buildGeneralMessages(question, history);
    const answerStream = await streamChat(messages);
    const encoder = new TextEncoder();
    let fullAnswer = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // No citations in general mode — emit empty citations header so the
        // client-side parser still works without changes.
        controller.enqueue(encoder.encode(JSON.stringify({ citations: [] }) + '\n'));

        const reader = answerStream.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          fullAnswer += new TextDecoder().decode(value);
          controller.enqueue(value);
        }
        controller.close();

        if (sessionId) {
          const userMsg: ChatSessionMessage = {
            id: generateId(), sessionId, userId: user.id,
            role: 'user', content: question, createdAt: new Date().toISOString(),
          };
          const assistantMsg: ChatSessionMessage = {
            id: generateId(), sessionId, userId: user.id,
            role: 'assistant', content: fullAnswer,
            createdAt: new Date().toISOString(),
          };
          await addChatMessage(userMsg).catch(() => undefined);
          await addChatMessage(assistantMsg).catch(() => undefined);
          await updateChatSession(user.id, sessionId, { updatedAt: new Date().toISOString() }).catch(() => undefined);
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });
  }

  // ── Document-grounded mode (default) ─────────────────────────────────────
  const queryEmbedding = await embedOne(question);
  const citations      = await search(queryEmbedding, { userId: user.id, collectionId, topK: 6 });

  if (sessionId) {
    const userMsg: ChatSessionMessage = {
      id: generateId(), sessionId, userId: user.id,
      role: 'user', content: question, createdAt: new Date().toISOString(),
    };
    await addChatMessage(userMsg).catch(() => undefined);
  }

  const messages     = buildMessages(question, citations);
  const answerStream = await streamChat(messages);
  const encoder = new TextEncoder();
  let fullAnswer = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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

      if (sessionId) {
        const assistantMsg: ChatSessionMessage = {
          id: generateId(), sessionId, userId: user.id,
          role: 'assistant', content: fullAnswer, citations,
          createdAt: new Date().toISOString(),
        };
        await addChatMessage(assistantMsg).catch(() => undefined);
        await updateChatSession(user.id, sessionId, { updatedAt: new Date().toISOString() }).catch(() => undefined);
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}
