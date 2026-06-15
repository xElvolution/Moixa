'use client';

import { useEffect, useState } from 'react';
import type { Decision } from '@/types';

export function useDecisions(limit = 50) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/decisions?limit=${limit}`);
        const data = await r.json();
        if (mounted && Array.isArray(data?.decisions)) {
          setDecisions(data.decisions);
        }
      } catch {
        if (mounted) setDecisions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { decisions, loading };
}
