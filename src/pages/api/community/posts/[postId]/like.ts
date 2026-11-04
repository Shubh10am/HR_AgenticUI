import { communityRoute } from '@/services/community/route';
import { react } from '@/services/community/interactions';

/** Kept for older clients: a like is the 👍 reaction. */
export default communityRoute({ POST: (viewer, req) => react(viewer, req.query.postId, 'like') });
