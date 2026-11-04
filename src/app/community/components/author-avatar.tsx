import { VenetianMask } from 'lucide-react';
import PersonAvatar from '@/components/person-avatar';
import type { FeedPerson } from '@/lib/community';
import { cn } from '@/lib/utils';

/** A colleague's initials, or a mask for anonymous posts. */
export default function AuthorAvatar({ person, className }: { person: FeedPerson | null; className?: string }) {
  if (!person) {
    return (
      <span aria-hidden className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background', className)}>
        <VenetianMask className="h-5 w-5" />
      </span>
    );
  }
  return <PersonAvatar person={person} className={className} />;
}
