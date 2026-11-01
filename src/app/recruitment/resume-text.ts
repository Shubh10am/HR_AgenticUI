'use client';

import * as pdfjsLib from 'pdfjs-dist';

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs';
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

/**
 * Plain text from a resume file (.pdf or .txt), extracted in the browser.
 *
 * @throws When the file type is unsupported, too large, or has no readable text.
 */
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_RESUME_BYTES) throw new Error(`${file.name} is larger than 5 MB.`);
  let text = '';
  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    text = await file.text();
  } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
  } else {
    throw new Error(`${file.name}: use a PDF or .txt file.`);
  }
  text = text.trim();
  if (text.length < 50) throw new Error(`${file.name} has no readable text (scanned PDFs aren't supported yet).`);
  return text.slice(0, 30000);
}
