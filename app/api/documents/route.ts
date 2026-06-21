import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/lib/store';

export async function GET(req: NextRequest) {
  const collectionId = req.nextUrl.searchParams.get('collectionId') || undefined;
  let docs = await getDocuments();
  if (collectionId) docs = docs.filter((d) => d.collectionId === collectionId);
  return NextResponse.json({ documents: docs });
}
