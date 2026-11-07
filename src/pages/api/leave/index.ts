import { apiRoute } from '@/lib/api-route';
import { leaveOverview, submitLeave } from '@/services/leave';

/** Your balances, requests and holidays (?year=); request leave. */
export default apiRoute({ GET: (viewer, req) => leaveOverview(viewer, req.query.year), POST: (viewer, req) => submitLeave(viewer, req.body ?? {}) }, 'leave');
