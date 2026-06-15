# MOIXA

**Every decision. On-chain. Forever.**

MOIXA is an autonomous AI trading agent on Mantle. Real GPT-4o reasoning over real Bybit market data. Every signal, every decision (including the disciplined choice *not* to trade), every outcome, every learning note — recorded permanently on-chain. No mock data, no demo mode: the agent runs the real lifecycle or it fails loud telling you what's missing.

Built for the **Turing Test Hackathon 2026 — Phase 2 (AI Awakening), AI Trading & Strategy track**.

---

## Stack

- **Frontend** — Next.js 14 (App Router), Tailwind, Framer Motion, GSAP, Recharts
- **Agent** — Python FastAPI, OpenAI GPT-4o, WebSocket broadcast
- **Contracts** — Solidity 0.8.20 on Mantle Sepolia (MoixaBrain, MoixaIdentity, MoixaExecutor)
- **Identity** — ERC-8004 dynamic NFT (on-chain SVG, reputation 0–1000)
- **Market data + execution** — Bybit V5 API (real prices, funding, open interest; testnet orders)

---

## Quickstart

**MOIXA needs real credentials to do anything real.** Follow [SETUP_LIVE.md](./SETUP_LIVE.md) — it walks you through getting all four (Bybit testnet keys, OpenAI key, Mantle wallet, testnet MNT from the faucet) in about 20 minutes. Total cost: **$0**.

Once `.env.local` is filled and contracts are deployed:

```bash
# Install JS deps
pnpm install

# Install agent deps
cd agent && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..

# Boot the agent (port 3001) — real trading loop autostarts
cd agent && source .venv/bin/activate && python main.py

# In another shell, boot the frontend (port 3000)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and `/command` for the live command center.

---

## Environment

See [SETUP_LIVE.md](./SETUP_LIVE.md) for the full guide to getting every credential. Summary of the keys:

| Key | Purpose |
| --- | --- |
| `MANTLE_RPC_URL` / `MANTLE_CHAIN_ID` | Mantle Sepolia (5003) by default; mainnet (5000) for production |
| `NEXT_PUBLIC_MANTLE_EXPLORER` | Block explorer host for tx links |
| `AGENT_PRIVATE_KEY` | Wallet MOIXA signs decisions with (fresh wallet — never reuse) |
| `NEXT_PUBLIC_MOIXA_*_ADDRESS` | Auto-filled by the deploy script |
| `OPENAI_API_KEY` | GPT-4o reasoning (rule-based fallback if absent) |
| `BYBIT_API_KEY` / `BYBIT_API_SECRET` | Real market data + signed orders (testnet by default) |
| `BYBIT_TESTNET` | `true` (testnet) or `false` (mainnet) |
| `MOIXA_LIVE_TRADING` | `true` to place real exchange orders |
| `MOIXA_LOOP_INTERVAL` | Seconds between decision cycles (default 300) |
| `NEXT_PUBLIC_WS_URL` | Agent WebSocket (default ws://localhost:3001) |

**Once `AGENT_PRIVATE_KEY` + `NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS` are set, every decision is recorded on-chain.** No mock fallback — the agent fails loud with a helpful message if any required credential is missing.

---

## Deploying contracts

```bash
pnpm contracts:compile
AGENT_ADDRESS=0xYourMoixaWallet pnpm contracts:deploy:sepolia   # or contracts:deploy for mainnet
```

The deploy script writes contract addresses back to `.env.local` and mints MOIXA Agent #001.

---

## Project layout

```
/agent         FastAPI Python agent (brain, executor, recorder, bybit, ...)
/app           Next.js 14 App Router pages + API routes
/components    UI primitives, animations, page-scoped components
/contracts     Solidity contracts + deploy script
/hooks         React hooks (live feed, decisions, identity)
/lib           Shared utilities (mantle, supabase, wagmi, formatters)
/types         Shared TypeScript types
```

---

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Landing — hero, three features, live stats, demo moment, why Mantle |
| `/command` | **The showpiece.** Live command center with brain state, chart, identity |
| `/decisions` | Filterable history of every on-chain decision |
| `/identity` | ERC-8004 profile, reputation ring, milestone timeline |
| `/performance` | Equity curve, win rate, drawdown, confidence vs accuracy |
| `/how-it-works` | Pipeline explainer + architecture overview |

---

## No demo mode

MOIXA does **not** ship with a mock or scripted demo loop. The agent runs the real trading lifecycle — detect → reason → record → execute → monitor → close → update — or it fails loud telling you which credential is missing. See [SETUP_LIVE.md](./SETUP_LIVE.md) to wire it up in ~20 minutes.

---

Built for the **Turing Test Hackathon 2026 — AI Awakening Phase 2, AI Trading & Strategy track**.
