// Splits raw document text into overlapping, embed-friendly chunks.
//
// Overlap preserves context across chunk boundaries so retrieval doesn't lose
// sentences that straddle two chunks.

export interface ChunkOptions {
  /** Target characters per chunk. */
  size?: number;
  /** Characters of overlap between consecutive chunks. */
  overlap?: number;
}

const DEFAULT_SIZE = 1000;
const DEFAULT_OVERLAP = 150;

export function chunkText(raw: string, options: ChunkOptions = {}): string[] {
  const size = options.size ?? DEFAULT_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  // Normalize whitespace.
  const text = raw.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!text) return [];
  if (text.length <= size) return [text];

  // Prefer to split on paragraph / sentence boundaries near the target size.
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + size, text.length);

    if (end < text.length) {
      // Look back for a clean boundary within the last 30% of the window.
      const window = text.slice(start, end);
      const boundary = Math.max(
        window.lastIndexOf('\n\n'),
        window.lastIndexOf('. '),
        window.lastIndexOf('? '),
        window.lastIndexOf('! '),
      );
      if (boundary > size * 0.7) {
        end = start + boundary + 1;
      }
    }

    const piece = text.slice(start, end).trim();
    if (piece) chunks.push(piece);

    if (end >= text.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}
