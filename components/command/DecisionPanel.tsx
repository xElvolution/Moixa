'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { cn, formatBps } from '@/lib/utils';
import type { Decision } from '@/types';

export function DecisionPanel({ recent }: { recent: Decision[] }) {
  if (!recent.length) {
    return (
      <Card className="p-5 text-center text-muted">
        <p className="font-mono text-xs uppercase tracking-[0.18em]">no decisions yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        recent decisions
      </div>
      <ul>
        {recent.slice(0, 5).map((d, i) => (
          <motion.li
            key={d.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
          >
            <DirectionTag direction={d.decision} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {d.token} ·{' '}
                <span className="font-mono text-muted">
                  {(d.confidenceScore * 100).toFixed(1)}% confidence
                </span>
              </p>
              <p className="font-mono text-[11px] text-muted">
                block #{d.blockNumber?.toLocaleString() ?? '-'}
              </p>
            </div>
            <ReturnPill ret={d.actualReturn ?? null} />
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}

function DirectionTag({ direction }: { direction: Decision['decision'] }) {
  const tone =
    direction === 'LONG'
      ? 'text-win-green border-win-green/40 bg-win-green/10'
      : direction === 'SHORT'
      ? 'text-loss-red border-loss-red/40 bg-loss-red/10'
      : 'text-muted border-border bg-white/5';
  const arrow = direction === 'LONG' ? '▲' : direction === 'SHORT' ? '▼' : '-';
  return (
    <span
      className={cn(
        'inline-flex h-9 w-14 items-center justify-center rounded-md border font-mono text-xs font-bold',
        tone
      )}
    >
      {arrow} {direction}
    </span>
  );
}

function ReturnPill({ ret }: { ret: number | null }) {
  if (ret === null || ret === undefined) {
    return <span className="font-mono text-xs text-muted">-</span>;
  }
  if (ret === 0) {
    return <span className="font-mono text-xs text-muted">FLAT</span>;
  }
  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums',
        ret >= 0 ? 'text-win-green' : 'text-loss-red'
      )}
    >
      {formatBps(ret)}
    </span>
  );
}
