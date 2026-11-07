import { apiRoute } from '@/lib/api-route';
import { awayInMonth } from '@/services/leave';

/** Who is away in a month (?month=YYYY-MM), without the leave type. */
export default apiRoute({ GET: (viewer, req) => awayInMonth(viewer, req.query.month) }, 'leave');
