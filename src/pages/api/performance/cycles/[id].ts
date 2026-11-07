import { apiRoute } from '@/lib/api-route';
import { setCycleStatus } from '@/services/performance/reviews';

/** Launch or close a cycle (HR and admins). */
export default apiRoute({ PATCH: (viewer, req) => setCycleStatus(viewer, req.query.id, req.body?.status) }, 'reviews');
