import { communityRoute } from '@/services/community/route';
import { addComment } from '@/services/community/feed';

/** Adds a comment, or a reply when parentId is set. */
export default communityRoute({ POST: (viewer, req) => addComment(viewer, req.query.postId, req.body?.content, req.body?.parentId) });
