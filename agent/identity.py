from __future__ import annotations

import math
import os
from datetime import datetime
from typing import Optional

from models import AgentStats


def _derive_address() -> str:
    """Resolve the agent's checksum address from AGENT_PRIVATE_KEY at startup.

    Empty string if the key is missing - persistence rows will just store ''
    rather than crash, and the address can be backfilled later.
    """
    pk = os.environ.get("AGENT_PRIVATE_KEY", "").strip()
    if not pk:
        return ""
    try:
        from eth_account import Account

        return Account.from_key(pk).address
    except Exception:
        return ""


class IdentityStore:
    """Tracks MOIXA's reputation from REAL trade outcomes.

    Starts at genesis matching the on-chain mint (reputation 500, zero history).
    Sharpe and max-drawdown are computed from the actual return series - no
    hardcoded performance numbers.
    """

    def __init__(self) -> None:
        self.reputationScore = 500  # matches MoixaIdentity mint
        self.totalTrades = 0
        self.correctTrades = 0
        self.totalVolume = 0.0
        self.winRate = 0.0
        self.birthBlock = 0  # set from the contract once known
        self.birthTx = ""  # set from the mint tx once known
        self.address = _derive_address()
        self.lastUpdated = datetime.utcnow()
        self._returns: list[float] = []  # realized returns in basis points
        self._equity = 1.0
        self._peak = 1.0
        self._max_drawdown = 0.0

    @property
    def sharpeRatio(self) -> float:
        if len(self._returns) < 2:
            return 0.0
        mean = sum(self._returns) / len(self._returns)
        var = sum((r - mean) ** 2 for r in self._returns) / (len(self._returns) - 1)
        std = math.sqrt(var)
        if std == 0:
            return 0.0
        return round(mean / std, 4)

    @property
    def maxDrawdown(self) -> float:
        return round(self._max_drawdown, 4)

    def apply_outcome(
        self, was_correct: bool, position_size: float, actual_return_bps: float = 0.0
    ) -> int:
        self.totalTrades += 1
        if was_correct:
            self.correctTrades += 1
        self.totalVolume += position_size
        self.winRate = self.correctTrades / max(self.totalTrades, 1)

        # Track the real return series for Sharpe + drawdown.
        self._returns.append(actual_return_bps)
        self._equity *= 1 + (actual_return_bps / 10_000.0)
        self._peak = max(self._peak, self._equity)
        if self._peak > 0:
            dd = (self._equity - self._peak) / self._peak
            self._max_drawdown = min(self._max_drawdown, dd)

        delta = 4 if was_correct else -2
        self.reputationScore = max(0, min(1000, self.reputationScore + delta))
        self.lastUpdated = datetime.utcnow()
        return self.reputationScore

    def snapshot(self) -> AgentStats:
        return AgentStats(
            totalTrades=self.totalTrades,
            correctTrades=self.correctTrades,
            totalVolume=self.totalVolume,
            winRate=self.winRate,
            sharpeRatio=self.sharpeRatio,
            maxDrawdown=self.maxDrawdown,
            reputationScore=self.reputationScore,
        )


identity_store = IdentityStore()
