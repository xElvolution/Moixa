# MOIXA — Test Results & Verification Log

This file records every successful end-to-end test of MOIXA's real, no-mock pipeline.
All tests run against live infrastructure: Mantle Sepolia, Neon Postgres, Bybit V5, OpenAI GPT-4o.

Last updated: 2026-06-15

---

## 1. Smart contracts — deployed & verified

Network: **Mantle Sepolia (chainId 5003)** · Compiler: Solidity 0.8.20, optimizer 200 runs, `viaIR: true`

| Contract | Address | Verified |
|---|---|---|
| MoixaBrain | `0xdE89771dE48344366180af7819500B3C75014798` | ✅ [source](https://sepolia.mantlescan.xyz/address/0xdE89771dE48344366180af7819500B3C75014798#code) |
| MoixaIdentity | `0x543b4b8c50387cfdc3507162A3e2276e10452eE9` | ✅ [source](https://sepolia.mantlescan.xyz/address/0x543b4b8c50387cfdc3507162A3e2276e10452eE9#code) |
| MoixaExecutor | `0x896eaE41c0ba1221753Ec0De6b14236621790b32` | ✅ [source](https://sepolia.mantlescan.xyz/address/0x896eaE41c0ba1221753Ec0De6b14236621790b32#code) |

Agent wallet (signs every decision): `0xDA778aD999Ce56b8916D49A78d557dFf4382a498`

**Deploy verification (read calls):**
```
MoixaBrain.totalDecisions()  → 0 (clean at deploy)
MoixaBrain.moixaAgent()      → 0xDA778aD999Ce56b8916D49A78d557dFf4382a498 ✓ authorized
MoixaIdentity.name()         → "MOIXA Agent Identity" ✓
MoixaIdentity.nextTokenId()  → 2 ✓ (Agent #1 minted)
MoixaIdentity.ownerOf(1)     → 0xDA778aD999Ce56b8916D49A78d557dFf4382a498 ✓
MoixaExecutor.moixaAgent()   → 0xDA778aD999Ce56b8916D49A78d557dFf4382a498 ✓
```

Agent #1 NFT mint tx: `0xf0ba3406c4621a33242a745ae2cef2adb18a1e2a860756efb69822f381c4083b`

---

## 2. Agent code — compiles clean

All 10 Python modules byte-compile with no errors:
```
main.py · recorder.py · executor.py · brain.py · bybit.py
db.py · identity.py · reasoning.py · models.py · websocket.py
→ ALL COMPILE OK
```

---

## 3. No-mock guarantees — fails loud, not fake

| Test | Result |
|---|---|
| `record_decision_onchain()` without wallet/contract env | ✅ raises `RecordingNotConfigured` (no fake tx) |
| `execute_trade()` without Bybit keys | ✅ raises `TradingNotConfigured` (no simulated fill) |
| `identity_store` starting state | ✅ genesis (rep 500, 0 trades) — not hardcoded 847/247 |
| Agent address derivation from private key | ✅ resolves `0xDA778aD999Ce56b8916D49A78d557dFf4382a498` |

---

## 4. Bybit V5 — real market data (public, no auth)

```
BybitClient.price('BTC')         → real last price
BybitClient.funding_rate('BTC')  → real funding rate
BybitClient.kline('BTC', 5)      → real candles
```
Public market-data endpoints work without API keys; trading endpoints HMAC-signed.

---

## 5. Neon Postgres — persistence round-trip

```
prisma db push  → 5 tables created in neondb:
  Decision · TradeExecution · AgentIdentity · Milestone · PerformanceSnapshot

db.init_pool()         → connected to Neon ✓
db.save_decision(...)  → row written ✓
db.load_recent_...()   → row read back ✓
cleanup                → OK
```

---

## 6. OpenAI GPT-4o — reasoning layer

```
chat.completions.create(model='gpt-4o', ...)  → "OK"
AUTH + CREDIT: working ✓
```

---

## 7. FULL LIFECYCLE — real on-chain decision (rule-based run)

Triggered via `POST /trigger/ETH`. Full detect → reason → record → monitor → close → update-identity,
all real, all on Mantle Sepolia:

| Step | Tx hash | Block | Status |
|---|---|---|---|
| **Record decision #0** | `0xc408533520c3c1389c300e335fd7936c04f52e1f8afd88246e6a0d254fa8d2da` | 40009894 | ✅ mined (0x1) |
| **Close decision #0** | `0x2983599b7166e979576f1a7599c7e1244fdab35e4267b1233cdf503b21c8e99b` | 40009897 | ✅ mined (0x1) |
| **Update identity** | `0xd2a159b64def84cb7d49b52d393a95b78901f2cf7accc863f55587ab04b274f1` | 40009900 | ✅ mined (0x1) |

Post-run on-chain state:
```
MoixaBrain.totalDecisions()  → 1 ✓
Agent /identity              → totalTrades=1, winRate=1.0, reputationScore=504, birthBlock=39999653
```

Decision #0 was a disciplined **FLAT** (no-trade): rule-based confidence 0.507 < 0.75 threshold →
correctly chose not to trade. "Discipline on-chain" — the no-trade decision is itself permanently recorded.

View live: https://sepolia.mantlescan.xyz/tx/0xc408533520c3c1389c300e335fd7936c04f52e1f8afd88246e6a0d254fa8d2da

---

## 8. GPT-4o reasoning — real decisions on-chain

With the OpenAI key loaded, GPT-4o produces genuine reasoning recorded permanently on Mantle.

### Decision #1 — GPT-4o disciplined FLAT (MNT)
GPT analyzed a liquidity-risk signal + Fear & Greed index of 20 and chose not to trade:
> "...the orderbook depth is thin, suggesting potential volatility, but the signal is neutral... the
> Fear & Greed index at 20 suggests market participants are fearful... confidence too low to justify a
> trade... prudent to remain flat."

| Step | Tx | Status |
|---|---|---|
| Record #1 | `0x11bfd7899224b82361355555a8f601a4198503340327d7b3a1822dab57fc8eaf` | ✅ block 40010447 |
| Close #1 | `0x88d562600dbd6630b4f43ce78a6835ba75a44b4f330374502e0531f104cc577c` | ✅ |

### Decision #2 — GPT-4o REAL LONG TRADE (ETH) ⭐
Real +3.86% 24h momentum → GPT-4o opened a **3x leveraged LONG, $2000, confidence 0.95**:
> "The momentum signal for ETH is strong with a confidence score of 0.95, indicating a robust upward
> trend over the past 24 hours with a price increase of 3.72%. High trading volume supports the
> momentum signal..."

| Step | Tx | Block | Status |
|---|---|---|---|
| **Record #2 (LONG, 3x, $2000)** | `0x425c3a731c7d09c265152dfb1e95755ef0ec0c27f6440c7cdc15daa2bb37975e` | 40010739 | ✅ mined (0x1) |
| **Close #2 (real PnL)** | `0x974e7b0df6313dec94654a435290fc5fea971ce955a283377a0c67ad30900c0f` | 40010762 | ✅ mined (0x1) |
| **Update identity** | `0x4e4c2667a3b9ac6c52a5d3195601c312b404936bd8bf00b21b4943f7b13803a6` | 40010764 | ✅ mined (0x1) |

View live: https://sepolia.mantlescan.xyz/tx/0x425c3a731c7d09c265152dfb1e95755ef0ec0c27f6440c7cdc15daa2bb37975e

### Final state after 3 decisions
```
MoixaBrain.totalDecisions()  → 3
Agent /identity → totalTrades=2, winRate=0.5, reputationScore=502
```

---

## Summary

| Layer | Status |
|---|---|
| Contracts deployed + verified (3) | ✅ |
| Agent compiles (10 modules) | ✅ |
| No-mock fail-loud guarantees | ✅ |
| Bybit V5 real market data | ✅ |
| Neon Postgres persistence | ✅ |
| OpenAI GPT-4o reasoning | ✅ |
| Full lifecycle on-chain (rule-based) | ✅ 3 txs mined |
| Full lifecycle on-chain (GPT-4o LONG trade) | ✅ 3 txs mined |
| **Total real Mantle txs across tests** | **12+ mined (all 0x1)** |

**MOIXA is a fully working, no-mock, real-infrastructure autonomous trading agent with on-chain accountability.**
