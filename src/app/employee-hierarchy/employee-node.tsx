'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TreeNode } from '@/lib/hierarchy';
import { cn } from '@/lib/utils';

const LINE = 'bg-border';

interface EmployeeNodeProps {
  node: TreeNode;
  currentUserEmail?: string | null;
  query: string;
  depth?: number;
}

function countReports(node: TreeNode): number {
  return node.children.reduce((total, child) => total + 1 + countReports(child), 0);
}

export default function EmployeeNode({ node, currentUserEmail, query, depth = 0 }: EmployeeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isCurrentUser = node.email === currentUserEmail;
  const normalizedQuery = query.trim().toLowerCase();
  const isMatch =
    normalizedQuery.length > 0 &&
    (node.name.toLowerCase().includes(normalizedQuery) || node.role.toLowerCase().includes(normalizedQuery));
  const isDimmed = normalizedQuery.length > 0 && !isMatch;
  const hasChildren = node.children.length > 0;
  const totalReports = countReports(node);

  return (
    <div className="flex flex-col items-center">
      <div
        id={`hierarchy-node-${node.id}`}
        className={cn(
          'relative z-10 w-56 rounded-xl border bg-card p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
          depth === 0 && 'border-primary/30 shadow-md shadow-primary/10',
          isCurrentUser && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isMatch && 'border-primary ring-4 ring-primary/20',
          isDimmed && 'opacity-40'
        )}
      >
        {depth === 0 && <span className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-primary to-accent" />}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            <Image src={node.avatarUrl} alt={node.name} width={40} height={40} data-ai-hint={node.dataAiHint} />
            <AvatarFallback>{node.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
              <span className="truncate">{node.name}</span>
              {isCurrentUser && (
                <span className="rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">You</span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{node.role}</p>
          </div>
        </div>
        {hasChildren && (
          <button
            type="button"
            id={`hierarchy-node-${node.id}-toggle`}
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}'s team`}
            className="absolute -bottom-3 left-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border bg-background px-2 text-[11px] font-medium text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            {totalReports}
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
                    <span
                      className={cn('absolute top-0 h-px', LINE, isFirst ? 'left-1/2 right-0' : isLast ? 'left-0 right-1/2' : 'inset-x-0')}
                    />
                  )}
                  <div className={cn('h-6 w-px', LINE)} />
                  <EmployeeNode node={child} currentUserEmail={currentUserEmail} query={query} depth={depth + 1} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
