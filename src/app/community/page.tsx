
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ThumbsUp, Share2, Send, Loader2, Image as ImageIcon, Lock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


interface Author {
  _id: string;
  name: string;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  createdAt: string;
}

interface Post {
  _id: string;
  author: Author;
  topic: string;
  subject: string;
  content: string;
  likes: string[]; // Array of employee IDs
  comments: Comment[];
  createdAt: string;
}

const mockPost: Post = {
    _id: 'mock-post-1',
    author: { _id: 'admin-id', name: 'Admin-X' },
    topic: 'Company Updates',
    subject: 'Exciting Times Ahead!',
    content: "Hi Team!\nWe’ve been working hard behind the scenes, and we’re excited to roll out some great updates soon. From improved workflows to new tools that will make your day smoother—we’re just getting started.\nStay tuned and keep an eye on this space! 👀\n#CompanyUpdates #TeamWork",
    likes: Array.from({ length: 12 }, (_, i) => `user-${i}`), // 12 fake likes
    comments: [
        {
            _id: 'comment-1',
            author: { _id: 'user-a', name: 'Jane Doe' },
            content: "This is great news! Looking forward to the updates.",
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
        },
        {
            _id: 'comment-2',
            author: { _id: 'user-b', name: 'John Smith' },
            content: "Can't wait to see what you've been working on!",
            createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
        },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
};


export default function CommunityPage() {
  const { user, token } = useAuth();
  const isGuest = !token || token.startsWith('guest-');
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostTopic, setNewPostTopic] = useState('');
  const [newPostSubject, setNewPostSubject] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // State for editing comments
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  
  // State for deleting comments
  const [commentToDelete, setCommentToDelete] = useState<{ postId: string; commentId: string } | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);


  const canPost = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager' || user?.role === 'SuperAdmin';

  const fetchPosts = useCallback(async () => {
    if (!token || isGuest) {
      setIsLoadingPosts(false);
      return;
    }
    setIsLoadingPosts(true);
    try {
      const response = await fetch('/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch posts.');
      const data = await response.json();
      setPosts(data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [token, toast, isGuest]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newPostTopic.trim() || !newPostSubject.trim() || !newPostContent.trim()) return;
    setIsSubmittingPost(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          topic: newPostTopic,
          subject: newPostSubject,
          content: newPostContent 
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post.');
      }
      setNewPostTopic('');
      setNewPostSubject('');
      setNewPostContent('');
      await fetchPosts(); // Refresh posts list
      toast({ title: 'Success', description: 'Your post has been published.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!token || isGuest) return;
    try {
        const response = await fetch(`/api/community/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to update like.');
        const updatedPost = await response.json();
        setPosts(posts.map(p => p._id === postId ? updatedPost : p));
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleCommentSubmit = async (postId: string) => {
    const content = commentInputs[postId];
    if (!content || !content.trim() || !token || isGuest) return;

    try {
        const response = await fetch(`/api/community/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error('Failed to add comment.');
        
        const updatedPost = await response.json();
        setPosts(posts.map(p => p._id === postId ? updatedPost : p));
        setCommentInputs(prev => ({ ...prev, [postId]: '' })); // Clear input
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditComment = async (postId: string, commentId: string) => {
    if (!editingCommentContent.trim()) {
      toast({ title: "Comment cannot be empty", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/community/posts/${postId}/comment/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editingCommentContent }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit comment.');
      }
      const updatedPost = await response.json();
      setPosts(posts.map(p => p._id === postId ? updatedPost : p));
      setEditingCommentId(null);
      setEditingCommentContent('');
      toast({ title: "Comment Updated" });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !token) return;
    setIsDeletingComment(true);
    try {
      const { postId, commentId } = commentToDelete;
      const response = await fetch(`/api/community/posts/${postId}/comment/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment.');
      }
      const updatedPost = await response.json();
      setPosts(posts.map(p => p._id === postId ? updatedPost : p));
      toast({ title: 'Comment Deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCommentToDelete(null);
      setIsDeletingComment(false);
    }
  };

  const isWithin24Hours = (dateString: string) => {
    const commentDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };


  const renderPost = (post: Post, isMock: boolean) => (
    <Card key={post._id} className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://placehold.co/40x40.png?text=${post.author.name.charAt(0)}`} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
         <div className="pt-4">
            <Badge variant="secondary">{post.topic}</Badge>
            <CardTitle className="text-xl mt-2">{post.subject}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
      </CardContent>
      <CardContent className="border-t pt-2 pb-2">
         <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{post.likes.length > 0 && `${post.likes.length} Likes`}</span>
            <span>{post.comments.length > 0 && `${post.comments.length} Comments`}</span>
         </div>
      </CardContent>
      <CardContent className="border-t pt-2 pb-4">
        <div className="flex justify-around">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="flex-1" onClick={() => !isMock && handleLike(post._id)} disabled={isMock}>
                <ThumbsUp className={`mr-2 h-4 w-4 ${post.likes.includes(user?.id || '') && !isMock ? 'text-primary fill-current' : ''}`} />
                Like
              </Button>
            </TooltipTrigger>
            {isMock && <TooltipContent>Login to like posts</TooltipContent>}
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="flex-1" disabled={isMock}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Comment
              </Button>
            </TooltipTrigger>
            {isMock && <TooltipContent>Login to comment</TooltipContent>}
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" className="flex-1" disabled={isMock}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </TooltipTrigger>
            {isMock && <TooltipContent>Login to share posts</TooltipContent>}
          </Tooltip>
        </div>
      </CardContent>
       <CardContent className="border-t px-4 pt-4 pb-4 bg-secondary/30">
         {post.comments.map(comment => {
          const userCanModify = !isMock && user && (user.role === 'Admin' || (user.id === comment.author._id && isWithin24Hours(comment.createdAt)));
          return (
            <div key={comment._id} className="flex items-start gap-2 mb-3 group">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.author.name.charAt(0)}`} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-background/50 rounded-lg p-2 text-sm flex-grow">
                    <div className="flex justify-between items-baseline">
                        <span className="font-semibold">{comment.author.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    </div>
                    {editingCommentId === comment._id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)} className="text-sm" />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => handleEditComment(post._id, comment._id)}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <p>{comment.content}</p>
                    )}
                </div>
                {userCanModify && (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {user.id === comment.author._id && isWithin24Hours(comment.createdAt) && (
                        <DropdownMenuItem onSelect={() => {
                          setEditingCommentId(comment._id);
                          setEditingCommentContent(comment.content);
                        }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onSelect={() => setCommentToDelete({ postId: post._id, commentId: comment._id })}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
         )})}
         <div className="flex items-center gap-2 mt-4">
            <Avatar className="h-8 w-8">
                 <AvatarImage src={`https://placehold.co/40x40.png?text=${isGuest ? 'G' : user?.name.charAt(0)}`} />
                 <AvatarFallback>{isGuest ? 'G' : user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Input
                placeholder="Write a comment..."
                className="h-9"
                value={commentInputs[post._id] || ''}
                onChange={(e) => setCommentInputs({...commentInputs, [post._id]: e.target.value})}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        !isMock && handleCommentSubmit(post._id);
                    }
                }}
                disabled={isMock}
            />
             <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => !isMock && handleCommentSubmit(post._id)} disabled={isMock || !commentInputs[post._id]}>
                <Send className="h-4 w-4"/>
             </Button>
         </div>
       </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <PageHeader
        title="Community Hub"
        description="Connect with your team, share updates, and stay engaged."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {isGuest ? (
            <Card className="shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="h-12 w-12 text-primary mb-4"/>
                    <h3 className="text-xl font-bold">Feature Locked in Guest Mode</h3>
                    <p className="text-muted-foreground mt-2">Log in or register to create posts and interact with the community.</p>
                </div>
                <CardHeader>
                    <CardTitle>Create a New Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 blur-sm">
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div><Label>Topic</Label><Input disabled /></div>
                        <div><Label>Subject</Label><Input disabled /></div>
                    </div>
                    <div><Label>Post Content</Label><Textarea className="min-h-[100px]" disabled /></div>
                    <div className="flex justify-end"><Button disabled>Post</Button></div>
                </CardContent>
            </Card>
          ) : canPost && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create a New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                     <div>
                      <Label htmlFor="postTopic">Topic</Label>
                      <Input
                        id="postTopic"
                        placeholder="e.g., Announcement"
                        value={newPostTopic}
                        onChange={(e) => setNewPostTopic(e.target.value)}
                        className="mt-1"
                        disabled={isSubmittingPost}
                        required
                      />
                    </div>
                     <div>
                      <Label htmlFor="postSubject">Subject</Label>
                      <Input
                        id="postSubject"
                        placeholder="e.g., Q3 All-Hands Meeting"
                        value={newPostSubject}
                        onChange={(e) => setNewPostSubject(e.target.value)}
                        className="mt-1"
                        disabled={isSubmittingPost}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postContent">Post Content</Label>
                    <Textarea
                      id="postContent"
                      placeholder={`What's on your mind, ${user?.name}?`}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="mt-1 min-h-[100px]"
                      disabled={isSubmittingPost}
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                       <Button type="button" variant="ghost" size="icon" disabled>
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                    <Button type="submit" disabled={isSubmittingPost || !newPostContent.trim()}>
                      {isSubmittingPost && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Post
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <div className="space-y-6">
            {isGuest ? (
                renderPost(mockPost, true)
            ) : isLoadingPosts ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : posts.length > 0 ? (
                posts.map((post) => renderPost(post, false))
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No community posts yet.</p>
                    {canPost ? <p>Be the first to share something!</p> : <p>Check back later for updates.</p>}
                </div>
            )}
           </div>
        </div>

        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team Birthdays</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No birthdays this month.</p>
            </CardContent>
          </Card>
        </div>
      </div>
       <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the comment.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDeleteComment} disabled={isDeletingComment}>
                    {isDeletingComment && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Yes, delete comment
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
