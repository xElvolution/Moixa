'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { cn, formatBps } from '@/lib/utils';
import type { Decision } from '@/types';

export function TradeExecutor({ recent }: { recent: Decision[] }) {
  const loop = [...recent, ...recent];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        <span>decision ticker</span>
        <span className="text-moixa"> live</span>
      </div>
      {recent.length === 0 ? (
        <div className="px-5 py-6 text-center font-mono text-xs text-muted">
          Awaiting first on-chain decision…
        </div>
      ) : (
      <div className="relative overflow-hidden py-3">
        <motion.div
          className="flex gap-3 whitespace-nowrap will-change-transform"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        >
          {loop.map((d, i) => (
            <TickerCell key={`${d.id}-${i}`} d={d} />
          ))}
        </motion.div>
      </div>
      )}
    </Card>
  );
}

function TickerCell({ d }: { d: Decision }) {
  const direction = d.decision;
  const ret = d.actualReturn ?? null;
  const colorClass =
    direction === 'FLAT'
      ? 'text-muted border-border'
      : ret !== null && ret >= 0
      ? 'text-win-green border-win-green/30'
      : ret !== null && ret < 0
      ? 'text-loss-red border-loss-red/30'
      : 'text-white border-border';
  const arrow = direction === 'LONG' ? '▲' : direction === 'SHORT' ? '▼' : '-';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md border bg-bg/40 px-3 py-1.5 font-mono text-xs',
        colorClass
      )}
    >
      <span>{arrow}</span>
      <span>
        {direction} {d.token}
      </span>
      <span className="text-muted">·</span>
      <span>
        {direction === 'FLAT'
          ? 'no trade'
          : ret !== null
          ? formatBps(ret)
          : 'open'}
      </span>
    </span>
  );
}
