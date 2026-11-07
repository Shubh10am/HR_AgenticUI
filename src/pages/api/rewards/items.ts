import { apiRoute } from '@/lib/api-route';
import { saveItem } from '@/services/rewards';

/** Adds or edits a reward in the catalogue (HR and admins). */
export default apiRoute({ POST: (viewer, req) => saveItem(viewer, req.body ?? {}) }, 'rewards');
