'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ThinkingDots } from '@/components/animations/ThinkingDots';
import { ConfidenceMeter } from '@/components/animations/ConfidenceMeter';
import { Badge } from '@/components/ui/Badge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { CopyButton } from '@/components/ui/CopyButton';
import { cn, formatUSD, shortTx, mantleScanTxUrl } from '@/lib/utils';
import type { BrainState, MarketSignal, RiskLevel, TradeDirection } from '@/types';

export interface MoixaBrainProps {
  state: BrainState;
  token: string;
  signals: MarketSignal[];
  thinking: string;
  confidence: number;
  decision?: {
    direction: TradeDirection;
    token: string;
    size: number;
    confidence: number;
    riskLevel: RiskLevel;
    leverage: number;
    expectedReturn?: number;
    expectedTimeframe?: string;
    txHash?: string;
    onChainId?: number;
    protocol?: string;
  };
  executionPrice?: number;
}

export function MoixaBrain({
  state,
  token,
  signals,
  thinking,
  confidence,
  decision,
  executionPrice,
}: MoixaBrainProps) {
  return (
    <section className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          What MOIXA is thinking
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">{stateTitle(state)}</h2>
      </header>

      <AnimatePresence mode="wait">
        {state === 'IDLE' && <IdleState key="idle" />}
        {state === 'ANALYZING' && (
          <AnalyzingState key="analyzing" token={token} signals={signals} />
        )}
        {state === 'REASONING' && (
          <ReasoningState key="reasoning" thinking={thinking} confidence={confidence} />
        )}
        {state === 'DECIDING' && decision && (
          <DecisionState key="deciding" decision={decision} confidence={confidence} />
        )}
        {state === 'EXECUTING' && decision && (
          <ExecutingState key="executing" decision={decision} />
        )}
        {state === 'COMPLETE' && decision && (
          <CompleteState key="complete" decision={decision} executionPrice={executionPrice} />
        )}
      </AnimatePresence>
    </section>
  );
}

function stateTitle(state: BrainState) {
  switch (state) {
    case 'IDLE':
      return 'Idle - waiting for signal';
    case 'ANALYZING':
      return 'Scanning markets...';
    case 'REASONING':
      return 'MOIXA is reasoning...';
    case 'DECIDING':
      return 'Decision locked';
    case 'EXECUTING':
      return 'Executing trade...';
    case 'COMPLETE':
      return 'Trade confirmed';
  }
}

function IdleState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
    >
      <ThinkingDots />
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
        Listening for the next signal
      </p>
    </motion.div>
  );
}

