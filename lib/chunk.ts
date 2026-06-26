const CHUNK_SIZE   = 512;  // target tokens (≈ chars / 4)
const CHUNK_OVERLAP = 64;

function splitSentences(text: string): string[] {
  return text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
}

export function chunkText(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = cleaned.split(/\n\n+/);
  const chunks: string[] = [];
  let buffer = '';

  for (const para of paragraphs) {
    const sentences = splitSentences(para);
    for (const sent of sentences) {
      const tentative = buffer ? `${buffer} ${sent}` : sent;
      if (tentative.length / 4 > CHUNK_SIZE && buffer) {
        chunks.push(buffer.trim());
        // Carry overlap from end of previous chunk
        const words = buffer.split(' ');
        const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP));
        buffer = overlapWords.join(' ') + ' ' + sent;
      } else {
        buffer = tentative;
      }
    }
    // Paragraph boundary — flush if above half-chunk
    if (buffer.length / 4 > CHUNK_SIZE / 2) {
      chunks.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks.filter((c) => c.length > 20);
}
