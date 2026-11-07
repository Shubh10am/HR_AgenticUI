import { communityRoute } from '@/services/community/route';
import { markRead } from '@/services/community/interactions';

/** Marks an announcement as read by the caller. */
export default communityRoute({ POST: (viewer, req) => markRead(viewer, req.query.postId) });
