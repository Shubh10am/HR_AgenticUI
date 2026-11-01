import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IOrganization } from './Organization';
import type { IEmployee } from './Employee';

export type KnowledgeItemType = 'folder' | 'document';
export type KnowledgeItemStatus = 'processing' | 'ready' | 'failed';

export interface IKnowledgeItem extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  parentId: mongoose.Types.ObjectId | null;
  type: KnowledgeItemType;
  name: string;
  /** Extracted plain text; documents only. Never returned in list responses. */
  content?: string;
  mimeType?: string;
  sizeBytes?: number;
  status: KnowledgeItemStatus;
  statusMessage?: string;
  chunkCount: number;
  ownerId: mongoose.Types.ObjectId | IEmployee;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeItemSchema: Schema<IKnowledgeItem> = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'KnowledgeItem', default: null },
    type: { type: String, enum: ['folder', 'document'], required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, select: false },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'ready' },
    statusMessage: { type: String },
    chunkCount: { type: Number, default: 0 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    ownerName: { type: String, required: true },
  },
  { timestamps: true }
);

KnowledgeItemSchema.index({ organizationId: 1, parentId: 1, type: 1, name: 1 });

const KnowledgeItem: Model<IKnowledgeItem> =
  models.KnowledgeItem || mongoose.model<IKnowledgeItem>('KnowledgeItem', KnowledgeItemSchema);

export default KnowledgeItem;
