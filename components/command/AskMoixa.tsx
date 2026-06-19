'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const TOKENS = ['ETH', 'BTC', 'MNT'] as const;
type Token = (typeof TOKENS)[number];

type Status = 'idle' | 'asking' | 'analyzing' | 'error';

export function AskMoixa({ className }: { className?: string }) {
  const [token, setToken] = useState<Token>('ETH');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const ask = async () => {
    setStatus('asking');
    setMessage('');
    try {
      const r = await fetch(`/api/trigger/${token}`, { method: 'POST' });
      const data = await r.json();
      if (!r.ok) {
        setStatus('error');
        setMessage(data?.error || 'Could not reach MOIXA.');
        return;
      }
      setStatus('analyzing');
      setMessage(
        `MOIXA is analyzing ${token} live - watch the brain panel. The decision will land on Mantle in a few seconds.`
      );
      // Reset back to idle after the lifecycle window so the user can ask again.
      window.setTimeout(() => setStatus('idle'), 30000);
    } catch {
      setStatus('error');
      setMessage('MOIXA agent is not reachable right now.');
    }
  };

  const busy = status === 'asking' || status === 'analyzing';

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          ask MOIXA
        </p>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-moixa">
          live trigger
        </span>
      </div>

      <p className="mt-3 text-sm text-muted">
        Tell MOIXA to analyze a market now. It runs a real decision and records it on-chain.
      </p>

      <div className="mt-4 flex items-center gap-1.5">
        {TOKENS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setToken(t)}
            disabled={busy}
            className={cn(
              'rounded-md border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50',
              t === token
                ? 'border-moixa/50 bg-moixa/10 text-moixa'
                : 'border-border text-muted hover:text-white'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={ask}
        disabled={busy}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black shadow-[0_0_24px_-8px_rgba(0,255,209,0.5)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'asking'
          ? 'Asking MOIXA…'
          : status === 'analyzing'
          ? `Analyzing ${token}…`
          : `Ask MOIXA to analyze ${token}`}
      </button>

      {message && (
        <p
          className={cn(
            'mt-3 font-mono text-xs leading-relaxed',
            status === 'error' ? 'text-loss-red' : 'text-moixa'
          )}
        >
          {message}
        </p>
      )}
    </Card>
  );
}
