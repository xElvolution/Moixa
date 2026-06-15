'use client';

import { DecisionCard } from './DecisionCard';
import type { Decision } from '@/types';

export function DecisionTimeline({ decisions }: { decisions: Decision[] }) {
  if (!decisions.length) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-12 text-center font-mono text-sm text-muted">
        No decisions match the current filters.
      </div>
    );
  }
  return (
    <div className="relative space-y-4 pl-6">
      <div className="absolute left-0 top-2 bottom-2 w-px bg-gradient-to-b from-moixa/40 via-border to-transparent" />
      {decisions.map((d) => (
        <div key={d.id} className="relative">
          <span className="absolute -left-[26px] top-5 inline-block h-2.5 w-2.5 rounded-full bg-moixa shadow-[0_0_12px_rgba(0,255,209,0.6)]" />
          <DecisionCard d={d} />
        </div>
      ))}
    </div>
  );
}
