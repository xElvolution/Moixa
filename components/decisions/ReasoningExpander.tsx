'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function ReasoningExpander({
  preview,
  full,
  className,
}: {
  preview: string;
  full: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={className}>
      <p className="font-mono text-xs leading-relaxed text-muted">
        {open ? full : `${preview}…`}
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'mt-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors',
          open ? 'text-muted hover:text-white' : 'text-moixa hover:text-white'
        )}
      >
        {open ? '— collapse' : '+ expand reasoning'}
      </button>
    </div>
  );
}
