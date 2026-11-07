import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

/** One headline figure with a label. */
export default function StatTile({ icon: Icon, label, value, hint, id }: { icon: LucideIcon; label: string; value: React.ReactNode; hint?: string; id?: string }) {
  return (
    <Card id={id} className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold leading-tight">{value}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Card>
  );
}
