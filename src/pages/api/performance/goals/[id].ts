import { apiRoute } from '@/lib/api-route';
import { deleteGoal, updateGoal } from '@/services/performance/goals';

/** Update or delete a goal (owner, their manager, HR or admins). */
export default apiRoute(
  { PATCH: (viewer, req) => updateGoal(viewer, req.query.id, req.body ?? {}), DELETE: (viewer, req) => deleteGoal(viewer, req.query.id) },
  'goals'
);
