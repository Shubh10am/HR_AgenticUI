import { apiRoute } from '@/lib/api-route';
import { withdrawExpense } from '@/services/expenses';

/** Withdraw a claim still awaiting approval. */
export default apiRoute({ DELETE: (viewer, req) => withdrawExpense(viewer, req.query.id) }, 'expenses');
