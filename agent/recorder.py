from __future__ import annotations

import asyncio
import os
from typing import Any, Optional, Tuple

from models import AgentStats, DecisionOutput, MarketSignal

# Import web3 at module load (main thread). web3 7.x runs ``asyncio.Lock()`` at
# import time, which on Python 3.9 requires a running event loop — importing it
# lazily inside ``asyncio.to_thread`` worker threads would raise "no current
# event loop". Keep it top-level so the lock is created on the main thread.
try:
    from web3 import Web3

    try:
        from web3.middleware import ExtraDataToPOAMiddleware as _POA  # web3 v7
    except Exception:  # pragma: no cover - version shim
        try:
            from web3.middleware import geth_poa_middleware as _POA  # web3 v6
        except Exception:
            _POA = None
except Exception:  # web3 not installed — recording is unavailable until deps are
    Web3 = None  # type: ignore
    _POA = None


def _configured() -> bool:
    return bool(
        os.environ.get("AGENT_PRIVATE_KEY")
        and os.environ.get("NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS")
    )


class RecordingNotConfigured(RuntimeError):
    """Raised when on-chain recording is requested without wallet/contracts."""


def _require_configured() -> None:
    if Web3 is None:
        raise RecordingNotConfigured(
            "web3 is not installed — run `pip install -r requirements.txt`."
        )
    if not _configured():
        raise RecordingNotConfigured(
            "AGENT_PRIVATE_KEY and NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS must be set. "
            "Deploy the contracts (see SETUP_LIVE.md) and fund the agent wallet."
        )


# ── Minimal ABIs — only the functions/events MOIXA actually calls ──────────────
# Signatures mirror contracts/MoixaBrain.sol and contracts/MoixaIdentity.sol.

_BRAIN_ABI = [
    {
        "name": "recordDecision",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "marketContext", "type": "string"},
            {"name": "signalDetected", "type": "string"},
            {"name": "confidenceScore", "type": "uint256"},
            {"name": "tradeDirection", "type": "string"},
            {"name": "token", "type": "string"},
            {"name": "positionSize", "type": "uint256"},
            {"name": "riskLevel", "type": "string"},
            {"name": "riskReasoning", "type": "string"},
            {"name": "expectedReturn", "type": "int256"},
        ],
        "outputs": [{"name": "decisionId", "type": "uint256"}],
    },
    {
        "name": "closeDecision",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "decisionId", "type": "uint256"},
            {"name": "actualReturn", "type": "int256"},
            {"name": "wasCorrect", "type": "bool"},
            {"name": "learningNote", "type": "string"},
        ],
        "outputs": [],
    },
    {
        "name": "totalDecisions",
        "type": "function",
        "stateMutability": "view",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
    },
    {
        "name": "DecisionRecorded",
        "type": "event",
        "anonymous": False,
        "inputs": [
            {"name": "id", "type": "uint256", "indexed": True},
            {"name": "token", "type": "string", "indexed": False},
            {"name": "direction", "type": "string", "indexed": False},
            {"name": "confidence", "type": "uint256", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
]

_IDENTITY_ABI = [
    {
        "name": "updateReputation",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "totalTrades", "type": "uint256"},
            {"name": "totalVolume", "type": "uint256"},
            {"name": "winRate", "type": "uint256"},
            {"name": "sharpeRatio", "type": "uint256"},
            {"name": "maxDrawdown", "type": "uint256"},
            {"name": "reputationScore", "type": "uint256"},
        ],
        "outputs": [],
    },
    {
        "name": "profiles",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "", "type": "uint256"}],
        "outputs": [
            {"name": "agentId", "type": "uint256"},
            {"name": "name", "type": "string"},
            {"name": "birthTimestamp", "type": "uint256"},
            {"name": "birthBlock", "type": "uint256"},
            {"name": "totalTrades", "type": "uint256"},
            {"name": "totalVolume", "type": "uint256"},
            {"name": "winRate", "type": "uint256"},
            {"name": "sharpeRatio", "type": "uint256"},
            {"name": "maxDrawdown", "type": "uint256"},
            {"name": "reputationScore", "type": "uint256"},
            {"name": "lastUpdated", "type": "uint256"},
        ],
    },
]

_AGENT_ID = 1  # Identity NFT #1, minted by deploy.ts


def read_birth_block() -> Optional[int]:
    """Read the agent's on-chain birth block from the Identity contract."""
    if not _configured() or not _connect() or _identity is None:
        return None
    try:
        profile = _identity.functions.profiles(_AGENT_ID).call()
        return int(profile[3])  # birthBlock
    except Exception:
        return None


# ── Lazy web3 client ───────────────────────────────────────────────────────────

_w3: Any = None
_acct: Any = None
_brain: Any = None
_identity: Any = None
_chain_id: Optional[int] = None
_init_failed = False


