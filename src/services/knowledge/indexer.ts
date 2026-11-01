import mongoose from 'mongoose';
import KnowledgeItem from '@/models/KnowledgeItem';
import KnowledgeChunk from '@/models/KnowledgeChunk';
import { chunkText } from './chunking';
import { embedTexts, getRunnerForOrganization } from './embeddings';

/**
 * Splits a document into passages, embeds them and replaces its stored
 * chunks. Marks the item `ready` with its chunk count, or `failed` with a
 * reason the UI can show. Never throws: a failed index leaves the document
 * saved and retryable.
 *
 * @param itemId - The document to index.
 * @param organizationId - The owning organization, used to pick the API key.
 * @returns The final status.
 */
export async function indexDocument(itemId: string, organizationId: string): Promise<'ready' | 'failed'> {
  const item = await KnowledgeItem.findOne({ _id: itemId, organizationId, type: 'document' }).select('+content');
  if (!item) return 'failed';

  try {
    const passages = chunkText(item.content ?? '');
    const runner = await getRunnerForOrganization(organizationId);
    const vectors = passages.length > 0 ? await embedTexts(runner, passages, 'RETRIEVAL_DOCUMENT') : [];

    await KnowledgeChunk.deleteMany({ organizationId, itemId: item._id });
    if (passages.length > 0) {
      await KnowledgeChunk.insertMany(
        passages.map((text, index) => ({
          organizationId: new mongoose.Types.ObjectId(organizationId),
          itemId: item._id,
          index,
          text,
          embedding: vectors[index],
        }))
      );
    }

    item.status = 'ready';
    item.statusMessage = undefined;
    item.chunkCount = passages.length;
    await item.save();
    console.info('[knowledge] indexed document', { itemId, organizationId, chunks: passages.length });
    return 'ready';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.error('[knowledge] indexing failed', { itemId, organizationId, reason });
    item.status = 'failed';
    item.statusMessage = 'AI indexing failed. Check the organization API key in Settings, then retry.';
    await item.save();
    return 'failed';
  }
}
