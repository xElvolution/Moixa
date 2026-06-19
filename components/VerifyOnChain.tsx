'use client';

import { Card } from '@/components/ui/Card';
import { useOnChainStats } from '@/hooks/useOnChainStats';
import { BRAIN_ADDRESS, IDENTITY_ADDRESS, EXECUTOR_ADDRESS } from '@/lib/mantle';
import { cn, mantleScanAddressUrl, shortTx } from '@/lib/utils';

const CONTRACTS: Array<[string, string]> = [
  ['MoixaBrain', BRAIN_ADDRESS],
  ['MoixaIdentity', IDENTITY_ADDRESS],
  ['MoixaExecutor', EXECUTOR_ADDRESS],
];

export function VerifyOnChain({ className }: { className?: string }) {
  const s = useOnChainStats();

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          verify on-chain
        </p>
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-[0.18em]',
            s.ok ? 'text-win-green' : 'text-muted'
          )}
        >
          {s.loading ? 'reading chain…' : s.ok ? '● live from Mantle' : 'unavailable'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
        <Stat label="Decisions" value={s.ok ? String(s.totalDecisions) : '—'} />
        <Stat label="Accuracy" value={s.ok ? `${(s.accuracy * 100).toFixed(0)}%` : '—'} />
        <Stat label="Correct" value={s.ok ? String(s.correctDecisions) : '—'} />
        <Stat label="Reputation" value={s.ok ? `${s.reputation}/1000` : '—'} />
      </div>

      <div className="mt-4 space-y-1.5">
        {CONTRACTS.filter(([, a]) => a).map(([name, addr]) => (
          <a
            key={name}
            href={mantleScanAddressUrl(addr)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-md border border-border bg-bg/40 px-3 py-2 font-mono text-[11px] transition-colors hover:border-border-hover"
          >
            <span className="text-muted">{name}</span>
            <span className="text-moixa">{shortTx(addr)} →</span>
          </a>
        ))}
      </div>

      <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted">
        These numbers are read straight from the contracts - no backend in the path. Click any
        contract to read the verified source on Mantlescan.
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="mt-1 text-white">{value}</div>
    </div>
  );
}
