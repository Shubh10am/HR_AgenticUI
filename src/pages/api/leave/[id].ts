import { apiRoute } from '@/lib/api-route';
import { withdrawLeave } from '@/services/leave';

/** Withdraw a pending or upcoming leave request. */
export default apiRoute({ DELETE: (viewer, req) => withdrawLeave(viewer, req.query.id) }, 'leave');
