import { communityRoute } from '@/services/community/route';
import { rsvp } from '@/services/community/interactions';

/** Toggles the caller's "going" on an event. */
export default communityRoute({ POST: (viewer, req) => rsvp(viewer, req.query.postId) });
