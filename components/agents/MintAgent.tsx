'use client';

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { ConnectWallet } from '@/components/wallet/ConnectWallet';
import { useAgents, type AgentSummary } from '@/hooks/useAgents';
import { cn, mantleScanTxUrl } from '@/lib/utils';

const TOKENS = ['ETH', 'BTC', 'MNT'] as const;

export function MintAgent() {
  const { address, isConnected } = useAccount();
  const { agents, refresh } = useAgents();
  const [name, setName] = useState('');
  const [minting, setMinting] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [mintTx, setMintTx] = useState<string | null>(null);

  const myAgent: AgentSummary | undefined = useMemo(
    () => agents.find((a) => address && a.address.toLowerCase() === address.toLowerCase()),
    [agents, address]
  );

  const mint = async () => {
    if (!address) return;
    setMinting(true);
    setMsg('');
    try {
      const r = await fetch('/api/agents/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, name: name || 'My MOIXA Agent' }),
      });
      const data = await r.json();
      if (data?.error) {
        setMsg(data.error);
      } else {
        if (data.txHash) setMintTx(data.txHash);
        setMsg(
          data.already
            ? `You already own Agent #${data.agentId}.`
            : `Minted Agent #${data.agentId}! It starts at reputation 500.`
        );
        await refresh();
      }
    } catch {
      setMsg('Could not reach MOIXA to mint.');
    } finally {
      setMinting(false);
    }
  };

  const analyze = async (token: string) => {
    if (!myAgent) return;
    setAnalyzing(token);
    setMsg('');
    try {
      const r = await fetch(`/api/agents/${myAgent.agentId}/analyze/${token}`, {
        method: 'POST',
      });
      const data = await r.json();
      if (data?.error) setMsg(data.error);
      else {
        setMsg(`Your agent is analyzing ${token} - the decision lands on Mantle in seconds.`);
        window.setTimeout(refresh, 18000);
      }
    } catch {
      setMsg('Could not reach MOIXA.');
    } finally {
      window.setTimeout(() => setAnalyzing(null), 1500);
    }
  };

  if (!isConnected) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-bold text-white">Mint your own MOIXA agent</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Connect a wallet to mint your own AI trading agent. Ask it to analyze markets and watch its
          reputation grow on-chain. Free on Mantle Sepolia - we sponsor the gas.
        </p>
        <div className="mt-5 flex justify-center">
          <ConnectWallet />
        </div>
      </Card>
    );
  }

  if (myAgent) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">your agent</p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {myAgent.name} <span className="text-muted">#{myAgent.agentId}</span>
            </h3>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-mantle">{myAgent.reputationScore}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">reputation</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
          <Stat label="Trades" value={String(myAgent.totalTrades)} />
          <Stat label="Win rate" value={`${Math.round((myAgent.winRate || 0) * 100)}%`} />
          <Stat label="Volume" value={`$${Math.round((myAgent.totalVolume || 0) / 100)}`} />
        </div>

        <p className="mt-5 text-sm text-muted">Ask your agent to analyze a market:</p>
        <div className="mt-2 flex gap-2">
          {TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              disabled={!!analyzing}
              onClick={() => analyze(t)}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50',
                analyzing === t
                  ? 'border-moixa bg-moixa/15 text-moixa'
                  : 'border-border text-muted hover:border-moixa/50 hover:text-moixa'
              )}
            >
              {analyzing === t ? '…' : t}
            </button>
          ))}
        </div>
        {msg && <p className="mt-3 font-mono text-xs text-moixa">{msg}</p>}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-white">Mint your own MOIXA agent</h3>
      <p className="mt-2 text-sm text-muted">
        One agent per wallet. It mints as an on-chain ERC-8004 identity at reputation 500 and grows
        from real outcomes. Gas is sponsored - you pay nothing.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name your agent (e.g. AlphaSeeker)"
        maxLength={32}
        className="mt-4 w-full rounded-md border border-border bg-bg/60 px-3 py-2.5 font-mono text-sm text-white outline-none placeholder:text-muted focus:border-moixa/50"
      />
      <button
        type="button"
        onClick={mint}
        disabled={minting}
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md bg-moixa-gradient px-6 text-sm font-bold text-black transition-all hover:brightness-110 disabled:opacity-60"
      >
        {minting ? 'Minting…' : 'Mint my agent (free)'}
      </button>
      {msg && <p className="mt-3 font-mono text-xs text-moixa">{msg}</p>}
      {mintTx && (
        <a
          href={mantleScanTxUrl(mintTx)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block font-mono text-xs text-moixa hover:underline"
        >
          View mint transaction →
        </a>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg/40 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="mt-1 text-white">{value}</div>
    </div>
  );
}
