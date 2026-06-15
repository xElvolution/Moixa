'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LiveDot } from '@/components/ui/LiveDot';

const NAV = [
  { href: '/command', label: 'Command' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/identity', label: 'Identity' },
  { href: '/performance', label: 'Performance' },
  { href: '/how-it-works', label: 'How It Works' },
];

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-moixa/40 bg-moixa/10 transition-all group-hover:border-moixa group-hover:shadow-[0_0_18px_rgba(0,255,209,0.4)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 20 L4 4 L9 12 L14 4 L14 20 M14 12 L20 12"
            stroke="#00FFD1"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="font-mono text-base font-bold tracking-wider">MOIXA</span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                    active
                      ? 'text-moixa bg-moixa/10'
                      : 'text-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LiveDot tone="cyan" label="Live on Mantle" className="hidden sm:inline-flex" />
          <Link
            href="/command"
            className="inline-flex h-9 items-center rounded-md bg-moixa-gradient px-3.5 text-sm font-bold text-black shadow-[0_0_18px_rgba(0,255,209,0.25)] transition-all hover:brightness-110"
          >
            Watch Live
          </Link>
        </div>
      </div>
    </header>
  );
}
