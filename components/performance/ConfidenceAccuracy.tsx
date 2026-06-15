'use client';

import { Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/Card';

export function ConfidenceAccuracy({ points = 60 }: { points?: number }) {
  const data = Array.from({ length: points }, () => {
    const conf = 60 + Math.random() * 40;
    const baseline = (conf - 70) * 0.05;
    const ret = baseline + (Math.random() - 0.5) * 2.5;
    return { confidence: Math.round(conf), ret: Number(ret.toFixed(2)), win: ret >= 0 };
  });

  return (
    <Card className="p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        confidence vs accuracy
      </p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis
              type="number"
              dataKey="confidence"
              domain={[55, 100]}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="number"
              dataKey="ret"
              domain={[-3, 4]}
              tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickFormatter={(v) => `${v}%`}
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
            <Scatter data={data} shape="circle">
              {data.map((p, i) => (
                <Cell key={i} fill={p.win ? '#00FF87' : '#FF4444'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
