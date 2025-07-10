
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, MessageSquare, HelpCircle, Search, ExternalLink, ChevronRight, Send, ChevronDown, Bot, User, Loader2, Lock } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { chatWithCopilot, type CopilotChatInput, type CopilotChatOutput } from '@/ai/flows/copilot-chat-flow';
import { useAuth } from '@/contexts/auth-context';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  avatarUrl?: string;
  avatarFallback: string;
  dataAiHint?: string;
}

const guestWelcomeMessage: ChatMessage = {
    id: 'ai-guest-welcome',
    sender: 'ai',
    text: "Welcome to HR Streamline AI! I'm the copilot, here to help. This is an all-in-one platform to assist with recruitment, email drafting, attendance, and more. Feel free to ask me anything about the platform's features!",
    avatarUrl: 'https://placehold.co/40x40.png?text=AI',
    avatarFallback: 'AI',
    dataAiHint: 'robot avatar'
};


export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isGuest = !user || user.organizationId === 'guest-org-id';

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        if (activeTab === 'messages') {
            inputRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [chatHistory]);

  const handleOpenMessagesTab = () => {
    setActiveTab('messages');
    if (isGuest && chatHistory.length === 0) {
        setChatHistory([guestWelcomeMessage]);
    }
  }

  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

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
        userInput: isGuest ? `The user is a guest. Please answer their question about the platform: "${trimmedInput}"` : trimmedInput,
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

  const renderHomeContent = () => (
    <div className="space-y-2">
        <div className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80">
            <div>
                <p className="font-semibold text-card-foreground">Send us a message</p>
                <p className="text-sm text-muted-foreground">We typically reply in a few minutes</p>
            </div>
            <Button size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 rounded-full flex-shrink-0" onClick={handleOpenMessagesTab}>
                <Send className="h-4 w-4" />
            </Button>
        </div>
        
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border/80 space-y-3">
            <p className="font-semibold text-card-foreground">Search for help</p>
            <div className="relative">
                <Input placeholder="Search..." className="pr-10" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
             <Link href="#" className="flex justify-between items-center text-sm text-card-foreground hover:text-primary">
                <span>How to add a new employee?</span>
                <ChevronRight className="h-4 w-4" />
            </Link>
        </div>

        <Link href="#" className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80 text-card-foreground hover:text-primary">
            <span className="font-semibold">Docs</span>
            <ExternalLink className="h-5 w-5" />
        </Link>

        <Link href="#" className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80 text-card-foreground hover:text-primary">
            <span className="font-semibold">Install Videos</span>
            <ExternalLink className="h-5 w-5" />
        </Link>

         <Link href="/book-a-demo" className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80 text-card-foreground hover:text-primary">
            <span className="font-semibold">Book Demo</span>
            <ExternalLink className="h-5 w-5" />
        </Link>
    </div>
  );

  const renderMessagesContent = () => (
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-grow p-1 pr-4 -mr-3" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-10">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet. Start a conversation!</p>
              </div>
            )}
            {chatHistory.map(message => (
              <div key={message.id} className={`flex items-end gap-2.5 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'ai' && (
                  <Avatar className="h-7 w-7 border flex-shrink-0"><AvatarImage src={message.avatarUrl} alt="AI Avatar" data-ai-hint={message.dataAiHint} /><AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback></Avatar>
                )}
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'}`}>
                  {message.text}
                </div>
                {message.sender === 'user' && (
                  <Avatar className="h-7 w-7 border flex-shrink-0"><AvatarImage src={message.avatarUrl} alt="User Avatar" data-ai-hint={message.dataAiHint} /><AvatarFallback><User className="h-3 w-3" /></AvatarFallback></Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-end gap-2.5">
                <Avatar className="h-7 w-7 border flex-shrink-0"><AvatarImage src="https://placehold.co/40x40.png?text=AI" alt="AI Avatar" data-ai-hint="robot avatar" /><AvatarFallback><Bot className="h-3 w-3" /></AvatarFallback></Avatar>
                <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-card text-card-foreground rounded-bl-none shadow-sm"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex-shrink-0 pt-3 mt-auto">
          <div className="relative">
            <Input ref={inputRef} type="text" placeholder="Type your message..." value={userInput} onChange={(e) => setUserInput(e.target.value)} disabled={isLoading} className="pr-12" />
            <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={isLoading || !userInput.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </form>
      </div>
  );

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 flex flex-col items-end", !isOpen && "pointer-events-none")}>
      <div className={cn("transition-[opacity,transform] duration-300 ease-in-out origin-bottom-right", isOpen ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-4 scale-95")}>
        <div className="w-[350px] h-[calc(100vh-100px)] max-h-[700px] bg-neutral-50 dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-2 border border-border">
            <div className="flex-shrink-0 h-48 bg-gradient-to-br from-primary to-accent p-6 flex flex-col justify-between text-primary-foreground">
                <div><div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center"><Logo className="h-6 w-6 text-white" /></div></div>
                <div><h2 className="text-3xl font-bold leading-tight">Hi there 👋,</h2><h2 className="text-3xl font-bold leading-tight">How can we help?</h2></div>
            </div>

            <div className="flex-grow overflow-y-auto p-3 bg-secondary/30 dark:bg-secondary/20">
              {activeTab === 'home' && renderHomeContent()}
              {activeTab === 'messages' && renderMessagesContent()}
              {activeTab === 'help' && <div className="text-center text-muted-foreground p-6">Help content goes here.</div>}
            </div>

            <div className="flex-shrink-0 border-t flex justify-around items-center p-2 bg-card">
                <button onClick={() => setActiveTab('home')} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors", activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary')}><Home className="h-6 w-6" /><span className="text-xs font-semibold">Home</span></button>
                <button onClick={handleOpenMessagesTab} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors", activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary')}><MessageSquare className="h-6 w-6" /><span className="text-xs font-semibold">Messages</span></button>
                <button onClick={() => setActiveTab('help')} className={cn("flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors", activeTab === 'help' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary')}><HelpCircle className="h-6 w-6" /><span className="text-xs font-semibold">Help</span></button>
            </div>
        </div>
      </div>
      <Button size="icon" className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg pointer-events-auto" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
      </Button>
    </div>
  );
}
