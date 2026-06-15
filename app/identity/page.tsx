'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ERC8004Card } from '@/components/identity/ERC8004Card';
import { MilestoneTimeline } from '@/components/identity/MilestoneTimeline';
import { StatGrid } from '@/components/identity/StatGrid';
import { Card } from '@/components/ui/Card';
import { useIdentity } from '@/hooks/useIdentity';

export default function IdentityPage() {
  const { identity } = useIdentity();
  const [expanded, setExpanded] = useState(false);

  const repHistory = useMemo(() => {
    const points = 90;
    let v = 500;
    return Array.from({ length: points }, (_, i) => {
      const drift = (i % 7 === 0 ? -8 : 6) + (Math.random() - 0.4) * 4;
      v = Math.max(400, Math.min(identity.reputationScore + 20, v + drift));
      return {
        t: new Date(Date.now() - (points - i) * 86_400_000).toISOString().slice(5, 10),
        rep: Math.round(v),
      };
    });
  }, [identity.reputationScore]);

  return (
    <div className="mx-auto max-w-container px-6 py-16">
      <header className="mb-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Agent Identity</p>
        <h1 className="mt-2 text-fluid-h2 font-bold tracking-tightish text-white">
          MOIXA’s soul, on-chain.
        </h1>
      </header>

      <ERC8004Card identity={identity} />

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-bold text-white">Live stats</h2>
        <StatGrid identity={identity} />
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-bold text-white">Reputation history</h2>
        <Card className="p-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={repHistory}>
                <defs>
                  <linearGradient id="repLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00FFD1" />
                    <stop offset="100%" stopColor="#6C5CE7" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[400, 1000]}
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#16161F',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rep"
                  stroke="url(#repLine)"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#00FFD1' }}
                />
                <ReferenceDot
                  x={repHistory[repHistory.length - 1].t}
                  y={identity.reputationScore}
                  r={6}
                  fill="#00FFD1"
                  stroke="#0A0A0F"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-bold text-white">Milestones</h2>
        <MilestoneTimeline />
      </section>

      <section className="mt-14">
        <Card className="p-6">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <h3 className="text-lg font-bold text-white">What is ERC-8004?</h3>
            <span className="font-mono text-xs text-muted">{expanded ? '−' : '+'}</span>
          </button>
          {expanded && (
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
              <p>
                ERC-8004 is a proposed standard for autonomous agent identities on EVM chains. The
                NFT carries the agent’s reputation, total trades, win rate, and milestones — all
                stored permanently on-chain.
              </p>
              <p>
                Anyone can read MOIXA’s identity NFT and verify its track record. Reputation
                cannot be faked, transferred, or rolled back. The agent earns its standing through
                accurate decisions.
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
