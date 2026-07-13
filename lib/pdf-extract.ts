// lib/pdf-extract.ts
// Direct pdfjs-dist v3 wrapper.
//
// Why not pdf-parse?
//   pdf-parse/index.js loads test PDFs at require-time via a top-level
//   `fs.readFileSync` call. In Vercel serverless that path doesn't exist
//   and the entire module crashes before any of our code runs. Using
//   pdfjs-dist directly bypasses that issue entirely.
//
// Why pdfjs-dist @3.x?
//   The /legacy/build/pdf.js entry point (introduced in v3) gives us a
//   CommonJS-compatible build with no Web Worker requirement — perfect
//   for Node.js serverless. v2.0.x only shipped /build/pdf.js which
//   lacks the legacy alias and caused a Turbopack module-not-found error.
//
// Why serverExternalPackages?
//   Listed in next.config.js so Turbopack/webpack never tries to bundle it;
//   it stays as a native Node.js require() at runtime.

export async function extractPdfText(buffer: Buffer): Promise<string> {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
  const pdfjsLib: any = require('pdfjs-dist/legacy/build/pdf.js');
  /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

  // Disable the Web Worker — not available in Vercel serverless environments.
  // Empty string is the correct v3 value (false is not a valid string type).
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    verbosity: 0, // Suppress pdfjs console output
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = (textContent.items as Array<{ str?: string }>)
      .map((item) => item.str ?? '')
      .join(' ')
      .replace(/[ \t]{2,}/g, ' ')   // collapse horizontal whitespace
      .replace(/\n{3,}/g, '\n\n')    // max 2 consecutive newlines
      .trim();

    if (pageText) pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n');
}
