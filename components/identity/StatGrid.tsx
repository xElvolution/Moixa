'use client';

import { CounterAnimation } from '@/components/animations/CounterAnimation';
import { Card } from '@/components/ui/Card';
import type { AgentIdentity } from '@/types';

export function StatGrid({ identity }: { identity: AgentIdentity }) {
  const stats = [
    { label: 'Total Decisions', value: identity.totalTrades, suffix: '' },
    { label: 'Win Rate', value: Math.round(identity.winRate * 1000) / 10, suffix: '%' },
    { label: 'Total Volume', value: Math.round(identity.totalVolume), prefix: '$' },
    { label: 'Sharpe Ratio', value: Math.round(identity.sharpeRatio * 100) / 100, suffix: '' },
    {
      label: 'Max Drawdown',
      value: Math.round(identity.maxDrawdown * 1000) / 10,
      suffix: '%',
      danger: true,
    },
    {
      label: 'Reputation',
      value: identity.reputationScore,
      suffix: '/1000',
      moixa: true,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className="p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            {s.label}
          </div>
          <div
            className={
              s.moixa
                ? 'mt-2 text-3xl font-bold text-moixa drop-shadow-[0_0_14px_rgba(0,255,209,0.4)]'
                : s.danger
                ? 'mt-2 text-3xl font-bold text-loss-red'
                : 'mt-2 text-3xl font-bold text-white'
            }
          >
            <CounterAnimation
              to={Number(s.value)}
              prefix={s.prefix ?? ''}
              suffix={s.suffix ?? ''}
              decimals={s.suffix === '%' || s.label === 'Sharpe Ratio' ? 2 : 0}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
