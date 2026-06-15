'use client';

import { Badge } from './Badge';
import type { RiskLevel } from '@/types';

const map: Record<RiskLevel, 'green' | 'orange' | 'red'> = {
  LOW: 'green',
  MEDIUM: 'orange',
  HIGH: 'red',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge tone={map[level]} className="uppercase">
      {level} RISK
    </Badge>
  );
}
