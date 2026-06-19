'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AgentSummary {
  agentId: number;
  name: string;
  address: string;
  reputationScore: number;
  totalTrades: number;
  correctTrades?: number;
  winRate: number;
  totalVolume: number;
  sharpeRatio?: number;
}

export function useAgents(pollMs = 15000) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/agents');
      const data = await r.json();
      // tolerate both the live shape and the Neon row shape (tokenId)
      const list: AgentSummary[] = (data?.agents ?? []).map((a: any) => ({
        agentId: a.agentId ?? a.tokenId,
        name: a.name ?? `Agent #${a.agentId ?? a.tokenId}`,
        address: a.address ?? '',
        reputationScore: a.reputationScore ?? 500,
        totalTrades: a.totalTrades ?? 0,
        correctTrades: a.correctTrades ?? 0,
        winRate: a.winRate ?? 0,
        totalVolume: a.totalVolume ?? 0,
        sharpeRatio: a.sharpeRatio ?? 0,
      }));
      setAgents(list);
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { agents, loading, refresh };
}
