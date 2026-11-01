'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, FolderPlus, Home, LayoutGrid, List, Loader2, Lock, RefreshCw, Search, UploadCloud, X } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { knowledgeApi, type Breadcrumb, type KnowledgeItem } from '@/lib/knowledge-client';
import AskPanel from './components/ask-panel';
import ItemList from './components/item-list';
import UploadDialog from './components/upload-dialog';
import DocumentPreview from './components/document-preview';
import NameDialog from './components/name-dialog';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { demoKnowledge } from '@/lib/guest-demo';

const EDITOR_ROLES = ['Admin', 'HR'];

export default function KnowledgeBasePage() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const isGuest = !token || token.startsWith('guest-') || user?.organizationId === 'guest-org-id';
  const hasOrganization = Boolean(user?.organizationId);
  const canEdit = EDITOR_ROLES.includes(user?.role ?? '');

  const [parentId, setParentId] = useState<string | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [renaming, setRenaming] = useState<KnowledgeItem | null>(null);
  const [deleting, setDeleting] = useState<KnowledgeItem | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isGuest) {
      const demo = demoKnowledge(activeSearch ? null : parentId, activeSearch);
      setItems(demo.items);
      setBreadcrumbs(demo.breadcrumbs);
      setIsLoading(false);
      return;
    }
    if (!token) return;
    setIsLoading(true);
    try {
      const result = await knowledgeApi.list(token, activeSearch ? null : parentId, activeSearch || undefined);
      setItems(result.items);
      setBreadcrumbs(result.breadcrumbs);
      setLoadError(null);
    } catch (error) {
      // Shown inline rather than as a toast: a toast here re-renders the page and would retrigger the load.
      setLoadError(error instanceof Error ? error.message : 'Could not load the knowledge base.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, token, parentId, activeSearch]);

  useEffect(() => { load(); }, [load]);

  // Keep polling while any document is still being indexed.
  useEffect(() => {
    if (!items.some((item) => item.status === 'processing')) return;
    const timer = setTimeout(load, 4000);
    return () => clearTimeout(timer);
  }, [items, load]);

  const currentFolderName = breadcrumbs.at(-1)?.name ?? 'Knowledge Base';

  const openItem = (item: KnowledgeItem) => {
    if (item.type === 'folder') {
      setActiveSearch('');
      setSearchTerm('');
      setParentId(item._id);
    } else if (isGuest) {
      toast({ title: 'Sample document', description: 'Sign in to open and search your own documents.' });
    } else {
      setPreviewId(item._id);
    }
  };

  const openSource = (sourceId: string) => {
    if (isGuest) {
      toast({ title: 'Sample document', description: 'Sign in to open and search your own documents.' });
      return;
    }
    if (sourceId.startsWith('policy:')) {
      toast({ title: 'Built-in company policy', description: 'Edit attendance, leave and code-of-conduct policies in Settings.' });
      return;
    }
    setPreviewId(sourceId);
  };

  const runAction = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      toast({ title: success });
      await load();
    } catch (error) {
      toast({ title: 'Something went wrong', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
      throw error;
    }
  };

  if (!isGuest && !hasOrganization) {
    return (
      <>
        <PageHeader title="Knowledge Base" description="Your organization's policies and documents, searchable by AI." />
        <Card id="kb-no-organization" className="flex flex-col items-center p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lock className="h-7 w-7" /></span>
          <h2 className="mt-4 text-xl font-semibold">Knowledge bases belong to organizations</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">You are signed in as a platform administrator, which has no organization of its own. Sign in as an organization&apos;s Admin or HR user to manage its documents.</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Knowledge Base" description="Your organization's policies and documents — searchable by AI.">
        {canEdit && (
          <div className="flex gap-2">
            <Button id="kb-new-folder" variant="outline" onClick={() => setIsFolderOpen(true)}><FolderPlus />New folder</Button>
            <Button id="kb-upload" onClick={() => setIsUploadOpen(true)}><UploadCloud />Upload</Button>
          </div>
        )}
      </PageHeader>
      {isGuest && <GuestSampleNotice what="the knowledge base" />}

      {token && <AskPanel token={token} onOpenSource={openSource} />}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <button type="button" id="kb-breadcrumb-root" onClick={() => { setActiveSearch(''); setSearchTerm(''); setParentId(null); }} className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Home className="h-4 w-4" />All documents
          </button>
          {!activeSearch && breadcrumbs.map((crumb, index) => (
            <span key={crumb.id} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              <button type="button" id={`kb-breadcrumb-${crumb.id}`} onClick={() => setParentId(crumb.id)} disabled={index === breadcrumbs.length - 1} className="truncate rounded-md px-2 py-1 font-medium hover:bg-secondary disabled:cursor-default disabled:hover:bg-transparent">
                {crumb.name}
              </button>
            </span>
          ))}
          {activeSearch && <span className="flex items-center gap-1"><ChevronRight className="h-4 w-4 text-muted-foreground" />Results for “{activeSearch}”</span>}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={(event) => { event.preventDefault(); setActiveSearch(searchTerm.trim()); }} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="kb-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search names and contents" className="h-9 w-56 rounded-lg pl-9 pr-8" />
            {searchTerm && (
              <button type="button" aria-label="Clear search" onClick={() => { setSearchTerm(''); setActiveSearch(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            )}
          </form>
          <Button id="kb-refresh" variant="outline" size="icon" className="h-9 w-9" aria-label="Refresh" onClick={load} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          </Button>
          <div className="flex rounded-lg border p-0.5">
            <Button id="kb-view-list" variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" aria-label="List view" onClick={() => setViewMode('list')}><List /></Button>
            <Button id="kb-view-grid" variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" aria-label="Grid view" onClick={() => setViewMode('grid')}><LayoutGrid /></Button>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loadError ? (
          <Card id="kb-load-error" className="flex flex-col items-center p-10 text-center">
            <p className="font-semibold">Could not load the knowledge base</p>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
            <Button id="kb-load-retry" variant="outline" className="mt-4" onClick={load}><RefreshCw />Try again</Button>
          </Card>
        ) : isLoading && items.length === 0 ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UploadCloud className="h-7 w-7" /></span>
            <h3 className="mt-4 font-semibold">{activeSearch ? 'No matches' : 'Nothing here yet'}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {activeSearch ? 'Try different words.' : canEdit ? 'Upload handbooks and policies. Copilot and AI email replies will start answering from them.' : 'Your Admin or HR team has not added documents here yet.'}
            </p>
            {canEdit && !activeSearch && <Button id="kb-empty-upload" className="mt-5" onClick={() => setIsUploadOpen(true)}><UploadCloud />Upload documents</Button>}
          </Card>
        ) : (
          <ItemList
            items={items}
            viewMode={viewMode}
            canEdit={canEdit}
            onOpen={openItem}
            onRename={setRenaming}
            onDelete={setDeleting}
            onReindex={(item) => runAction(() => knowledgeApi.update(token!, item._id, { reindex: true }), 'Re-indexed for AI').catch(() => undefined)}
          />
        )}
      </div>

      {token && (
        <>
          <UploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} token={token} parentId={activeSearch ? null : parentId} folderName={activeSearch ? 'Knowledge Base' : currentFolderName} onUploaded={load} />
          <DocumentPreview token={token} documentId={previewId} onClose={() => setPreviewId(null)} />
          <NameDialog
            open={isFolderOpen}
            title="New folder"
            description={`Create a folder in ${currentFolderName}.`}
            submitLabel="Create"
            onOpenChange={setIsFolderOpen}
            onSubmit={(name) => runAction(() => knowledgeApi.createFolder(token, name, parentId), 'Folder created')}
          />
          <NameDialog
            open={Boolean(renaming)}
            title="Rename"
            description="Give this item a clearer name."
            submitLabel="Save"
            initialName={renaming?.name}
            onOpenChange={(open) => !open && setRenaming(null)}
            onSubmit={(name) => runAction(() => knowledgeApi.update(token, renaming!._id, { name }), 'Renamed')}
          />
          <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleting?.type === 'folder' ? 'The folder and everything inside it will be deleted.' : 'This document will be deleted.'} Copilot and AI replies will stop using it. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel id="kb-delete-cancel">Cancel</AlertDialogCancel>
                <AlertDialogAction id="kb-delete-confirm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && runAction(() => knowledgeApi.remove(token, deleting._id), 'Deleted').catch(() => undefined)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
