import { apiRoute } from '@/lib/api-route';
import { listProjects, saveProject } from '@/services/timesheets';

/** Projects people log time against; HR and admins add and edit them. */
export default apiRoute({ GET: (viewer, req) => listProjects(viewer, req.query.all === '1'), POST: (viewer, req) => saveProject(viewer, req.body ?? {}) }, 'timesheets');
