import { apiRoute } from '@/lib/api-route';
import { enrol, learningOverview } from '@/services/learning';

/** Your courses and the catalogue; join a course. */
export default apiRoute({ GET: (viewer) => learningOverview(viewer), POST: (viewer, req) => enrol(viewer, req.body?.courseId) }, 'learning');
