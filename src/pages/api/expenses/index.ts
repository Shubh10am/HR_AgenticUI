import { apiRoute } from '@/lib/api-route';
import { listExpenses, markPaid, submitExpense } from '@/services/expenses';

export const config = { api: { bodyParser: { sizeLimit: '3mb' } } };

/** List claims (?scope=mine|team|all), submit a claim, or mark claims paid. */
export default apiRoute(
  {
    GET: (viewer, req) => listExpenses(viewer, req.query.scope),
    POST: (viewer, req) => submitExpense(viewer, req.body ?? {}),
    PATCH: (viewer, req) => markPaid(viewer, req.body?.ids),
  },
  'expenses'
);
