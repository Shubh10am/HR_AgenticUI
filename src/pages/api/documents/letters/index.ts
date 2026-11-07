import { apiRoute } from '@/lib/api-route';
import { listLetters, requestLetter } from '@/services/documents/letters';

/** Letters: yours, or all (?scope=all, HR); request one (or issue it, HR). */
export default apiRoute({ GET: (viewer, req) => listLetters(viewer, req.query.scope), POST: (viewer, req) => requestLetter(viewer, req.body ?? {}) }, 'documents');
