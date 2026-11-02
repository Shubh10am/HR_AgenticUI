
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, Loader2, Lock, Sparkles } from 'lucide-react';
import { isGuestToken } from '@/lib/guest-demo';
import { chatWithCopilot, type CopilotChatInput, type CopilotChatOutput } from '@/ai/flows/copilot-chat-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

const SUGGESTIONS = [
  'Summarize our leave policy',
  'Who is on leave this week?',
  'Draft a welcome note for a new joiner',
  'What onboarding tasks are still open?',
];

interface CopilotSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface MentionableUser {
    _id: string;
    name: string;
}

export default function CopilotSidebar({ isOpen, onOpenChange }: CopilotSidebarProps) {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, token } = useAuth();
  // Visitors who aren't signed in, and the sample guest workspace, can't use the live Copilot.
  const isGuest = user?.organizationId === 'guest-org-id' || isGuestToken(token);

  // State for @mentions
  const [isMentionPopoverOpen, setIsMentionPopoverOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionableUser[]>([]);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const currentMentionStartIndex = useRef<number | null>(null);


  useEffect(() => {
    if (isOpen && !isGuest && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isGuest]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);
  
  useEffect(() => {
    if (mentionQuery) {
      setIsMentionLoading(true);
      const timer = setTimeout(async () => {
        try {
          if (!token || isGuest) return;
          const response = await fetch(`/api/employees/search?name=${mentionQuery}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setMentionSuggestions(data);
          } else {
             setMentionSuggestions([]);
          }
        } catch (error) {
          console.error("Failed to fetch mention suggestions", error);
          setMentionSuggestions([]);
        } finally {
          setIsMentionLoading(false);
        }
      }, 300); // Debounce API calls
      return () => clearTimeout(timer);
    } else {
      setMentionSuggestions([]);
    }
  }, [mentionQuery, token, isGuest]);

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    
    if (isGuest) {
      toast({
        title: "Feature Locked",
        description: "Please log in or register to use the Copilot.",
      });
      return;
    }

    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedInput,
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const aiInput: CopilotChatInput = { 
        userInput: trimmedInput, 
        authToken: token,
        userId: user?.id,
        organizationId: user?.organizationId,
       };
      const result: CopilotChatOutput = await chatWithCopilot(aiInput);
      
      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.aiResponse,
      };
      setChatHistory(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error('Error calling copilot chat flow:', error);
      toast({
        title: 'Error',
        description: 'Could not get a response from the copilot. Please try again.',
        variant: 'destructive',
      });
       const errorAiMessage: ChatMessage = {
        id: `ai-error-${Date.now()}`,
        sender: 'ai',
        text: "Sorry, I encountered an issue while trying to respond. Please try again.",
      };
      setChatHistory(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
          inputRef.current.focus();
      }
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    const cursorPosition = e.target.selectionStart || 0;
    const textUpToCursor = value.substring(0, cursorPosition);
    const atIndex = textUpToCursor.lastIndexOf('@');

    if (atIndex !== -1 && (atIndex === 0 || /\s/.test(value[atIndex - 1]))) {
      const query = textUpToCursor.substring(atIndex + 1);
      
      // Check for space after query, if so, close popover
      if (/\s/.test(query)) {
        setIsMentionPopoverOpen(false);
        return;
      }
      
      setMentionQuery(query);
      setIsMentionPopoverOpen(true);
      currentMentionStartIndex.current = atIndex;
    } else {
      setIsMentionPopoverOpen(false);
    }
  };

  const handleSelectMention = (user: MentionableUser) => {
    if (currentMentionStartIndex.current !== null) {
      const start = userInput.substring(0, currentMentionStartIndex.current);
      // The substring to replace is from '@' up to the current mention query length
      const end = userInput.substring(currentMentionStartIndex.current + 1 + mentionQuery.length);
      const newText = `${start}@${user.name} ${end}`;
      
      setUserInput(newText);
      setIsMentionPopoverOpen(false);
      setMentionQuery('');
      setMentionSuggestions([]);
      
      // Focus and move cursor to end of inserted name
      setTimeout(() => {
        const newCursorPos = (start + `@${user.name} `).length;
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };


  const usePrompt = (prompt: string) => {
    setUserInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        id="landing-copilot"
        side="right"
        className="flex w-full flex-col gap-0 border-l border-white/10 bg-[#0b0d17] p-0 text-white sm:max-w-md [&>button:last-child]:right-5 [&>button:last-child]:top-5 [&>button:last-child]:rounded-full [&>button:last-child]:bg-transparent [&>button:last-child]:p-1.5 [&>button:last-child]:text-slate-400 [&>button:last-child]:hover:bg-white/10 [&>button:last-child]:hover:text-white"
      >
        <SheetHeader className="relative space-y-0 overflow-hidden border-b border-white/10 px-5 pb-4 pt-5 text-left">
          <span aria-hidden className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-950/40">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <SheetTitle className="text-base font-semibold tracking-tight text-white">HR Copilot</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${isGuest ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                {isGuest ? 'Sign in to chat with your workspace' : 'Ask about people, policies and your work'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-grow" ref={scrollAreaRef}>
          <div className="space-y-4 px-5 py-6">
            {chatHistory.length === 0 && !isLoading && (
              <div id="landing-copilot-welcome">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Your HR assistant</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">How can I help today?</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-400">
                  Answers draw on your workspace&apos;s knowledge base and records. Review anything important before you act on it.
                </p>
                <div className="mt-5 grid gap-2">
                  {SUGGESTIONS.map((prompt, index) => (
                    <button
                      key={prompt}
                      type="button"
                      id={`landing-copilot-suggestion-${index}`}
                      onClick={() => usePrompt(prompt)}
                      disabled={isGuest}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-[13px] text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-500/10 disabled:cursor-default disabled:opacity-60 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03]"
                    >
                      {prompt}
                      <ArrowUp className="h-3.5 w-3.5 rotate-45 text-slate-500 transition group-hover:text-indigo-300" />
                    </button>
                  ))}
                </div>
                {isGuest && (
                  <div id="landing-copilot-locked" className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 to-violet-500/5 p-4">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Lock className="h-4 w-4 text-indigo-300" /> Copilot works inside your workspace
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">Log in to ask questions about your own team, or create a workspace to get started.</p>
                    <div className="mt-4 flex gap-2">
                      <Button asChild size="sm" className="rounded-full bg-white text-slate-950 hover:bg-slate-200" onClick={() => onOpenChange(false)}>
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => onOpenChange(false)}>
                        <Link href="/register">Create a workspace</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {chatHistory.map((message) =>
              message.sender === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-indigo-600 px-3.5 py-2.5 text-[13px] leading-6 text-white shadow-lg shadow-indigo-950/30">
                    {message.text}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-6 text-slate-200">
                    {message.text}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div className="flex items-start gap-2.5" aria-live="polite">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/10 bg-white/[0.04] px-4 py-3.5">
                  <span className="sr-only">Copilot is thinking</span>
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="block border-t border-white/10 bg-[#0b0d17] px-4 pb-4 pt-3 sm:flex-col sm:space-x-0">
          <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
            <PopoverTrigger asChild>
              <form
                onSubmit={handleSendMessage}
                className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 pl-4 transition focus-within:border-indigo-400/60 focus-within:ring-4 focus-within:ring-indigo-500/15"
              >
                <Input
                  ref={inputRef}
                  id="landing-copilot-input"
                  type="text"
                  placeholder={isGuest ? 'Log in to chat with Copilot' : 'Ask Copilot… use @ to mention someone'}
                  value={userInput}
                  onChange={handleInputChange}
                  className="h-9 flex-1 border-0 bg-transparent p-0 text-[13px] text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isLoading || isGuest}
                  autoComplete="off"
                />
                <Button
                  id="landing-copilot-send"
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-white/10 disabled:text-slate-500 disabled:opacity-100"
                  disabled={isLoading || !userInput.trim() || isGuest}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                  <span className="sr-only">Send</span>
                </Button>
              </form>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] border-white/10 bg-[#141726] p-0 text-white" onOpenAutoFocus={(e) => e.preventDefault()} side="top" align="start">
              <Command className="bg-transparent text-white">
                <CommandList>
                  {isMentionLoading && <div className="p-2 text-center text-sm text-slate-400">Loading…</div>}
                  {!isMentionLoading && mentionSuggestions.length === 0 && <div className="p-2 text-center text-sm text-slate-400">No people found.</div>}
                  <CommandGroup>
                    {mentionSuggestions.map((suggestion) => (
                      <CommandItem key={suggestion._id} onSelect={() => handleSelectMention(suggestion)} value={suggestion.name} className="text-slate-200 aria-selected:bg-white/10 aria-selected:text-white">
                        {suggestion.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="mt-2 text-center text-[10px] text-slate-500">Copilot can make mistakes. Check important answers.</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
