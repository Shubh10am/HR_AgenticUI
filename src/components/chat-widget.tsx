
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
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

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
  const isGuest = user?.organizationId === 'guest-org-id';

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
      avatarUrl: `https://placehold.co/40x40.png?text=U`,
      avatarFallback: 'U',
      dataAiHint: 'user avatar'
    };
    setChatHistory(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const userApiKey = localStorage.getItem('userApiKey');
      const aiInput: CopilotChatInput = { 
        userInput: trimmedInput, 
        apiKey: userApiKey,
        userId: user?.id,
        organizationId: user?.organizationId,
       };
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
                    No messages yet. Start a conversation!
                  </p>
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
          )}
        </ScrollArea>
        
        <SheetFooter className="p-4 border-t bg-background">
          <Popover open={isMentionPopoverOpen} onOpenChange={setIsMentionPopoverOpen}>
            <PopoverTrigger asChild>
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                    ref={inputRef}
                    type="text"
                    placeholder={isGuest ? "Log in to use Copilot" : "Ask Copilot..."}
                    value={userInput}
                    onChange={handleInputChange}
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
            </PopoverTrigger>
            <PopoverContent 
                className="w-[300px] p-0" 
                onOpenAutoFocus={(e) => e.preventDefault()}
                side="top"
                align="start"
            >
                <Command>
                <CommandList>
                    {isMentionLoading && <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>}
                    {!isMentionLoading && mentionSuggestions.length === 0 && (
                    <div className="p-2 text-center text-sm text-muted-foreground">No users found.</div>
                    )}
                    <CommandGroup>
                    {mentionSuggestions.map((suggestion) => (
                        <CommandItem key={suggestion._id} onSelect={() => handleSelectMention(suggestion)} value={suggestion.name}>
                        {suggestion.name}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                </Command>
            </PopoverContent>
          </Popover>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
