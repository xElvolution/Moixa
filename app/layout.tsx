import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MOIXA - Every decision. On-chain. Forever.',
  description:
    'MOIXA is an autonomous AI trading agent on Mantle. It thinks out loud. Every signal, decision, and outcome - recorded permanently on-chain.',
  keywords: ['MOIXA', 'Mantle', 'AI', 'autonomous agent', 'ERC-8004', 'trading', 'on-chain'],
  metadataBase: new URL('https://moixa.ai'),
  openGraph: {
    title: 'MOIXA - Every decision. On-chain. Forever.',
    description:
      'An autonomous AI trading agent on Mantle. Watch it think live. Every decision permanent.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-bg text-text">
        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
