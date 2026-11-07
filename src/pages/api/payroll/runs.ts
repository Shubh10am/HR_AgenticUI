import { apiRoute } from '@/lib/api-route';
import { listRuns, prepareRun } from '@/services/payroll';

/** Pay runs; prepare (or rebuild) a month's draft (HR and admins). */
export default apiRoute({ GET: (viewer) => listRuns(viewer), POST: (viewer, req) => prepareRun(viewer, req.body ?? {}) }, 'payroll');
