import { apiRoute } from '@/lib/api-route';
import { createPolicy, listPolicies } from '@/services/documents/policies';

/** Company policies, and publishing one (HR and admins). */
export default apiRoute({ GET: (viewer) => listPolicies(viewer), POST: (viewer, req) => createPolicy(viewer, req.body ?? {}) }, 'documents');
