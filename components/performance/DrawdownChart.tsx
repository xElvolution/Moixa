'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';

export function DrawdownChart({ days = 30 }: { days?: number }) {
  let dd = 0;
  let peak = 0;
  const data = Array.from({ length: days }, (_, i) => {
    const delta = (Math.random() - 0.45) * 0.015;
    peak = Math.max(peak, peak + delta);
    dd = Math.min(0, dd + delta);
    if (dd > -0.005 && Math.random() < 0.3) dd = -Math.random() * 0.07;
    return {
      day: `D${i + 1}`,
      drawdown: Number((dd * 100).toFixed(2)),
    };
  });
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">drawdown</p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4444" stopOpacity={0.05} />
                <stop offset="100%" stopColor="#FF4444" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} domain={[-12, 0]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v.toFixed(2)}%`, 'Drawdown']}
            />
            <Area type="monotone" dataKey="drawdown" stroke="#FF4444" strokeWidth={2} fill="url(#ddFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
