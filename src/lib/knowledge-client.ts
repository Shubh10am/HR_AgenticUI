/**
 * Browser-side helpers for the knowledge base: typed API calls and text
 * extraction from uploaded files. Extraction runs in the browser (as the
 * recruitment page already does), so only plain text is sent to the server.
 */

export type KnowledgeItemType = 'folder' | 'document';
export type KnowledgeItemStatus = 'processing' | 'ready' | 'failed';

export interface KnowledgeItem {
  _id: string;
  parentId: string | null;
  type: KnowledgeItemType;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  status: KnowledgeItemStatus;
  statusMessage?: string;
  chunkCount: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  content?: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}

export interface KnowledgePassage {
  sourceId: string;
  sourceName: string;
  text: string;
  score: number;
}

export interface KnowledgeSearchResult {
  passages: KnowledgePassage[];
  answer?: string;
  isAnswered?: boolean;
}

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.mjs';

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}

export const knowledgeApi = {
  list: (token: string, parentId: string | null, query?: string) => {
    const params = new URLSearchParams();
    if (parentId) params.set('parentId', parentId);
    if (query) params.set('q', query);
    return request<{ items: KnowledgeItem[]; breadcrumbs: Breadcrumb[] }>(token, `/api/knowledge?${params}`);
  },
  get: (token: string, id: string) => request<{ item: KnowledgeItem }>(token, `/api/knowledge/${id}`),
  createFolder: (token: string, name: string, parentId: string | null) =>
    request<{ item: KnowledgeItem }>(token, '/api/knowledge', { method: 'POST', body: JSON.stringify({ type: 'folder', name, parentId }) }),
  createDocument: (token: string, doc: { name: string; content: string; mimeType: string; sizeBytes: number; parentId: string | null }) =>
    request<{ item: KnowledgeItem }>(token, '/api/knowledge', { method: 'POST', body: JSON.stringify({ type: 'document', ...doc }) }),
  update: (token: string, id: string, changes: { name?: string; parentId?: string | null; reindex?: boolean }) =>
    request<{ item: KnowledgeItem }>(token, `/api/knowledge/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  remove: (token: string, id: string) => request<{ deleted: number }>(token, `/api/knowledge/${id}`, { method: 'DELETE' }),
  search: (token: string, query: string, options: { limit?: number; answer?: boolean } = {}) =>
    request<KnowledgeSearchResult>(token, '/api/knowledge/search', { method: 'POST', body: JSON.stringify({ query, ...options }) }),
};

/**
 * Fetches knowledge passages to ground an AI feature. Never throws: an
 * unavailable knowledge base must not break Copilot or email drafting.
 *
 * @param token - The signed-in user's token; guests get no passages.
 * @param query - Text to search for.
 * @returns Up to `limit` passages, or an empty list.
 */
export async function fetchKnowledgeContext(token: string | null, query: string, limit = 4): Promise<KnowledgePassage[]> {
  if (!token || token.startsWith('guest-') || !query.trim()) return [];
  try {
    const { passages } = await knowledgeApi.search(token, query.slice(0, 4000), { limit });
    return passages;
  } catch {
    return [];
  }
}

function mimeTypeFor(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.md')) return 'text/markdown';
  return 'text/plain';
}

/**
 * Reads a PDF, Word (.docx), text or Markdown file into plain text.
 *
 * @param file - A file picked or dropped by the user.
 * @returns The text and the normalized MIME type.
 * @throws When the type is unsupported, the file is too large, or no text could be read.
 */
export async function extractTextFromFile(file: File): Promise<{ text: string; mimeType: string }> {
  const lowerName = file.name.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    throw new Error('Unsupported file type. Use PDF, Word (.docx), TXT or Markdown.');
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('File is larger than 10 MB.');

  const mimeType = mimeTypeFor(file);
  let text = '';
  if (mimeType === 'application/pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    }
    text = pages.join('\n\n');
  } else if (lowerName.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else {
    text = await file.text();
  }

  if (!text.trim()) throw new Error('No readable text found. Scanned PDFs are not supported yet.');
  return { text, mimeType };
}

/** Human-readable file size. */
export function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
