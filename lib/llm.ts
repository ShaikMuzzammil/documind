// OpenAI-compatible chat client with streaming support.
//
// Returns a ReadableStream of text tokens so the chat UI can render answers as
// they generate. Falls back to a helpful message when no API key is configured.

import { Citation } from './types';

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const CHAT_MODEL = process.env.LLM_CHAT_MODEL || 'gpt-4o-mini';

export function llmConfigured(): boolean {
  return Boolean(API_KEY);
}

/** Build the grounded system + user prompt from retrieved citations. */
export function buildMessages(question: string, citations: Citation[]) {
  const context = citations
    .map((c, i) => `[${i + 1}] (from "${c.documentName}")\n${c.text}`)
    .join('\n\n');

  const system = [
    'You are DocuMind, a retrieval-augmented assistant.',
    'Answer ONLY using the provided context passages.',
    'Cite sources inline using bracketed numbers like [1], [2] that map to the passages.',
    'If the answer is not in the context, say you could not find it in the documents.',
    'Be concise, accurate, and never invent facts.',
  ].join(' ');

  const user = context
    ? `Context passages:\n\n${context}\n\nQuestion: ${question}`
    : `Question: ${question}\n\n(No relevant context was found in the documents.)`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

/** Stream a chat completion as plain text tokens. */
export async function streamChat(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  if (!API_KEY) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'LLM is not configured. Add LLM_API_KEY to .env.local to enable AI answers. ' +
              'Retrieval and citations still work — see the sources below.',
          ),
        );
        controller.close();
      },
    });
  }

  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true, temperature: 0.2 }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`LLM request failed (${upstream.status}). ${errText}`));
        controller.close();
      },
    });
  }

  // Parse the provider's SSE stream and re-emit only the text deltas.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore keep-alive / non-JSON lines
            }
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n[stream error] ${String(err)}`));
      } finally {
        controller.close();
      }
    },
  });
}
