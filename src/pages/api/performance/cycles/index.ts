import { apiRoute } from '@/lib/api-route';
import { createCycle, listCycles } from '@/services/performance/reviews';

/** Review cycles (HR and admins). */
export default apiRoute({ GET: (viewer) => listCycles(viewer), POST: (viewer, req) => createCycle(viewer, req.body ?? {}) }, 'reviews');