def _connect() -> bool:
    """Build the web3 client + contract handles once. Returns True if usable."""
    global _w3, _acct, _brain, _identity, _chain_id, _init_failed
    if _w3 is not None:
        return True
    if _init_failed:
        return False
    if Web3 is None:
        print("[recorder] web3 not installed — cannot record on-chain")
        _init_failed = True
        return False
    try:
        rpc = os.environ.get("MANTLE_RPC_URL", "https://rpc.mantle.xyz")
        w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={"timeout": 20}))

        # Mantle carries extended extraData like POA chains — inject the
        # middleware so block parsing doesn't choke. Import name differs across
        # web3 v6/v7; _POA is resolved at module load (see top of file).
        if _POA is not None:
            try:
                w3.middleware_onion.inject(_POA, layer=0)
            except Exception:
                pass

        acct = w3.eth.account.from_key(os.environ["AGENT_PRIVATE_KEY"])
        brain_addr = Web3.to_checksum_address(
            os.environ["NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS"]
        )
        brain = w3.eth.contract(address=brain_addr, abi=_BRAIN_ABI)

        identity = None
        id_addr = os.environ.get("NEXT_PUBLIC_MOIXA_IDENTITY_ADDRESS")
        if id_addr:
            identity = w3.eth.contract(
                address=Web3.to_checksum_address(id_addr), abi=_IDENTITY_ABI
            )

        _w3, _acct, _brain, _identity = w3, acct, brain, identity
        _chain_id = w3.eth.chain_id
        return True
    except Exception as e:
        # Transient (RPC down, etc.) — don't latch; allow the next cycle to retry.
        print(f"[recorder] web3 init failed (will retry next cycle): {e}")
        return False


def _send(fn) -> Tuple[str, Any]:
    """Build, sign, send a contract call; wait for receipt. Returns (tx_hash, receipt)."""
    nonce = _w3.eth.get_transaction_count(_acct.address)
    tx = fn.build_transaction(
        {
            "from": _acct.address,
            "nonce": nonce,
            "chainId": _chain_id,
            "gas": 1_200_000,
            "gasPrice": _w3.eth.gas_price,
        }
    )
    signed = _acct.sign_transaction(tx)
    raw = getattr(signed, "raw_transaction", None) or signed.rawTransaction
    tx_hash = _w3.eth.send_raw_transaction(raw)
    receipt = _w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    # web3 v7's HexBytes.hex() drops the 0x prefix (v6 kept it) — normalize so
    # explorer links work on both.
    tx_hex = tx_hash.hex()
    if not tx_hex.startswith("0x"):
        tx_hex = "0x" + tx_hex
    return tx_hex, receipt


# ── Unit conversion helpers (float → contract integer units) ───────────────────

def _bps(x: float) -> int:
    """0–1 ratio → basis points (×10000)."""
    return int(round(x * 10000))


def _cents(x: float) -> int:
    return int(round(x * 100))


# ── Public API ─────────────────────────────────────────────────────────────────

async def record_decision_onchain(
    decision: DecisionOutput,
    market_context: dict,
    signal: MarketSignal,
) -> Tuple[str, int, int]:
    _require_configured()
    return await asyncio.to_thread(
        _record_onchain_real, decision, market_context, signal
    )


async def close_decision_onchain(
    on_chain_id: int,
    actual_return: float,
    was_correct: bool,
    learning_note: str,
) -> str:
    _require_configured()
    return await asyncio.to_thread(
        _close_onchain_real,
        on_chain_id,
        actual_return,
        was_correct,
        learning_note,
    )


async def update_identity(stats: AgentStats) -> str:
    _require_configured()
    return await asyncio.to_thread(_update_identity_real, stats)


# ── Real implementations ───────────────────────────────────────────────────────

def _market_ctx_str(market_context: dict) -> str:
    price = market_context.get("price")
    change = market_context.get("change24h")
    parts = []
    if price is not None:
        parts.append(f"price ${price}")
    if change is not None:
        parts.append(f"24h {change:+.2f}%")
    return ", ".join(parts) or "n/a"


def _record_onchain_real(
    decision: DecisionOutput, market_context: dict, signal: MarketSignal
) -> Tuple[str, int, int]:
    if not _connect():
        raise RuntimeError("web3 not connected")

    fn = _brain.functions.recordDecision(
        _market_ctx_str(market_context),
        f"{signal.type}: {signal.detail}" if signal.detail else signal.type,
        _bps(decision.confidenceScore),
        decision.direction,
        decision.token,
        _cents(decision.positionSize),
        decision.riskLevel,
        decision.riskReasoning,
        int(round(decision.expectedReturn)),
    )
    tx_hash, receipt = _send(fn)

    # Resolve the real decision id from the DecisionRecorded event, falling
    # back to totalDecisions()-1 if the log can't be decoded.
    decision_id = -1
    try:
        logs = _brain.events.DecisionRecorded().process_receipt(receipt)
        if logs:
            decision_id = int(logs[0]["args"]["id"])
    except Exception:
        pass
    if decision_id < 0:
        decision_id = int(_brain.functions.totalDecisions().call()) - 1

    block = receipt.get("blockNumber") if isinstance(receipt, dict) else receipt.blockNumber
    print(f"[recorder] recorded decision #{decision_id} tx={tx_hash} block={block}")
    return tx_hash, decision_id, int(block)


def _close_onchain_real(
    on_chain_id: int, actual_return: float, was_correct: bool, learning_note: str
) -> str:
    if not _connect():
        raise RuntimeError("web3 not connected")
    fn = _brain.functions.closeDecision(
        int(on_chain_id),
        int(round(actual_return)),
        bool(was_correct),
        learning_note or "",
    )
    tx_hash, _ = _send(fn)
    print(f"[recorder] closed decision #{on_chain_id} tx={tx_hash}")
    return tx_hash


def _update_identity_real(stats: AgentStats) -> str:
    if not _connect() or _identity is None:
        raise RuntimeError("identity contract not configured")
    fn = _identity.functions.updateReputation(
        _AGENT_ID,
        int(stats.totalTrades),
        _cents(stats.totalVolume),
        _bps(stats.winRate),
        _cents(stats.sharpeRatio),
        _cents(abs(stats.maxDrawdown)),
        int(stats.reputationScore),
    )
    tx_hash, _ = _send(fn)
    print(f"[recorder] updated identity rep={stats.reputationScore} tx={tx_hash}")
    return tx_hash
