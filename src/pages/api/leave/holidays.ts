import { apiRoute } from '@/lib/api-route';
import { addHoliday, removeHoliday } from '@/services/leave';

/** Add (POST) or remove (DELETE ?id=) a holiday — HR and admins. */
export default apiRoute({ POST: (viewer, req) => addHoliday(viewer, req.body ?? {}), DELETE: (viewer, req) => removeHoliday(viewer, req.query.id) }, 'leave');
