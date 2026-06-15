'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';

export function WinRateChart({ days = 30 }: { days?: number }) {
  let v = 60;
  const data = Array.from({ length: days }, (_, i) => {
    v += (Math.random() - 0.45) * 3;
    v = Math.max(50, Math.min(78, v));
    return {
      day: `D${i + 1}`,
      winRate: Number(v.toFixed(1)),
    };
  });
  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">win rate over time</p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} domain={[40, 80]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                background: '#16161F',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, 'Win rate']}
            />
            <Line type="monotone" dataKey="winRate" stroke="#00FFD1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
