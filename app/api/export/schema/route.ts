import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { SchemaField } from '@/lib/types';

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body:   { schema: SchemaField[]; format?: string } = await req.json().catch(() => ({ schema: [] }));
  const schema  = body.schema ?? [];
  const format  = (body.format ?? 'json') as 'json' | 'csv';

  if (!schema.length) {
    return NextResponse.json({ error: 'No schema fields provided' }, { status: 400 });
  }

  if (format === 'csv') {
    // Empty CSV template with headers
    const headers = ['document', ...schema.map((f) => f.key)].join(',');
    const example = ['example.pdf', ...schema.map((f) => {
      if (f.type === 'number')  return '0';
      if (f.type === 'boolean') return 'true';
      if (f.type === 'date')    return '2024-01-01';
      return '';
    })].map((v) => `"${v}"`).join(',');
    const csv = `${headers}\n${example}\n`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': 'attachment; filename="schema-template.csv"',
      },
    });
  }

  // JSON template
  const template = {
    schema,
    example: {
      _document: 'example.pdf',
      ...Object.fromEntries(schema.map((f) => [
        f.key,
        f.type === 'number' ? 0 : f.type === 'boolean' ? true : f.type === 'date' ? '2024-01-01' : '',
      ])),
    },
    instructions: 'Use POST /api/schema-extract with this schema and a collectionId to extract structured data.',
  };

  return new NextResponse(JSON.stringify(template, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': 'attachment; filename="schema-template.json"',
    },
  });
}
