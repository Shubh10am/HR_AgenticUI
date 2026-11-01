'use client';

import { useEffect, useState } from 'react';
import { Check, Link2, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Thin bar across the top that fills as the reader scrolls. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return <div className="fixed inset-x-0 top-0 z-[60] h-1 bg-gradient-to-r from-primary to-accent transition-[width] duration-150" style={{ width: `${progress}%` }} aria-hidden />;
}

/** Copy-link and LinkedIn share buttons. */
export function ShareButtons({ title, idPrefix }: { title: string; idPrefix: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="flex items-center gap-2">
      <Button id={`${idPrefix}-copy`} variant="outline" size="sm" className="rounded-full" onClick={copy} aria-label={`Copy link to ${title}`}>
        {isCopied ? <Check /> : <Link2 />} {isCopied ? 'Copied' : 'Copy link'}
      </Button>
      <Button id={`${idPrefix}-linkedin`} variant="outline" size="icon" className="h-9 w-9 rounded-full" onClick={shareOnLinkedIn} aria-label="Share on LinkedIn">
        <Linkedin />
      </Button>
    </div>
  );
}
