// Legacy type stub — DocuMind v8 uses pdfjs-dist directly (lib/pdf-extract.ts)
// and no longer imports pdf-parse. This file is kept for reference only.
declare module 'pdf-parse' {
  interface PDFData { text: string; numpages: number; numrender: number; info: object; metadata: object; version: string }
  function pdfParse(dataBuffer: Buffer, options?: object): Promise<PDFData>
  export = pdfParse
}
