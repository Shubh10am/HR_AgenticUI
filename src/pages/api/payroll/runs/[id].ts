import { apiRoute } from '@/lib/api-route';
import { deleteDraft, publishRun, runPayslips } from '@/services/payroll';

/** One pay run: its payslips, publish it, or delete a draft (HR and admins). */
export default apiRoute({ GET: (viewer, req) => runPayslips(viewer, req.query.id), POST: (viewer, req) => publishRun(viewer, req.query.id), DELETE: (viewer, req) => deleteDraft(viewer, req.query.id) }, 'payroll');
