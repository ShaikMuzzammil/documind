// Gemini Embeddings client.
//
// Uses the Gemini text-embedding-004 model (768-dim) when GEMINI_API_KEY is set.
// Falls back to a deterministic local hashing embedder (384-dim) so the full
// RAG pipeline still works end-to-end with zero setup.
//
// NOTE: Re-indexing is required when switching between local and Gemini embeddings
// because they produce different vector dimensions.

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';

const LOCAL_DIM = 384;

/** Deterministic local fallback embedding (bag-of-hashed-tokens, L2 normalized). */
export function localEmbed(text: string): number[] {
  const vec = new Array(LOCAL_DIM).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % LOCAL_DIM;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function usingLocalEmbeddings(): boolean {
  return !GEMINI_KEY;
}

interface BatchEmbedResponse {
  embeddings: { values: number[] }[];
}

/**
 * Batch embed via Gemini batchEmbedContents endpoint.
 * text-embedding-004 produces 768-dimensional float vectors.
 */
async function remoteEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch(
    `${GEMINI_BASE}/models/${EMBED_MODEL}:batchEmbedContents?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT',
        })),
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini embeddings request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as BatchEmbedResponse;
  return data.embeddings.map((e) => e.values);
}

/** Embed a batch of texts. Never throws — falls back to local embeddings on error. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (!GEMINI_KEY) return texts.map(localEmbed);

  try {
    return await remoteEmbed(texts);
  } catch {
    // Provider failed — degrade gracefully to local embeddings.
    return texts.map(localEmbed);
  }
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
