import { apiRoute } from '@/lib/api-route';
import { leavePolicy, saveLeavePolicy } from '@/services/leave';

/** Leave types and allowances; HR and admins change them. */
export default apiRoute({ GET: (viewer) => leavePolicy(viewer.organizationId), PUT: (viewer, req) => saveLeavePolicy(viewer, req.body?.types) }, 'leave');
