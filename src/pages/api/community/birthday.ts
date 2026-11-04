import { communityRoute } from '@/services/community/route';
import { setMyBirthday } from '@/services/community/highlights';

/** Shares or stops sharing the caller's birthday (day and month only). */
export default communityRoute({
  PUT: async (viewer, req) => {
    await setMyBirthday(viewer, req.body ?? null);
    return { ok: true };
  },
});
