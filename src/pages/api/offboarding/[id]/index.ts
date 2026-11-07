import { apiRoute } from '@/lib/api-route';
import { setChecklistItem, updateLastDay, withdrawOffboarding } from '@/services/offboarding';

/** Tick a checklist item or move the last day (PATCH), or withdraw the exit (DELETE). */
export default apiRoute(
  {
    PATCH: (viewer, req) =>
      req.body?.lastWorkingDay ? updateLastDay(viewer, req.query.id, req.body.lastWorkingDay) : setChecklistItem(viewer, req.query.id, req.body?.key, req.body?.done),
    DELETE: (viewer, req) => withdrawOffboarding(viewer, req.query.id),
  },
  'offboarding'
);