function AnalyzingState({ token, signals }: { token: string; signals: MarketSignal[] }) {
  const tokens = ['ETH', 'BTC', 'MNT'];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="flex gap-1.5">
        {tokens.map((t) => (
          <span
            key={t}
            className={cn(
              'rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors',
              t === token
                ? 'border-moixa/50 bg-moixa/10 text-moixa'
                : 'border-border text-muted'
            )}
          >
            {t}
          </span>
        ))}
      </div>

      <AnimatePresence>
        {signals.map((s, i) => (
          <motion.div
            key={`${s.type}-${i}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-md border border-border bg-bg/40 p-3"
          >
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-moixa">
              <span> Signal detected</span>
              <span className="text-muted">{s.timeframe}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {pretty(s.type)} - {s.token}
            </p>
            {s.detail && <p className="mt-1 text-xs text-muted">{s.detail}</p>}
            <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-muted">
              <span>Strength</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-card">
                <motion.div
                  className="h-full bg-moixa-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${s.strength * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="tabular-nums text-white">{Math.round(s.strength * 100)}%</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {signals.length === 0 && (
        <p className="font-mono text-xs text-muted">No signals above threshold yet...</p>
      )}
    </motion.div>
  );
}

function ReasoningState({ thinking, confidence }: { thinking: string; confidence: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <ThinkingDots />
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
          GPT-4o reasoning live
        </span>
      </div>
      <Typewriter text={thinking} />
      <ConfidenceMeter score={confidence} isBuilding />
    </motion.div>
  );
}

function DecisionState({
  decision,
  confidence,
}: {
  decision: NonNullable<MoixaBrainProps['decision']>;
  confidence: number;
}) {
  const big = decision.direction;
  const colorClass =
    big === 'LONG'
      ? 'text-win-green border-win-green/40 bg-win-green/10 shadow-[0_0_36px_rgba(0,255,135,0.35)]'
      : big === 'SHORT'
      ? 'text-loss-red border-loss-red/40 bg-loss-red/10 shadow-[0_0_36px_rgba(255,68,68,0.35)]'
      : 'text-muted border-border bg-white/5';
  const arrow = big === 'LONG' ? '▲' : big === 'SHORT' ? '▼' : '-';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className="flex flex-col gap-4"
    >
      <div
        className={cn(
          'flex items-center justify-center gap-3 rounded-xl border px-6 py-7 font-mono text-2xl font-bold tracking-wider',
          colorClass
        )}
      >
        <span>{arrow}</span>
        <span>{big}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <Stat label="Token" value={decision.token} />
        <Stat label="Size" value={formatUSD(decision.size)} />
        <Stat
          label="Leverage"
          value={decision.leverage > 1 ? `${decision.leverage}x` : 'Spot'}
        />
        <Stat
          label="Confidence"
          value={`${(decision.confidence * 100).toFixed(1)}%`}
          highlight
        />
        <Stat
          label="Expected"
          value={
            decision.expectedReturn
              ? `+${(decision.expectedReturn / 100).toFixed(2)}%`
              : '-'
          }
        />
        <Stat label="Window" value={decision.expectedTimeframe ?? '4 hours'} />
      </div>

      <div className="flex items-center gap-2">
        <RiskBadge level={decision.riskLevel} />
        {decision.protocol && (
          <Badge tone="moixa" className="font-mono">
            {decision.protocol}
          </Badge>
        )}
      </div>

      {decision.txHash && (
        <div className="rounded-md border border-border bg-bg/50 p-3 font-mono text-[11px] text-muted">
          <p className="text-moixa"> Recording on Mantle...</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span>tx</span>
            <a
              href={mantleScanTxUrl(decision.txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-white underline-offset-4 hover:underline"
            >
              {shortTx(decision.txHash)}
            </a>
            <CopyButton value={decision.txHash} label="copy" />
          </div>
          {decision.onChainId !== undefined && (
            <p className="mt-1 text-muted">on-chain id #{decision.onChainId}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ExecutingState({
  decision,
}: {
  decision: NonNullable<MoixaBrainProps['decision']>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      <Badge tone="orange" className="self-start">
         EXECUTING ON {decision.protocol?.toUpperCase() ?? 'MERCHANT MOE'}
      </Badge>
      <div className="rounded-md border border-warn/30 bg-warn/5 p-4 font-mono text-xs">
        <p className="text-warn">Broadcasting transaction...</p>
        <p className="mt-2 text-muted">
          Routing {formatUSD(decision.size)} into {decision.token} via{' '}
          {decision.protocol ?? 'Merchant Moe'}
        </p>
      </div>
      <ProgressBar />
    </motion.div>
  );
}

function CompleteState({
  decision,
  executionPrice,
}: {
  decision: NonNullable<MoixaBrainProps['decision']>;
  executionPrice?: number;
}) {
  const price = executionPrice ?? 3284.5;
  const stop = price * 0.98;
  const target = price * 1.023;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-4"
    >
      <Badge tone="green" className="self-start">
         TRADE CONFIRMED
      </Badge>
      <p className="text-sm text-white">
        Position opened on <span className="text-moixa">{decision.protocol ?? 'Merchant Moe'}</span>
      </p>
      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
        <Stat label="Entry" value={formatUSD(price, 2)} highlight />
        <Stat label="Token" value={decision.token} />
        <Stat label="Stop" value={formatUSD(stop, 2)} />
        <Stat label="Target" value={formatUSD(target, 2)} />
      </div>
      {decision.txHash && (
        <div className="flex items-center justify-between rounded-md border border-border bg-bg/50 px-3 py-2 font-mono text-[11px]">
          <span className="text-muted">tx</span>
          <a
            href={mantleScanTxUrl(decision.txHash)}
            target="_blank"
            rel="noreferrer"
            className="text-white"
          >
            {shortTx(decision.txHash)}
          </a>
          <CopyButton value={decision.txHash} />
        </div>
      )}
    </motion.div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={cn('mt-1 text-sm font-mono tabular-nums', highlight ? 'text-moixa' : 'text-white')}>
        {value}
      </div>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-card">
      <motion.div
        className="h-full w-1/2 bg-moixa-gradient"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
      />
    </div>
  );
}

function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    setShown('');
    if (!text) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 24);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-bg/50 p-4 font-mono text-[13px] leading-relaxed text-muted">
      {shown.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-moixa align-middle" />
    </div>
  );
}

function pretty(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}
