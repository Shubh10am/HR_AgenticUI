import { apiRoute } from '@/lib/api-route';
import { listOffboarding, startOffboarding } from '@/services/offboarding';

/** Exits the caller can see, and starting one (a resignation, or HR starting it for someone). */
export default apiRoute(
  {
    GET: (viewer) => listOffboarding(viewer),
    POST: (viewer, req) => startOffboarding(viewer, req.body ?? {}),
  },
  'offboarding'
);
