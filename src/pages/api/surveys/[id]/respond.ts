import { apiRoute } from '@/lib/api-route';
import { respond } from '@/services/surveys';

/** Submit answers anonymously; the audit entry names no one. */
export default apiRoute(
  {
    POST: (viewer, req) => {
      req.auditAnonymously = true;
      return respond(viewer, req.query.id, req.body?.answers);
    },
  },
  'surveys'
);
