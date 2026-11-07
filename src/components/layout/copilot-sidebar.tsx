'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, User, Bot, Lock, BookOpen } from 'lucide-react';
import { fetchKnowledgeContext } from '@/lib/knowledge-client';
import { chatWithCopilot, type CopilotChatInput, type CopilotChatOutput } from '@/ai/flows/copilot-chat-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

interface CopilotSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  avatarUrl?: string;
  avatarFallback: string;
  dataAiHint?: string;
  /** Knowledge-base documents the answer was grounded in. */
  sources?: string[];
}

const COPILOT_STARTERS = ['What needs my attention today?', 'How much leave do I have left?', 'Which courses are due soon?', 'When is my next 1:1?'];

export default function CopilotSidebar({ isOpen, onOpenChange }: CopilotSidebarProps) {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, token } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

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

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>, preset?: string) => {
    if (event) event.preventDefault();
    
    if (isGuest) {
      toast({
        title: "Feature Locked",
        description: "Please log in or register to use the Copilot.",
      });
      return;
    }

    const trimmedInput = (preset ?? userInput).trim();
    if (!trimmedInput) return;

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedInput,
      avatarUrl: `https://placehold.co/40x40.png?text=U`,
      avatarFallback: 'U',
      dataAiHint: 'user avatar'
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const passages = await fetchKnowledgeContext(token, trimmedInput);
      const aiInput: CopilotChatInput = { 
        userInput: trimmedInput, 
        authToken: token,
        userId: user?.id,
        organizationId: user?.organizationId,
        knowledgeContext: passages.map(({ sourceName, text }) => ({ sourceName, text })),
      };
      const result: CopilotChatOutput = await chatWithCopilot(aiInput);
      
      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.aiResponse,
        sources: [...new Set(passages.map((passage) => passage.sourceName))],
        avatarUrl: `https://placehold.co/40x40.png?text=AI`,
        avatarFallback: 'AI',
        dataAiHint: 'robot avatar'
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
        avatarUrl: `https://placehold.co/40x40.png?text=AI`,
        avatarFallback: 'AI',
        dataAiHint: 'robot error'
      };
      setChatHistory(prev => [...prev, errorAiMessage]);
    } finally {
      setIsLoading(false);
      if (inputRef.current) {
          inputRef.current.focus();
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full flex flex-col p-0" side="right">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center text-lg">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            HR Streamline Copilot
          </SheetTitle>
          <SheetDescription className="text-xs">
            Ask questions or get assistance.
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          {isGuest ? (
             <div className="text-center text-muted-foreground py-10 h-full flex flex-col items-center justify-center">
              <Lock className="h-10 w-10 text-primary mb-4" />
              <p className="font-semibold text-lg mb-2">Feature Locked</p>
              <p className="text-sm mb-4">
                Please log in or register to use the HR Copilot.
              </p>
              <div className="flex gap-4">
                <Button asChild size="sm" onClick={() => onOpenChange(false)}>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button asChild variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-10">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Ask about your leave, approvals, 1:1s, courses or company policies.
                  </p>
                  <div className="mt-4 flex flex-col items-stretch gap-2 px-2">
                    {COPILOT_STARTERS.map((starter, i) => (
                      <Button key={starter} id={`copilot-starter-${i}`} variant="outline" size="sm" className="h-auto justify-start whitespace-normal py-2 text-left" onClick={() => void handleSendMessage(undefined, starter)}>
                        {starter}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map(message => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2.5 ${
                    message.sender === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-7 w-7 border flex-shrink-0">
                      <AvatarImage src={message.avatarUrl} alt="AI Avatar" data-ai-hint={message.dataAiHint} />
                      <AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    }`}
                  >
                    {message.text.split('\n').map((line, i, arr) => (
                      <span key={i}>
                        {line}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                    {message.sources && message.sources.length > 0 && (
                      <span className="mt-2 flex flex-wrap items-center gap-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> From your knowledge base:
                        {message.sources.map((source) => (
                          <span key={source} className="rounded-full bg-background px-2 py-0.5 font-medium text-foreground/80">{source}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="h-7 w-7 border flex-shrink-0">
                       <AvatarImage src={message.avatarUrl} alt="User Avatar" data-ai-hint={message.dataAiHint} />
                      <AvatarFallback><User className="h-3 w-3" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-end gap-2.5">
                  <Avatar className="h-7 w-7 border flex-shrink-0">
                    <AvatarImage src="https://placehold.co/40x40.png?text=AI" alt="AI Avatar" data-ai-hint="robot avatar" />
                    <AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-bl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        
        <SheetFooter className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={isGuest ? "Log in to use Copilot" : "Ask Copilot..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 h-9"
              disabled={isLoading || isGuest}
              autoComplete="off"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-9 w-9" 
              disabled={isLoading || !userInput.trim() || isGuest}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
