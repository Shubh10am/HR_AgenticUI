import { apiRoute } from '@/lib/api-route';
import { awardPoints } from '@/services/rewards';

/** Awards points to a colleague (HR and admins). */
export default apiRoute({ POST: (viewer, req) => awardPoints(viewer, req.body ?? {}) }, 'rewards');
