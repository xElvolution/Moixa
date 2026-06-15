'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Wave {
  baseY: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
  spike: number;
}

export function BrainWave({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const wavesRef = useRef<Wave[]>([]);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const colors = ['#00FFD1', '#6C5CE7', '#00FFD1', '#6C5CE7', '#00FFD1'];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      wavesRef.current = Array.from({ length: 5 }, (_, i) => ({
        baseY: height * (0.2 + i * 0.15),
        amplitude: 10 + i * 4,
        frequency: 0.005 + i * 0.0008,
        speed: 0.012 + i * 0.004,
        color: colors[i % colors.length],
        spike: 0,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const I = intensityRef.current;

      wavesRef.current.forEach((w) => {
        if (I > 1 && Math.random() < 0.02 * I) {
          w.spike = Math.min(80 * I, w.spike + 22 * I);
        }
        w.spike *= 0.93;

        ctx.beginPath();
        ctx.moveTo(0, w.baseY);
        for (let x = 0; x <= width; x += 4) {
          const y =
            w.baseY +
            Math.sin(x * w.frequency + t * w.speed) * (w.amplitude + w.spike * 0.5) +
            Math.sin(x * w.frequency * 2.3 + t * w.speed * 1.7) * (w.amplitude * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = 0.12 + Math.min(0.18, w.spike / 200);
        ctx.lineWidth = 1.5;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 18;
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      t += 1;
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 h-full w-full pointer-events-none', className)}
    />
  );
}
