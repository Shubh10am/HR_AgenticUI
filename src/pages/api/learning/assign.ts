import { apiRoute } from '@/lib/api-route';
import { assignCourse } from '@/services/learning';

/** Assigns a course to people (HR, admins, or managers for their reports). */
export default apiRoute({ POST: (viewer, req) => assignCourse(viewer, req.body ?? {}) }, 'learning');
