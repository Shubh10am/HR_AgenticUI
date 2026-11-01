'use client';

import { format } from 'date-fns';
import { AlertTriangle, Eye, FileText, Folder, Loader2, MoreHorizontal, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatBytes, type KnowledgeItem } from '@/lib/knowledge-client';
import { cn } from '@/lib/utils';

interface ItemListProps {
  items: KnowledgeItem[];
  viewMode: 'list' | 'grid';
  canEdit: boolean;
  onOpen: (item: KnowledgeItem) => void;
  onRename: (item: KnowledgeItem) => void;
  onReindex: (item: KnowledgeItem) => void;
  onDelete: (item: KnowledgeItem) => void;
}

function StatusBadge({ item }: { item: KnowledgeItem }) {
  if (item.type === 'folder') return null;
  if (item.status === 'processing') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Indexing</span>;
  }
  if (item.status === 'failed') {
    return <span title={item.statusMessage} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" />Not indexed</span>;
  }
  return <span title={`${item.chunkCount} passages searchable by AI`} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"><Sparkles className="h-3 w-3" />AI-ready</span>;
}

function ItemIcon({ item, large }: { item: KnowledgeItem; large?: boolean }) {
  const size = large ? 'h-12 w-12' : 'h-9 w-9';
  return item.type === 'folder' ? (
    <span className={cn('flex shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600', size)}><Folder className={large ? 'h-6 w-6' : 'h-4 w-4'} /></span>
  ) : (
    <span className={cn('flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary', size)}><FileText className={large ? 'h-6 w-6' : 'h-4 w-4'} /></span>
  );
}

function ItemActions({ item, canEdit, onOpen, onRename, onReindex, onDelete }: Omit<ItemListProps, 'items' | 'viewMode'> & { item: KnowledgeItem }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id={`kb-item-${item._id}-actions`} variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full" aria-label={`Actions for ${item.name}`} onClick={(event) => event.stopPropagation()}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem id={`kb-item-${item._id}-open`} onSelect={() => onOpen(item)}><Eye className="mr-2 h-4 w-4" />{item.type === 'folder' ? 'Open' : 'Preview'}</DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem id={`kb-item-${item._id}-rename`} onSelect={() => onRename(item)}><Pencil className="mr-2 h-4 w-4" />Rename</DropdownMenuItem>
            {item.type === 'document' && (
              <DropdownMenuItem id={`kb-item-${item._id}-reindex`} onSelect={() => onReindex(item)}><RefreshCw className="mr-2 h-4 w-4" />Re-index for AI</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem id={`kb-item-${item._id}-delete`} onSelect={() => onDelete(item)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Folder contents as a table (list) or tiles (grid). Clicking opens a folder or previews a document. */
export default function ItemList(props: ItemListProps) {
  const { items, viewMode, onOpen } = props;

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item._id}
            id={`kb-item-${item._id}`}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(item)}
            onKeyDown={(event) => event.key === 'Enter' && onOpen(item)}
            className="group flex cursor-pointer flex-col rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <ItemIcon item={item} large />
              <ItemActions {...props} item={item} />
            </div>
            <p className="mt-4 truncate font-semibold" title={item.name}>{item.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.type === 'folder' ? 'Folder' : formatBytes(item.sizeBytes)} · {format(new Date(item.updatedAt), 'MMM d, yyyy')}</p>
            <div className="mt-3"><StatusBadge item={item} /></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b bg-secondary/40 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <tr>
            <th id="kb-table-name-header" className="px-4 py-3">Name</th>
            <th id="kb-table-status-header" className="hidden px-4 py-3 md:table-cell">Status</th>
            <th id="kb-table-size-header" className="hidden px-4 py-3 lg:table-cell">Size</th>
            <th id="kb-table-owner-header" className="hidden px-4 py-3 lg:table-cell">Added by</th>
            <th id="kb-table-updated-header" className="hidden px-4 py-3 sm:table-cell">Updated</th>
            <th className="w-12 px-2 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} id={`kb-table-${item._id}-row`} onClick={() => onOpen(item)} className="cursor-pointer border-b last:border-0 transition-colors hover:bg-secondary/50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ItemIcon item={item} />
                  <span className="truncate font-medium">{item.name}</span>
                </div>
              </td>
              <td className="hidden px-4 py-3 md:table-cell"><StatusBadge item={item} /></td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{item.type === 'folder' ? '—' : formatBytes(item.sizeBytes)}</td>
              <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{item.ownerName}</td>
              <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{format(new Date(item.updatedAt), 'MMM d, yyyy')}</td>
              <td className="px-2 py-3"><ItemActions {...props} item={item} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
