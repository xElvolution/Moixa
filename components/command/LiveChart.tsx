'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { cn, formatUSD } from '@/lib/utils';

const TOKENS = ['ETH', 'BTC', 'MNT'] as const;
type TokenKey = (typeof TOKENS)[number];

type Point = { t: number; price: number };

const RANGES = [
  { label: '1H', points: 60 },
  { label: '4H', points: 120 },
  { label: '1D', points: 200 },
];

export function LiveChart({
  highlightToken,
  entryPrice,
  exitPrice,
}: {
  highlightToken?: string;
  entryPrice?: number;
  exitPrice?: number;
}) {
  const [token, setToken] = useState<TokenKey>('ETH');
  const [range, setRange] = useState(RANGES[0]);
  const [series, setSeries] = useState<Point[]>([]);

  useEffect(() => {
    if (highlightToken && TOKENS.includes(highlightToken as TokenKey)) {
      setToken(highlightToken as TokenKey);
    }
  }, [highlightToken]);

  // Fetch real candles from the agent (Bybit klines) and re-poll periodically.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/market?token=${token}&points=${range.points}`);
        const data = await r.json();
        const raw: Array<{ t: number; close: number }> = data?.series ?? [];
        if (mounted) {
          setSeries(raw.map((p) => ({ t: p.t, price: p.close })));
        }
      } catch {
        if (mounted) setSeries([]);
      }
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [token, range.points]);

  const entryIndex = useMemo(() => {
    if (!entryPrice) return -1;
    return series.findIndex((p) => Math.abs(p.price - entryPrice) < entryPrice * 0.002);
  }, [entryPrice, series]);

  const last = series[series.length - 1];
  const first = series[0];
  const change = last && first ? ((last.price - first.price) / first.price) * 100 : 0;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setToken(t)}
              className={cn(
                'rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors',
                t === token
                  ? 'border-moixa/50 bg-moixa/10 text-moixa'
                  : 'border-border text-muted hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-mono text-xl font-bold tabular-nums text-white">
              {last ? formatUSD(last.price, token === 'MNT' ? 4 : 2) : '-'}
            </div>
            <div
              className={cn(
                'font-mono text-xs tabular-nums',
                change >= 0 ? 'text-win-green' : 'text-loss-red'
              )}
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(2)}%
            </div>
          </div>
          <div className="flex items-center gap-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  'rounded-md px-2 py-1 font-mono text-[11px] transition-colors',
                  r.label === range.label
                    ? 'bg-card text-white'
                    : 'text-muted hover:text-white'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FFD1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00FFD1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="t" hide />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#6B7280', fontFamily: 'JetBrains Mono', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(v) => (token === 'MNT' ? `$${(+v).toFixed(3)}` : `$${(+v).toFixed(0)}`)}
            />
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              labelFormatter={(label) => new Date(label as number).toLocaleTimeString()}
              formatter={(value: number) => [formatUSD(value, token === 'MNT' ? 4 : 2), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00FFD1"
              strokeWidth={1.8}
              fill="url(#px)"
              isAnimationActive={false}
            />
            {entryIndex >= 0 && entryPrice && (
              <ReferenceDot
                x={series[entryIndex].t}
                y={entryPrice}
                r={5}
                fill="#00FFD1"
                stroke="#0A0A0F"
                strokeWidth={2}
              />
            )}
            {exitPrice && (
              <ReferenceDot
                x={series[series.length - 1].t}
                y={exitPrice}
                r={5}
                fill="#6C5CE7"
                stroke="#0A0A0F"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
