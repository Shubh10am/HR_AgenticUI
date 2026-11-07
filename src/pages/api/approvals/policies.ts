import { apiRoute } from '@/lib/api-route';
import { listPolicies, savePolicy } from '@/services/approvals';

/** Approval chains per request type; anyone may read them, HR and admins change them. */
export default apiRoute(
  {
    GET: (viewer) => listPolicies(viewer),
    PUT: (viewer, req) => savePolicy(viewer, req.body?.kind, req.body?.steps),
  },
  'approvals'
);
