from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class MarketSignal(BaseModel):
    type: str  # MOMENTUM/MEAN_REVERT/BREAKOUT/VOLUME_SPIKE/SMART_MONEY/FUNDING
    token: str
    strength: float = Field(ge=0.0, le=1.0)
    direction: str  # LONG/SHORT/NEUTRAL
    timeframe: str
    source: str
    detail: str = ""


class DecisionInput(BaseModel):
    signals: list[MarketSignal]
    marketContext: dict[str, Any]
    currentPositions: list[dict[str, Any]] = []
    availableCapital: float = 10_000.0


class DecisionOutput(BaseModel):
    shouldTrade: bool
    direction: str  # LONG/SHORT/FLAT
    token: str
    positionSize: float
    leverage: int = 1
    confidenceScore: float
    riskLevel: str  # LOW/MEDIUM/HIGH
    riskReasoning: str
    expectedReturn: float
    expectedTimeframe: str
    fullReasoning: str


class TradeResult(BaseModel):
    decisionId: str
    txHash: str
    actualAmountIn: float
    actualAmountOut: float
    executionPrice: float
    slippage: float


class AgentStats(BaseModel):
    totalTrades: int
    correctTrades: int
    totalVolume: float
    winRate: float
    sharpeRatio: float
    maxDrawdown: float
    reputationScore: int


class DecisionRecord(BaseModel):
    id: str
    blockNumber: Optional[int] = None
    txHash: Optional[str] = None
    timestamp: datetime
    marketContext: str
    signalDetected: str
    signalStrength: float
    confidenceScore: float
    decision: str
    token: str
    positionSize: float
    leverage: int = 1
    protocol: str
    riskLevel: str
    riskReasoning: str
    expectedReturn: float
    expectedTime: str
    actualReturn: Optional[float] = None
    wasCorrect: Optional[bool] = None
    closedAt: Optional[datetime] = None
    closeTxHash: Optional[str] = None
    learningNote: Optional[str] = None
    onChainId: Optional[int] = None
