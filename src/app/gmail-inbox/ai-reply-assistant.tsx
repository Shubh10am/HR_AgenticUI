'use client';

import { ChevronDown, Loader2, MessageSquareText, Sparkles, Wand2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface ReplyIntent {
  id: string;
  label: string;
  prompt: string;
}

export const REPLY_INTENTS: ReplyIntent[] = [
  { id: 'acknowledge', label: 'Acknowledge', prompt: 'Politely acknowledge this email and confirm we have received it.' },
  { id: 'details', label: 'Ask for details', prompt: 'Reply asking for any missing details we need to act on this email.' },
  { id: 'meeting', label: 'Propose a meeting', prompt: 'Reply proposing a short meeting to discuss this, asking for their availability.' },
  { id: 'decline', label: 'Decline politely', prompt: 'Politely decline the request in this email and thank them.' },
];

interface AiReplyAssistantProps {
  senderName: string;
  isBusy: boolean;
  activeIntentId: string | null;
  isHighlighted?: boolean;
  onIntent: (intent: ReplyIntent) => void;
  onGenerateOptions: () => void;
  onCustomPrompt: () => void;
}

/** Compact AI reply toolbar that sits above the open email, so the message stays in view. */
export default function AiReplyAssistant({ senderName, isBusy, activeIntentId, isHighlighted, onIntent, onGenerateOptions, onCustomPrompt }: AiReplyAssistantProps) {
  const activeIntent = REPLY_INTENTS.find((intent) => intent.id === activeIntentId);
  return (
    <div
      id="gmail-ai-assistant"
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-gradient-to-r from-primary/[0.08] to-accent/[0.08] p-0.5 transition-shadow duration-500 sm:gap-1.5 sm:p-1 2xl:pl-3',
        isHighlighted && 'shadow-[0_0_0_4px_hsl(var(--primary)/0.25)]'
      )}
    >
      <span className="hidden items-center gap-1.5 text-xs font-semibold text-primary 2xl:flex" title={`Draft a reply to ${senderName}; you review it before anything is sent.`}>
        <Sparkles className="h-3.5 w-3.5" /> AI Reply
      </span>

      <Button id="gmail-ai-options" size="sm" onClick={onGenerateOptions} disabled={isBusy} className="h-7 shrink-0 gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 text-xs shadow-sm shadow-primary/30 hover:opacity-90 sm:h-8 sm:text-sm [&_svg]:size-3.5">
        {isBusy && !activeIntentId ? <Loader2 className="animate-spin" /> : <Wand2 />}
        <span className="2xl:hidden">AI replies</span>
        <span className="hidden 2xl:inline">Generate AI Reply Options</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button id="gmail-ai-intents" size="sm" aria-label="One-click reply" variant="outline" disabled={isBusy} className="h-7 shrink-0 gap-1 rounded-full border-primary/25 bg-background/80 px-2.5 text-xs hover:border-primary/50 hover:text-primary sm:h-8 sm:text-sm [&_svg]:size-3.5">
            {activeIntent ? <Loader2 className="animate-spin" /> : <Zap />}
            <span className="max-w-[7rem] truncate empty:hidden">{activeIntent ? activeIntent.label : <><span className="hidden sm:inline xl:hidden">Quick</span><span className="hidden xl:inline">One-click reply</span></>}</span>
            <ChevronDown className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Draft a reply that…</DropdownMenuLabel>
          {REPLY_INTENTS.map((intent) => (
            <DropdownMenuItem key={intent.id} id={`gmail-ai-intent-${intent.id}`} onSelect={() => onIntent(intent)}>
              {intent.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem id="gmail-quick-reply-menu" onSelect={onCustomPrompt}>
            <MessageSquareText className="mr-2 h-4 w-4" /> Write my own instruction…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button id="gmail-quick-reply" size="sm" variant="ghost" disabled={isBusy} onClick={onCustomPrompt} className="hidden h-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary xl:inline-flex">
        <MessageSquareText /> Quick Reply with AI
      </Button>
    </div>
  );
}
