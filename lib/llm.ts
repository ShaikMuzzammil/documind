// OpenAI-compatible chat client with streaming support (Gemini by default).
//
// Returns a ReadableStream of text tokens so the chat UI can render answers as
// they generate. Falls back to a helpful message when no API key is
// configured, and never leaks raw provider error bodies or key material to
// the client.

import { Citation } from './types';

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
const CHAT_MODEL = process.env.LLM_CHAT_MODEL || 'gemini-2.5-flash';

export function llmConfigured(): boolean {
  return Boolean(API_KEY);
}

/** Build the grounded system + user prompt from retrieved citations. */
export function buildMessages(question: string, citations: Citation[]) {
  const context = citations
    .map((c, i) => `[${i + 1}] (from "${c.documentName}")\n${c.text}`)
    .join('\n\n');

  const system = [
    'You are the DocuMind retrieval assistant.',
    'Answer ONLY using the provided context passages.',
    'Cite sources inline using bracketed numbers like [1], [2] that map to the passages.',
    "If the answer is not in the context, say you could not find it in the user's documents.",
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

function friendlyUpstreamMessage(status: number): string {
  if (status === 429) {
    return 'The AI is receiving too many requests right now. Please wait a minute and try again.';
  }
  if (status === 401 || status === 403) {
    return 'The AI answer service is not available right now. Retrieval and citations below still work.';
  }
  if (status >= 500) {
    return 'The AI answer service is temporarily unavailable. Please try again shortly.';
  }
  return 'The AI could not generate an answer for this question. Please rephrase and try again.';
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
            'AI answers are not turned on for this workspace yet. Open Settings to learn how to enable them - ' +
              'retrieval and citations below still work without it.',
          ),
        );
        controller.close();
      },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true, temperature: 0.2 }),
    });
  } catch {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('Could not reach the AI service. Please check your connection and try again.'));
        controller.close();
      },
    });
  }

  if (!upstream.ok || !upstream.body) {
    const message = friendlyUpstreamMessage(upstream.status);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(message));
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
      let emitted = false;
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
              if (token) {
                emitted = true;
                controller.enqueue(encoder.encode(token));
              }
            } catch {
              // ignore keep-alive / non-JSON lines
            }
          }
        }
        if (!emitted) {
          controller.enqueue(encoder.encode('The AI returned an empty response. Please try rephrasing your question.'));
        }
      } catch {
        if (!emitted) {
          controller.enqueue(encoder.encode('The AI connection was interrupted. Please try again.'));
        }
      } finally {
        controller.close();
      }
    },
  });
}
