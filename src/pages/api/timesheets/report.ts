import { apiRoute } from '@/lib/api-route';
import { timeReport } from '@/services/timesheets';

/** Hours by project and person (?from=&to=) for managers, HR and admins. */
export default apiRoute({ GET: (viewer, req) => timeReport(viewer, req.query.from, req.query.to) }, 'timesheets');
