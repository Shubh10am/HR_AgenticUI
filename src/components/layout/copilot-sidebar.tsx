'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Send, User, Bot, Lock } from 'lucide-react';
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
}

export default function CopilotSidebar({ isOpen, onOpenChange }: CopilotSidebarProps) {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isGuest = user?.organizationId === 'guest-org-id';

  useEffect(() => {
    if (isOpen && inputRef.current) { // Focus input if sidebar is open and input exists
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    if (isGuest) {
      toast({
        title: "Login Required",
        description: (
          <div>
            Please{' '}
            <Link href="/login" className="underline" onClick={() => onOpenChange(false)}>
              log in
            </Link> or{' '}
            <Link href="/register" className="underline" onClick={() => onOpenChange(false)}>
              register
            </Link>{' '}
            to use the Copilot.
          </div>
        ),
        variant: "default", // Or a custom variant if you prefer
      });
      setUserInput(''); // Clear input for guest after showing toast
      return;
    }

    const trimmedInput = userInput.trim();
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
      const userApiKey = localStorage.getItem('userApiKey');
      const aiInput: CopilotChatInput = { userInput: trimmedInput, apiKey: userApiKey };
      const result: CopilotChatOutput = await chatWithCopilot(aiInput);
      
      const newAiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: result.aiResponse,
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
      if (inputRef.current) { // Refocus after sending, if not guest (guest path returns early)
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
          <div className="space-y-4">
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-10">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {isGuest
                    ? "Log in or register to use the Copilot."
                    : "No messages yet. Start a conversation!"}
                </p>
                {isGuest && (
                  <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2">
                    <Button size="sm" asChild onClick={() => onOpenChange(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <span className="text-xs text-muted-foreground hidden sm:inline">or</span>
                    <Button size="sm" variant="outline" asChild onClick={() => onOpenChange(false)}>
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
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
        </ScrollArea>
        
        <SheetFooter className="p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder={isGuest ? "Log in or register to chat" : "Ask Copilot..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="flex-1 h-9"
              disabled={isLoading} // Only disable if AI is processing
              autoComplete="off"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-9 w-9" 
              disabled={isLoading || (!isGuest && !userInput.trim())}
            >
              {/* For guests, button is enabled unless isLoading. For auth users, also check for input. */}
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
