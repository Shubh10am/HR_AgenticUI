import { communityRoute } from '@/services/community/route';
import { createPost, listFeed } from '@/services/community/feed';

/** The organisation's feed, and publishing to it. */
export default communityRoute({
  GET: (viewer) => listFeed(viewer),
  POST: (viewer, req) => {
    if (req.body?.anonymous) req.auditAnonymously = true;
    return createPost(viewer, req.body ?? {});
  },
});
