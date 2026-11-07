import { apiRoute } from '@/lib/api-route';
import { submitExitInterview } from '@/services/offboarding';

/** The leaver's confidential exit feedback. */
export default apiRoute({ POST: (viewer, req) => submitExitInterview(viewer, req.query.id, req.body?.answers) }, 'offboarding');
