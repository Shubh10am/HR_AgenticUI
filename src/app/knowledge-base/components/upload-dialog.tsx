'use client';

import { useRef, useState, type DragEvent } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, ShieldAlert, UploadCloud, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SUPPORTED_EXTENSIONS, extractTextFromFile, formatBytes, knowledgeApi } from '@/lib/knowledge-client';
import { cn } from '@/lib/utils';

type UploadState = 'queued' | 'reading' | 'indexing' | 'done' | 'warning' | 'error';

interface UploadEntry {
  key: string;
  file: File;
  state: UploadState;
  message?: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  parentId: string | null;
  folderName: string;
  onUploaded: () => void;
}

const STATE_LABEL: Record<UploadState, string> = {
  queued: 'Waiting',
  reading: 'Reading text…',
  indexing: 'Indexing for AI…',
  done: 'Ready',
  warning: 'Saved, AI indexing failed',
  error: 'Failed',
};

/** Drag-and-drop upload that extracts text in the browser and indexes each file for AI search. */
export default function UploadDialog({ open, onOpenChange, token, parentId, folderName, onUploaded }: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const updateEntry = (key: string, changes: Partial<UploadEntry>) =>
    setEntries((current) => current.map((entry) => (entry.key === key ? { ...entry, ...changes } : entry)));

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const added = Array.from(files).map((file) => ({ key: `${file.name}-${file.size}-${file.lastModified}`, file, state: 'queued' as UploadState }));
    setEntries((current) => [...current, ...added.filter((entry) => !current.some((existing) => existing.key === entry.key))]);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const uploadAll = async () => {
    setIsUploading(true);
    for (const entry of entries.filter((item) => item.state === 'queued')) {
      try {
        updateEntry(entry.key, { state: 'reading' });
        const { text, mimeType } = await extractTextFromFile(entry.file);
        updateEntry(entry.key, { state: 'indexing' });
        const { item } = await knowledgeApi.createDocument(token, { name: entry.file.name, content: text, mimeType, sizeBytes: entry.file.size, parentId });
        updateEntry(entry.key, item.status === 'failed' ? { state: 'warning', message: item.statusMessage } : { state: 'done' });
      } catch (error) {
        updateEntry(entry.key, { state: 'error', message: error instanceof Error ? error.message : 'Upload failed.' });
      }
    }
    setIsUploading(false);
    onUploaded();
  };

  const close = (nextOpen: boolean) => {
    if (isUploading) return;
    if (!nextOpen) setEntries([]);
    onOpenChange(nextOpen);
  };

  const hasQueued = entries.some((entry) => entry.state === 'queued');

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>Adding to <span className="font-medium text-foreground">{folderName}</span>. PDF, Word (.docx), TXT or Markdown, up to 10 MB each.</DialogDescription>
        </DialogHeader>

        <div
          id="kb-upload-dropzone"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/50'
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UploadCloud className="h-6 w-6" /></span>
          <p className="mt-3 text-sm font-medium">Drop files here or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">{SUPPORTED_EXTENSIONS.join(' · ')}</p>
          <input ref={inputRef} id="kb-upload-input" type="file" multiple accept={SUPPORTED_EXTENSIONS.join(',')} className="hidden" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        </div>

        <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Upload policies, handbooks and guides only. Do not upload individual employee records, medical or health information, or other personal data.
        </p>

        {entries.length > 0 && (
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.key} className="flex items-center gap-3 rounded-lg border p-2.5">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.file.name}</p>
                  <p className={cn('truncate text-xs', entry.state === 'error' ? 'text-destructive' : entry.state === 'warning' ? 'text-amber-600' : 'text-muted-foreground')}>
                    {formatBytes(entry.file.size)} · {entry.message ?? STATE_LABEL[entry.state]}
                  </p>
                </div>
                {(entry.state === 'reading' || entry.state === 'indexing') && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {entry.state === 'done' && <CheckCircle2 className="h-4 w-4 text-success" />}
                {entry.state === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {entry.state === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button id="kb-upload-cancel" type="button" variant="outline" onClick={() => close(false)} disabled={isUploading}>
            {hasQueued ? 'Cancel' : 'Close'}
          </Button>
          <Button id="kb-upload-submit" type="button" onClick={uploadAll} disabled={isUploading || !hasQueued}>
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />} Upload {entries.filter((e) => e.state === 'queued').length || ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
