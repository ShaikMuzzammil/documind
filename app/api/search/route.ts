import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search } from '@/lib/store';
import { getDocuments, getCollections } from '@/lib/store';
import { citationsToResults, keywordScore, extractSnippet, buildHighlights } from '@/lib/search';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query        = (searchParams.get('q') ?? '').trim();
  const collectionId = searchParams.get('collectionId') ?? undefined;
  const mode         = (searchParams.get('mode') ?? 'hybrid') as 'semantic' | 'keyword' | 'hybrid';
  const topK         = Math.min(Number(searchParams.get('topK') ?? '10'), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], query, total: 0 });
  }

  const [docs, cols] = await Promise.all([
    getDocuments(user.id, collectionId),
    getCollections(user.id),
  ]);

  const colMap = Object.fromEntries(cols.map((c) => [c.id, c.name]));
  const results = [];

  // Semantic search
  if (mode === 'semantic' || mode === 'hybrid') {
    try {
      const qEmbed   = await embedOne(query);
      const citations = await search(qEmbed, { userId: user.id, collectionId, topK });
      results.push(...citationsToResults(citations, docs, query).map((r) => ({
        ...r,
        collectionName: colMap[r.collectionId] ?? 'Unknown',
      })));
    } catch { /* embedding might fail without key */ }
  }

  // Keyword fallback / hybrid boost
  if (mode === 'keyword' || mode === 'hybrid') {
    const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const seen  = new Set(results.map((r) => r.documentId));

    for (const doc of docs.filter((d) => d.status === 'ready')) {
      // Match document name keywords
      const nameScore = keywordScore(doc.name, query);
      if (nameScore > 0 && !seen.has(doc.id)) {
        seen.add(doc.id);
        results.push({
          documentId:     doc.id,
          documentName:   doc.name,
          collectionId:   doc.collectionId,
          collectionName: colMap[doc.collectionId] ?? 'Unknown',
          snippet:        `Document: ${doc.name}`,
          highlights:     buildHighlights(doc.name, query),
          score:          nameScore * 0.3,
          type:           'keyword' as const,
        });
      }
    }

    // Boost existing semantic results that also match keywords
    if (mode === 'hybrid') {
      for (const r of results) {
        const kScore = keywordScore(r.snippet, query);
        if (kScore > 0) r.score = r.score * 0.7 + kScore * 0.3;
      }
    }
  }

  // Deduplicate by documentId keeping highest score
  const deduped: typeof results = [];
  const docBest = new Map<string, number>();
  for (const r of results) {
    const prev = docBest.get(r.documentId) ?? -1;
    if (r.score > prev) {
      const idx = deduped.findIndex((x) => x.documentId === r.documentId);
      if (idx >= 0) deduped[idx] = r; else deduped.push(r);
      docBest.set(r.documentId, r.score);
    }
  }

  deduped.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    results:  deduped.slice(0, topK),
    total:    deduped.length,
    query,
    mode,
  });
}
