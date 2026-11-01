'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogFilters, LogResult } from '../types';

interface FacetOption {
  value: string;
  label: string;
  sublabel?: string;
  count?: number;
}

function FacetGroup({ title, filterKey, options, filters, onChange }: {
  title: string;
  filterKey: keyof LogFilters;
  options: FacetOption[];
  filters: LogFilters;
  onChange: (key: keyof LogFilters, value: string) => void;
}) {
  if (options.length === 0) return null;
  const selected = filters[filterKey];
  return (
    <div>
      <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="max-h-56 space-y-0.5 overflow-y-auto">
        {options.map((option) => {
          const isActive = selected === option.value;
          return (
            <li key={option.value}>
              <button
                type="button"
                id={`admin-logs-facet-${filterKey}-${option.value}`}
                onClick={() => onChange(filterKey, isActive ? '' : option.value)}
                aria-pressed={isActive}
                className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted', isActive && 'bg-primary/10 text-primary')}
              >
                <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', isActive && 'border-primary bg-primary text-primary-foreground')}>
                  {isActive && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.label}</span>
                  {option.sublabel && <span className="block truncate text-xs text-muted-foreground">{option.sublabel}</span>}
                </span>
                {option.count !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Left-hand filter panel: one group per attribute, with counts for the current search. */
export default function LogFacets({ facets, filters, onChange }: { facets: LogResult['facets'] | undefined; filters: LogFilters; onChange: (key: keyof LogFilters, value: string) => void }) {
  return (
    <div className="space-y-5">
      <FacetGroup title="Result" filterKey="outcome" filters={filters} onChange={onChange} options={[{ value: 'success', label: 'Succeeded' }, { value: 'failure', label: 'Failed' }]} />
      <FacetGroup title="Status code" filterKey="status" filters={filters} onChange={onChange} options={['2xx', '4xx', '5xx'].map((value) => ({ value, label: value }))} />
      <FacetGroup title="Method" filterKey="method" filters={filters} onChange={onChange} options={['POST', 'PUT', 'PATCH', 'DELETE'].map((value) => ({ value, label: value }))} />
      <FacetGroup title="Organization" filterKey="organizationId" filters={filters} onChange={onChange} options={(facets?.organizations ?? []).map((org) => ({ value: org.id, label: org.name, count: org.count }))} />
      <FacetGroup title="Category" filterKey="category" filters={filters} onChange={onChange} options={(facets?.categories ?? []).map((category) => ({ value: category.name, label: category.name, count: category.count }))} />
      <FacetGroup title="User" filterKey="actorId" filters={filters} onChange={onChange} options={(facets?.users ?? []).map((user) => ({ value: user.id, label: user.name, sublabel: user.email, count: user.count }))} />
    </div>
  );
}
