
'use client';

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ThumbsUp, Share2, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

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
  content: string;
  likes: string[]; // Array of employee IDs
  comments: Comment[];
  createdAt: string;
}

export default function CommunityPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const canPost = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'Manager';

  const fetchPosts = useCallback(async () => {
    if (!token) return;
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
  }, [token, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newPostContent.trim()) return;
    setIsSubmittingPost(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newPostContent }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post.');
      }
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
    if (!token) return;
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
    if (!content || !content.trim() || !token) return;

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

  return (
    <>
      <PageHeader
        title="Community Hub"
        description="Connect with your team, share updates, and stay engaged."
      />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {canPost && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Create a New Post</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <Textarea
                    placeholder={`What's on your mind, ${user?.name}?`}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isSubmittingPost}
                  />
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
          
          {isLoadingPosts ? (
             <div className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          ) : posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
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
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </CardContent>
                  <CardContent className="border-t pt-2 pb-2">
                     <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{post.likes.length > 0 && `${post.likes.length} Likes`}</span>
                        <span>{post.comments.length > 0 && `${post.comments.length} Comments`}</span>
                     </div>
                  </CardContent>
                  <CardContent className="border-t pt-2 pb-4">
                    <div className="flex justify-around">
                      <Button variant="ghost" className="flex-1" onClick={() => handleLike(post._id)}>
                        <ThumbsUp className={`mr-2 h-4 w-4 ${post.likes.includes(user?.id || '') ? 'text-primary fill-current' : ''}`} />
                        Like
                      </Button>
                      <Button variant="ghost" className="flex-1">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Comment
                      </Button>
                      <Button variant="ghost" className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </CardContent>
                   <CardContent className="border-t px-4 pt-4 pb-4 bg-secondary/30">
                     {post.comments.map(comment => (
                        <div key={comment._id} className="flex items-start gap-2 mb-3">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.author.name.charAt(0)}`} />
                                <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="bg-background/50 rounded-lg p-2 text-sm flex-grow">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-semibold">{comment.author.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                </div>
                                <p>{comment.content}</p>
                            </div>
                        </div>
                     ))}
                     <div className="flex items-center gap-2 mt-4">
                        <Avatar className="h-8 w-8">
                             <AvatarImage src={`https://placehold.co/40x40.png?text=${user?.name.charAt(0)}`} />
                             <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Input
                            placeholder="Write a comment..."
                            className="h-9"
                            value={commentInputs[post._id] || ''}
                            onChange={(e) => setCommentInputs({...commentInputs, [post._id]: e.target.value})}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCommentSubmit(post._id);
                                }
                            }}
                        />
                         <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => handleCommentSubmit(post._id)} disabled={!commentInputs[post._id]}>
                            <Send className="h-4 w-4"/>
                         </Button>
                     </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
                <p>No community posts yet.</p>
                {canPost ? <p>Be the first to share something!</p> : <p>Check back later for updates.</p>}
            </div>
          )}
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
    </>
  );
}
