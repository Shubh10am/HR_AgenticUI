import { apiRoute } from '@/lib/api-route';
import { ackStatus, acknowledgePolicy, updatePolicy } from '@/services/documents/policies';

/** Who has signed (GET, HR), sign (POST), edit or archive (PUT, HR). */
export default apiRoute(
  {
    GET: (viewer, req) => ackStatus(viewer, req.query.id),
    POST: (viewer, req) => acknowledgePolicy(viewer, req.query.id, req.body?.signedName),
    PUT: (viewer, req) => updatePolicy(viewer, req.query.id, req.body ?? {}),
  },
  'documents'
);
