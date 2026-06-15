'use client';

import { cn } from '@/lib/utils';

type Tone = 'cyan' | 'orange' | 'red' | 'gray' | 'green';

const colors: Record<Tone, string> = {
  cyan: 'bg-moixa shadow-[0_0_12px_rgba(0,255,209,0.8)]',
  orange: 'bg-warn shadow-[0_0_12px_rgba(245,158,11,0.7)]',
  red: 'bg-loss-red shadow-[0_0_12px_rgba(255,68,68,0.7)]',
  gray: 'bg-muted',
  green: 'bg-win-green shadow-[0_0_12px_rgba(0,255,135,0.7)]',
};

export function LiveDot({
  tone = 'cyan',
  label,
  size = 8,
  className,
}: {
  tone?: Tone;
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider', className)}>
      <span
        className={cn('inline-block rounded-full animate-pulse-dot', colors[tone])}
        style={{ width: size, height: size }}
      />
      {label && <span className="text-muted">{label}</span>}
    </span>
  );
}
