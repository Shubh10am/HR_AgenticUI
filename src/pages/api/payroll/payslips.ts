import { apiRoute } from '@/lib/api-route';
import { myPayslips } from '@/services/payroll';

/** Your own published payslips. */
export default apiRoute({ GET: (viewer) => myPayslips(viewer) }, 'payroll');
