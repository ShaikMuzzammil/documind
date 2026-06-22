// Gemini chat client with streaming support.
//
// Uses the Gemini REST API (v1beta) for streaming chat completions.
// Falls back to a helpful message when no API key is configured.

import { Citation } from './types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.0-flash';

export function llmConfigured(): boolean {
  return Boolean(GEMINI_KEY);
}

/** Build the grounded system + user prompt from retrieved citations. */
export function buildMessages(question: string, citations: Citation[]) {
  const context = citations
    .map((c, i) => `[${i + 1}] (from "${c.documentName}")\n${c.text}`)
    .join('\n\n');

  const system = [
    'You are DocuMind, a retrieval-augmented document intelligence assistant.',
    'Answer ONLY using the provided context passages.',
    'Cite sources inline using bracketed numbers like [1], [2] that map to the passages.',
    'If the answer is not in the context, say you could not find it in the provided documents.',
    'Be concise, accurate, structured with markdown where helpful, and never invent facts.',
    'Use bullet points and headings when presenting multiple pieces of information.',
  ].join(' ');

  const user = context
    ? `Context passages:\n\n${context}\n\nQuestion: ${question}`
    : `Question: ${question}\n\n(No relevant context was found in the documents.)`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

interface GeminiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Stream a chat completion as plain text tokens via Gemini API. */
export async function streamChat(
  messages: GeminiMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  if (!GEMINI_KEY) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            '⚠️ Gemini is not configured. Add **GEMINI_API_KEY** to `.env.local` to enable AI answers. ' +
              'Retrieval and citations still work — see the sources panel below.',
          ),
        );
        controller.close();
      },
    });
  }

  // Separate system instruction from chat messages
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const contents = chatMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const requestBody = {
    contents,
    ...(systemMsg && {
      systemInstruction: { parts: [{ text: systemMsg.content }] },
    }),
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const upstream = await fetch(
    `${GEMINI_BASE}/models/${CHAT_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
  );

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`Gemini request failed (${upstream.status}). ${errText}`),
        );
        controller.close();
      },
    });
  }

  // Parse the Gemini SSE stream and re-emit only the text deltas.
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
              // Gemini SSE: candidates[0].content.parts[0].text
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(encoder.encode(text));
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
