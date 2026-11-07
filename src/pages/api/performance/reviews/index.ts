import { apiRoute } from '@/lib/api-route';
import { myReviews } from '@/services/performance/reviews';

/** Reviews the caller writes or may read. */
export default apiRoute({ GET: (viewer) => myReviews(viewer) }, 'reviews');
