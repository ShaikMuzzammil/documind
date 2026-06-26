import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, search } from '@/lib/store';
import { embedOne } from '@/lib/embeddings';
import { completeJSON } from '@/lib/llm';
import { SchemaField } from '@/lib/types';

export const runtime     = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body         = await req.json().catch(() => ({}));
  const collectionId = (body.collectionId ?? '').toString();
  const schemaFields: SchemaField[] = body.schema ?? [];

  if (!collectionId)    return NextResponse.json({ error: 'collectionId is required' },  { status: 400 });
  if (!schemaFields.length) return NextResponse.json({ error: 'schema fields required' }, { status: 400 });

  const docs = await getDocuments(user.id, collectionId);
  if (!docs.length) return NextResponse.json({ error: 'No documents found in this collection' }, { status: 404 });

  const schemaDesc = schemaFields.map((f) => `"${f.key}" (${f.type}${f.description ? ': ' + f.description : ''})`).join(', ');

  const results: Record<string, unknown>[] = [];

  for (const doc of docs.filter((d) => d.status === 'ready')) {
    try {
      // Get representative chunks for this document
      const queryText  = schemaFields.map((f) => f.description ?? f.key).join(' ');
      const qEmbed     = await embedOne(queryText);
      const citations  = await search(qEmbed, { userId: user.id, collectionId, topK: 8 });
      const docCites   = citations.filter((c) => c.documentId === doc.id);
      const context    = docCites.length
        ? docCites.map((c) => c.text).join('\n\n')
        : citations.slice(0, 3).map((c) => c.text).join('\n\n');

      const prompt = `You are a precise data extraction assistant. Extract the following fields from the document context.
Return ONLY a valid JSON object with these exact keys: ${schemaFields.map((f) => f.key).join(', ')}.
If a field cannot be found, use null. Do not include any explanation or markdown.

Schema: { ${schemaDesc} }

Document: "${doc.name}"
Context:
${context}

JSON:`;

      const raw    = await completeJSON(prompt);
      const clean  = raw.replace(/```json\n?|```\n?/g, '').trim();
      let extracted: Record<string, unknown> = {};
      try { extracted = JSON.parse(clean); } catch { /* keep empty */ }

      results.push({ _document: doc.name, _documentId: doc.id, ...extracted });
    } catch (err) {
      if (String(err).includes('QUOTA_EXCEEDED')) {
        return NextResponse.json(
          { error: 'AI quota exceeded. Please wait and try again.', partial: results },
          { status: 429 },
        );
      }
      results.push({ _document: doc.name, _documentId: doc.id, _error: String(err) });
    }
  }

  return NextResponse.json({ results, count: results.length });
}
