import Link from 'next/link';

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border bg-bg">
      <div className="mx-auto max-w-container px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-moixa/40 bg-moixa/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20 L4 4 L9 12 L14 4 L14 20 M14 12 L20 12"
                    stroke="#00FFD1"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="font-mono text-lg font-bold tracking-wider">MOIXA</span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted">
              The first trading agent that thinks out loud on-chain. Every signal, every decision,
              every outcome — permanent on Mantle.
            </p>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Every decision. On-chain. Forever.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Surfaces</h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ['/command', 'Command Center'],
                ['/decisions', 'Decisions'],
                ['/identity', 'Identity'],
                ['/performance', 'Performance'],
                ['/how-it-works', 'How It Works'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-muted transition-colors hover:text-moixa">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Infrastructure</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>Built on Mantle</li>
              <li>ERC-8004 Identity</li>
              <li>GPT-4o Reasoning</li>
              <li>WebSocket Live Feed</li>
              <li>Turing Test Hackathon 2026</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted md:flex-row md:items-center">
          <span className="font-mono">© 2026 MOIXA. All decisions logged on-chain.</span>
          <span className="font-mono">Mantle Chain ID 5000 · Agent #001</span>
        </div>
      </div>
    </footer>
  );
}
