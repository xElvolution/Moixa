'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ConfidenceAccuracy } from '@/components/performance/ConfidenceAccuracy';
import { DrawdownChart } from '@/components/performance/DrawdownChart';
import { EquityCurve } from '@/components/performance/EquityCurve';
import { WinRateChart } from '@/components/performance/WinRateChart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePerformance } from '@/hooks/usePerformance';
import { cn, formatUSD } from '@/lib/utils';

const RANGES = ['7d', '30d', '90d', 'all'] as const;
type Range = (typeof RANGES)[number];

export default function PerformancePage() {
  const [range, setRange] = useState<Range>('30d');
  const { data } = usePerformance(range);
  const stats = data.stats;

  return (
    <div className="mx-auto max-w-container px-6 py-16">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">Performance</p>
          <h1 className="mt-2 text-fluid-h2 font-bold tracking-tightish text-white">
            How MOIXA is doing.
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                r === range
                  ? 'border-moixa/50 bg-moixa/10 text-moixa'
                  : 'border-border text-muted hover:text-white'
              )}
            >
              {r === 'all' ? 'All Time' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <EquityCurve data={data.equityCurve} />

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <WinRateChart days={data.equityCurve.length} />
        <ConfidenceAccuracy />
        <DrawdownChart days={data.equityCurve.length} />
      </div>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <DistributionPie
          title="token distribution"
          data={[
            { name: 'ETH', value: 58 },
            { name: 'BTC', value: 26 },
            { name: 'MNT', value: 16 },
          ]}
          colors={['#00FFD1', '#6C5CE7', '#F59E0B']}
        />
        <DistributionPie
          title="trade type"
          data={[
            { name: 'LONG', value: 54 },
            { name: 'SHORT', value: 28 },
            { name: 'FLAT', value: 18 },
          ]}
          colors={['#00FF87', '#FF4444', '#6B7280']}
        />
        <DistributionPie
          title="protocol usage"
          data={[
            { name: 'Merchant Moe', value: 62 },
            { name: 'Fluxion', value: 24 },
            { name: 'Agni', value: 14 },
          ]}
          colors={['#00FFD1', '#6C5CE7', '#F59E0B']}
        />
      </section>

      <section className="mt-12">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-bold text-white">All-time stats</h2>
          </div>
          <table className="w-full font-mono text-sm">
            <thead className="bg-bg/60 text-xs uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-6 py-3 text-left">Metric</th>
                <th className="px-6 py-3 text-left">Value</th>
                <th className="px-6 py-3 text-left">Rank</th>
              </tr>
            </thead>
            <tbody>
              <StatRow label="Win Rate" value={`${(stats.winRate * 100).toFixed(1)}%`} rank="Top 15%" highlight />
              <StatRow label="Sharpe" value={stats.sharpeRatio.toFixed(2)} rank="Top 8%" highlight />
              <StatRow label="Max DD" value={`${(stats.maxDrawdown * 100).toFixed(1)}%`} rank="Top 20%" />
              <StatRow label="Total Volume" value={formatUSD(stats.totalVolume)} rank="-" />
              <StatRow label="Reputation" value={`${stats.reputationScore}/1000`} rank="Top 5%" highlight />
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  rank,
  highlight,
}: {
  label: string;
  value: string;
  rank: string;
  highlight?: boolean;
}) {
  return (
    <tr className="border-t border-border">
      <td className="px-6 py-4 text-white">{label}</td>
      <td className={highlight ? 'px-6 py-4 text-moixa' : 'px-6 py-4 text-white'}>{value}</td>
      <td className="px-6 py-4">
        <Badge tone={highlight ? 'moixa' : 'muted'}>{rank}</Badge>
      </td>
    </tr>
  );
}

function DistributionPie({
  title,
  data,
  colors,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
}) {
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{title}</p>
      <div className="mt-3 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={66} stroke="#0A0A0F">
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
          <Badge key={d.name} tone="muted" className="font-mono">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: colors[i] }} />
            {d.name} · {d.value}%
          </Badge>
        ))}
      </div>
    </Card>
  );
}
