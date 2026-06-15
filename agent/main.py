from __future__ import annotations

import asyncio
import os
from datetime import datetime
from typing import Any, Optional

# Load .env.local (repo root) BEFORE importing modules that read env at import.
try:
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
except Exception:
    pass

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import brain
import db
import executor
from executor import execute_trade, monitor_position
from identity import identity_store
from reasoning import generate_learning_note, reason_about_decision
from recorder import close_decision_onchain, record_decision_onchain, update_identity
from websocket import (
    emit_analyzing,
    emit_decision,
    emit_executing,
    emit_identity_updated,
    emit_position_closed,
    emit_reasoning,
    emit_trade_complete,
    manager,
)
from models import DecisionInput


app = FastAPI(title="MOIXA Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_recent_decisions: list[dict[str, Any]] = []


@app.get("/")
async def root() -> dict:
    return {"name": "MOIXA", "status": "live"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(ws)


@app.get("/decisions")
async def get_decisions(limit: int = 50) -> dict:
    return {"decisions": _recent_decisions[-limit:][::-1]}


@app.get("/decisions/{decision_id}")
async def get_decision(decision_id: str) -> dict:
    for d in _recent_decisions:
        if d.get("id") == decision_id:
            return d
    return {"error": "not found"}


@app.get("/identity")
async def get_identity() -> dict:
    snap = identity_store.snapshot()
    return {
        "agentId": 1,
        "name": "MOIXA",
        "birthBlock": identity_store.birthBlock,
        **snap.model_dump(),
    }


@app.get("/performance")
async def get_performance(timeframe: str = "30d") -> dict:
    # Equity curve built from REAL closed-decision returns, compounded in order.
    start_val = float(os.environ.get("MOIXA_START_EQUITY", "10000"))
    series = []
    val = start_val
    for d in _recent_decisions:
        ret_bps = d.get("actualReturn")
        if ret_bps is None or not d.get("closeTxHash"):
            continue
        val *= 1 + (ret_bps / 10_000.0)
        series.append(
            {
                "date": d.get("timestamp"),
                "portfolioValue": round(val, 2),
                "onChainId": d.get("onChainId"),
            }
        )
    snap = identity_store.snapshot()
    return {
        "timeframe": timeframe,
        "startEquity": start_val,
        "equityCurve": series,
        "stats": snap.model_dump(),
    }


@app.get("/market/{token}")
async def get_market(token: str, points: int = 60) -> dict:
    """Real price series (Bybit klines) + market context for the chart."""
    import bybit

    series = await bybit.get_client().kline(token, points=points)
    ctx = await brain.market_context(token)
    return {"token": token.upper(), "series": series, "context": ctx}


@app.post("/trigger/{token}")
async def post_trigger(token: str) -> dict:
    """Force one full real decision lifecycle on demand.

    Records a real decision on-chain using live market data (real CoinGecko
    price/direction + GPT-4o or rule-based reasoning), even when natural signals
    are below threshold. Returns the on-chain tx + decision id immediately;
    the close happens asynchronously after the monitoring window.
    """
    token = token.upper()
    if token not in {"ETH", "BTC", "MNT"}:
        return {"error": f"unsupported token {token}; use ETH/BTC/MNT"}
    asyncio.create_task(_run_decision(token, force=True))
    return {"triggered": token, "status": "decision lifecycle started"}


async def _run_decision(token: str, force: bool = False) -> Optional[dict]:
    """One full real lifecycle: detect → reason → record → execute → close.

    When force=True, builds a real signal from live market data so a decision
    fires even in calm markets (for the manual /trigger endpoint). Returns the
    decision record dict, or None if no signal and not forced.
    """
    signals = await brain.detect_signals(token)
    if not signals:
        if not force:
            return None
        signals = [await brain.forced_signal(token)]
    ctx = await brain.market_context(token)
    await emit_analyzing(token, signals, ctx)
    decision_input = DecisionInput(
        signals=signals, marketContext=ctx, currentPositions=[], availableCapital=10_000
    )
    decision = await reason_about_decision(signals, ctx, decision_input)
    await emit_reasoning(decision.fullReasoning, decision.confidenceScore)

    # Record EVERY decision on-chain — including disciplined no-trades.
    tx_hash, on_chain_id, block = await record_decision_onchain(decision, ctx, signals[0])
    record = {
        "id": f"decision-{on_chain_id}",
        "onChainId": on_chain_id,
        "blockNumber": block,
        "txHash": tx_hash,
        "timestamp": datetime.utcnow().isoformat(),
        **decision.model_dump(),
    }
    _recent_decisions.append(record)
    await db.save_decision(record)
    await emit_decision(decision.model_dump(), on_chain_id, tx_hash)

    if not decision.shouldTrade:
        # No-trade: close immediately as a correct discipline decision.
        note = "Confidence below threshold — stayed flat to protect capital."
        close_tx = await close_decision_onchain(on_chain_id, 0, True, note)
        rep = identity_store.apply_outcome(True, 0)
        snap = identity_store.snapshot()
        id_tx = await update_identity(snap)
        record.update(actualReturn=0, wasCorrect=True, closeTxHash=close_tx,
                      learningNote=note, identityTxHash=id_tx)
        await db.close_decision(on_chain_id, 0, True, close_tx, note)
        await db.upsert_identity(1, identity_store.address,
                                 identity_store.birthBlock, identity_store.birthTx, snap)
        await emit_position_closed(on_chain_id, 0, True, note, rep)
        await emit_identity_updated(snap.reputationScore, snap.winRate, snap.totalTrades)
        return record

    # Execute on Bybit if keys are configured; otherwise skip the exchange
    # order but still track the real price move so the decision closes on-chain
    # with genuine PnL. On-chain recording never depends on Bybit.
    protocol = "Bybit Perp" if decision.leverage > 1 else "Bybit Spot"
    exec_ref = f"onchain-{on_chain_id}"
    if executor.is_trading_enabled():
        try:
            trade = await execute_trade(decision)
            exec_ref = trade.txHash
            await emit_executing(protocol, decision.token, decision.positionSize)
            await emit_trade_complete(trade.txHash, trade.executionPrice, trade.slippage)
        except Exception as e:
            print(f"[run] Bybit execution skipped: {e}")
            await emit_executing(protocol, decision.token, decision.positionSize)
    else:
        await emit_executing(protocol, decision.token, decision.positionSize)

    async def _on_close(_pos_id: str, actual_return: float, was_correct: bool) -> None:
        note = await generate_learning_note(
            f"{decision.direction} {decision.token}",
            actual_return,
            was_correct,
        )
        close_tx = await close_decision_onchain(
            on_chain_id, actual_return, was_correct, note
        )
        rep = identity_store.apply_outcome(was_correct, decision.positionSize, actual_return)
        snap = identity_store.snapshot()
        id_tx = await update_identity(snap)
        record.update(actualReturn=actual_return, wasCorrect=was_correct,
                      closeTxHash=close_tx, learningNote=note, identityTxHash=id_tx)
        await db.close_decision(on_chain_id, actual_return, was_correct, close_tx, note)
        await db.upsert_identity(1, identity_store.address,
                                 identity_store.birthBlock, identity_store.birthTx, snap)
        await emit_position_closed(on_chain_id, actual_return, was_correct, note, rep)
        await emit_identity_updated(snap.reputationScore, snap.winRate, snap.totalTrades)

    await monitor_position(exec_ref, decision, _on_close)
    return record


async def trading_loop() -> None:
    tokens = ["ETH", "BTC", "MNT"]
    interval = int(os.environ.get("MOIXA_LOOP_INTERVAL", "300"))
    while True:
        for token in tokens:
            try:
                await _run_decision(token)
            except asyncio.CancelledError:
                raise
            except Exception as e:
                print(f"[trading_loop] {token} error: {e}")
        await asyncio.sleep(interval)


@app.on_event("startup")
async def on_startup() -> None:
    # Connect Neon and restore in-memory cache so /decisions and /performance
    # survive restarts. Missing DATABASE_URL just skips persistence silently.
    await db.init_pool()
    restored = await db.load_recent_decisions(limit=200)
    for row in reversed(restored):  # oldest-first to match append order
        _recent_decisions.append(
            {
                "id": row.get("id"),
                "onChainId": row.get("onChainId"),
                "blockNumber": row.get("blockNumber"),
                "txHash": row.get("txHash"),
                "timestamp": (row.get("timestamp") or datetime.utcnow()).isoformat()
                if hasattr(row.get("timestamp"), "isoformat") else row.get("timestamp"),
                "direction": row.get("decision"),
                "token": row.get("token"),
                "positionSize": row.get("positionSize"),
                "leverage": row.get("leverage"),
                "confidenceScore": row.get("confidenceScore"),
                "riskLevel": row.get("riskLevel"),
                "actualReturn": row.get("actualReturn"),
                "wasCorrect": row.get("wasCorrect"),
                "closeTxHash": row.get("closeTxHash"),
                "learningNote": row.get("learningNote"),
                "fullReasoning": row.get("marketContext"),
            }
        )
    if restored:
        print(f"[startup] restored {len(restored)} decisions from Neon")

    # Sync the agent's real birth block from the Identity contract, if deployed.
    try:
        import recorder

        bb = await asyncio.to_thread(recorder.read_birth_block)
        if bb:
            identity_store.birthBlock = bb
    except Exception as e:
        print(f"[startup] birth-block sync skipped: {e}")

    # The real trading loop is the product. It autostarts by default.
    if os.environ.get("MOIXA_AUTOSTART_LOOP", "true").lower() == "true":
        asyncio.create_task(trading_loop())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await brain.shutdown()
    await db.close_pool()
    try:
        import bybit

        await bybit.shutdown()
    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("AGENT_WS_PORT", "3001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
