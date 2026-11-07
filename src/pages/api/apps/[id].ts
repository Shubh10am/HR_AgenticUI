import { apiRoute } from '@/lib/api-route';
import { completeTask, releaseAccess } from '@/services/apps';

/** DELETE: withdraw or give up your own access. PATCH: HR and admins mark a setup or removal done. */
export default apiRoute({ DELETE: (viewer, req) => releaseAccess(viewer, req.query.id), PATCH: (viewer, req) => completeTask(viewer, req.query.id) }, 'apps');
