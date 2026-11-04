import { communityRoute } from '@/services/community/route';
import { communityHighlights } from '@/services/community/highlights';

/** Sidebar data for the community feed. */
export default communityRoute({ GET: (viewer) => communityHighlights(viewer) });
