import { apiRoute } from '@/lib/api-route';
import { createSurvey, listSurveys } from '@/services/surveys';

/** Surveys, and creating one (HR and admins). */
export default apiRoute({ GET: (viewer) => listSurveys(viewer), POST: (viewer, req) => createSurvey(viewer, req.body ?? {}) }, 'surveys');
