import { apiRoute } from '@/lib/api-route';
import { approvalInbox } from '@/services/approvals';

/** The caller's approvals inbox. */
export default apiRoute({ GET: (viewer) => approvalInbox(viewer) }, 'approvals');
