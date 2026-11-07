import { apiRoute } from '@/lib/api-route';
import { saveReview } from '@/services/performance/reviews';

/** Save or submit a review the caller writes. */
export default apiRoute({ PUT: (viewer, req) => saveReview(viewer, req.query.id, req.body?.answers, req.body?.submit) }, 'reviews');
