import { apiRoute } from '@/lib/api-route';
import { roster } from '@/services/shifts';

/** The week's roster (?week=YYYY-MM-DD, any day in the week). */
export default apiRoute({ GET: (viewer, req) => roster(viewer, req.query.week) }, 'shifts');
