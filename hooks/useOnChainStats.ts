'use client';

import { useEffect, useState } from 'react';
import { Contract } from 'ethers';
import {
  getMantleProvider,
  BRAIN_ADDRESS,
  IDENTITY_ADDRESS,
  BRAIN_ABI,
  IDENTITY_ABI,
} from '@/lib/mantle';

export interface OnChainStats {
  totalDecisions: number;
  correctDecisions: number;
  accuracy: number; // 0-1
  totalVolume: number; // raw uint (cents) -> we expose as-is; UI formats
  reputation: number;
  loading: boolean;
  ok: boolean;
}

const EMPTY: OnChainStats = {
  totalDecisions: 0,
  correctDecisions: 0,
  accuracy: 0,
  totalVolume: 0,
  reputation: 500,
  loading: true,
  ok: false,
};

// Reads MOIXA's stats DIRECTLY from the Mantle contracts (trustless) - no agent
// or backend in the path, so the numbers are provably from chain.
export function useOnChainStats(pollMs = 20000): OnChainStats {
  const [stats, setStats] = useState<OnChainStats>(EMPTY);

  useEffect(() => {
    if (!BRAIN_ADDRESS) {
      setStats((s) => ({ ...s, loading: false }));
      return;
    }
    let mounted = true;
    const provider = getMantleProvider();
    const brain = new Contract(BRAIN_ADDRESS, BRAIN_ABI, provider);
    const identity = IDENTITY_ADDRESS
      ? new Contract(IDENTITY_ADDRESS, IDENTITY_ABI, provider)
      : null;

    const load = async () => {
      try {
        const [total, correct, accuracyBps, volume] = await brain.getTotalStats();
        let reputation = 500;
        if (identity) {
          try {
            const p = await identity.getProfile(1);
            reputation = Number(p.reputationScore);
          } catch {
            /* identity may not be minted yet */
          }
        }
        if (!mounted) return;
        setStats({
          totalDecisions: Number(total),
          correctDecisions: Number(correct),
          accuracy: Number(accuracyBps) / 10000,
          totalVolume: Number(volume),
          reputation,
          loading: false,
          ok: true,
        });
      } catch {
        if (mounted) setStats((s) => ({ ...s, loading: false, ok: false }));
      }
    };
    load();
    const id = window.setInterval(load, pollMs);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return stats;
}
