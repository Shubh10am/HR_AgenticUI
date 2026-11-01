import type { NextApiResponse } from 'next';
import mongoose from 'mongoose';
import KnowledgeItem from '@/models/KnowledgeItem';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { withAuth, type NextApiRequestWithAuth } from '@/lib/withAuth';
import { indexDocument } from '@/services/knowledge/indexer';
import { canEditKnowledge, parseObjectId, requireOrganization } from '@/services/knowledge/access';

const DETAIL_FIELDS = 'parentId type name mimeType sizeBytes status statusMessage chunkCount ownerName createdAt updatedAt';

/** Collects a folder and every item beneath it, within one organization. */
async function collectSubtree(organizationId: string, rootId: mongoose.Types.ObjectId): Promise<mongoose.Types.ObjectId[]> {
  const ids = [rootId];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const children = await KnowledgeItem.find({ organizationId, parentId: { $in: frontier } }).select('_id').lean();
    frontier = children.map((child) => child._id as mongoose.Types.ObjectId);
    ids.push(...frontier);
  }
  return ids;
}

/**
 * GET    /api/knowledge/:id — one item, with document text for preview.
 * PATCH  /api/knowledge/:id — `{ name?, parentId?, reindex? }`.
 * DELETE /api/knowledge/:id — removes the item (and a folder's contents) with its search index.
 */
async function handler(req: NextApiRequestWithAuth, res: NextApiResponse) {
  const organizationId = requireOrganization(req, res);
  if (!organizationId) return;
  const id = parseObjectId(req.query.id, res);
  if (!id) return;

  const item = await KnowledgeItem.findOne({ _id: id, organizationId }).select(`${DETAIL_FIELDS} +content`);
  if (!item) return res.status(404).json({ error: 'Item not found.' });

  if (req.method === 'GET') {
    return res.status(200).json({ item });
  }

  if (!canEditKnowledge(req)) return res.status(403).json({ error: 'Only Admins or HR can change the knowledge base.' });

  if (req.method === 'PATCH') {
    const { name, parentId, reindex } = req.body ?? {};
    try {
      if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim() || name.length > 200) return res.status(400).json({ error: 'A name of up to 200 characters is required.' });
        item.name = name.trim();
      }
      if (parentId !== undefined) {
        if (parentId === null) {
          item.parentId = null;
        } else {
          const target = parseObjectId(parentId, res, 'parentId');
          if (!target) return;
          const folder = await KnowledgeItem.exists({ _id: target, organizationId, type: 'folder' });
          if (!folder) return res.status(404).json({ error: 'Destination folder not found.' });
          if (item.type === 'folder') {
            const subtree = await collectSubtree(organizationId, id);
            if (subtree.some((nodeId) => nodeId.equals(target))) return res.status(400).json({ error: 'A folder cannot be moved inside itself.' });
          }
          item.parentId = target;
        }
      }
      await item.save();
      console.info('[knowledge] item updated', { organizationId, itemId: String(id) });

      if (reindex && item.type === 'document') {
        item.status = 'processing';
        await item.save();
        await indexDocument(String(id), organizationId);
      }
      const saved = await KnowledgeItem.findById(id).select(DETAIL_FIELDS).lean();
      return res.status(200).json({ item: saved });
    } catch (error) {
      console.error('[knowledge] update failed', { organizationId, itemId: String(id), error });
      return res.status(500).json({ error: 'Could not update the item.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const ids = item.type === 'folder' ? await collectSubtree(organizationId, id) : [id];
      await KnowledgeChunk.deleteMany({ organizationId, itemId: { $in: ids } });
      await KnowledgeItem.deleteMany({ organizationId, _id: { $in: ids } });
      console.info('[knowledge] items deleted', { organizationId, rootId: String(id), count: ids.length });
      return res.status(200).json({ deleted: ids.length });
    } catch (error) {
      console.error('[knowledge] delete failed', { organizationId, itemId: String(id), error });
      return res.status(500).json({ error: 'Could not delete the item.' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler);
