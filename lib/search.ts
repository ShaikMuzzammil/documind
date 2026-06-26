import { Citation, DocumentMeta } from '@/lib/types';

export interface SearchResult {
  documentId:   string;
  documentName: string;
  collectionId: string;
  snippet:      string;
  highlights:   { start: number; end: number }[];
  score:        number;
  type:         'semantic' | 'keyword';
}

/** Highlight all occurrences of query words in text */
export function buildHighlights(text: string, query: string): { start: number; end: number }[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const hits: { start: number; end: number }[] = [];
  for (const word of words) {
    let idx = 0;
    const lower = text.toLowerCase();
    while ((idx = lower.indexOf(word, idx)) !== -1) {
      hits.push({ start: idx, end: idx + word.length });
      idx += word.length;
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

/** Extract a short snippet centered around the first match */
export function extractSnippet(text: string, query: string, maxLen = 200): string {
  const words  = query.toLowerCase().split(/\s+/);
  const lower  = text.toLowerCase();
  let   center = 0;
  for (const w of words) {
    const idx = lower.indexOf(w);
    if (idx >= 0) { center = idx; break; }
  }
  const start   = Math.max(0, center - 80);
  const end     = Math.min(text.length, start + maxLen);
  const snippet = text.slice(start, end).trim();
  return (start > 0 ? '…' : '') + snippet + (end < text.length ? '…' : '');
}

/** Convert citation results to SearchResult format */
export function citationsToResults(
  citations: Citation[],
  docs: DocumentMeta[],
  query: string,
): SearchResult[] {
  return citations.map((c) => {
    const doc = docs.find((d) => d.id === c.documentId);
    return {
      documentId:   c.documentId,
      documentName: c.documentName,
      collectionId: doc?.collectionId ?? '',
      snippet:      extractSnippet(c.text, query),
      highlights:   buildHighlights(c.text, query),
      score:        c.score,
      type:         'semantic' as const,
    };
  });
}

/** Simple BM25-inspired keyword scorer */
export function keywordScore(text: string, query: string): number {
  const words  = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  const lower  = text.toLowerCase();
  const tokens = lower.split(/\W+/);
  const N      = tokens.length || 1;
  let   score  = 0;
  for (const word of words) {
    const tf = tokens.filter((t) => t === word).length;
    const k1 = 1.5, b = 0.75, avgdl = 200;
    score += (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (N / avgdl)));
  }
  return score;
}
