import type { NextApiResponse } from 'next';
import KnowledgeItem from '@/models/KnowledgeItem';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { indexDocument } from '@/services/knowledge/indexer';
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_CHARS, canEditKnowledge, parseObjectId, requireOrganization } from '@/services/knowledge/access';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

const LIST_FIELDS = 'parentId type name mimeType sizeBytes status statusMessage chunkCount ownerName createdAt updatedAt';

/**
 * GET  /api/knowledge?parentId=&q=  — list a folder (root when parentId is empty), or search names/contents when q is set.
 * POST /api/knowledge               — create a folder `{ type: 'folder', name, parentId? }`
 *                                     or a document `{ type: 'document', name, content, mimeType, sizeBytes, parentId? }`.
 */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const organizationId = requireOrganization(req, res);
  if (!organizationId) return;

  if (req.method === 'GET') {
    const { parentId, q } = req.query;
    try {
      if (typeof q === 'string' && q.trim()) {
        const pattern = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const items = await KnowledgeItem.find({ organizationId, $or: [{ name: pattern }, { content: pattern }] })
          .select(LIST_FIELDS).sort({ type: -1, name: 1 }).limit(100).lean();
        return res.status(200).json({ items, breadcrumbs: [] });
      }

      let parent = null;
      if (parentId) {
        const parentObjectId = parseObjectId(parentId, res, 'parentId');
        if (!parentObjectId) return;
        parent = parentObjectId;
      }
      const items = await KnowledgeItem.find({ organizationId, parentId: parent }).select(LIST_FIELDS).sort({ type: -1, name: 1 }).lean();

      const breadcrumbs: { id: string; name: string }[] = [];
      let cursor = parent;
      for (let depth = 0; cursor && depth < 20; depth++) {
        const folder = await KnowledgeItem.findOne({ _id: cursor, organizationId, type: 'folder' }).select('name parentId').lean();
        if (!folder) break;
        breadcrumbs.unshift({ id: String(folder._id), name: folder.name });
        cursor = folder.parentId;
      }
      return res.status(200).json({ items, breadcrumbs });
    } catch (error) {
      console.error('[knowledge] list failed', { organizationId, error });
      return res.status(500).json({ error: 'Could not load the knowledge base.' });
    }
  }

  if (req.method === 'POST') {
    if (!canEditKnowledge(req)) return res.status(403).json({ error: 'Only Admins or HR can add to the knowledge base.' });

    const { type, name, content, mimeType, sizeBytes, parentId } = req.body ?? {};
    if (type !== 'folder' && type !== 'document') return res.status(400).json({ error: 'type must be "folder" or "document".' });
    if (typeof name !== 'string' || !name.trim() || name.length > 200) return res.status(400).json({ error: 'A name of up to 200 characters is required.' });

    let parent = null;
    if (parentId) {
      const parentObjectId = parseObjectId(parentId, res, 'parentId');
      if (!parentObjectId) return;
      const folder = await KnowledgeItem.exists({ _id: parentObjectId, organizationId, type: 'folder' });
      if (!folder) return res.status(404).json({ error: 'Parent folder not found.' });
      parent = parentObjectId;
    }

    if (type === 'document') {
      if (typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'The document has no readable text.' });
      if (content.length > MAX_DOCUMENT_CHARS) return res.status(413).json({ error: 'This document is too large. Split it into smaller files.' });
      if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) return res.status(400).json({ error: 'Unsupported file type.' });
    }

    try {
      const item = await KnowledgeItem.create({
        organizationId,
        parentId: parent,
        type,
        name: name.trim(),
        content: type === 'document' ? content : undefined,
        mimeType: type === 'document' ? mimeType || 'text/plain' : undefined,
        sizeBytes: type === 'document' && typeof sizeBytes === 'number' ? sizeBytes : undefined,
        status: type === 'document' ? 'processing' : 'ready',
        ownerId: req.user.id,
        ownerName: req.user.name,
      });
      console.info('[knowledge] item created', { organizationId, itemId: String(item._id), type });

      if (type === 'document') await indexDocument(String(item._id), organizationId);
      const saved = await KnowledgeItem.findById(item._id).select(LIST_FIELDS).lean();
      return res.status(201).json({ item: saved });
    } catch (error) {
      console.error('[knowledge] create failed', { organizationId, error });
      return res.status(500).json({ error: 'Could not save to the knowledge base.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler);
