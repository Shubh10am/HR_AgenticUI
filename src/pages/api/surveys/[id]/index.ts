import { apiRoute } from '@/lib/api-route';
import { setSurveyStatus, surveyResults } from '@/services/surveys';

/** Results (GET) and opening/closing (PATCH), for HR and admins. */
export default apiRoute(
  { GET: (viewer, req) => surveyResults(viewer, req.query.id), PATCH: (viewer, req) => setSurveyStatus(viewer, req.query.id, req.body?.status) },
  'surveys'
);
