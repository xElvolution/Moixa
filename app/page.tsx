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
import { cn, formatBps, mantleScanTxUrl, shortTx, timeAgo } from '@/lib/utils';
import { useDecisions } from '@/hooks/useDecisions';
import { useOnChainStats } from '@/hooks/useOnChainStats';

const FEATURES = [
  {
    title: 'Every thought. On-chain.',
    description:
      'Not just the trade - the full reasoning. Market context, signal detected, confidence score, risk assessment, expected outcome, actual outcome, learning note. All of it. Permanent. On Mantle.',
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
    cta: 'Explore decisions →',
    href: '/decisions',
  },
  {
    title: 'MOIXA has a soul.',
    description:
      'The first trading agent with an on-chain identity that grows. Reputation score, win rate, total volume - all stored in an ERC-8004 NFT that evolves with every decision. Unfakeable. Permanent.',
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
        <div className="text-mantle">MOIXA Agent #1</div>
        <div className="mt-1.5">Reputation starts at <span className="text-white">500</span> / 1000</div>
        <div>Moves with every <span className="text-white">real outcome</span></div>
        <div>Win rate, Sharpe, drawdown - all on-chain</div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card">
          <div className="h-full w-1/2 bg-mantle" />
        </div>
      </div>
    ),
    cta: 'View identity →',
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
          <span className="text-moixa"></span> ANALYZING ETH/USDC...
        </div>
        <div className="text-muted">
          <span className="text-moixa"></span> Volume +340% above avg
        </div>
        <div className="text-muted">
          <span className="text-moixa"></span> Confidence 84.7% ▲
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

const MANTLE_COMPARE: Array<[string, string, string, 'good' | 'bad']> = [
  ['Finality', '1 block', '12+ blocks', 'good'],
  ['Gas cost', '~$0.01', '$15-180', 'good'],
  ['EVM Compatible', 'Yes', 'Yes', 'good'],
  ['On-chain recording', 'Viable', 'Too expensive', 'good'],
];

export default function Page() {
  return (
    <>
      <Hero />
      <Features />
      <LiveStats />
      <HowItWorks />
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
          every decision, every outcome - recorded permanently on-chain. Watch it happen live.
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

        <HeroLastDecision />
      </div>
    </section>
  );
}

function HeroLastDecision() {
  const { decisions } = useDecisions(1);
  const d = decisions[0];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.1, duration: 0.6 }}
      className="mt-14 max-w-2xl rounded-md border border-border bg-card/40 px-4 py-3 font-mono text-xs text-muted"
    >
      {d ? (
        <span>
          Last decision:{' '}
          <span className={d.decision === 'FLAT' ? 'text-muted' : 'text-win-green'}>
            {d.decision} {d.token}
          </span>{' '}
          | {(d.confidenceScore * 100).toFixed(1)}% confidence
          {typeof d.actualReturn === 'number' && d.decision !== 'FLAT' && (
            <>
              {' '}
              | <span className={d.actualReturn >= 0 ? 'text-win-green' : 'text-loss-red'}>
                {formatBps(d.actualReturn)}
              </span>
            </>
          )}
          {d.txHash && (
            <>
              {' '}
              |{' '}
              <a
                href={mantleScanTxUrl(d.txHash)}
                target="_blank"
                rel="noreferrer"
                className="text-moixa hover:underline"
              >
                {shortTx(d.txHash)}
              </a>
            </>
          )}
          {d.timestamp && <> | {timeAgo(d.timestamp)}</>}
        </span>
      ) : (
        <span>Waiting for MOIXA&apos;s first on-chain decision…</span>
      )}
    </motion.div>
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
              Most trading bots are black boxes. MOIXA records its full reasoning, carries an
              evolving on-chain identity, and lets you watch and verify every decision.
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
  const s = useOnChainStats();
  const stats = [
    { to: s.totalDecisions, label: 'Decisions On-Chain', suffix: '', prefix: '' },
    { to: Math.round(s.accuracy * 100), label: 'Accuracy Rate', suffix: '%', prefix: '' },
    { to: Math.round(s.totalVolume / 100), label: 'Total Volume', prefix: '$', suffix: '' },
    { to: s.reputation, label: 'Reputation Score', suffix: '/1000', prefix: '' },
  ];
  return (
    <section className="relative bg-surface px-6 py-20">
      <div className="mx-auto max-w-container">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted md:text-left">
          <span className="text-moixa">●</span> Read live from the Mantle contracts - no backend in the path
        </p>
        <div className="grid gap-10 md:grid-cols-4">
          {stats.map((stat) => (
            <ScrollReveal key={stat.label}>
              <div className="text-center md:text-left">
                <div className="font-mono text-[clamp(2.5rem,4vw,3.5rem)] font-bold text-moixa drop-shadow-[0_0_18px_rgba(0,255,209,0.35)]">
                  <CounterAnimation to={stat.to} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: '01',
    title: 'Watch it think',
    body: 'Open the command center to see MOIXA pull live market signals and reason in real time - confidence building on screen before it decides.',
    href: '/command',
    cta: 'Open command center',
  },
  {
    n: '02',
    title: 'Ask MOIXA',
    body: 'Pick a token and ask MOIXA to analyze it. It runs a real decision, records it on Mantle, and hands you the transaction - live.',
    href: '/command',
    cta: 'Ask MOIXA',
  },
  {
    n: '03',
    title: 'Verify on-chain',
    body: 'Every decision, outcome and reputation update is a real transaction. Click any hash and read it yourself on Mantlescan. Nothing is faked.',
    href: '/decisions',
    cta: 'See decisions',
  },
  {
    n: '04',
    title: 'Mint your own agent',
    body: 'Connect a wallet and mint your own AI trading agent. Ask it to analyze markets and watch its reputation grow on-chain. Climb the leaderboard.',
    href: '/agents',
    cta: 'Mint an agent',
  },
];

function HowItWorks() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-container">
        <ScrollReveal>
          <h2 className="font-sans font-bold tracking-tightish text-fluid-h2 text-white">
            How you use MOIXA.
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Watch the agent think, ask it to analyze a market, verify the result on-chain, then mint
            your own agent and grow its reputation.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 0.08}>
              <Card className="flex h-full flex-col p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="font-mono text-sm text-moixa">{s.n}</span>
                <h3 className="mt-3 text-lg font-bold tracking-tightish text-white">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.body}</p>
                <Link
                  href={s.href}
                  className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-moixa transition-colors hover:text-white"
                >
                  {s.cta} →
                </Link>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.15}>
          <div className="mt-12 flex justify-center">
            <MagneticButton href="/command">
              <span className="inline-flex h-12 items-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black shadow-[0_0_36px_-8px_rgba(0,255,209,0.5)]">
                Try it now →
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
