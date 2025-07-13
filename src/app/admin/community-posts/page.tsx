
'use client';

import { useState, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface PostAuthor {
  _id: string;
  name: string;
}

interface PostOrganization {
  _id: string;
  name: string;
}

interface AdminPost {
  _id: string;
  subject: string;
  author: PostAuthor;
  organization: PostOrganization;
  likes: any[];
  comments: any[];
  createdAt: string;
}

export default function AdminCommunityPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<AdminPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { token } = useAuth();

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/community-posts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch posts.');
      }
      const data = await response.json();
      setPosts(data);
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  
  const handleDeletePost = async () => {
    if (!postToDelete || !token) return;
    setIsDeleting(true);
    try {
        const response = await fetch(`/api/admin/community-posts/${postToDelete._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        toast({ title: 'Post Deleted', description: 'The community post has been permanently deleted.' });
        fetchPosts(); // Refresh list
    } catch (e: any) {
        toast({ title: 'Error Deleting Post', description: e.message, variant: 'destructive' });
    } finally {
        setIsDeleting(false);
        setPostToDelete(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading community posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-destructive font-semibold">Failed to load posts</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Community Content Moderation"
        description="Oversee and manage all posts across the platform."
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Community Posts</CardTitle>
          <CardDescription>A chronological list of all posts from all organizations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post Subject</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No community posts found.
                    </TableCell>
                  </TableRow>
                )}
                {posts.map((post) => (
                  <TableRow key={post._id}>
                    <TableCell className="font-medium max-w-xs truncate">{post.subject}</TableCell>
                    <TableCell>{post.organization?.name || 'N/A'}</TableCell>
                    <TableCell>{post.author?.name || 'N/A'}</TableCell>
                    <TableCell>{post.likes.length}</TableCell>
                    <TableCell>{post.comments.length}</TableCell>
                    <TableCell>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => setPostToDelete(post)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
       <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the post
                    <span className="font-semibold"> "{postToDelete?.subject}" </span>
                    and all of its associated comments and likes.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={handleDeletePost} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Yes, delete post
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
