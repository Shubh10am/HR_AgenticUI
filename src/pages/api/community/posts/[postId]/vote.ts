import { communityRoute } from '@/services/community/route';
import { vote } from '@/services/community/interactions';

/** Casts or moves the caller's poll vote. */
export default communityRoute({ POST: (viewer, req) => vote(viewer, req.query.postId, req.body?.optionId) });
