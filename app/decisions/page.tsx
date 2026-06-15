'use client';

import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { DecisionTimeline } from '@/components/decisions/DecisionTimeline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDecisions } from '@/hooks/useDecisions';
import { cn } from '@/lib/utils';
import type { Decision } from '@/types';

const FILTERS = ['All', 'LONG', 'SHORT', 'FLAT', 'CORRECT', 'WRONG'] as const;
type Filter = (typeof FILTERS)[number];

export default function DecisionsPage() {
  const { decisions } = useDecisions(80);
  const [filter, setFilter] = useState<Filter>('All');
  const [token, setToken] = useState<'ALL' | 'ETH' | 'BTC' | 'MNT'>('ALL');
  const [minConfidence, setMinConfidence] = useState(0);

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      if (filter === 'LONG' && d.decision !== 'LONG') return false;
      if (filter === 'SHORT' && d.decision !== 'SHORT') return false;
      if (filter === 'FLAT' && d.decision !== 'FLAT') return false;
      if (filter === 'CORRECT' && d.wasCorrect !== true) return false;
      if (filter === 'WRONG' && d.wasCorrect !== false) return false;
      if (token !== 'ALL' && d.token !== token) return false;
      if (d.confidenceScore * 100 < minConfidence) return false;
      return true;
    });
  }, [decisions, filter, token, minConfidence]);

  const stats = useMemo(() => computeStats(decisions), [decisions]);

  return (
    <div className="mx-auto max-w-container px-6 py-16">
      <header className="mb-10">
        <h1 className="text-fluid-h2 font-bold tracking-tightish text-white">
          Every thought MOIXA ever had.
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          {decisions.length} decisions. All on Mantle. All verifiable. All permanent.
        </p>
      </header>

      <Card className="mb-8 flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                filter === f
                  ? 'border-moixa/50 bg-moixa/10 text-moixa'
                  : 'border-border text-muted hover:text-white'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="text-muted">·</span>
        <select
          value={token}
          onChange={(e) => setToken(e.target.value as any)}
          className="rounded-md border border-border bg-bg/60 px-3 py-1.5 font-mono text-xs text-muted"
        >
          <option value="ALL">All tokens</option>
          <option value="ETH">ETH</option>
          <option value="BTC">BTC</option>
          <option value="MNT">MNT</option>
        </select>
        <label className="flex items-center gap-2 font-mono text-xs text-muted">
          min conf
          <input
            type="range"
            min={0}
            max={100}
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="accent-moixa"
          />
          <span className="w-10 text-white tabular-nums">{minConfidence}%</span>
        </label>
        <span className="ml-auto font-mono text-xs text-muted">
          {filtered.length} of {decisions.length}
        </span>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DecisionTimeline decisions={filtered} />
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <StatsCard stats={stats} />
          <TokenPie decisions={decisions} />
          <ConfidenceScatter decisions={decisions} />
        </aside>
      </div>
    </div>
  );
}

function computeStats(decisions: Decision[]) {
  const closed = decisions.filter((d) => d.actualReturn != null);
  const wins = closed.filter((d) => d.wasCorrect === true);
  let bestStreak = 0;
  let worstStreak = 0;
  let cur = 0;
  for (const d of closed) {
    if (d.wasCorrect) {
      cur = cur >= 0 ? cur + 1 : 1;
      bestStreak = Math.max(bestStreak, cur);
    } else if (d.wasCorrect === false) {
      cur = cur <= 0 ? cur - 1 : -1;
      worstStreak = Math.min(worstStreak, cur);
    }
  }
  return {
    accuracy: closed.length ? (wins.length / closed.length) * 100 : 0,
    bestStreak,
    worstStreak: Math.abs(worstStreak),
    avgConfidence:
      decisions.reduce((s, d) => s + d.confidenceScore, 0) / Math.max(decisions.length, 1) * 100,
    avgHold: 4.2,
  };
}

function StatsCard({ stats }: { stats: ReturnType<typeof computeStats> }) {
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">overall</p>
      <ul className="mt-3 space-y-2 font-mono text-sm">
        <li className="flex justify-between"><span className="text-muted">Accuracy</span><span className="text-moixa">{stats.accuracy.toFixed(1)}%</span></li>
        <li className="flex justify-between"><span className="text-muted">Best streak</span><span className="text-white">{stats.bestStreak} wins</span></li>
        <li className="flex justify-between"><span className="text-muted">Worst streak</span><span className="text-white">{stats.worstStreak} losses</span></li>
        <li className="flex justify-between"><span className="text-muted">Avg confidence</span><span className="text-white">{stats.avgConfidence.toFixed(1)}%</span></li>
        <li className="flex justify-between"><span className="text-muted">Avg hold</span><span className="text-white">{stats.avgHold.toFixed(1)}h</span></li>
      </ul>
    </Card>
  );
}

function TokenPie({ decisions }: { decisions: Decision[] }) {
  const groups: Record<string, number> = {};
  decisions.forEach((d) => {
    if (d.wasCorrect == null) return;
    if (!groups[d.token]) groups[d.token] = 0;
    if (d.wasCorrect) groups[d.token] += 1;
  });
  const data = Object.entries(groups).map(([token, wins]) => ({ token, wins }));
  const colors = ['#00FFD1', '#6C5CE7', '#F59E0B'];
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">accuracy by token</p>
      <div className="mt-3 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="wins" nameKey="token" innerRadius={36} outerRadius={62} stroke="#0A0A0F">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {data.map((d, i) => (
          <Badge key={d.token} tone="muted" className="font-mono">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: colors[i] }} />
            {d.token} · {d.wins}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function ConfidenceScatter({ decisions }: { decisions: Decision[] }) {
  const data = decisions
    .filter((d) => d.actualReturn != null)
    .map((d) => ({
      x: Math.round(d.confidenceScore * 100),
      y: (d.actualReturn ?? 0) / 100,
      win: d.wasCorrect,
    }));
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        confidence vs accuracy
      </p>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis
              type="number"
              dataKey="x"
              domain={[60, 100]}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-3, 5]}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            />
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v.toFixed(2)}%`, 'return']}
            />
            <Scatter
              data={data}
              shape="circle"
              fill="#00FFD1"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.win ? '#00FF87' : '#FF4444'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
