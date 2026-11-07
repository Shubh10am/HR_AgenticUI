import { apiRoute } from '@/lib/api-route';
import { createGoal, listGoals } from '@/services/performance/goals';

/** The organisation's goals, and creating one. */
export default apiRoute({ GET: (viewer) => listGoals(viewer), POST: (viewer, req) => createGoal(viewer, req.body ?? {}) }, 'goals');
