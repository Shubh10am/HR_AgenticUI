import { apiRoute } from '@/lib/api-route';
import { expenseReceipt } from '@/services/expenses';

/** The claim's receipt as a data URL, for people allowed to see the claim. */
export default apiRoute({ GET: (viewer, req) => expenseReceipt(viewer, req.query.id) }, 'expenses');
