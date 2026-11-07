import { apiRoute } from '@/lib/api-route';
import { myWeek, saveWeek, submitWeek, withdrawWeek } from '@/services/timesheets';

/** Your week (?week=YYYY-MM-DD); save it (PUT), submit (POST {action:'submit'}) or withdraw (POST {action:'withdraw'}). */
export default apiRoute(
  {
    GET: (viewer, req) => myWeek(viewer, req.query.week),
    PUT: (viewer, req) => saveWeek(viewer, req.body?.week, req.body?.entries),
    POST: (viewer, req) => (req.body?.action === 'withdraw' ? withdrawWeek(viewer, req.body?.week) : submitWeek(viewer, req.body?.week)),
  },
  'timesheets'
);
