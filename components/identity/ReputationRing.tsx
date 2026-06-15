'use client';

import { motion } from 'framer-motion';
import { CounterAnimation } from '@/components/animations/CounterAnimation';

export function ReputationRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score / 1000));
  const circumference = 2 * Math.PI * 100;
  const offset = circumference * (1 - pct);
  return (
    <div className="relative mx-auto h-[240px] w-[240px]">
      <svg viewBox="0 0 240 240" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00FFD1" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="120" cy="120" r="100" fill="none" stroke="#16161F" strokeWidth="12" />
        <motion.circle
          cx="120"
          cy="120"
          r="100"
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 2, ease: 'easeOut' }}
          filter="url(#ringGlow)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[64px] font-bold leading-none text-white drop-shadow-[0_0_22px_rgba(0,255,209,0.5)]">
          <CounterAnimation to={score} />
        </div>
        <div className="mt-1 font-mono text-xs uppercase tracking-[0.22em] text-muted">
          / 1000 REPUTATION
        </div>
      </div>
    </div>
  );
}
