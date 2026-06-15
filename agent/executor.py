from __future__ import annotations

import asyncio
from typing import Optional

import bybit
from models import DecisionOutput, TradeResult


class TradingNotConfigured(RuntimeError):
    """Raised when a live trade is requested without Bybit credentials."""


def require_live() -> None:
    if not bybit.has_trading_keys():
        raise TradingNotConfigured(
            "BYBIT_API_KEY / BYBIT_API_SECRET are not set. Set them (testnet "
            "keys from https://testnet.bybit.com) to run MOIXA live."
        )


async def execute_trade(decision: DecisionOutput) -> Optional[TradeResult]:
    if not decision.shouldTrade or decision.direction == "FLAT":
        return None
    if decision.leverage > 1:
        return await execute_perp(decision)
    return await execute_spot(decision)


async def execute_spot(decision: DecisionOutput) -> TradeResult:
    return await _execute_bybit(decision, category="spot", protocol="Bybit Spot")


async def execute_perp(decision: DecisionOutput) -> TradeResult:
    return await _execute_bybit(decision, category="linear", protocol="Bybit Perp")


async def _execute_bybit(
    decision: DecisionOutput, category: str, protocol: str
) -> TradeResult:
    """Place a real market order on Bybit (testnet unless BYBIT_TESTNET=false)."""
    require_live()
    client = bybit.get_client()

    price = await client.price(decision.token)
    if price is None:
        raise RuntimeError(f"Bybit returned no price for {decision.token}")

    qty = round(decision.positionSize / price, 4)
    side = "Buy" if decision.direction == "LONG" else "Sell"

    resp = await client.place_market_order(decision.token, side, qty, category)
    ret_code = resp.get("retCode") if isinstance(resp, dict) else None
    if ret_code not in (0, None):
        raise RuntimeError(f"Bybit order rejected: {resp.get('retMsg')} ({ret_code})")

    result = resp.get("result", {}) if isinstance(resp, dict) else {}
    order_id = result.get("orderId")
    if not order_id:
        raise RuntimeError(f"Bybit order returned no orderId: {resp}")

    return TradeResult(
        decisionId=order_id,
        txHash=order_id,  # on-exchange order reference
        actualAmountIn=decision.positionSize,
        actualAmountOut=qty,
        executionPrice=price,
        slippage=0.0,
    )


async def monitor_position(
    position_id: str,
    decision: DecisionOutput,
    on_close,
    hold_seconds: int = 28,
) -> None:
    """Hold the position, then close it with the REAL realized return.

    Entry price is read at open; exit price after ``hold_seconds``. Return is
    the genuine market move (in basis points), direction-adjusted.
    """
    client = bybit.get_client()
    entry = await client.price(decision.token)
    await asyncio.sleep(hold_seconds)
    exit_price = await client.price(decision.token)

    if entry and exit_price and entry > 0:
        move = (exit_price - entry) / entry
        signed = move if decision.direction == "LONG" else -move
        actual_return = signed * 10_000 * decision.leverage  # basis points
    else:
        actual_return = 0.0

    was_correct = actual_return > 0
    await on_close(position_id, actual_return, was_correct)
