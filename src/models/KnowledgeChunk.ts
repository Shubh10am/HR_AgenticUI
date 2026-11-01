import mongoose, { Schema, Document, models, Model } from 'mongoose';

/** One searchable passage of a knowledge document, with its embedding vector. */
export interface IKnowledgeChunk extends Document {
  organizationId: mongoose.Types.ObjectId;
  itemId: mongoose.Types.ObjectId;
  index: number;
  text: string;
  embedding: number[];
  createdAt: Date;
}

const KnowledgeChunkSchema: Schema<IKnowledgeChunk> = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'KnowledgeItem', required: true },
    index: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

KnowledgeChunkSchema.index({ organizationId: 1, itemId: 1, index: 1 });

const KnowledgeChunk: Model<IKnowledgeChunk> =
  models.KnowledgeChunk || mongoose.model<IKnowledgeChunk>('KnowledgeChunk', KnowledgeChunkSchema);

export default KnowledgeChunk;
