'use client';

import { useEffect, useMemo } from 'react';
import { BrainWave } from '@/components/animations/BrainWave';
import { DecisionPanel } from '@/components/command/DecisionPanel';
import { IdentityCard } from '@/components/command/IdentityCard';
import { LiveChart } from '@/components/command/LiveChart';
import { MarketContext } from '@/components/command/MarketContext';
import { MoixaBrain } from '@/components/command/MoixaBrain';
import { TradeExecutor } from '@/components/command/TradeExecutor';
import { LiveDot } from '@/components/ui/LiveDot';
import { Badge } from '@/components/ui/Badge';
import { useDecisions } from '@/hooks/useDecisions';
import { useIdentity } from '@/hooks/useIdentity';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import type {
  AgentIdentity,
  BrainState,
  Decision,
  MarketSignal,
  RiskLevel,
  TradeDirection,
} from '@/types';

interface DerivedState {
  state: BrainState;
  token: string;
  signals: MarketSignal[];
  thinking: string;
  confidence: number;
  decision?: {
    direction: TradeDirection;
    token: string;
    size: number;
    confidence: number;
    riskLevel: RiskLevel;
    leverage: number;
    expectedReturn?: number;
    expectedTimeframe?: string;
    txHash?: string;
    onChainId?: number;
    protocol?: string;
  };
  executionPrice?: number;
  market?: Record<string, number>;
  reasoning?: string;
  entryPrice?: number;
}

const INITIAL: DerivedState = {
  state: 'IDLE',
  token: 'ETH',
  signals: [],
  thinking: '',
  confidence: 0,
};

export default function CommandPage() {
  const { events, latest, connected } = useLiveFeed(80);
  const { decisions } = useDecisions(20);
  const { identity, setIdentity } = useIdentity();

  // Real chain height: the highest block among recorded decisions (0 until the
  // first on-chain decision lands).
  const block = decisions.reduce((max, d) => Math.max(max, d.blockNumber ?? 0), 0);

  const derived = useMemo(() => deriveState(events), [events]);

  useEffect(() => {
    if (latest?.type === 'IDENTITY_UPDATED') {
      setIdentity((prev: AgentIdentity) => ({
        ...prev,
        reputationScore: latest.reputationScore,
        winRate: latest.winRate,
        totalTrades: latest.totalTrades,
      }));
    }
  }, [latest, setIdentity]);

  return (
    <div className="relative min-h-screen">
      <BrainWave className="opacity-30" intensity={derived.state === 'REASONING' ? 1.6 : 1} />

      <div className="relative">
        <CommandHeader block={block} connected={connected} />

        <div className="mx-auto grid max-w-[1480px] grid-cols-1 gap-5 px-6 py-6 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
          <aside className="rounded-xl border border-border bg-card/60 backdrop-blur-sm xl:h-[calc(100vh-140px)]">
            <MoixaBrain
              state={derived.state}
              token={derived.token}
              signals={derived.signals}
              thinking={derived.thinking}
              confidence={derived.confidence}
              decision={derived.decision}
              executionPrice={derived.executionPrice}
            />
          </aside>

          <section className="flex flex-col gap-5">
            <LiveChart
              highlightToken={derived.token}
              entryPrice={derived.entryPrice}
            />
            <MarketContext token={derived.token} />
            <TradeExecutor recent={decisions} />
            <DecisionPanel recent={decisions} />
          </section>

          <aside className="flex flex-col gap-5">
            <IdentityCard identity={identity} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function CommandHeader({ block, connected }: { block: number; connected: boolean }) {
  return (
    <div className="border-b border-border bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3 px-6 py-3">
        <div className="font-mono text-sm font-bold tracking-wider">COMMAND CENTER</div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="text-muted">Block</span>
          <span className="text-white tabular-nums">#{block.toLocaleString()}</span>
          <span className="text-muted">·</span>
          <LiveDot tone={connected ? 'cyan' : 'gray'} label={connected ? 'live on mantle' : 'reconnecting'} />
          <Badge tone="moixa">Mantle 5000</Badge>
        </div>
      </div>
    </div>
  );
}

function deriveState(events: any[]): DerivedState {
  if (!events.length) return INITIAL;
  const recent = events.slice(-12);
  const next: DerivedState = { ...INITIAL };
  let lastDecisionPayload: any = null;

  for (const e of recent) {
    switch (e.type) {
      case 'ANALYZING':
        next.state = 'ANALYZING';
        next.token = e.token ?? next.token;
        next.signals = e.signals ?? [];
        next.market = e.marketContext;
        break;
      case 'REASONING':
        next.state = 'REASONING';
        next.thinking = e.thinking ?? next.thinking;
        next.confidence = e.confidenceProgress ?? next.confidence;
        break;
      case 'DECISION':
        next.state = 'DECIDING';
        next.token = e.token ?? next.token;
        next.confidence = e.confidence ?? next.confidence;
        next.reasoning = e.reasoning;
        lastDecisionPayload = e;
        next.decision = {
          direction: e.decision,
          token: e.token,
          size: e.size,
          confidence: e.confidence,
          riskLevel: e.riskLevel ?? 'LOW',
          leverage: e.leverage ?? 1,
          expectedReturn: e.expectedReturn,
          expectedTimeframe: e.expectedTimeframe,
          txHash: e.txHash,
          onChainId: e.onChainId,
          protocol: e.protocol,
        };
        break;
      case 'EXECUTING':
        next.state = 'EXECUTING';
        if (next.decision) {
          next.decision.protocol = e.protocol ?? next.decision.protocol;
        }
        break;
      case 'TRADE_COMPLETE':
        next.state = 'COMPLETE';
        next.executionPrice = e.executionPrice;
        next.entryPrice = e.executionPrice;
        if (next.decision) {
          next.decision.txHash = e.txHash ?? next.decision.txHash;
        }
        break;
      case 'POSITION_CLOSED':
        // remain on COMPLETE; tickers will reflect outcome
        break;
      default:
        break;
    }
  }
  if (lastDecisionPayload && !next.reasoning) next.reasoning = lastDecisionPayload.reasoning;
  return next;
}
