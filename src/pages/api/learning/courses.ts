import { apiRoute } from '@/lib/api-route';
import { saveCourse } from '@/services/learning';

/** Adds or edits a course (HR and admins). */
export default apiRoute({ POST: (viewer, req) => saveCourse(viewer, req.body ?? {}) }, 'learning');
