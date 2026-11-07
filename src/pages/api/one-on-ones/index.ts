import { apiRoute } from '@/lib/api-route';
import { oneOnOneOverview, scheduleOneOnOne } from '@/services/one-on-ones';

/** Your 1:1s with your manager and reports; book a new one. */
export default apiRoute({ GET: (viewer) => oneOnOneOverview(viewer), POST: (viewer, req) => scheduleOneOnOne(viewer, req.body ?? {}) }, 'one-on-ones');
