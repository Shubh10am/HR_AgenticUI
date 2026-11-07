import { apiRoute } from '@/lib/api-route';
import { updateOneOnOne } from '@/services/one-on-ones';

/** One change to a 1:1: agenda, notes, actions or status. */
export default apiRoute({ PATCH: (viewer, req) => updateOneOnOne(viewer, req.query.id, req.body ?? {}) }, 'one-on-ones');
