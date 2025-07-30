
'use client';

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, LayoutGrid, List, FolderPlus, Plus, File, Folder, UploadCloud, ChevronDown, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';

interface KnowledgeBaseItem {
  id: string;
  name: string;
  type: 'Folder' | 'File';
  createdAt: string;
  owner: string;
}

const initialItems: KnowledgeBaseItem[] = [];

const EmptyState = ({ onAddFolder, onAddFile, onUploadFile, onUploadFolder }: { onAddFolder: () => void; onAddFile: () => void; onUploadFile: () => void; onUploadFolder: () => void; }) => (
  <div className="text-center py-16">
    <div className="inline-block bg-secondary p-6 rounded-full">
      <div className="inline-block bg-background p-4 rounded-full">
        <Folder className="h-16 w-16 text-muted-foreground" strokeWidth={1} />
      </div>
    </div>
    <h3 className="mt-6 text-xl font-semibold">No Knowledge Bases</h3>
    <p className="mt-2 text-muted-foreground">Get started by creating or uploading a file or folder.</p>
    <div className="mt-6 flex justify-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onAddFolder}><FolderPlus className="mr-2 h-4 w-4" />Create Folder</DropdownMenuItem>
          <DropdownMenuItem onSelect={onAddFile}><File className="mr-2 h-4 w-4" />Create File</DropdownMenuItem>
          <DropdownMenuItem onSelect={onUploadFolder}><UploadCloud className="mr-2 h-4 w-4" />Upload Folder (Simulated)</DropdownMenuItem>
          <DropdownMenuItem onSelect={onUploadFile}><UploadCloud className="mr-2 h-4 w-4" />Upload File</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<KnowledgeBaseItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploadFolderDialogOpen, setIsUploadFolderDialogOpen] = useState(false);
  
  const [newItemName, setNewItemName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const results = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(results);
  }, [searchTerm, items]);
  
  const resetFormFields = useCallback(() => {
    setNewItemName('');
    setSelectedFile(null);
  }, []);

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
    setItems(prev => [...prev, newFolder]);
    toast({ title: 'Folder Created', description: `Folder "${newFolder.name}" has been created.` });
    setIsFolderDialogOpen(false);
    resetFormFields();
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
    setItems(prev => [...prev, newFile]);
    toast({ title: 'File Created', description: `File "${newFile.name}" has been created.` });
    setIsFileDialogOpen(false);
    resetFormFields();
  };

  const handleUploadFolder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newItemName.trim()) {
      toast({ title: 'Folder name is required', variant: 'destructive' });
      return;
    }
    const newFolder: KnowledgeBaseItem = {
      id: `folder-upload-${Date.now()}`,
      name: newItemName.trim(),
      type: 'Folder',
      createdAt: new Date().toLocaleDateString(),
      owner: user?.name || 'You',
    };
    setItems(prev => [...prev, newFolder]);
    toast({ title: 'Folder Uploaded (Simulated)', description: `Folder "${newFolder.name}" has been added.` });
    setIsUploadFolderDialogOpen(false);
    resetFormFields();
  };

  const handleFileUpload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Please choose a file to upload.', variant: 'destructive' });
      return;
    }
    const newFile: KnowledgeBaseItem = {
      id: `file-upload-${Date.now()}`,
      name: selectedFile.name,
      type: 'File',
      createdAt: new Date().toLocaleDateString(),
      owner: user?.name || 'You',
    };
    setItems(prev => [...prev, newFile]);
    toast({ title: 'File Uploaded (Simulated)', description: `File "${newFile.name}" has been added.` });
    setIsUploadDialogOpen(false);
    resetFormFields();
  };

  const handleRefresh = () => {
    setSearchTerm('');
    toast({
      title: 'View Refreshed',
      description: 'Cleared filters and showing all items.',
    });
  };

  const displayedContent = searchTerm ? filteredItems : items;

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description={
          <>
            Manage your document collections and knowledge sources for AI interactions.
             <Dialog>
              <DialogTrigger asChild>
                <button className="text-primary hover:underline ml-2">
                  Quick guide
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                      <DialogTitle className="flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-primary"/> Using the Knowledge Base</DialogTitle>
                      <DialogDescription>A guide to effectively manage your organization's knowledge.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4 text-sm">
                      <div>
                          <h4 className="font-semibold text-foreground">What is it?</h4>
                          <p className="text-muted-foreground">The Knowledge Base is a central repository for your company's documents, policies, and other important information.</p>
                      </div>
                      <div>
                          <h4 className="font-semibold text-foreground">How is it used by AI?</h4>
                          <p className="text-muted-foreground">The AI features, especially the HR Copilot, use the documents stored here as a primary source of truth. For example, if you upload your company's leave policy, the Copilot can accurately answer employee questions about it.</p>
                      </div>
                       <div>
                          <h4 className="font-semibold text-foreground">How do I use it?</h4>
                          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                              <li>Use the <strong>"Add New"</strong> button to create folders, create blank files, or upload existing files (like PDFs).</li>
                              <li>Organize related documents into folders to keep things tidy.</li>
                              <li>Keep documents up-to-date to ensure the AI provides accurate information.</li>
                          </ul>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button>Got it!</Button>
                      </DialogClose>
                  </DialogFooter>
              </DialogContent>
            </Dialog>
            {' '}on using Knowledge Base.
          </>
        }
      />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto sm:flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search knowledge bases..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <div className="flex items-center rounded-md bg-muted p-1">
            <Button
              variant={viewMode === 'list' ? 'outline' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'outline' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add New <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setIsFolderDialogOpen(true)}><FolderPlus className="mr-2 h-4 w-4" />Create Folder</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsFileDialogOpen(true)}><File className="mr-2 h-4 w-4" />Create File</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsUploadFolderDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4" />Upload Folder (Simulated)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsUploadDialogOpen(true)}><UploadCloud className="mr-2 h-4 w-4" />Upload File</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
      
      {items.length === 0 ? (
        <EmptyState
          onAddFolder={() => setIsFolderDialogOpen(true)}
          onAddFile={() => setIsFileDialogOpen(true)}
          onUploadFile={() => setIsUploadDialogOpen(true)}
          onUploadFolder={() => setIsUploadFolderDialogOpen(true)}
        />
      ) : viewMode === 'list' ? (
        <div className="rounded-lg border mt-4">
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
              {displayedContent.map((item) => (
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {displayedContent.map((item) => (
            <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                {item.type === 'Folder' ? (
                  <Folder className="h-16 w-16 text-primary mb-4" />
                ) : (
                  <File className="h-16 w-16 text-muted-foreground mb-4" />
                )}
                <p className="font-semibold truncate w-full" title={item.name}>{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  By {item.owner} on {item.createdAt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
       {items.length > 0 && displayedContent.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mx-auto" strokeWidth={1} />
            <h3 className="mt-6 text-xl font-semibold">No Results Found</h3>
            <p className="mt-2 text-muted-foreground">Your search for "{searchTerm}" did not match any items.</p>
          </div>
        )}

      {/* Modals */}
      <Dialog open={isFolderDialogOpen} onOpenChange={(open) => { if (!open) resetFormFields(); setIsFolderDialogOpen(open); }}>
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

      <Dialog open={isFileDialogOpen} onOpenChange={(open) => { if (!open) resetFormFields(); setIsFileDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription>Enter a name for your new file.</DialogDescription>
          </DialogHeader>
          <form id="create-file-form" onSubmit={handleCreateFile}>
            <div className="py-4">
              <Label htmlFor="file-name">File Name</Label>
              <Input id="file-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required placeholder="e.g., my-document.txt"/>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFileDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="create-file-form">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadFolderDialogOpen} onOpenChange={(open) => { if (!open) resetFormFields(); setIsUploadFolderDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Folder (Simulated)</DialogTitle>
            <DialogDescription>In a real app, you would select a folder. Here, we'll just name it.</DialogDescription>
          </DialogHeader>
          <form id="upload-folder-form" onSubmit={handleUploadFolder}>
            <div className="py-4">
              <Label htmlFor="upload-folder-name">Folder Name</Label>
              <Input id="upload-folder-name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required placeholder="e.g., Project Documents"/>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUploadFolderDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="upload-folder-form">Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => { if (!open) resetFormFields(); setIsUploadDialogOpen(open); }}>
         <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a File</DialogTitle>
            <DialogDescription>
                Select a file from your computer to add to the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <form id="upload-file-form" onSubmit={handleFileUpload}>
            <div className="py-4">
              <Label htmlFor="file-upload">File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                required
                className="mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {selectedFile && <p className="text-sm text-muted-foreground mt-2">Selected: {selectedFile.name}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button type="submit" form="upload-file-form">Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
