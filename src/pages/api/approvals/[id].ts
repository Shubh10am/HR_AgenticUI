import { apiRoute } from '@/lib/api-route';
import { decide } from '@/services/approvals';

/** Approves or rejects the step waiting on the caller. */
export default apiRoute({ POST: (viewer, req) => decide(viewer, req.query.id, req.body?.decision, req.body?.comment) }, 'approvals');
