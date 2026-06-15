'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'moixa' | 'mantle' | 'green' | 'red' | 'orange' | 'muted';

const tones: Record<Tone, string> = {
  moixa: 'text-moixa border-moixa/30 bg-moixa/10',
  mantle: 'text-mantle border-mantle/30 bg-mantle/10',
  green: 'text-win-green border-win-green/30 bg-win-green/10',
  red: 'text-loss-red border-loss-red/30 bg-loss-red/10',
  orange: 'text-warn border-warn/30 bg-warn/10',
  muted: 'text-muted border-border bg-white/5',
};

export function Badge({
  tone = 'muted',
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium font-mono',
        tones[tone],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
