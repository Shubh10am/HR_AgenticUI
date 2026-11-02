'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronsDownUp, ChevronsUpDown, Layers, Loader2, Minus, Plus, RotateCcw, Search, UserCog, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageHeader from '@/components/page-header';
import GuestSampleNotice from '@/components/guest-sample-notice';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { isGuestToken } from '@/lib/guest-demo';
import { ancestorsOf, buildForest, collectStats, demoOrgPeople, matchingIds, type OrgPerson } from '@/lib/hierarchy';
import EmployeeNode, { type NodeViewState } from './employee-node';
import PersonAvatar from '@/components/person-avatar';
import PersonSheet from './person-sheet';

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
const ALL_DEPARTMENTS = 'all';

export default function EmployeeHierarchyPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const isGuest = isGuestToken(token);

  const [people, setPeople] = useState<OrgPerson[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState(ALL_DEPARTMENTS);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (isGuest) {
      setPeople(demoOrgPeople());
      setCanEdit(true); // Guests can rearrange the sample; nothing is saved.
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/hierarchy', { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not load the org chart.');
      setPeople(body.people);
      setCanEdit(Boolean(body.canEdit));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load the org chart.');
    } finally {
      setLoading(false);
    }
  }, [isGuest, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const forest = useMemo(() => buildForest(people), [people]);
  const stats = useMemo(() => collectStats(forest), [forest]);
  const charted = forest.filter((root) => root.children.length > 0);
  const unplaced = forest.filter((root) => root.children.length === 0);
  const departments = useMemo(() => [...new Set(people.map((person) => person.department).filter(Boolean))].sort(), [people]);

  // Search and the department filter highlight their people, open the branches above them and dim the rest.
  const search = useMemo(() => {
    const hasQuery = query.trim().length > 0;
    const hasDepartment = department !== ALL_DEPARTMENTS;
    if (!hasQuery && !hasDepartment) return { active: false, matches: new Set<string>(), visible: new Set<string>() };
    const queried = hasQuery ? matchingIds(people, query) : null;
    const found = people.filter((person) => (!queried || queried.has(person.id)) && (!hasDepartment || person.department === department));
    return { active: true, matches: new Set(found.map((person) => person.id)), visible: ancestorsOf(people, found) };
  }, [people, query, department]);

  // Wide charts open centred on the top of the organization rather than at the left edge.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!loading && canvas) canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2;
  }, [loading]);

  // Bring the first match into view as the user types.
  useEffect(() => {
    const first = [...search.matches][0];
    if (!first) return;
    const timer = setTimeout(() => document.getElementById(`hierarchy-node-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }), 150);
    return () => clearTimeout(timer);
  }, [search]);

  const view: NodeViewState = {
    currentUserEmail: user?.email,
    selectedId,
    collapsed,
    search,
    onSelect: setSelectedId,
    onToggle: (id) =>
      setCollapsed((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
  };

  const collapseAll = () => setCollapsed(new Set(people.filter((person) => people.some((other) => other.managerId === person.id)).map((person) => person.id)));
  const zoomBy = (delta: number) => setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 10) / 10)));
  const resetView = () => {
    setZoom(1);
    setQuery('');
    setDepartment(ALL_DEPARTMENTS);
    setCollapsed(new Set());
  };

  const savePosition = async (id: string, change: { managerId: string | null; jobTitle: string }): Promise<string | null> => {
    if (!isGuest) {
      const response = await fetch(`/api/hierarchy/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(change),
      });
      if (!response.ok) return (await response.json().catch(() => ({}))).error ?? 'Could not save the change.';
    }
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, ...change } : person)));
    toast({ title: 'Org chart updated', description: isGuest ? 'Sample data only — sign in to edit your real org chart.' : undefined });
    return null;
  };

  // Drag the empty canvas to pan around large charts; Ctrl/⌘ + scroll zooms.
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[role="button"],button') || !canvasRef.current) return;
    drag.current = { x: event.clientX, y: event.clientY, left: canvasRef.current.scrollLeft, top: canvasRef.current.scrollTop };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !canvasRef.current) return;
    canvasRef.current.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    canvasRef.current.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };
  const onWheel = (event: React.WheelEvent) => {
    if (event.ctrlKey || event.metaKey) zoomBy(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  };

  const statTiles: { id: string; label: string; value: number; icon: LucideIcon }[] = [
    { id: 'people', label: 'People', value: stats.people, icon: Users },
    { id: 'managers', label: 'Managers', value: stats.managers, icon: UserCog },
    { id: 'levels', label: 'Levels', value: charted.length > 0 ? stats.levels : 0, icon: Layers },
    { id: 'unplaced', label: 'Not on the chart yet', value: unplaced.length, icon: UserPlus },
  ];

  const selected = people.find((person) => person.id === selectedId) ?? null;

  return (
    <>
      <PageHeader title="Employee Hierarchy" description="See who reports to whom, find anyone fast, and keep reporting lines up to date." />
      {isGuest && <GuestSampleNotice what="the org chart" />}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <Card key={tile.id} id={`hierarchy-stat-${tile.id}`} className="flex items-center gap-4 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <tile.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none">{loading ? '–' : tile.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="relative h-[calc(100vh-20rem)] min-h-[460px] overflow-hidden">
        {/* Toolbar */}
        <div className="absolute inset-x-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hierarchy-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a person, title or email"
                className="h-10 rounded-xl bg-background/90 pl-9 shadow-sm backdrop-blur"
              />
            </div>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger id="hierarchy-department-filter" className="h-10 w-48 rounded-xl bg-background/90 shadow-sm backdrop-blur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DEPARTMENTS}>All departments</SelectItem>
                {departments.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {search.active && (
              <span id="hierarchy-match-count" className="rounded-full border bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                {search.matches.size} {search.matches.size === 1 ? 'match' : 'matches'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl border bg-background/90 p-1 shadow-sm backdrop-blur">
            <Button id="hierarchy-expand-all" variant="ghost" size="icon" className="h-8 w-8" aria-label="Expand all teams" title="Expand all" onClick={() => setCollapsed(new Set())}>
              <ChevronsUpDown />
            </Button>
            <Button id="hierarchy-collapse-all" variant="ghost" size="icon" className="h-8 w-8" aria-label="Collapse all teams" title="Collapse all" onClick={collapseAll}>
              <ChevronsDownUp />
            </Button>
            <span className="mx-1 h-5 w-px bg-border" />
            <Button id="hierarchy-zoom-out" variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom out" onClick={() => zoomBy(-ZOOM_STEP)}>
              <Minus />
            </Button>
            <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button id="hierarchy-zoom-in" variant="ghost" size="icon" className="h-8 w-8" aria-label="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
              <Plus />
            </Button>
            <span className="mx-1 h-5 w-px bg-border" />
            <Button id="hierarchy-zoom-reset" variant="ghost" size="icon" className="h-8 w-8" aria-label="Reset view" title="Reset view" onClick={resetView}>
              <RotateCcw />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          id="hierarchy-canvas"
          className="h-full w-full cursor-grab select-none overflow-auto bg-secondary/30 bg-dot-grid active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
          onWheel={onWheel}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading org chart…
            </div>
          ) : loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-sm">
              <p className="text-destructive">{loadError}</p>
              <Button variant="outline" onClick={load}>
                Try again
              </Button>
            </div>
          ) : charted.length === 0 ? (
            <div id="hierarchy-empty" className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <UserCog className="h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">No reporting lines yet</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {canEdit ? 'Pick someone below and set who they report to — the chart builds itself as you go.' : 'Ask an Admin or HR to set who reports to whom.'}
              </p>
            </div>
          ) : (
            <div className="inline-block min-w-full px-10 pb-16 pt-24" style={{ zoom }}>
              <div className="flex items-start justify-center gap-16">
                {charted.map((root) => (
                  <EmployeeNode key={root.id} node={root} view={view} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {!loading && unplaced.length > 0 && (
        <Card id="hierarchy-unplaced" className="mt-6 p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Not on the chart yet ({unplaced.length})</h2>
            <p className="text-xs text-muted-foreground">
              {canEdit ? 'No manager and no reports. Click someone to set who they report to.' : 'These people have no manager or reports set yet.'}
            </p>
          </div>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {unplaced.map((person) => (
              <button
                key={person.id}
                type="button"
                id={`hierarchy-unplaced-${person.id}`}
                onClick={() => setSelectedId(person.id)}
                className={`flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm transition-colors hover:border-primary/40 ${search.active && !search.matches.has(person.id) ? 'opacity-40' : ''}`}
              >
                <PersonAvatar person={person} className="h-7 w-7 text-[11px]" />
                {person.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      <PersonSheet person={selected} people={people} canEdit={canEdit} onClose={() => setSelectedId(null)} onSelect={setSelectedId} onSave={savePosition} />
    </>
  );
}
