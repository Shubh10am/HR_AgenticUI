import { communityRoute } from '@/services/community/route';
import { toggleSaved } from '@/services/community/interactions';

/** Toggles the caller's bookmark. */
export default communityRoute({ POST: (viewer, req) => toggleSaved(viewer, req.query.postId) });
