'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function ConfidenceMeter({
  score,
  threshold = 0.75,
  className,
  label = 'CONFIDENCE',
  isBuilding = false,
}: {
  score: number;
  threshold?: number;
  className?: string;
  label?: string;
  isBuilding?: boolean;
}) {
  const target = useMotionValue(0);
  const spring = useSpring(target, { stiffness: 80, damping: 20 });
  const pct = useTransform(spring, (v) => `${Math.min(100, Math.max(0, v * 100)).toFixed(1)}%`);
  const width = useTransform(spring, (v) => `${Math.min(100, Math.max(0, v * 100))}%`);

  useEffect(() => {
    target.set(score);
  }, [score, target]);

  const passed = score >= threshold;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
        <motion.span
          className={cn(
            'font-mono font-bold tabular-nums',
            'text-[clamp(2rem,4vw,3rem)] leading-none transition-colors',
            passed ? 'text-moixa' : 'text-white',
            isBuilding && 'drop-shadow-[0_0_18px_rgba(0,255,209,0.45)]'
          )}
        >
          {pct}
        </motion.span>
      </div>

      <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-card">
        <motion.div
          style={{ width }}
          className="h-full rounded-full bg-moixa-gradient shadow-[0_0_18px_rgba(0,255,209,0.6)]"
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-warn/80"
          style={{ left: `${threshold * 100}%` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        <span>0%</span>
        <span
          className={cn(
            'transition-colors',
            passed ? 'text-moixa' : 'text-warn'
          )}
          style={{ marginLeft: `${threshold * 100 - 12}%` }}
        >
          {passed ? 'THRESHOLD EXCEEDED' : 'TRADE THRESHOLD'}
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
