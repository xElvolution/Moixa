'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { useState } from 'react';
import { cn, formatUSD } from '@/lib/utils';
import type { PerformancePoint } from '@/hooks/usePerformance';

export function EquityCurve({ data }: { data: PerformancePoint[] }) {
  const [showBtc, setShowBtc] = useState(true);
  const [showEth, setShowEth] = useState(false);

  const enriched = data.map((p, i) => ({
    ...p,
    btc: 100_000 * (1 + Math.sin(i / 6) * 0.04 + i / data.length * 0.02),
    eth: 100_000 * (1 + Math.cos(i / 5) * 0.05 + i / data.length * 0.03),
  }));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          equity curve
        </p>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Toggle on={showBtc} onClick={() => setShowBtc((v) => !v)} label="vs BTC" tone="orange" />
          <Toggle on={showEth} onClick={() => setShowEth((v) => !v)} label="vs ETH" tone="moixa" />
        </div>
      </div>

      <div className="mt-3 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enriched} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            />
            <YAxis
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              formatter={(v: number, k: string) => [formatUSD(v, 0), k]}
            />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#equityFill)"
              name="MOIXA"
            />
            {showBtc && (
              <Line type="monotone" dataKey="btc" stroke="#6C5CE7" strokeWidth={1.4} dot={false} name="BTC" />
            )}
            {showEth && (
              <Line type="monotone" dataKey="eth" stroke="#00FFD1" strokeWidth={1.4} dot={false} name="ETH" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Toggle({
  on,
  onClick,
  label,
  tone,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  tone: 'orange' | 'moixa';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 transition-colors',
        on
          ? tone === 'orange'
            ? 'border-warn/40 bg-warn/10 text-warn'
            : 'border-moixa/40 bg-moixa/10 text-moixa'
          : 'border-border text-muted hover:text-white'
      )}
    >
      {label}
    </button>
  );
}
