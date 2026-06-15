'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ThinkingDots } from '@/components/animations/ThinkingDots';

export function ReasoningFeed({ text }: { text: string }) {
  if (!text) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          reasoning feed <ThinkingDots />
        </div>
        <p className="mt-3 font-mono text-xs text-muted">
          Awaiting next reasoning cycle...
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        reasoning feed <ThinkingDots />
      </div>
      <motion.p
        key={text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3 font-mono text-xs leading-relaxed text-muted"
      >
        {text}
      </motion.p>
    </Card>
  );
}
