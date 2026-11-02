'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { subtitleOf, type TreeNode } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';
import PersonAvatar from '@/components/person-avatar';

const LINE = 'bg-border';

export interface NodeViewState {
  currentUserEmail?: string | null;
  selectedId: string | null;
  collapsed: Set<string>;
  /** While searching: matches are highlighted and everything off their paths is dimmed. */
  search: { active: boolean; matches: Set<string>; visible: Set<string> };
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

export default function EmployeeNode({ node, depth = 0, view }: { node: TreeNode; depth?: number; view: NodeViewState }) {
  const isCurrentUser = node.email === view.currentUserEmail;
  const isMatch = view.search.matches.has(node.id);
  const isDimmed = view.search.active && !view.search.visible.has(node.id);
  // A search opens every branch leading to a match.
  const isExpanded = view.search.active ? view.search.visible.has(node.id) || !view.collapsed.has(node.id) : !view.collapsed.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div
        id={`hierarchy-node-${node.id}`}
        role="button"
        tabIndex={0}
        onClick={() => view.onSelect(node.id)}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && (event.preventDefault(), view.onSelect(node.id))}
        className={cn(
          'relative z-10 w-56 cursor-pointer rounded-xl border bg-card p-3 text-left shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary',
          depth === 0 && 'border-primary/30 shadow-md shadow-primary/10',
          isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          view.selectedId === node.id && 'border-primary shadow-lg shadow-primary/20',
          isMatch && 'border-primary ring-4 ring-primary/20',
          isDimmed && 'opacity-40'
        )}
      >
        {depth === 0 && <span className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
        <div className="flex items-center gap-3">
          <PersonAvatar person={node} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="truncate">{node.name}</span>
              {isCurrentUser && <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">You</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{subtitleOf(node)}</p>
          </div>
        </div>
        {hasChildren && (
          <button
            type="button"
            id={`hierarchy-node-${node.id}-toggle`}
            onClick={(event) => {
              event.stopPropagation();
              view.onToggle(node.id);
            }}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}'s team`}
            title={`${node.children.length} direct, ${node.totalReports} in total`}
            className="absolute -bottom-3 left-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-2 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            {node.totalReports}
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <>
          <div className={cn('h-8 w-px', LINE)} />
          <div className="flex">
            {node.children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === node.children.length - 1;
              return (
                <div key={child.id} className="relative flex flex-col items-center px-3">
                  {node.children.length > 1 && (
                    <span className={cn('absolute top-0 h-px', LINE, isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'inset-x-0')} />
                  )}
                  <div className={cn('h-6 w-px', LINE)} />
                  <EmployeeNode node={child} depth={depth + 1} view={view} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
