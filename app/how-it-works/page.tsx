'use client';

import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { SignalFlow } from '@/components/animations/SignalFlow';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MagneticButton } from '@/components/animations/MagneticButton';

const STEPS = [
  {
    title: 'Detect',
    body:
      'MOIXA scans six market signals in parallel — momentum, volume anomalies, smart-money flow, funding rates, liquidity depth, cross-asset correlation. Signals weaker than 50% strength are discarded.',
  },
  {
    title: 'Reason',
    body:
      'GPT-4o ingests the signals plus market context and current positions. It produces a structured decision (direction, size, leverage, confidence, risk, expected return, reasoning).',
  },
  {
    title: 'Record',
    body:
      'Before the trade fires, the full decision is written to the MoixaBrain contract on Mantle. Reasoning, confidence, expected outcome — all permanent.',
  },
  {
    title: 'Execute',
    body:
      'Spot trades route through Merchant Moe; perps through Fluxion; LP entries through Agni. Trades are executed via the MoixaExecutor contract using MOIXA’s wallet.',
  },
  {
    title: 'Close',
    body:
      'Positions monitor in the background. On exit, the actual return + a learning note are appended to the on-chain record. Reputation updates.',
  },
  {
    title: 'Evolve',
    body:
      'Every 10 trades, MOIXA’s ERC-8004 identity is recalculated and re-recorded on-chain. Reputation is unfakeable, unreversible, and growing.',
  },
];

const TECH = [
  { label: 'Layer', value: 'Mantle Mainnet · Chain 5000' },
  { label: 'Identity', value: 'ERC-8004 Agent NFT' },
  { label: 'Reasoning', value: 'GPT-4o · structured JSON' },
  { label: 'Stream', value: 'WebSocket · <100ms latency' },
  { label: 'DB', value: 'Supabase + Prisma mirror of on-chain state' },
  { label: 'Frontend', value: 'Next.js 14 · Framer · GSAP · Recharts' },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-16">
      <ScrollReveal>
        <header className="mb-10 text-center">
          <Badge tone="moixa" className="mb-3">PIPELINE</Badge>
          <h1 className="text-fluid-h2 font-bold tracking-tightish text-white">
            How MOIXA thinks.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted">
            Six steps from raw market signal to permanent on-chain record.
          </p>
        </header>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <Card className="overflow-hidden p-6">
          <div className="h-[280px]">
            <SignalFlow />
          </div>
        </Card>
      </ScrollReveal>

      <section className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <ScrollReveal key={s.title} delay={i * 0.05}>
            <Card className="h-full p-6">
              <div className="font-mono text-xs text-muted">STEP {String(i + 1).padStart(2, '0')}</div>
              <h3 className="mt-2 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.body}</p>
            </Card>
          </ScrollReveal>
        ))}
      </section>

      <ScrollReveal delay={0.1}>
        <Card className="mt-14 p-6">
          <h2 className="text-lg font-bold text-white">Architecture at a glance</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {TECH.map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between rounded-md border border-border bg-bg/40 px-4 py-3 font-mono text-sm"
              >
                <span className="text-muted">{t.label}</span>
                <span className="text-white">{t.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={0.15}>
        <div className="mt-14 flex justify-center">
          <MagneticButton href="/command">
            <span className="inline-flex h-12 items-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black shadow-[0_0_36px_-8px_rgba(0,255,209,0.5)]">
              Watch MOIXA think →
            </span>
          </MagneticButton>
        </div>
      </ScrollReveal>
    </div>
  );
}
