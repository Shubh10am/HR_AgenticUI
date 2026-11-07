import { apiRoute } from '@/lib/api-route';
import { provisionDefaults, revokeAll } from '@/services/apps';

/** HR and admins: set a joiner up with default apps, or remove a leaver's access. */
export default apiRoute({ POST: (viewer, req) => (req.body?.action === 'revoke-all' ? revokeAll(viewer, req.body?.employeeId) : provisionDefaults(viewer, req.body?.employeeId)) }, 'apps');
