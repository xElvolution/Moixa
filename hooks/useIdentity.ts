'use client';

import { useEffect, useState } from 'react';
import type { AgentIdentity } from '@/types';

// Genesis state, matching the on-chain mint (MoixaIdentity: reputation 500,
// zero history). Real values arrive from the agent / contract.
const GENESIS: AgentIdentity = {
  agentId: 1,
  name: 'MOIXA',
  birthBlock: 0,
  totalTrades: 0,
  correctTrades: 0,
  totalVolume: 0,
  winRate: 0,
  sharpeRatio: 0,
  maxDrawdown: 0,
  reputationScore: 500,
};

export function useIdentity() {
  const [identity, setIdentity] = useState<AgentIdentity>(GENESIS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/identity');
        const data = (await r.json()) as Partial<AgentIdentity>;
        if (mounted && data && typeof data.reputationScore === 'number') {
          setIdentity({ ...GENESIS, ...data });
        }
      } catch {
        /* keep genesis until the agent responds */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { identity, setIdentity, loading };
}
