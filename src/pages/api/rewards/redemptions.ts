import { apiRoute } from '@/lib/api-route';
import { decideRedemption, listRedemptions } from '@/services/rewards';

/** Redemption requests to fulfil or decline (HR and admins). */
export default apiRoute({ GET: (viewer) => listRedemptions(viewer), PATCH: (viewer, req) => decideRedemption(viewer, req.body?.id, req.body?.decision) }, 'rewards');
