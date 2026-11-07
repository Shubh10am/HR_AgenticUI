import { apiRoute } from '@/lib/api-route';
import { progress } from '@/services/learning';

/** Starts or completes one of your courses. */
export default apiRoute({ PATCH: (viewer, req) => progress(viewer, req.query.id, req.body?.action) }, 'learning');
