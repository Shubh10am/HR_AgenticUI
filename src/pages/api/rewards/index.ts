import { apiRoute } from '@/lib/api-route';
import { redeem, rewardsOverview } from '@/services/rewards';

/** Your points, history and the catalogue; redeem an item. */
export default apiRoute({ GET: (viewer) => rewardsOverview(viewer), POST: (viewer, req) => redeem(viewer, req.body?.itemId) }, 'rewards');
