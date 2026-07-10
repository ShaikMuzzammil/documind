// OpenAI-compatible chat client with streaming support (Gemini by default).
// Supports two modes:
//   • "documents"  — grounded RAG answers citing retrieved passages
//   • "general"    — direct LLM chat with no document context required
//
// Returns a ReadableStream of text tokens so the chat UI renders answers live.

import { Citation } from './types';

const API_KEY    = process.env.LLM_API_KEY;
const BASE_URL   = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
const CHAT_MODEL = process.env.LLM_CHAT_MODEL || 'gemini-2.5-flash';

export function llmConfigured(): boolean {
  return Boolean(API_KEY);
}

// ─── Document-grounded mode ───────────────────────────────────────────────────

/** Build the grounded system + user prompt from retrieved citations. */
export function buildMessages(question: string, citations: Citation[]) {
  const context = citations
    .map((c, i) => `[${i + 1}] (from "${c.documentName}")\n${c.text}`)
    .join('\n\n');

  const system = citations.length > 0
    ? [
        'You are DocuMind, an intelligent document assistant.',
        'Answer using ONLY the provided context passages — never invent facts outside them.',
        'Cite sources inline using bracketed numbers like [1], [2] that correspond to the passages.',
        'If the specific answer is not in the context, say clearly: "I could not find this in the provided documents."',
        'Be concise, accurate, and well-structured. Use markdown for lists and headings when it helps clarity.',
      ].join(' ')
    : [
        'You are DocuMind, an intelligent document assistant.',
        'No relevant passages were found for this question in the indexed documents.',
        'Politely let the user know their documents do not contain an answer to this question.',
        'Suggest they upload relevant documents or rephrase their question.',
        'Never make up document content. Be brief and helpful.',
      ].join(' ');

  const user = context
    ? `Context passages:\n\n${context}\n\nQuestion: ${question}`
    : `Question: ${question}\n\n(No relevant context was found in the documents.)`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user'   as const, content: user   },
  ];
}

// ─── General AI mode ─────────────────────────────────────────────────────────

export type GeneralMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Build messages for a free-form AI conversation (no document context).
 * Includes full history so the LLM can follow multi-turn threads.
 */
export function buildGeneralMessages(
  question: string,
  history: GeneralMessage[] = [],
) {
  const system = [
    'You are DocuMind AI, a highly capable general-purpose assistant built into the DocuMind platform.',
    'You can answer any question, help with writing, analysis, coding, maths, brainstorming, or creative tasks.',
    'When the user mentions "my documents" or asks about content they uploaded, remind them to switch to Document Mode',
    'using the toggle at the top of the chat.',
    'Be friendly, concise, and use markdown formatting (lists, code blocks, headings) when it improves clarity.',
    'Never mention that you are based on a specific underlying model.',
  ].join(' ');

  return [
    { role: 'system' as const, content: system },
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user'   as const, content: question },
  ];
}

// ─── Shared streaming engine ──────────────────────────────────────────────────

function friendlyUpstreamMessage(status: number): string {
  if (status === 429) return 'The AI is rate-limited right now. Please wait a minute and try again.';
  if (status === 401 || status === 403) return 'The AI key is invalid or missing. Go to Settings → AI Engine to configure it.';
  if (status >= 500) return 'The AI provider is temporarily unavailable. Please try again shortly.';
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
        controller.enqueue(encoder.encode(
          '**AI answers are not configured yet.**\n\n' +
          'Add your `LLM_API_KEY` in Vercel → Settings → Environment Variables ' +
          '(Gemini, OpenAI, Groq, or any OpenAI-compatible provider).\n\n' +
          'Then redeploy so the key is picked up.\n\n' +
          '_Document upload and semantic search still work without an AI key._',
        ));
        controller.close();
      },
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true, temperature: 0.3 }),
    });
  } catch {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('Could not reach the AI service. Check your connection and try again.'));
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

  const reader  = upstream.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer  = '';
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
            if (payload === '[DONE]') { controller.close(); return; }
            try {
              const json  = JSON.parse(payload);
              const token = json.choices?.[0]?.delta?.content;
              if (token) { emitted = true; controller.enqueue(encoder.encode(token)); }
            } catch { /* non-JSON keep-alive lines */ }
          }
        }
        if (!emitted) {
          controller.enqueue(encoder.encode('The AI returned an empty response. Please try rephrasing.'));
        }
      } catch {
        if (!emitted) controller.enqueue(encoder.encode('The AI connection was interrupted. Please try again.'));
      } finally {
        controller.close();
      }
    },
  });
}
