import * as React from 'react';
import { cn } from '@/lib/utils';

function Empty({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center md:p-12',
        className
      )}
      {...props}
    />
  );
}

interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'icon';
}

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: EmptyMediaProps) {
  return (
    <div
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-6 mb-1',
        className
      )}
      {...props}
    />
  );
}

function EmptyTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-foreground tracking-tight', className)}
      {...props}
    />
  );
}

function EmptyDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed', className)}
      {...props}
    />
  );
}

function EmptyContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-2 pt-2', className)}
      {...props}
    />
  );
}

export { Empty, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent };
