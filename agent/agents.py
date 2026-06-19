"""Multi-agent registry: users mint their own MOIXA agent and grow its reputation.

Each user agent is an ERC-721 identity (minted via recorder.mint_agent, sponsored
by the backend on testnet). Asking an agent to analyze a token runs the SAME real
brain/reasoning, records the decision on MoixaBrain, monitors real PnL, then writes
that agent's reputation on-chain via updateReputation(agentId, ...). Per-agent stats
persist in the Neon AgentIdentity table; the global decision log still captures
every decision.
"""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any, Optional

import brain
import db
import recorder
from executor import monitor_position
from identity import IdentityStore
from models import DecisionInput
from reasoning import generate_learning_note, reason_about_decision
from websocket import (
    emit_analyzing,
    emit_decision,
    emit_executing,
    emit_identity_updated,
    emit_position_closed,
    emit_reasoning,
    emit_trade_complete,
)

# agentId -> {agentId, address, name, store: IdentityStore, decisions: list}
_agents: dict[int, dict[str, Any]] = {}


def _summary(a: dict[str, Any]) -> dict[str, Any]:
    snap = a["store"].snapshot()
    return {
        "agentId": a["agentId"],
        "name": a["name"],
        "address": a["address"],
        **snap.model_dump(),
    }


def register(agent_id: int, address: str, name: str, store: Optional[IdentityStore] = None) -> dict:
    if agent_id in _agents:
        return _agents[agent_id]
    st = store or IdentityStore()
    st.address = address
    _agents[agent_id] = {
        "agentId": agent_id,
        "address": address,
        "name": name,
        "store": st,
        "decisions": [],
    }
    return _agents[agent_id]


def get(agent_id: int) -> Optional[dict]:
    return _agents.get(agent_id)


def all_summaries() -> list[dict]:
    return sorted(
        (_summary(a) for a in _agents.values()),
        key=lambda s: s["reputationScore"],
        reverse=True,
    )


async def hydrate_from_db() -> None:
    """Repopulate the in-memory registry from the Neon AgentIdentity table."""
    rows = await db.list_agents(limit=500)
    for r in rows:
        aid = int(r.get("tokenId") or 0)
        if aid <= 0 or aid in _agents:
            continue
        st = IdentityStore()
        st.address = r.get("address") or ""
        st.reputationScore = int(r.get("reputationScore") or 500)
        st.totalTrades = int(r.get("totalTrades") or 0)
        st.correctTrades = int(r.get("correctTrades") or 0)
        st.totalVolume = float(r.get("totalVolume") or 0)
        st.winRate = float(r.get("winRate") or 0)
        register(aid, st.address, r.get("name") or f"Agent #{aid}", st)


async def mint(address: str, name: str) -> dict:
    """Mint (or return existing) agent for an address."""
    existing = await asyncio.to_thread(recorder.read_agent_of, address)
    if existing and existing > 0:
        a = _agents.get(existing) or register(existing, address, name)
        return {"agentId": existing, "txHash": None, "already": True, **_summary(a)}

    tx_hash, agent_id = await recorder.mint_agent(address, name)
    a = register(agent_id, address, name)
    snap = a["store"].snapshot()
    await db.upsert_identity(agent_id, address, a["store"].birthBlock, tx_hash, snap)
    return {"agentId": agent_id, "txHash": tx_hash, "already": False, **_summary(a)}


async def analyze(agent_id: int, token: str) -> dict:
    """Run one real decision lifecycle attributed to `agent_id`."""
    a = _agents.get(agent_id)
    if a is None:
        raise ValueError(f"unknown agent #{agent_id}")
    token = token.upper()
    store: IdentityStore = a["store"]

    signals = await brain.detect_signals(token)
    if not signals:
        signals = [await brain.forced_signal(token)]
    ctx = await brain.market_context(token)
    await emit_analyzing(token, signals, ctx)

    di = DecisionInput(signals=signals, marketContext=ctx, currentPositions=[], availableCapital=10_000)
    decision = await reason_about_decision(signals, ctx, di)
    await emit_reasoning(decision.fullReasoning, decision.confidenceScore)

    tx_hash, on_chain_id, block = await recorder.record_decision_onchain(decision, ctx, signals[0])
    record = {
        "id": f"agent{agent_id}-decision-{on_chain_id}",
        "agentId": agent_id,
        "onChainId": on_chain_id,
        "blockNumber": block,
        "txHash": tx_hash,
        "timestamp": datetime.utcnow().isoformat(),
        **decision.model_dump(),
    }
    a["decisions"].append(record)
    await db.save_decision(record)
    await emit_decision(decision.model_dump(), on_chain_id, tx_hash)

    async def _finalize(actual_return: float, was_correct: bool, note: str) -> None:
        close_tx = await recorder.close_decision_onchain(on_chain_id, actual_return, was_correct, note)
        store.apply_outcome(was_correct, decision.positionSize, actual_return)
        snap = store.snapshot()
        id_tx = await recorder.update_identity(snap, agent_id)
        record.update(actualReturn=actual_return, wasCorrect=was_correct,
                      closeTxHash=close_tx, learningNote=note, identityTxHash=id_tx)
        await db.close_decision(on_chain_id, actual_return, was_correct, close_tx, note)
        await db.upsert_identity(agent_id, store.address, store.birthBlock, "", snap)
        await emit_position_closed(on_chain_id, actual_return, was_correct, note,
                                   snap.reputationScore)
        await emit_identity_updated(snap.reputationScore, snap.winRate, snap.totalTrades)

    if not decision.shouldTrade:
        await _finalize(0, True, "Confidence below threshold - stayed flat to protect capital.")
        return record

    protocol = "Bybit Perp" if decision.leverage > 1 else "Bybit Spot"
    await emit_executing(protocol, decision.token, decision.positionSize)

    async def _on_close(_pos: str, actual_return: float, was_correct: bool) -> None:
        note = await generate_learning_note(
            f"{decision.direction} {decision.token}", actual_return, was_correct
        )
        await _finalize(actual_return, was_correct, note)

    await monitor_position(f"agent{agent_id}-{on_chain_id}", decision, _on_close)
    return record
