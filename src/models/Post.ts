import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';
import './Comment'; // Ensure Comment model is registered for population

export const POST_KINDS = ['update', 'announcement', 'kudos', 'poll', 'event', 'achievement'] as const;
export type PostKind = (typeof POST_KINDS)[number];

export interface IPostReaction {
  employee: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IPollOption {
  _id: mongoose.Types.ObjectId;
  label: string;
  votes: mongoose.Types.ObjectId[];
}

export interface IPost extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  /** Always stored so the author can manage the post; never returned for anonymous posts. */
  author: mongoose.Types.ObjectId | IEmployee;
  kind: PostKind;
  anonymous: boolean;
  topic: string;
  subject: string;
  content: string;
  /** Legacy thumbs-up list; read as 👍 reactions. */
  likes: mongoose.Types.ObjectId[];
  reactions: IPostReaction[];
  comments: mongoose.Types.ObjectId[];
  pinned: boolean;
  savedBy: mongoose.Types.ObjectId[];
  kudos?: { recipient: mongoose.Types.ObjectId; value: string };
  poll?: { options: IPollOption[]; closesAt?: Date };
  event?: { startsAt: Date; location?: string; going: mongoose.Types.ObjectId[] };
  createdAt: Date;
  updatedAt: Date;
}

// Each option keeps its own _id: votes are cast by option id.
const PollOptionSchema = new Schema({ label: { type: String, maxlength: 80 }, votes: [{ type: Schema.Types.ObjectId, ref: 'Employee' }] }, { _id: true });

const PostSchema: Schema<IPost> = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    kind: { type: String, enum: POST_KINDS, default: 'update' },
    anonymous: { type: Boolean, default: false },
    topic: { type: String, trim: true, default: 'General', maxlength: 40 },
    subject: { type: String, trim: true, default: '', maxlength: 140 },
    content: { type: String, required: [true, 'Post content cannot be empty.'], trim: true, maxlength: 4000 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    reactions: [{ _id: false, employee: { type: Schema.Types.ObjectId, ref: 'Employee' }, emoji: String }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    pinned: { type: Boolean, default: false },
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    kudos: { type: new Schema({ recipient: { type: Schema.Types.ObjectId, ref: 'Employee' }, value: String }, { _id: false }), default: undefined },
    poll: {
      type: new Schema(
        { options: [PollOptionSchema], closesAt: Date },
        { _id: false }
      ),
      default: undefined,
    },
    event: {
      type: new Schema(
        { startsAt: Date, location: { type: String, maxlength: 120 }, going: [{ type: Schema.Types.ObjectId, ref: 'Employee' }] },
        { _id: false }
      ),
      default: undefined,
    },
  },
  { timestamps: true }
);

PostSchema.index({ organizationId: 1, createdAt: -1 });

const Post: Model<IPost> = models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
