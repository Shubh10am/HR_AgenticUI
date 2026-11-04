'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FeedComment, FeedPerson } from '@/lib/community';
import AuthorAvatar from './author-avatar';
import RichText from './rich-text';

const EDIT_WINDOW_MS = 24 * 3_600_000;

interface Props {
  postId: string;
  comments: FeedComment[];
  me: FeedPerson;
  canModerate: boolean;
  onComment: (content: string, parentId?: string) => Promise<boolean>;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
}

function CommentBox({ id, me, placeholder, onSubmit, autoFocus, initial = '' }: { id: string; me: FeedPerson; placeholder: string; onSubmit: (text: string) => Promise<boolean>; autoFocus?: boolean; initial?: string }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!text.trim() || busy) return;
        setBusy(true);
        if (await onSubmit(text.trim())) setText('');
        setBusy(false);
      }}
    >
      <AuthorAvatar person={me} className="h-8 w-8 text-xs" />
      <Input id={id} value={text} autoFocus={autoFocus} maxLength={2000} onChange={(event) => setText(event.target.value)} placeholder={placeholder} className="h-9 rounded-full bg-muted/50" />
      <Button type="submit" size="icon" variant="ghost" disabled={!text.trim() || busy} aria-label="Send">
        {busy ? <Loader2 className="animate-spin" /> : <Send />}
      </Button>
    </form>
  );
}

/** Comments with one level of replies. */
export default function CommentThread({ postId, comments, me, canModerate, onComment, onEdit, onDelete }: Props) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const roots = comments.filter((comment) => !comment.parentId || !comments.some((candidate) => candidate.id === comment.parentId));

  const renderComment = (comment: FeedComment, isReply: boolean) => {
    const editable = comment.mine && Date.now() - new Date(comment.createdAt).getTime() < EDIT_WINDOW_MS;
    return (
      <div key={comment.id} id={`community-comment-${comment.id}`} className="flex gap-2.5">
        <AuthorAvatar person={comment.author} className={isReply ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'} />
        <div className="min-w-0 flex-1">
          {editing === comment.id ? (
            <CommentBox
              id={`community-comment-${comment.id}-edit`}
              me={me}
              initial={comment.content}
              autoFocus
              placeholder="Edit your comment"
              onSubmit={async (text) => {
                const ok = await onEdit(comment.id, text);
                if (ok) setEditing(null);
                return ok;
              }}
            />
          ) : (
            <div className="rounded-2xl bg-muted/60 px-3.5 py-2">
              <p className="text-sm font-semibold">{comment.author?.name ?? 'Former colleague'}</p>
              <div className="text-sm [&_p]:text-sm">
                <RichText text={comment.content} />
              </div>
            </div>
          )}
          <div className="mt-1 flex gap-3 px-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            <button type="button" id={`community-comment-${comment.id}-reply`} className="font-medium hover:text-foreground" onClick={() => setReplyTo(isReply ? (comment.parentId ?? comment.id) : comment.id)}>
              Reply
            </button>
            {editable && (
              <button type="button" id={`community-comment-${comment.id}-edit-toggle`} className="font-medium hover:text-foreground" onClick={() => setEditing(editing === comment.id ? null : comment.id)}>
                {editing === comment.id ? 'Cancel' : 'Edit'}
              </button>
            )}
            {(comment.mine || canModerate) && (
              <button type="button" id={`community-comment-${comment.id}-delete`} className="font-medium hover:text-destructive" onClick={() => void onDelete(comment.id)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {roots.map((root) => (
        <div key={root.id} className="space-y-2">
          {renderComment(root, false)}
          <div className="ml-10 space-y-2">
            {comments.filter((reply) => reply.parentId === root.id).map((reply) => renderComment(reply, true))}
            {replyTo === root.id && (
              <CommentBox
                id={`community-comment-${root.id}-reply-input`}
                me={me}
                autoFocus
                placeholder={`Reply to ${root.author?.name ?? 'this comment'}…`}
                onSubmit={async (text) => {
                  const ok = await onComment(text, root.id);
                  if (ok) setReplyTo(null);
                  return ok;
                }}
              />
            )}
          </div>
        </div>
      ))}
      <CommentBox id={`community-post-${postId}-comment-input`} me={me} placeholder="Write a comment… use @name to mention" onSubmit={(text) => onComment(text)} />
    </div>
  );
}
