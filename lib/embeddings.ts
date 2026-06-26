const API_KEY   = process.env.AI_API_KEY ?? '';
const MODEL     = process.env.AI_EMBED_MODEL ?? 'text-embedding-004';
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:batchEmbedContents?key=${API_KEY}`;
const DIM = 768;

/* Deterministic hash fallback when no API key is set */
function hashEmbed(text: string): number[] {
  const v = new Array<number>(DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    v[i % DIM] = (v[i % DIM] + c * (i + 1)) % 256;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (!API_KEY) return texts.map(hashEmbed);
  const body = {
    requests: texts.map((t) => ({
      model: `models/${MODEL}`,
      content: { parts: [{ text: t.slice(0, 8000) }] },
    })),
  };
  const res  = await fetch(EMBED_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    console.error('[embed] API error:', res.status, err.slice(0, 200));
    return texts.map(hashEmbed); // graceful fallback
  }
  const data = await res.json();
  return (data.embeddings as { values: number[] }[]).map((e) => e.values);
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text]);
  return v;
}
