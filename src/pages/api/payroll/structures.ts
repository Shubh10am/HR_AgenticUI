import { apiRoute } from '@/lib/api-route';
import { listStructures, saveStructure } from '@/services/payroll';

/** Everyone's pay structure; save one (HR and admins). */
export default apiRoute({ GET: (viewer) => listStructures(viewer), PUT: (viewer, req) => saveStructure(viewer, req.body ?? {}) }, 'payroll');
