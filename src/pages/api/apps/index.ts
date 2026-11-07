import { apiRoute } from '@/lib/api-route';
import { appsOverview, requestAccess, saveApp } from '@/services/apps';

/** The app catalogue and your access; request an app; save an app (HR and admins, PUT). */
export default apiRoute({ GET: (viewer) => appsOverview(viewer), POST: (viewer, req) => requestAccess(viewer, req.body?.appId, req.body?.reason), PUT: (viewer, req) => saveApp(viewer, req.body ?? {}) }, 'apps');
