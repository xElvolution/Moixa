'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-card/80 backdrop-blur-sm',
        'transition-all duration-300 hover:border-border-hover',
        glow && 'shadow-[0_0_36px_-12px_rgba(0,255,209,0.35)]',
        className
      )}
      {...rest}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('p-5 border-b border-border', className)} {...rest} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('p-5', className)} {...rest} />
  )
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={cn('p-5 border-t border-border', className)} {...rest} />
  )
);
CardFooter.displayName = 'CardFooter';
