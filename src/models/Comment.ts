
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { IEmployee } from './Employee';
import type { IPost } from './Post';

export interface IComment extends Document {
  post: mongoose.Types.ObjectId | IPost;
  author: mongoose.Types.ObjectId | IEmployee;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
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
      required: [true, 'Comment content cannot be empty.'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment: Model<IComment> = models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
