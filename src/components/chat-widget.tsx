'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Home, MessageSquare, HelpCircle, Search, ExternalLink, ChevronRight, Send, ChevronDown } from 'lucide-react';
import Logo from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex flex-col items-end",
      // When closed, the entire container is non-interactive.
      !isOpen && "pointer-events-none"
    )}>
      {/* Chat Widget Window */}
      <div
        className={cn(
          "transition-[opacity,transform] duration-300 ease-in-out origin-bottom-right",
          isOpen
            // When open, it's visible and interactive.
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            // When closed, it's invisible. The parent div handles pointer-events.
            : "opacity-0 translate-y-4 scale-95"
        )}
      >
        <div className="w-[350px] h-[calc(100vh-100px)] max-h-[700px] bg-neutral-50 dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-2 border border-border">
            {/* Header */}
            <div className="flex-shrink-0 h-48 bg-gradient-to-br from-primary to-accent p-6 flex flex-col justify-between text-primary-foreground">
                <div>
                    <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center">
                      <Logo className="h-6 w-6 text-white" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold leading-tight">Hi there 👋,</h2>
                    <h2 className="text-3xl font-bold leading-tight">How can we help?</h2>
                </div>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-3 space-y-2 bg-secondary/30 dark:bg-secondary/20">
                <div className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80">
                    <div>
                        <p className="font-semibold text-card-foreground">Send us a message</p>
                        <p className="text-sm text-muted-foreground">We typically reply in a few minutes</p>
                    </div>
                    <Button size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90 rounded-full flex-shrink-0">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border/80 space-y-3">
                    <p className="font-semibold text-card-foreground">Search for help</p>
                    <div className="relative">
                        <Input placeholder="Search..." className="pr-10 bg-secondary/50 dark:bg-secondary/30" />
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

                 <Link href="#" className="bg-card rounded-lg p-4 flex justify-between items-center shadow-sm border border-border/80 text-card-foreground hover:text-primary">
                    <span className="font-semibold">Book Demo</span>
                    <ExternalLink className="h-5 w-5" />
                </Link>
            </div>

            {/* Footer Nav */}
            <div className="flex-shrink-0 border-t flex justify-around items-center p-2 bg-card">
                <button 
                  onClick={() => setActiveTab('home')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors",
                    activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}>
                    <Home className="h-6 w-6" />
                    <span className="text-xs font-semibold">Home</span>
                </button>
                 <button 
                  onClick={() => setActiveTab('messages')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors",
                    activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}>
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-xs font-semibold">Messages</span>
                </button>
                 <button 
                  onClick={() => setActiveTab('help')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg w-20 transition-colors",
                    activeTab === 'help' ? 'text-primary' : 'text-muted-foreground hover:bg-secondary'
                  )}>
                    <HelpCircle className="h-6 w-6" />
                    <span className="text-xs font-semibold">Help</span>
                </button>
            </div>
        </div>
      </div>

      {/* FAB - The button itself is always interactive */}
      <Button
        size="icon"
        className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg pointer-events-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
      </Button>
    </div>
  );
}
