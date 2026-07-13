// lib/pdf-extract.ts
// Direct pdfjs-dist wrapper — completely bypasses pdf-parse's root index.js
// which tries to load test PDF files at require-time, crashing on Vercel.
// pdfjs-dist is bundled as a transitive dependency of pdf-parse and is
// always present in node_modules. It is also listed in serverExternalPackages
// so the Node.js runtime loads it directly without any bundler interference.

export async function extractPdfText(buffer: Buffer): Promise<string> {
  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */
  const pdfjsLib: any = require('pdfjs-dist/legacy/build/pdf.js');
  /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

  // Disable the Web Worker — not available in Vercel serverless environments
  pdfjsLib.GlobalWorkerOptions.workerSrc = false;

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
