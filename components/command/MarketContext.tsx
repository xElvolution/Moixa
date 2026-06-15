'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn, formatUSD } from '@/lib/utils';

interface Ctx {
  price?: number;
  change24h?: number;
  volume24h?: number;
  btcDominance?: number;
  fearGreed?: number;
}

const fmt = (v: number | undefined, f: (n: number) => string) =>
  typeof v === 'number' ? f(v) : '—';

export function MarketContext({ token }: { token: string }) {
  const [ctx, setCtx] = useState<Ctx>({});

  // Real market context from the agent (CoinGecko price + global, Bybit).
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/market?token=${token}`);
        const data = await r.json();
        if (mounted) setCtx(data?.context ?? {});
      } catch {
        if (mounted) setCtx({});
      }
    };
    load();
    const id = window.setInterval(load, 20000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [token]);

  const { price, change24h, volume24h, btcDominance, fearGreed } = ctx;

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        market context · {token}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
        <Row
          label="Price"
          value={fmt(price, (v) => formatUSD(v, token === 'MNT' ? 4 : 2))}
        />
        <Row
          label="24h"
          value={fmt(change24h, (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`)}
          colorClass={
            change24h === undefined
              ? undefined
              : change24h >= 0
              ? 'text-win-green'
              : 'text-loss-red'
          }
        />
        <Row label="Volume" value={fmt(volume24h, (v) => `$${(v / 1_000_000).toFixed(1)}M`)} />
        <Row label="BTC Dom" value={fmt(btcDominance, (v) => `${v.toFixed(1)}%`)} />
        <Row
          label="Fear & Greed"
          value={fmt(fearGreed, (v) => `${v} (${labelFG(v)})`)}
          colorClass={
            fearGreed === undefined
              ? undefined
              : fearGreed > 60
              ? 'text-win-green'
              : fearGreed < 40
              ? 'text-loss-red'
              : 'text-warn'
          }
        />
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={cn('mt-1', colorClass ?? 'text-white')}>{value}</div>
    </div>
  );
}

function labelFG(v: number) {
  if (v >= 75) return 'Extreme Greed';
  if (v >= 55) return 'Greed';
  if (v >= 45) return 'Neutral';
  if (v >= 25) return 'Fear';
  return 'Extreme Fear';
}
