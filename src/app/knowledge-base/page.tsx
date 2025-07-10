
'use client';

import { useState, type FormEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, LayoutGrid, List, FolderPlus, Plus, File, Folder } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface KnowledgeBaseItem {
  id: string;
  name: string;
  type: 'Folder' | 'File';
  createdAt: string;
  owner: string;
}

const initialItems: KnowledgeBaseItem[] = [];

const EmptyState = ({ onAddFolder, onAddFile }: { onAddFolder: () => void; onAddFile: () => void }) => (
  <div className="text-center py-16">
    <div className="inline-block bg-secondary p-6 rounded-full">
      <div className="inline-block bg-background p-4 rounded-full">
        <Folder className="h-16 w-16 text-muted-foreground" strokeWidth={1} />
      </div>
    </div>
    <h3 className="mt-6 text-xl font-semibold">No Knowledge Bases</h3>
    <p className="mt-2 text-muted-foreground">Get started by creating a new knowledge base or folder.</p>
    <div className="mt-6 flex justify-center gap-2">
      <Button variant="outline" onClick={onAddFolder}>
        <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
      </Button>
      <Button onClick={onAddFile}>
        <Plus className="mr-2 h-4 w-4" /> Create New
      </Button>
    </div>
  </div>
);

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>(initialItems);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const { toast } = useToast();
  const { user } = useAuth();

  const handleCreateFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newItemName.trim()) {
      toast({ title: 'Folder name is required', variant: 'destructive' });
      return;
    }
    const newFolder: KnowledgeBaseItem = {
      id: `folder-${Date.now()}`,
      name: newItemName.trim(),
      type: 'Folder',
      createdAt: new Date().toLocaleDateString(),
      owner: user?.name || 'You',
    };
    setItems([...items, newFolder]);
    toast({ title: 'Folder Created', description: `Folder "${newFolder.name}" has been created.` });
    setIsFolderDialogOpen(false);
    setNewItemName('');
  };

  const handleCreateFile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newItemName.trim()) {
      toast({ title: 'File name is required', variant: 'destructive' });
      return;
    }
    const newFile: KnowledgeBaseItem = {
      id: `file-${Date.now()}`,
      name: newItemName.trim(),
      type: 'File',
      createdAt: new Date().toLocaleDateString(),
      owner: user?.name || 'You',
    };
    setItems([...items, newFile]);
    toast({ title: 'File Created', description: `File "${newFile.name}" has been created.` });
    setIsFileDialogOpen(false);
    setNewItemName('');
  };

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description={
          <>
            Manage your document collections and knowledge sources for AI interactions.
            <Link href="#" className="text-primary hover:underline ml-2">
              Quick guide
            </Link>
            {' '}on using Knowledge Base.
          </>
        }
      />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search knowledge bases..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center rounded-md bg-muted p-1">
            <Button
              variant={viewMode === 'grid' ? 'outline' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'outline' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isFolderDialogOpen} onOpenChange={(open) => { if (!open) setNewItemName(''); setIsFolderDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 h-4 w-4" /> Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>Enter a name for your new folder.</DialogDescription>
              </DialogHeader>
              <form id="create-folder-form" onSubmit={handleCreateFolder}>
                <div className="py-4">
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input id="folder-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                </div>
              </form>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>Cancel</Button>
                <Button type="submit" form="create-folder-form">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isFileDialogOpen} onOpenChange={(open) => { if (!open) setNewItemName(''); setIsFileDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create New
              </Button>
            </DialogTrigger>
             <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Knowledge Base File</DialogTitle>
                <DialogDescription>
                    This will create a new file entry. You can upload content later.
                </DialogDescription>
              </DialogHeader>
              <form id="create-file-form" onSubmit={handleCreateFile}>
                <div className="py-4">
                  <Label htmlFor="file-name">File Name</Label>
                  <Input id="file-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                </div>
              </form>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFileDialogOpen(false)}>Cancel</Button>
                <Button type="submit" form="create-file-form">Create File</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <div className="rounded-lg border">
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {item.type === 'Folder' ? <Folder className="h-4 w-4 text-primary"/> : <File className="h-4 w-4 text-muted-foreground"/>}
                    {item.name}
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell>{item.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState 
            onAddFolder={() => setIsFolderDialogOpen(true)} 
            onAddFile={() => setIsFileDialogOpen(true)} 
          />
        )}
      </div>
    </>
  );
}
