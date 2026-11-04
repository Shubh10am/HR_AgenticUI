import { communityRoute } from '@/services/community/route';
import { react } from '@/services/community/interactions';

/** Sets or clears the caller's reaction. */
export default communityRoute({ POST: (viewer, req) => react(viewer, req.query.postId, req.body?.emoji) });
