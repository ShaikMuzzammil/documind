import { Citation } from '@/lib/types';

const API_KEY  = process.env.AI_API_KEY ?? '';
const MODEL    = process.env.AI_CHAT_MODEL ?? 'gemini-2.0-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`;

export type LlmMessage = { role: 'user' | 'model'; parts: { text: string }[] };

export function buildMessages(question: string, citations: Citation[]): LlmMessage[] {
  const context = citations.length
    ? citations.map((c, i) => `[${i + 1}] ${c.documentName}:\n${c.text}`).join('\n\n')
    : 'No relevant document context found.';

  return [
    {
      role: 'user',
      parts: [
        {
          text: `You are DocuMind, a precise document intelligence assistant. Answer using ONLY the provided document context. Cite sources as [1], [2], etc. If the context does not contain enough information, say so clearly.\n\n--- DOCUMENT CONTEXT ---\n${context}\n--- END CONTEXT ---\n\nQuestion: ${question}`,
        },
      ],
    },
  ];
}

/* Streaming via SSE — returns a ReadableStream<Uint8Array> of token text */
export async function streamChat(messages: LlmMessage[]): Promise<ReadableStream<Uint8Array>> {
  if (!API_KEY) {
    const fallback = 'AI key not configured. Add AI_API_KEY to your environment variables.';
    return new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(fallback));
        c.close();
      },
    });
  }

  const res = await fetch(`${BASE_URL}:streamGenerateContent?alt=sse&key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents:         messages,
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');

    // User-friendly quota message
    if (res.status === 429) {
      const friendly =
        '⚠️ AI quota reached for this key. The free tier limit has been hit. ' +
        'Please wait a few minutes and try again, or upgrade your AI plan for higher limits.';
      return new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode(friendly));
          c.close();
        },
      });
    }

    const errMsg = `AI service error (${res.status}). Please try again.`;
    console.error('[llm] error:', res.status, errText.slice(0, 300));
    return new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode(errMsg));
        c.close();
      },
    });
  }

  const encoder = new TextEncoder();
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (json === '[DONE]') { controller.close(); return; }
          try {
            const chunk = JSON.parse(json);
            const text  = chunk?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) controller.enqueue(encoder.encode(text));
          } catch { /* skip malformed SSE line */ }
        }
        return; // yield control back
      }
    },
    cancel() { reader.cancel(); },
  });
}

/* Non-streaming completion for schema extraction */
export async function completeJSON(prompt: string): Promise<string> {
  if (!API_KEY) return '{}';
  const res = await fetch(`${BASE_URL}:generateContent?key=${API_KEY}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents:         [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error('QUOTA_EXCEEDED');
    throw new Error(`AI error ${res.status}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}
