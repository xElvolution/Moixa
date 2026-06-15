'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { CopyButton } from '@/components/ui/CopyButton';
import { cn, formatBps, formatUSD, mantleScanTxUrl, shortTx, timeAgo } from '@/lib/utils';
import type { Decision } from '@/types';

export function DecisionCard({ d }: { d: Decision }) {
  const [open, setOpen] = useState(false);
  const isWin = d.actualReturn != null && d.actualReturn > 0;
  const isLoss = d.actualReturn != null && d.actualReturn < 0;
  const direction = d.decision;

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Tag direction={direction} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white">
            {d.token} ·{' '}
            <span className="font-mono text-muted">
              {(d.confidenceScore * 100).toFixed(1)}% confidence
            </span>
          </p>
          <p className="font-mono text-[11px] text-muted">
            block #{d.blockNumber?.toLocaleString() ?? '—'} · {d.timestamp ? timeAgo(d.timestamp) : 'just now'}
          </p>
        </div>
        <Result d={d} />
        <span
          className={cn(
            'font-mono text-xs transition-transform',
            open && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="exp"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid gap-6 border-t border-border bg-bg/40 p-5 md:grid-cols-2">
              <Section title="MARKET CONTEXT">
                <p className="font-mono text-xs text-muted">
                  ETH $3,284 · BTC dom 51.2% · F&G 72 (Greed)
                </p>
              </Section>

              <Section title="SIGNAL DETECTED">
                <p className="font-mono text-xs text-muted">{d.signalDetected ?? '—'}</p>
                {d.signalStrength != null && (
                  <p className="font-mono text-[11px] text-muted">
                    strength {(d.signalStrength * 100).toFixed(0)}%
                  </p>
                )}
              </Section>

              <Section title="MOIXA'S REASONING" wide>
                <p className="font-mono text-xs leading-relaxed text-muted">
                  {d.fullReasoning ??
                    'Reasoning summary not available for this decision.'}
                </p>
              </Section>

              <Section title="CONFIDENCE">
                <ConfidenceBar score={d.confidenceScore} />
              </Section>
              <Section title="RISK">
                <div className="flex items-center gap-2">
                  <RiskBadge level={d.riskLevel} />
                  <p className="font-mono text-[11px] text-muted">
                    {d.riskReasoning ?? ''}
                  </p>
                </div>
              </Section>

              <Section title="EXPECTED">
                <p className="font-mono text-sm text-white">
                  {d.expectedReturn != null ? `+${(d.expectedReturn / 100).toFixed(2)}%` : '—'} in{' '}
                  {d.expectedTime ?? d.expectedTimeframe ?? '4 hours'}
                </p>
              </Section>
              <Section title="OUTCOME">
                {d.actualReturn != null ? (
                  <p
                    className={cn(
                      'font-mono text-sm tabular-nums',
                      isWin ? 'text-win-green' : isLoss ? 'text-loss-red' : 'text-muted'
                    )}
                  >
                    {formatBps(d.actualReturn)}
                    {d.wasCorrect ? ' ✓' : d.wasCorrect === false ? ' ✗' : ''}
                  </p>
                ) : (
                  <p className="font-mono text-sm text-muted">open</p>
                )}
              </Section>

              {d.learningNote && (
                <Section title="MOIXA LEARNED" wide>
                  <p className="font-mono text-xs italic leading-relaxed text-mantle">
                    “{d.learningNote}”
                  </p>
                </Section>
              )}

              <Section title="ON-CHAIN RECORD" wide>
                <div className="grid gap-2 font-mono text-[11px] md:grid-cols-2">
                  {d.txHash && <TxRow label="Open" hash={d.txHash} />}
                  {d.closeTxHash && <TxRow label="Close" hash={d.closeTxHash} />}
                  <p className="text-muted">
                    Block <span className="text-white">#{d.blockNumber?.toLocaleString() ?? '—'}</span>
                  </p>
                  <p className="text-muted">
                    Size <span className="text-white">{formatUSD(d.positionSize)}</span>
                  </p>
                  {d.protocol && (
                    <p className="text-muted">
                      Protocol <span className="text-white">{d.protocol}</span>
                    </p>
                  )}
                </div>
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function Tag({ direction }: { direction: Decision['decision'] }) {
  const tone =
    direction === 'LONG'
      ? 'text-win-green border-win-green/40 bg-win-green/10'
      : direction === 'SHORT'
      ? 'text-loss-red border-loss-red/40 bg-loss-red/10'
      : 'text-muted border-border bg-white/5';
  const arrow = direction === 'LONG' ? '▲' : direction === 'SHORT' ? '▼' : '—';
  return (
    <span
      className={cn(
        'inline-flex h-9 w-20 items-center justify-center rounded-md border font-mono text-xs font-bold',
        tone
      )}
    >
      {arrow} {direction}
    </span>
  );
}

function Result({ d }: { d: Decision }) {
  if (d.actualReturn == null) {
    return <Badge tone="muted">open</Badge>;
  }
  const positive = d.actualReturn >= 0;
  return (
    <span
      className={cn(
        'font-mono text-sm tabular-nums',
        positive ? 'text-win-green' : 'text-loss-red'
      )}
    >
      {formatBps(d.actualReturn)} {d.wasCorrect ? '✓' : d.wasCorrect === false ? '✗' : ''}
    </span>
  );
}

function Section({
  title,
  children,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
        <div
          className="h-full bg-moixa-gradient"
          style={{ width: `${Math.min(100, score * 100)}%` }}
        />
      </div>
      <p className="font-mono text-xs text-white">{(score * 100).toFixed(1)}%</p>
    </div>
  );
}

function TxRow({ label, hash }: { label: string; hash: string }) {
  return (
    <p className="text-muted">
      {label}{' '}
      <a
        href={mantleScanTxUrl(hash)}
        target="_blank"
        rel="noreferrer"
        className="text-moixa underline-offset-4 hover:underline"
      >
        {shortTx(hash)}
      </a>{' '}
      <CopyButton value={hash} />
    </p>
  );
}
