import { communityRoute } from '@/services/community/route';
import { ownedPost } from '@/services/community/feed';
import { deletePost, setPinned } from '@/services/community/interactions';

/** Pin/unpin (staff) and delete (author, HR or admin). */
export default communityRoute({
  PATCH: (viewer, req) => setPinned(viewer, req.query.postId, !!req.body?.pinned),
  DELETE: async (viewer, req) => {
    const post = await ownedPost(viewer, req.query.postId);
    // Deleting your own anonymous post would otherwise reveal you wrote it.
    if (post.anonymous && String(post.author) === viewer.id) req.auditAnonymously = true;
    await deletePost(viewer, req.query.postId);
    return { ok: true };
  },
});
