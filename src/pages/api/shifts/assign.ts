import { apiRoute } from '@/lib/api-route';
import { assignShift } from '@/services/shifts';

/** Put people on a shift from a date (HR and admins). */
export default apiRoute({ POST: (viewer, req) => assignShift(viewer, req.body ?? {}) }, 'shifts');
