import { apiRoute } from '@/lib/api-route';
import { moveAsset } from '@/services/assets';

/** Assign, return, repair, retire or restock (HR and admins). */
export default apiRoute({ PATCH: (viewer, req) => moveAsset(viewer, req.query.id, req.body?.action, req.body?.employeeId, req.body?.note) }, 'assets');
