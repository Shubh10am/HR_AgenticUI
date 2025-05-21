
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
    <div className="mb-6">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight text-foreground", titleClassName)}>{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground">{description}</p>
          )}
        </div>
        {children && <div className="ml-0 sm:ml-4 pt-2 sm:pt-0">{children}</div>}
      </div>
    </div>
  );
}
