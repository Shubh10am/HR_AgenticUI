
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string | ReactNode;
  description?: string;
  children?: ReactNode;
  titleClassName?: string;
}

export default function PageHeader({ title, description, children, titleClassName }: PageHeaderProps) {
  return (
    <div data-ui-motion="heading" className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h1 className={cn("font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground", titleClassName)}>{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
          )}
        </div>
        {children && <div className="flex-shrink-0">{children}</div>}
      </div>
    </div>
  );
}
