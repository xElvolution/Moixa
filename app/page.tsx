'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BrainWave } from '@/components/animations/BrainWave';
import { CounterAnimation } from '@/components/animations/CounterAnimation';
import { MagneticButton } from '@/components/animations/MagneticButton';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { SignalFlow } from '@/components/animations/SignalFlow';
import { TextSplit } from '@/components/animations/TextSplit';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveDot } from '@/components/ui/LiveDot';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    title: 'Every thought. On-chain.',
    description:
      'Not just the trade — the full reasoning. Market context, signal detected, confidence score, risk assessment, expected outcome, actual outcome, learning note. All of it. Permanent. On Mantle.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00FFD1" strokeWidth="1.6">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
        <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
      </svg>
    ),
    tone: 'moixa' as const,
    visual: (
      <pre className="font-mono text-[11px] leading-relaxed text-muted">
        <span className="text-moixa">struct</span> Decision {'{'}
        {`\n  signal: "VOLUME_SPIKE",`}
        {`\n  confidence: 0.847,`}
        {`\n  direction: "LONG",`}
        {`\n  token: "ETH",`}
        {`\n  size: 500 USDC,`}
        {`\n  risk: "LOW",`}
        {`\n  expected: +230 bps,`}
        {`\n  actual: +210 bps ✓`}
        {`\n}`}
      </pre>
    ),
    cta: 'View Decision #247 →',
    href: '/decisions',
  },
  {
    title: 'MOIXA has a soul.',
    description:
      'The first trading agent with an on-chain identity that grows. Reputation score, win rate, total volume — all stored in an ERC-8004 NFT that evolves with every decision. Unfakeable. Permanent.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C5CE7" strokeWidth="1.6">
        <circle cx="12" cy="6" r="2" />
        <circle cx="6" cy="14" r="2" />
        <circle cx="18" cy="14" r="2" />
        <circle cx="12" cy="20" r="2" />
        <path d="M12 8v4M8 14h8M10 16l2 2 2-2" />
      </svg>
    ),
    tone: 'mantle' as const,
    visual: (
      <div className="font-mono text-xs text-muted">
        <div className="text-mantle">MOIXA Agent #001</div>
        <div className="mt-1.5">Reputation <span className="text-white">847</span> / 1000</div>
        <div>Trades <span className="text-white">247</span></div>
        <div>Win rate <span className="text-white">68.2%</span></div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card">
          <div className="h-full w-[84.7%] bg-mantle" />
        </div>
      </div>
    ),
    cta: 'View Identity →',
    href: '/identity',
  },
  {
    title: 'Built to be watched.',
    description:
      'The live command center shows MOIXA analyzing, reasoning, and deciding in real time. Judges and audiences watch an AI think. The confidence score builds on screen. The trade fires. The record appears on Mantle.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.6">
        <circle cx="12" cy="12" r="3" />
        <path d="M2 12c2.5-5 6-7 10-7s7.5 2 10 7c-2.5 5-6 7-10 7s-7.5-2-10-7Z" />
      </svg>
    ),
    tone: 'orange' as const,
    visual: (
      <div className="space-y-2 font-mono text-[11px]">
        <div className="text-muted">
          <span className="text-moixa">●</span> ANALYZING ETH/USDC...
        </div>
        <div className="text-muted">
          <span className="text-moixa">●</span> Volume +340% above avg
        </div>
        <div className="text-muted">
          <span className="text-moixa">●</span> Confidence 84.7% ▲
        </div>
        <div className="text-win-green">
          <span>▲</span> LONG ETH | $500 | EXECUTING
        </div>
      </div>
    ),
    cta: 'Watch Live →',
    href: '/command',
  },
];

const TERMINAL_STEPS = [
  '> Signal: ETH momentum breakout | Volume +340% | Confidence: 72% → 84.7%',
  '> Decision recorded on Mantle | tx 0x7f3a...8b2c | Block #8,294,771',
  '> Executing on Merchant Moe | $500 → 0.152 ETH @ $3,284.50',
  '> Position closes | +2.1% in 27s | Reputation 847 → 851',
  '> Learning note logged on-chain | Every step permanent',
];

