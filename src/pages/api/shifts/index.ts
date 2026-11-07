import { apiRoute } from '@/lib/api-route';
import { createShift, listShifts } from '@/services/shifts';

/** Shift patterns; HR and admins create them. */
export default apiRoute({ GET: (viewer) => listShifts(viewer), POST: (viewer, req) => createShift(viewer, req.body ?? {}) }, 'shifts');
