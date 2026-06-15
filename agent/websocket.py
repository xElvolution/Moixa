from __future__ import annotations

import asyncio
import json
import time
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active: set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self.history: list[dict[str, Any]] = []
        self.max_history = 200

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.add(ws)
        for event in self.history[-50:]:
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                break

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self.active.discard(ws)

    async def broadcast(self, event: dict[str, Any]) -> None:
        event = {**event, "timestamp": event.get("timestamp", int(time.time() * 1000))}
        self.history.append(event)
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history :]

        payload = json.dumps(event)
        dead: list[WebSocket] = []
        async with self._lock:
            sockets = list(self.active)
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        if dead:
            async with self._lock:
                for ws in dead:
                    self.active.discard(ws)


manager = ConnectionManager()


async def emit_analyzing(token: str, signals: list, market_context: dict) -> None:
    await manager.broadcast(
        {
            "type": "ANALYZING",
            "token": token,
            "signals": [s.model_dump() if hasattr(s, "model_dump") else s for s in signals],
            "marketContext": market_context,
        }
    )


async def emit_reasoning(thinking: str, confidence_progress: float) -> None:
    await manager.broadcast(
        {
            "type": "REASONING",
            "thinking": thinking,
            "confidenceProgress": confidence_progress,
        }
    )


async def emit_decision(decision_dict: dict, on_chain_id: int, tx_hash: str) -> None:
    await manager.broadcast(
        {
            "type": "DECISION",
            **decision_dict,
            "onChainId": on_chain_id,
            "txHash": tx_hash,
        }
    )


async def emit_executing(protocol: str, token: str, amount: float) -> None:
    await manager.broadcast(
        {
            "type": "EXECUTING",
            "protocol": protocol,
            "token": token,
            "amount": amount,
        }
    )


async def emit_trade_complete(tx_hash: str, execution_price: float, slippage: float) -> None:
    await manager.broadcast(
        {
            "type": "TRADE_COMPLETE",
            "txHash": tx_hash,
            "executionPrice": execution_price,
            "slippage": slippage,
        }
    )


async def emit_position_closed(
    on_chain_id: int,
    actual_return: float,
    was_correct: bool,
    learning_note: str,
    reputation_update: int,
) -> None:
    await manager.broadcast(
        {
            "type": "POSITION_CLOSED",
            "onChainId": on_chain_id,
            "actualReturn": actual_return,
            "wasCorrect": was_correct,
            "learningNote": learning_note,
            "reputationUpdate": reputation_update,
        }
    )


async def emit_identity_updated(reputation_score: int, win_rate: float, total_trades: int) -> None:
    await manager.broadcast(
        {
            "type": "IDENTITY_UPDATED",
            "reputationScore": reputation_score,
            "winRate": win_rate,
            "totalTrades": total_trades,
        }
    )
