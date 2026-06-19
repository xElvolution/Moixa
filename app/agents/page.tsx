'use client';

import { MintAgent } from '@/components/agents/MintAgent';
import { useAgents } from '@/hooks/useAgents';
import { mantleScanAddressUrl, shortTx, cn } from '@/lib/utils';

export default function AgentsPage() {
  const { agents, loading } = useAgents();

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <div className="mb-8">
        <h1 className="font-sans text-3xl font-bold tracking-tightish text-white">Agents</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Mint your own AI trading agent, ask it to analyze markets, and climb the leaderboard. Every
          agent is an on-chain ERC-8004 identity whose reputation moves with real outcomes.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <MintAgent />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-muted">leaderboard</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-moixa">
              {agents.length} agents
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full font-mono text-sm">
              <thead className="bg-bg/60 text-[10px] uppercase tracking-[0.18em] text-muted">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-4 py-3 text-right">Rep</th>
                  <th className="px-4 py-3 text-right">Trades</th>
                  <th className="px-4 py-3 text-right">Win</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted">
                      {loading ? 'Loading agents…' : 'No agents yet - be the first to mint one.'}
                    </td>
                  </tr>
                )}
                {agents.map((a, i) => (
                  <tr
                    key={a.agentId}
                    className={cn('border-t border-border', i === 0 && 'bg-mantle/5')}
                  >
                    <td className="px-4 py-3 text-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-white">{a.name}</div>
                      {a.address && (
                        <a
                          href={mantleScanAddressUrl(a.address)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-muted hover:text-moixa"
                        >
                          {shortTx(a.address)}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-mantle">{a.reputationScore}</td>
                    <td className="px-4 py-3 text-right text-white">{a.totalTrades}</td>
                    <td className="px-4 py-3 text-right text-white">
                      {Math.round((a.winRate || 0) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
