import type { NextApiResponse } from 'next';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { searchKnowledge } from '@/services/knowledge/search';
import { answerFromKnowledge } from '@/services/knowledge/answer';
import { requireOrganization } from '@/services/knowledge/access';

const MAX_QUERY_CHARS = 4000;

/**
 * POST /api/knowledge/search — `{ query, limit?, answer? }`.
 * Returns the caller's organization's most relevant passages. With
 * `answer: true` it also returns an answer written only from those passages.
 * The organization always comes from the verified token, which is what keeps
 * one tenant from reading another's documents.
 */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const organizationId = requireOrganization(req, res);
  if (!organizationId) return;

  const { query, limit, answer } = req.body ?? {};
  if (typeof query !== 'string' || !query.trim()) return res.status(400).json({ error: 'A query is required.' });
  const trimmedQuery = query.trim().slice(0, MAX_QUERY_CHARS);
  const passageLimit = typeof limit === 'number' ? Math.min(Math.max(Math.floor(limit), 1), 10) : 5;

  try {
    const passages = await searchKnowledge(organizationId, trimmedQuery, passageLimit);
    console.info('[knowledge] search', { organizationId, passages: passages.length, withAnswer: Boolean(answer) });
    if (!answer) return res.status(200).json({ passages });

    const result = await answerFromKnowledge(organizationId, req.user.id, trimmedQuery, passages);
    return res.status(200).json({ passages, ...result });
  } catch (error) {
    console.error('[knowledge] search failed', { organizationId, error });
    return res.status(500).json({ error: 'Knowledge search failed.' });
  }
}

export default withAuth(handler);
