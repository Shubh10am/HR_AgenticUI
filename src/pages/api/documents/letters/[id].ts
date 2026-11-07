import { apiRoute } from '@/lib/api-route';
import { decideLetter } from '@/services/documents/letters';

/** Issue or decline a requested letter (HR and admins). */
export default apiRoute({ PATCH: (viewer, req) => decideLetter(viewer, req.query.id, req.body?.decision) }, 'documents');
