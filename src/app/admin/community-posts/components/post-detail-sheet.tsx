'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Heart, Loader2, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';

export interface PostDetail {
  _id: string;
  subject: string;
  content?: string;
  author?: { name: string } | null;
  organization?: { name: string } | null;
  likes: unknown[];
  comments: unknown[];
  createdAt: string;
}

interface PostComment {
  _id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

/** Reads one post in full, with its comments, so a moderator can judge it before acting. */
export default function PostDetailSheet({ post, onClose, onDelete }: { post: PostDetail | null; onClose: () => void; onDelete: (post: PostDetail) => void }) {
  const { token } = useAuth();
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post || !token) return;
    let cancelled = false;
    setComments(null);
    setError(null);
    fetch(`/api/admin/community-posts/${post._id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error ?? 'Could not load comments.');
        if (!cancelled) setComments(body.comments);
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [post, token]);

  return (
    <Sheet open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
        {post && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="break-words pr-6 text-xl">{post.subject}</SheetTitle>
              <SheetDescription>
                {post.author?.name ?? 'Deleted user'} · {post.organization?.name ?? 'Unknown organization'} · {format(new Date(post.createdAt), 'd MMM yyyy, HH:mm')}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" />{post.likes.length} likes</span>
              <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments.length} comments</span>
            </div>

            <div className="mt-5 whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
              {post.content?.trim() || <span className="text-muted-foreground">This post has no text.</span>}
            </div>

            <h3 className="mt-6 text-sm font-semibold">Comments</h3>
            <div className="mt-2 flex-1 space-y-3">
              {error ? <p className="text-sm text-destructive">{error}</p> : comments === null ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading comments…</div>
              ) : comments.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No comments yet.</p>
              ) : comments.map((comment) => (
                <div key={comment._id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{comment.authorName} <span className="font-normal text-xs text-muted-foreground">· {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span></p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-foreground/80">{comment.content}</p>
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-background px-6 py-4">
              <Button id="admin-post-delete" variant="destructive" className="w-full sm:w-auto" onClick={() => onDelete(post)}><Trash2 className="mr-2 h-4 w-4" />Delete post</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
