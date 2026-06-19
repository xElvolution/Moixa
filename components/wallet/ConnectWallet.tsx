'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { mantleSepolia } from '@/lib/wagmi';

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectWallet({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (!isConnected) {
    const injected = connectors[0];
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => injected && connect({ connector: injected })}
        className={cn(
          'inline-flex h-9 items-center rounded-md bg-moixa-gradient px-3.5 text-sm font-bold text-black shadow-[0_0_18px_rgba(0,255,209,0.25)] transition-all hover:brightness-110 disabled:opacity-60',
          className
        )}
      >
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }

  const wrongNetwork = chainId !== mantleSepolia.id && chainId !== 5000;

  return (
    <div className={cn('relative', className)}>
      {wrongNetwork ? (
        <button
          type="button"
          onClick={() => switchChain({ chainId: mantleSepolia.id })}
          className="inline-flex h-9 items-center rounded-md border border-warn/50 bg-warn/10 px-3 text-sm font-medium text-warn transition-all hover:bg-warn/20"
        >
          Switch to Mantle
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card/60 px-3 font-mono text-xs text-white transition-all hover:border-border-hover"
        >
          <span className="h-2 w-2 rounded-full bg-win-green" />
          {address ? short(address) : ''}
          <span className="text-muted">{chainId === 5000 ? 'Mainnet' : 'Sepolia'}</span>
        </button>
      )}
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-card p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="w-full rounded px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
