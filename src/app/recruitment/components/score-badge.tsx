import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Candidate } from '../store';

export function ScoreRing({ score }: { score: number }) {
  const tone = score >= 75 ? 'text-green-600 border-green-500/40 bg-green-500/10' : score >= 50 ? 'text-amber-600 border-amber-500/40 bg-amber-500/10' : 'text-red-600 border-red-500/40 bg-red-500/10';
  return <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold', tone)}>{Math.round(score)}</span>;
}

const REC: Record<Candidate['recommendation'], { label: string; className: string }> = {
  advance: { label: 'Advance', className: 'bg-green-600 hover:bg-green-600' },
  maybe: { label: 'Maybe', className: 'bg-amber-500 hover:bg-amber-500' },
  decline: { label: 'Not a fit', className: 'bg-red-600 hover:bg-red-600' },
};

export function RecommendationBadge({ value }: { value: Candidate['recommendation'] }) {
  return <Badge className={REC[value].className}>{REC[value].label}</Badge>;
}
