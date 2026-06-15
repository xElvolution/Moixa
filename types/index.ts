export type TradeDirection = 'LONG' | 'SHORT' | 'FLAT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type BrainState = 'IDLE' | 'ANALYZING' | 'REASONING' | 'DECIDING' | 'EXECUTING' | 'COMPLETE';

export interface MarketSignal {
  type: string;
  token: string;
  strength: number;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  timeframe: string;
  source: string;
  detail?: string;
}

export interface Decision {
  id: string;
  onChainId?: number;
  blockNumber?: number;
  txHash?: string;
  timestamp: string;
  marketContext?: Record<string, unknown> | string;
  signalDetected?: string;
  signalStrength?: number;
  confidenceScore: number;
  decision: TradeDirection;
  token: string;
  positionSize: number;
  leverage: number;
  protocol: string;
  riskLevel: RiskLevel;
  riskReasoning?: string;
  expectedReturn: number;
  expectedTime?: string;
  expectedTimeframe?: string;
  fullReasoning?: string;
  actualReturn?: number | null;
  wasCorrect?: boolean | null;
  closedAt?: string | null;
  closeTxHash?: string | null;
  learningNote?: string | null;
}

export interface AgentIdentity {
  agentId: number;
  name: string;
  birthBlock: number;
  totalTrades: number;
  correctTrades: number;
  totalVolume: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  reputationScore: number;
}

export interface Milestone {
  id: string;
  type: string;
  description: string;
  blockNumber: number;
  txHash: string;
  achievedAt: string;
  icon?: string;
}

export type WsEvent =
  | {
      type: 'ANALYZING';
      token: string;
      signals: MarketSignal[];
      marketContext: Record<string, unknown>;
      timestamp: number;
    }
  | {
      type: 'REASONING';
      thinking: string;
      confidenceProgress: number;
      timestamp: number;
    }
  | {
      type: 'DECISION';
      decision: TradeDirection;
      token: string;
      size: number;
      confidence: number;
      reasoning: string;
      riskLevel: RiskLevel;
      onChainId: number;
      txHash: string;
      protocol?: string;
      leverage?: number;
      expectedReturn?: number;
      expectedTimeframe?: string;
      timestamp: number;
    }
  | {
      type: 'EXECUTING';
      protocol: string;
      token: string;
      amount: number;
      timestamp: number;
    }
  | {
      type: 'TRADE_COMPLETE';
      txHash: string;
      executionPrice: number;
      slippage: number;
      timestamp: number;
    }
  | {
      type: 'POSITION_CLOSED';
      onChainId: number;
      actualReturn: number;
      wasCorrect: boolean;
      learningNote: string;
      reputationUpdate: number;
      timestamp: number;
    }
  | {
      type: 'IDENTITY_UPDATED';
      reputationScore: number;
      winRate: number;
      totalTrades: number;
      timestamp: number;
    };
