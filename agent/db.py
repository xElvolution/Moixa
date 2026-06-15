"""Neon (Postgres) persistence for MOIXA.

Every decision the agent records on-chain is also persisted here so that:
  - /decisions and /performance survive restarts
  - the Performance page renders a real equity curve from history, not in-memory

Schema mirrors prisma/schema.prisma. Connection string read from DATABASE_URL.
Falls back silently if DATABASE_URL is absent — agent still works, just without
persisted history (recording on-chain remains the source of truth).
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Optional

try:
    import asyncpg
except ImportError:  # pragma: no cover
    asyncpg = None  # type: ignore


_pool: Optional["asyncpg.Pool"] = None


def _dsn() -> Optional[str]:
    dsn = os.environ.get("DATABASE_URL", "").strip()
    return dsn or None


async def init_pool() -> bool:
    """Open the Neon connection pool. Returns True if ready, False otherwise."""
    global _pool
    if _pool is not None:
        return True
    if asyncpg is None:
        print("[db] asyncpg not installed — skipping persistence")
        return False
    dsn = _dsn()
    if not dsn:
        print("[db] DATABASE_URL not set — skipping persistence")
        return False
    try:
        # Strip prisma-only flags asyncpg doesn't understand.
        dsn = dsn.replace("&channel_binding=require", "").replace(
            "?channel_binding=require", "?"
        ).replace("?&", "?")
        _pool = await asyncpg.create_pool(dsn, min_size=1, max_size=4, ssl="require")
        print("[db] connected to Neon")
        return True
    except Exception as e:
        print(f"[db] connect failed, persistence disabled: {e}")
        return False


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def save_decision(record: dict[str, Any]) -> Optional[str]:
    """Insert a freshly-recorded decision. Returns the row id (cuid-ish)."""
    if _pool is None:
        return None
    rid = f"d_{record.get('onChainId')}_{int(datetime.utcnow().timestamp())}"
    try:
        async with _pool.acquire() as c:
            await c.execute(
                """
                INSERT INTO "Decision" (
                    id, "blockNumber", "txHash", "timestamp",
                    "marketContext", "signalDetected", "signalStrength",
                    "confidenceScore", decision, token, "positionSize",
                    leverage, protocol, "riskLevel", "riskReasoning",
                    "expectedReturn", "expectedTime", "onChainId"
                ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7,
                    $8, $9, $10, $11,
                    $12, $13, $14, $15,
                    $16, $17, $18
                )
                ON CONFLICT ("txHash") DO NOTHING
                """,
                rid,
                record.get("blockNumber"),
                record.get("txHash"),
                datetime.utcnow(),
                str(record.get("marketContext") or record.get("fullReasoning") or ""),
                str(record.get("signalDetected") or ""),
                float(record.get("signalStrength") or 0.0),
                float(record.get("confidenceScore") or 0.0),
                str(record.get("direction") or record.get("decision") or "FLAT"),
                str(record.get("token") or ""),
                float(record.get("positionSize") or 0.0),
                int(record.get("leverage") or 1),
                str(record.get("protocol") or ""),
                str(record.get("riskLevel") or "LOW"),
                str(record.get("riskReasoning") or ""),
                float(record.get("expectedReturn") or 0.0),
                str(record.get("expectedTimeframe") or record.get("expectedTime") or ""),
                int(record.get("onChainId") or 0),
            )
        return rid
    except Exception as e:
        print(f"[db] save_decision failed: {e}")
        return None


async def close_decision(
    on_chain_id: int,
    actual_return: float,
    was_correct: bool,
    close_tx: Optional[str],
    learning_note: Optional[str],
) -> None:
    if _pool is None:
        return
    try:
        async with _pool.acquire() as c:
            await c.execute(
                """
                UPDATE "Decision"
                SET "actualReturn" = $1,
                    "wasCorrect"   = $2,
                    "closedAt"     = $3,
                    "closeTxHash"  = $4,
                    "learningNote" = $5
                WHERE "onChainId" = $6
                """,
                float(actual_return),
                bool(was_correct),
                datetime.utcnow(),
                close_tx,
                learning_note,
                int(on_chain_id),
            )
    except Exception as e:
        print(f"[db] close_decision failed: {e}")


async def upsert_identity(
    token_id: int, address: str, birth_block: int, birth_tx: str, snap: Any
) -> None:
    """Insert-or-update the agent's identity row from a snapshot."""
    if _pool is None:
        return
    try:
        async with _pool.acquire() as c:
            await c.execute(
                """
                INSERT INTO "AgentIdentity" (
                    id, "tokenId", address, name, "birthBlock", "birthTx",
                    "totalTrades", "correctTrades", "totalVolume",
                    "winRate", "sharpeRatio", "maxDrawdown", "reputationScore",
                    "updatedAt"
                ) VALUES (
                    $1, $2, $3, 'MOIXA', $4, $5,
                    $6, $7, $8,
                    $9, $10, $11, $12,
                    NOW()
                )
                ON CONFLICT ("tokenId") DO UPDATE SET
                    "totalTrades"     = EXCLUDED."totalTrades",
                    "correctTrades"   = EXCLUDED."correctTrades",
                    "totalVolume"     = EXCLUDED."totalVolume",
                    "winRate"         = EXCLUDED."winRate",
                    "sharpeRatio"     = EXCLUDED."sharpeRatio",
                    "maxDrawdown"     = EXCLUDED."maxDrawdown",
                    "reputationScore" = EXCLUDED."reputationScore",
                    "updatedAt"       = NOW()
                """,
                f"id_{token_id}",
                int(token_id),
                address,
                int(birth_block),
                birth_tx,
                int(snap.totalTrades),
                int(snap.correctTrades),
                float(snap.totalVolume),
                float(snap.winRate),
                float(snap.sharpeRatio),
                float(snap.maxDrawdown),
                int(snap.reputationScore),
            )
    except Exception as e:
        print(f"[db] upsert_identity failed: {e}")


async def load_recent_decisions(limit: int = 50) -> list[dict[str, Any]]:
    """Restore the most-recent decisions on startup (for /decisions endpoint)."""
    if _pool is None:
        return []
    try:
        async with _pool.acquire() as c:
            rows = await c.fetch(
                """
                SELECT * FROM "Decision"
                ORDER BY "timestamp" DESC
                LIMIT $1
                """,
                int(limit),
            )
        # Newest-first → caller can reverse if it wants the same order as before.
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"[db] load_recent_decisions failed: {e}")
        return []
