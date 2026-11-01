'use client';

import { useState, useMemo } from 'react';
import { Layers, Minus, Plus, RotateCcw, Search, UserCog, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { generateMockHierarchy, type TreeNode } from '@/lib/hierarchy';
import EmployeeNode from './employee-node';

interface OrgStats {
  people: number;
  managers: number;
  levels: number;
}

function collectStats(node: TreeNode, depth = 1): OrgStats {
  return node.children.reduce<OrgStats>(
    (stats, child) => {
      const childStats = collectStats(child, depth + 1);
      return {
        people: stats.people + childStats.people,
        managers: stats.managers + childStats.managers,
        levels: Math.max(stats.levels, childStats.levels),
      };
    },
    { people: 1, managers: node.children.length > 0 ? 1 : 0, levels: depth }
  );
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export default function EmployeeHierarchyPage() {
  const { user } = useAuth();
  // In a real app, you would fetch real hierarchy data here
  const hierarchyData = useMemo(() => generateMockHierarchy(), []);
  const stats = useMemo(() => collectStats(hierarchyData), [hierarchyData]);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState('');

  const statTiles: { id: string; label: string; value: number; icon: LucideIcon }[] = [
    { id: 'people', label: 'People', value: stats.people, icon: Users },
    { id: 'managers', label: 'Managers', value: stats.managers, icon: UserCog },
    { id: 'levels', label: 'Levels', value: stats.levels, icon: Layers },
  ];

  return (
    <>
      <PageHeader title="Employee Hierarchy" description="Visualize the reporting structure of your organization." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {statTiles.map((tile) => (
          <Card key={tile.id} id={`hierarchy-stat-${tile.id}`} className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <tile.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{tile.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="relative h-[calc(100vh-20rem)] min-h-[420px] overflow-hidden">
        {/* Toolbar */}
        <div className="absolute inset-x-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="hierarchy-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a person or role"
              className="h-10 rounded-xl bg-background/90 pl-9 shadow-sm backdrop-blur"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border bg-background/90 p-1 shadow-sm backdrop-blur">
            <Button id="hierarchy-zoom-out" variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM))}>
              <Minus />
            </Button>
            <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button id="hierarchy-zoom-in" variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))}>
              <Plus />
            </Button>
            <span className="mx-1 h-5 w-px bg-border" />
            <Button id="hierarchy-zoom-reset" variant="ghost" size="icon" className="h-8 w-8" aria-label="Reset zoom" onClick={() => setZoom(1)}>
              <RotateCcw />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="h-full w-full overflow-auto bg-secondary/30 bg-dot-grid">
          <div className="inline-block min-w-full px-10 pb-16 pt-24" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="flex justify-center">
              <EmployeeNode node={hierarchyData} currentUserEmail={user?.email} query={query} />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
