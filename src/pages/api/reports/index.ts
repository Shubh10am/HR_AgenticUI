import { apiRoute } from '@/lib/api-route';
import { peopleReport } from '@/services/reports';

/** Organisation-wide people numbers (HR and admins). */
export default apiRoute({ GET: (viewer) => peopleReport(viewer) }, 'reports');