const MANTLE_COMPARE: Array<[string, string, string, 'good' | 'bad']> = [
  ['Finality', '1 block', '12+ blocks', 'good'],
  ['Gas cost', '~$0.01', '$15–180', 'good'],
  ['EVM Compatible', 'Yes', 'Yes', 'good'],
  ['On-chain recording', 'Viable', 'Too expensive', 'good'],
];

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      <LiveStats />
      <DemoMoment />
      <WhyMantle />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <BrainWave className="opacity-90" intensity={1.2} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-moixa-radial" />

      <div className="relative mx-auto flex max-w-container flex-col items-center px-6 pt-24 pb-32 text-center md:pt-32 md:pb-44">
        <Badge tone="moixa" className="mb-7 px-3 py-1.5 text-[11px]">
          <LiveDot tone="cyan" />
          LIVE ON MANTLE
          <span className="text-muted">· Every decision recorded on-chain</span>
        </Badge>

        <h1 className="font-sans font-bold leading-[1.05] tracking-tightish text-fluid-h1">
          <TextSplit className="text-white">Every decision.</TextSplit>
          <br />
          <TextSplit className="gradient-text" delay={0.15} stagger={0.025}>
            On-chain. Forever.
          </TextSplit>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-7 max-w-xl text-[15px] leading-relaxed text-muted"
        >
          MOIXA is an autonomous AI trading agent on Mantle. It thinks out loud. Every signal,
          every decision, every outcome — recorded permanently on-chain. Watch it happen live.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <MagneticButton href="/command">
            <span className="inline-flex h-12 items-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black shadow-[0_0_36px_-8px_rgba(0,255,209,0.5)] transition-all hover:brightness-110">
              Watch MOIXA Think →
            </span>
          </MagneticButton>
          <MagneticButton href="/decisions">
            <span className="inline-flex h-12 items-center rounded-md border border-border bg-card/50 px-6 text-sm font-medium text-white transition-all hover:border-border-hover">
              View Decision History
            </span>
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-14 max-w-2xl rounded-md border border-border bg-card/40 px-4 py-3 font-mono text-xs text-muted"
        >
          Last decision:{' '}
          <span className="text-win-green">LONG ETH</span> | 84.7% confidence |{' '}
          <span className="text-win-green">+2.1%</span> actual return | Recorded: Block #8,294,771
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-container">
        <ScrollReveal>
          <div className="mb-14 text-center">
            <h2 className="font-sans font-bold tracking-tightish text-fluid-h2 text-white">
              What makes MOIXA different.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Three features judges said didn’t exist. We built all three.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <Card className="h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                <Badge tone={f.tone} className="px-2.5 py-1.5">
                  {f.icon}
                </Badge>
                <h3 className="mt-5 text-xl font-bold tracking-tightish text-white">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{f.description}</p>
                <div className="my-6 rounded-md border border-border bg-bg/60 p-4">{f.visual}</div>
                <Link
                  href={f.href}
                  className={cn(
                    'inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors',
                    f.tone === 'moixa' && 'text-moixa hover:text-white',
                    f.tone === 'mantle' && 'text-mantle hover:text-white',
                    f.tone === 'orange' && 'text-warn hover:text-white'
                  )}
                >
                  {f.cta}
                </Link>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function LiveStats() {
  return (
    <section className="relative bg-surface px-6 py-20">
      <div className="mx-auto grid max-w-container gap-10 md:grid-cols-4">
        {[
          { to: 247, label: 'Decisions Recorded', suffix: '' },
          { to: 68, label: 'Accuracy Rate', suffix: '%' },
          { to: 124_500, label: 'Total Volume', prefix: '$' },
          { to: 847, label: 'Reputation Score', suffix: '/1000' },
        ].map((s) => (
          <ScrollReveal key={s.label}>
            <div className="text-center md:text-left">
              <div className="font-mono text-[clamp(2.5rem,4vw,3.5rem)] font-bold text-moixa drop-shadow-[0_0_18px_rgba(0,255,209,0.35)]">
                <CounterAnimation to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                {s.label}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function DemoMoment() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-container">
        <ScrollReveal>
          <h2 className="font-sans font-bold tracking-tightish text-fluid-h2 text-white">
            The demo that wins rooms.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            From signal detection to on-chain finalization in under 18 seconds.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="mt-12 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border bg-bg/60 px-5 py-3 font-mono text-xs text-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-loss-red/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-win-green/80" />
              <span className="ml-3">moixa@mantle: ~ live</span>
              <span className="ml-auto">block #8,294,771</span>
            </div>
            <div className="space-y-3 p-7 font-mono text-sm">
              {TERMINAL_STEPS.map((line, i) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  className="terminal-line"
                >
                  <span className="prompt">›</span>
                  {line.replace(/^>\s*/, '')}
                </motion.div>
              ))}
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mt-10 flex justify-center">
            <MagneticButton href="/command">
              <span className="inline-flex h-12 items-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black shadow-[0_0_36px_-8px_rgba(0,255,209,0.5)]">
                Watch it happen →
              </span>
            </MagneticButton>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-20">
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              SIGNAL FLOW
            </p>
            <div className="relative h-[280px] rounded-xl border border-border bg-card/50">
              <SignalFlow />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function WhyMantle() {
  return (
    <section className="relative bg-surface px-6 py-24">
      <div className="mx-auto max-w-container">
        <ScrollReveal>
          <h2 className="font-sans font-bold tracking-tightish text-fluid-h2 text-white">
            Why Mantle. Not Ethereum.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Recording every AI decision on Ethereum would cost $180+ per decision. On Mantle it
            costs $0.01. MOIXA makes 50+ decisions per day. The math only works on Mantle.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <Card className="mt-12 overflow-hidden">
            <table className="w-full font-mono text-sm">
              <thead className="bg-bg/60 text-xs uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-6 py-4 text-left">Feature</th>
                  <th className="px-6 py-4 text-left text-moixa">Mantle</th>
                  <th className="px-6 py-4 text-left text-muted">Ethereum</th>
                </tr>
              </thead>
              <tbody>
                {MANTLE_COMPARE.map(([feature, mantle, eth], i) => (
                  <tr key={feature} className={cn('border-t border-border', i % 2 && 'bg-white/[0.02]')}>
                    <td className="px-6 py-4 text-white">{feature}</td>
                    <td className="px-6 py-4 text-moixa">
                      <span className="mr-2 inline-block">✓</span>
                      {mantle}
                    </td>
                    <td className="px-6 py-4 text-warn">
                      <span className="mr-2 inline-block">!</span>
                      {eth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}
