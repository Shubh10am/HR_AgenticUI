
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IOrganization } from './Organization';
import './Comment'; // Ensure Comment model is registered for population

export interface IPost extends Document {
  organizationId: mongoose.Types.ObjectId | IOrganization;
  author: mongoose.Types.ObjectId | IEmployee;
  content: string;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[]; // This will now store references to Comment documents
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Post content cannot be empty.'],
      trim: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    }],
  },
  {
    timestamps: true,
  }
);

const Post: Model<IPost> = models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
