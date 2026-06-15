'use client';

import { Card } from '@/components/ui/Card';
import type { Milestone } from '@/types';

const DEFAULTS: Milestone[] = [
  {
    id: '1',
    type: 'GENESIS',
    description: 'MOIXA came online',
    blockNumber: 8_294_771,
    txHash: '0x' + 'a'.repeat(64),
    achievedAt: '2026-02-01',
    icon: '🎂',
  },
  {
    id: '2',
    type: 'FIRST_DECISION',
    description: 'First decision: LONG ETH',
    blockNumber: 8_294_785,
    txHash: '0x' + 'b'.repeat(64),
    achievedAt: '2026-02-01',
    icon: '📊',
  },
  {
    id: '3',
    type: 'TEN_DECISIONS',
    description: '10 decisions, 70% accuracy in first 10',
    blockNumber: 8_295_120,
    txHash: '0x' + 'c'.repeat(64),
    achievedAt: '2026-02-04',
    icon: '🏆',
  },
  {
    id: '4',
    type: 'TEN_K_VOLUME',
    description: '$10K volume threshold — reputation 612',
    blockNumber: 8_297_400,
    txHash: '0x' + 'd'.repeat(64),
    achievedAt: '2026-02-12',
    icon: '💰',
  },
  {
    id: '5',
    type: 'WIN_RATE_65',
    description: '65% win rate sustained — reputation 740',
    blockNumber: 8_300_802,
    txHash: '0x' + 'e'.repeat(64),
    achievedAt: '2026-03-02',
    icon: '📈',
  },
  {
    id: '6',
    type: 'HUNDRED_DECISIONS',
    description: '100 decisions — reputation 790',
    blockNumber: 8_304_220,
    txHash: '0x' + 'f'.repeat(64),
    achievedAt: '2026-03-20',
    icon: '🏆',
  },
  {
    id: '7',
    type: 'HUNDRED_K_VOLUME',
    description: '$100K volume — current reputation 847',
    blockNumber: 8_311_440,
    txHash: '0x' + '1'.repeat(64),
    achievedAt: '2026-04-18',
    icon: '💰',
  },
];

export function MilestoneTimeline({ milestones = DEFAULTS }: { milestones?: Milestone[] }) {
  return (
    <div className="relative space-y-3 pl-6">
      <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-moixa/40 via-border to-transparent" />
      {milestones.map((m) => (
        <div key={m.id} className="relative">
          <span className="absolute -left-[26px] top-5 inline-block h-2.5 w-2.5 rounded-full bg-moixa shadow-[0_0_12px_rgba(0,255,209,0.6)]" />
          <Card className="border-l-2 border-l-moixa/40 p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">{m.icon ?? '◆'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{m.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  block #{m.blockNumber.toLocaleString()} · {m.achievedAt}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
