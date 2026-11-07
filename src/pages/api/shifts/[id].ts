import { apiRoute } from '@/lib/api-route';
import { updateShift } from '@/services/shifts';

/** Edit or archive a shift (HR and admins). */
export default apiRoute({ PUT: (viewer, req) => updateShift(viewer, req.query.id, req.body ?? {}) }, 'shifts');
