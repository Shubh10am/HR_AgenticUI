'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatBytes, knowledgeApi, type KnowledgeItem } from '@/lib/knowledge-client';

interface DocumentPreviewProps {
  token: string;
  documentId: string | null;
  onClose: () => void;
}

/** Side sheet showing a document's extracted text and metadata. */
export default function DocumentPreview({ token, documentId, onClose }: DocumentPreviewProps) {
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;
    setItem(null);
    setError(null);
    knowledgeApi.get(token, documentId).then(({ item: loaded }) => setItem(loaded)).catch((err: Error) => setError(err.message));
  }, [token, documentId]);

  return (
    <Sheet open={Boolean(documentId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
            <div className="min-w-0">
              <SheetTitle className="truncate">{item?.name ?? 'Loading…'}</SheetTitle>
              {item && (
                <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
                  <span>{formatBytes(item.sizeBytes)}</span>·<span>Added by {item.ownerName}</span>·<span>{format(new Date(item.updatedAt), 'MMM d, yyyy')}</span>
                  {item.status === 'ready' && <span className="inline-flex items-center gap-1 text-primary"><Sparkles className="h-3 w-3" />{item.chunkCount} AI passages</span>}
                </SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {!item && !error && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {item?.statusMessage && <p className="mb-4 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">{item.statusMessage}</p>}
          {item?.content && <pre id="kb-preview-content" className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{item.content}</pre>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
