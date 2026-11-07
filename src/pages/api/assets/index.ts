import { apiRoute } from '@/lib/api-route';
import { addAsset, listAssets } from '@/services/assets';

/** Equipment: your own (default) or the register (?scope=all, HR and admins); add to the register. */
export default apiRoute({ GET: (viewer, req) => listAssets(viewer, req.query.scope), POST: (viewer, req) => addAsset(viewer, req.body ?? {}) }, 'assets');
