'use client';

import { Badge } from '@/components/ui/Badge';

export function OutcomeTag({ correct, ret }: { correct?: boolean | null; ret?: number | null }) {
  if (ret == null) return <Badge tone="muted">open</Badge>;
  if (ret === 0) return <Badge tone="muted">flat</Badge>;
  return correct ? (
    <Badge tone="green">win {(ret / 100).toFixed(2)}%</Badge>
  ) : (
    <Badge tone="red">loss {(ret / 100).toFixed(2)}%</Badge>
  );
}
