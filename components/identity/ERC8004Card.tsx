'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ReputationRing } from './ReputationRing';
import type { AgentIdentity } from '@/types';

export function ERC8004Card({ identity }: { identity: AgentIdentity }) {
  return (
    <Card glow className="relative overflow-hidden p-10">
      <div className="absolute inset-0 bg-moixa-radial opacity-60" />
      <div className="relative flex flex-col items-center text-center">
        <Badge tone="moixa" className="mb-3">ERC-8004 IDENTITY</Badge>
        <h2 className="font-mono text-3xl font-bold tracking-wider text-white">{identity.name}</h2>
        <p className="font-mono text-sm text-muted">Agent #{String(identity.agentId).padStart(3, '0')}</p>

        <div className="my-8">
          <ReputationRing score={identity.reputationScore} />
        </div>

        <div className="grid gap-2 font-mono text-xs text-muted">
          <p>Born: Block #{identity.birthBlock.toLocaleString()}</p>
          <p>Chain: Mantle Mainnet</p>
          <p>Standard: ERC-8004</p>
          <p>Token ID: #{identity.agentId}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 font-mono text-xs">
          <a
            href="https://mantlescan.xyz"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-bg/60 px-3 py-1.5 text-muted transition-colors hover:border-border-hover hover:text-moixa"
          >
            View on MantleScan ↗
          </a>
          <a
            href="#"
            className="rounded-md border border-border bg-bg/60 px-3 py-1.5 text-muted transition-colors hover:border-border-hover hover:text-moixa"
          >
            View NFT Metadata ↗
          </a>
        </div>
      </div>
    </Card>
  );
}
