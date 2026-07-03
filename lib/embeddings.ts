// Embeddings client.
//
// Uses an OpenAI-compatible /embeddings endpoint (Gemini's OpenAI-compatibility
// layer by default). If no provider key is configured, falls back to a
// deterministic local hashing embedder so the whole pipeline still works with
// zero setup. Both paths produce the SAME dimensionality so vectors are never
// mixed incompatibly inside one account's collection.

const API_KEY = process.env.LLM_API_KEY;
const BASE_URL = process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
const EMBED_MODEL = process.env.LLM_EMBED_MODEL || 'gemini-embedding-001';

// 768 is Google's recommended "high quality, low cost" embedding size and is
// also what the local fallback embedder produces, so the two paths never
// disagree on vector width inside the same database column.
export const EMBED_DIM = Number(process.env.EMBED_DIM || 768);

/** Deterministic local fallback embedding (bag-of-hashed-tokens, L2 normalized). */
export function localEmbed(text: string): number[] {
  const vec = new Array(EMBED_DIM).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % EMBED_DIM;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

export function usingLocalEmbeddings(): boolean {
  return !API_KEY;
}

async function remoteEmbed(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts, dimensions: EMBED_DIM }),
  });

  if (!res.ok) {
    throw new Error(`Embeddings request failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] };
  return data.data.map((d) => {
    const v = d.embedding;
    // Defensive: if a provider ignores `dimensions` and returns a different
    // width, normalize back to EMBED_DIM so storage and search never break.
    if (v.length === EMBED_DIM) return v;
    if (v.length > EMBED_DIM) return v.slice(0, EMBED_DIM);
    return [...v, ...new Array(EMBED_DIM - v.length).fill(0)];
  });
}

/** Embed a batch of texts. Never throws - falls back to local embeddings. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  if (!API_KEY) return texts.map(localEmbed);

  try {
    return await remoteEmbed(texts);
  } catch {
    // Provider has no embeddings endpoint or failed - degrade gracefully.
    return texts.map(localEmbed);
  }
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
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
