'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function TextSplit({
  children,
  className,
  delay = 0,
  stagger = 0.02,
  as: Tag = 'span',
}: {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: keyof JSX.IntrinsicElements;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    let mounted = true;

    (async () => {
      const { gsap } = await import('gsap');
      if (!mounted || !ref.current) return;
      const chars = ref.current.querySelectorAll<HTMLElement>('[data-c]');
      gsap.fromTo(
        chars,
        { y: '110%', opacity: 0 },
        {
          y: '0%',
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out',
          stagger,
          delay,
        }
      );
    })();

    return () => {
      mounted = false;
    };
  }, [children, delay, stagger]);

  const TagRef = Tag as any;
  return (
    <TagRef ref={ref} className={cn('inline-block overflow-hidden align-baseline', className)}>
      {Array.from(children).map((c, i) => (
        <span
          key={`${c}-${i}`}
          data-c
          style={{ display: 'inline-block', whiteSpace: c === ' ' ? 'pre' : 'normal' }}
        >
          {c}
        </span>
      ))}
    </TagRef>
  );
}
