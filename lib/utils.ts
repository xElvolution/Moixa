import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('en-US', opts).format(n);
}

export function formatUSD(n: number, fractionDigits = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

export function formatBps(bps: number) {
  const pct = bps / 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function shortAddress(addr: string) {
  if (!addr) return '';
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function shortTx(hash: string) {
  return shortAddress(hash);
}

export function timeAgo(date: Date | string | number) {
  const d = typeof date === 'object' ? date : new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Explorer host is env-driven so the same UI works on testnet or mainnet.
// Defaults to Mantle Sepolia (the demo network).
const EXPLORER_BASE = (
  process.env.NEXT_PUBLIC_MANTLE_EXPLORER || 'https://sepolia.mantlescan.xyz'
).replace(/\/+$/, '');

export function mantleScanTxUrl(hash: string) {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function mantleScanAddressUrl(address: string) {
  return `${EXPLORER_BASE}/address/${address}`;
}

export function mantleScanBlockUrl(block: number | string) {
  return `${EXPLORER_BASE}/block/${block}`;
}
