'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function SignalFlow({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;

    (async () => {
      const { gsap } = await import('gsap');
      const { MotionPathPlugin } = await import('gsap/MotionPathPlugin');
      if (cancelled) return;
      gsap.registerPlugin(MotionPathPlugin);

      const svg = ref.current!;
      const paths = svg.querySelectorAll<SVGPathElement>('path[data-flow]');
      paths.forEach((path, i) => {
        const dots = svg.querySelectorAll<SVGCircleElement>(`circle[data-dot="${i}"]`);
        dots.forEach((dot, d) => {
          gsap.to(dot, {
            duration: 3.6,
            repeat: -1,
            ease: 'none',
            delay: d * 1.0 + i * 0.4,
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
            },
          });
        });
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 900 280"
      className={cn('w-full h-full', className)}
      fill="none"
    >
      <defs>
        <linearGradient id="flow-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#6C5CE7" />
        </linearGradient>
        <filter id="flow-glow">
          <feGaussianBlur stdDeviation="3" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[
        { id: 'Market Data', x: 80 },
        { id: 'Brain', x: 320 },
        { id: 'Decision', x: 580 },
        { id: 'Chain', x: 820 },
      ].map((node, i) => (
        <g key={node.id} transform={`translate(${node.x},140)`}>
          <circle r="34" fill="#0A0A0F" stroke="url(#flow-gradient)" strokeWidth="1.5" />
          <text
            textAnchor="middle"
            y="-50"
            fill="#6B7280"
            fontFamily="JetBrains Mono"
            fontSize="11"
            letterSpacing="2"
          >
            {String(i + 1).padStart(2, '0')}
          </text>
          <text
            textAnchor="middle"
            y="6"
            fill="#FFFFFF"
            fontFamily="Inter"
            fontSize="13"
            fontWeight="600"
          >
            {node.id}
          </text>
        </g>
      ))}

      {[
        ['M 114 140 C 200 60, 240 60, 286 140', 0],
        ['M 354 140 C 440 220, 480 220, 546 140', 1],
        ['M 614 140 C 700 60, 740 60, 786 140', 2],
      ].map(([d, i]) => (
        <g key={i as number}>
          <path d={d as string} stroke="url(#flow-gradient)" strokeWidth="1.5" data-flow filter="url(#flow-glow)" />
          {[0, 1, 2].map((dotIdx) => (
            <circle
              key={dotIdx}
              data-dot={i}
              r="3.5"
              fill="#00FFD1"
              filter="url(#flow-glow)"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
