'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { CounterAnimation } from '@/components/animations/CounterAnimation';
import type { AgentIdentity } from '@/types';

export function IdentityCard({ identity }: { identity: AgentIdentity }) {
  const pct = Math.max(0, Math.min(1, identity.reputationScore / 1000));
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - pct);

  return (
    <Card className="p-5">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          REPUTATION SCORE
        </p>
        <div className="relative mx-auto mt-3 h-[200px] w-[200px]">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#16161F" strokeWidth="10" />
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#repGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
              style={{
                filter: 'drop-shadow(0 0 14px rgba(0,255,209,0.6))',
              }}
            />
            <defs>
              <linearGradient id="repGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00FFD1" />
                <stop offset="100%" stopColor="#6C5CE7" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[44px] font-bold leading-none text-white drop-shadow-[0_0_18px_rgba(0,255,209,0.4)]">
              <CounterAnimation to={identity.reputationScore} />
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              / 1000
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 font-mono text-xs">
        <Stat label="Win Rate" value={`${(identity.winRate * 100).toFixed(1)}%`} highlight />
        <Stat label="Total Trades" value={String(identity.totalTrades)} />
        <Stat label="Volume" value={`$${(identity.totalVolume / 1000).toFixed(1)}K`} />
        <Stat label="Sharpe" value={identity.sharpeRatio.toFixed(2)} />
        <Stat
          label="Max DD"
          value={`${(identity.maxDrawdown * 100).toFixed(1)}%`}
          danger
        />
        <Stat label="Accuracy" value={`${(identity.winRate * 100).toFixed(0)}%`} />
      </div>

      <div className="mt-5 rounded-md border border-border bg-bg/40 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          ERC-8004 Agent
        </p>
        <p className="mt-1 font-mono text-sm text-moixa">MOIXA Agent #001</p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">
          Born block #{identity.birthBlock.toLocaleString()}
        </p>
        <a
          href="/identity"
          className="mt-2 inline-flex font-mono text-[11px] text-moixa underline-offset-4 hover:underline"
        >
          View Full Identity →
        </a>
      </div>

      <div className="mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Milestones</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-muted">
          <li>
            <span className="mr-2">🏆</span>First 100 decisions
          </li>
          <li>
            <span className="mr-2">📈</span>Hit 65% win rate
          </li>
          <li>
            <span className="mr-2">💰</span>$100K volume milestone
          </li>
        </ul>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div
        className={
          highlight ? 'mt-1 text-sm text-moixa' : danger ? 'mt-1 text-sm text-loss-red' : 'mt-1 text-sm text-white'
        }
      >
        {value}
      </div>
    </div>
  );
}
