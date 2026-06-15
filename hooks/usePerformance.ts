'use client';

import { useEffect, useState } from 'react';

export interface PerformancePoint {
  date: string;
  portfolioValue: number;
}

export interface PerformanceData {
  timeframe: string;
  equityCurve: PerformancePoint[];
  stats: {
    totalTrades: number;
    correctTrades: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    reputationScore: number;
    totalVolume: number;
  };
}

const EMPTY: PerformanceData = {
  timeframe: '30d',
  equityCurve: [],
  stats: {
    totalTrades: 0,
    correctTrades: 0,
    winRate: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    reputationScore: 500,
    totalVolume: 0,
  },
};

export function usePerformance(timeframe: '7d' | '30d' | '90d' | 'all' = '30d') {
  const [data, setData] = useState<PerformanceData>({ ...EMPTY, timeframe });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/performance?timeframe=${timeframe}`);
        const fetched = await r.json();
        if (mounted && Array.isArray(fetched?.equityCurve)) {
          setData(fetched);
        }
      } catch {
        if (mounted) setData({ ...EMPTY, timeframe });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [timeframe]);

  return { data, loading };
}
