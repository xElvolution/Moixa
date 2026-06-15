# MOIXA — Go-Live Guide (get every key, step by step)

MOIXA is a **real** autonomous trading agent. There is no demo mode and no mock data — everything it shows
is real: real market data, real GPT-4o reasoning, real Bybit (testnet) orders, and real on-chain decision
records on Mantle. To run it, you need four sets of credentials. This guide walks you through getting each
one, in order, with copy-paste commands. Total time: ~20 minutes. Cost: **$0** (everything uses free
testnets and free tiers).

---

## What you need (checklist)

| # | Credential | Used for | Cost |
|---|------------|----------|------|
| 1 | **Bybit testnet API key + secret** | Real market data + placing real testnet trades | Free |
| 2 | **OpenAI API key** | GPT-4o reasoning (the agent's "brain") | ~Free/cheap |
| 3 | **Mantle wallet private key** | Signing on-chain decision records | Free |
| 4 | **Mantle Sepolia test MNT** | Gas for those on-chain txs | Free (faucet) |

You'll paste all of them into a single file: `.env.local` at the project root.

```bash
cp .env.local.example .env.local
```

Keep that file private — it's already in `.gitignore`.

---

## 0. Install everything (once)

```bash
# JS / frontend deps
pnpm install        # or: npm install

# Python agent deps (web3, bybit client, fastapi, openai, ...)
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 1. Bybit testnet API key + secret

The agent reads live prices, funding rates, and open interest from Bybit, and (optionally) places real
orders on the **testnet** — play money, zero risk.

1. Go to **https://testnet.bybit.com** and create an account (separate from any mainnet account).
2. Get free testnet funds: top-right **Assets → Request a Coin / Faucet**, add some test USDT.
3. Create API keys: profile menu → **API** (or directly **https://testnet.bybit.com/app/user/api-management**).
   - Click **Create New Key** → **System-generated API Keys**.
   - Permissions: enable **Contracts → Orders & Positions** and **Spot → Trade**. (Read is on by default.)
   - **Do NOT** enable Withdrawals.
   - Copy the **API Key** and **API Secret** (the secret is shown only once).
4. Put them in `.env.local`:

```
BYBIT_TESTNET=true
BYBIT_API_KEY=your_testnet_api_key
BYBIT_API_SECRET=your_testnet_api_secret
```

> Market data (price/funding/charts) works even without keys. Keys are required only to place trades.
> Live trading also needs `MOIXA_LIVE_TRADING=true` (see section 5).

---

## 2. OpenAI API key (GPT-4o reasoning)

1. Go to **https://platform.openai.com/api-keys** and sign in.
2. **Create new secret key**, copy it (starts with `sk-`).
3. Add a little credit if your account has none: **https://platform.openai.com/settings/organization/billing**
   ($5 is plenty — each decision costs a fraction of a cent).
4. Put it in `.env.local`:

```
OPENAI_API_KEY=sk-...
```

> Without this key the agent falls back to a built-in rule-based strategy (still real logic, not mock —
> but GPT-4o reasoning is the headline feature, so add the key).

---

## 3. Mantle wallet private key

This is the wallet MOIXA signs on-chain transactions with. **Create a fresh one** — never reuse a wallet
that holds real money.

Generate a throwaway keypair:

```bash
cd agent && source .venv/bin/activate
python -c "from eth_account import Account; a=Account.create(); print('ADDRESS    ', a.address); print('PRIVATE_KEY', a.key.hex())"
cd ..
```

Copy the two printed values. Put the private key in `.env.local`:

```
AGENT_PRIVATE_KEY=0x...   # the PRIVATE_KEY printed above
```

Keep the **ADDRESS** handy for the next two steps.

---

## 4. Fund the wallet with test MNT, then deploy the contracts

### 4a. Get free test MNT (gas)

Send test MNT to the **ADDRESS** from step 3 using the Mantle Sepolia faucet:

- **https://faucet.sepolia.mantle.xyz**  (paste your address, request MNT)

The RPC, chain id (5003), and explorer are already defaulted in `.env.local.example` to Mantle Sepolia.

### 4b. Deploy MOIXA's contracts

```bash
pnpm contracts:compile
AGENT_ADDRESS=<your ADDRESS from step 3> pnpm contracts:deploy:sepolia
```

This deploys `MoixaBrain`, `MoixaIdentity`, `MoixaExecutor`, mints **MOIXA Agent #1**, and writes the three
contract addresses back into `.env.local` automatically. Open the printed mint tx on
**https://sepolia.mantlescan.xyz** to confirm it's real.

> `AGENT_ADDRESS` must equal the wallet behind `AGENT_PRIVATE_KEY` — that wallet is the only one the
> contracts authorize to record decisions (`onlyMoixa`). The deploy script and the agent both use
> `AGENT_PRIVATE_KEY`, so they match automatically.

---

## 5. Choose your run mode, then boot

By default (after steps 1–4) the agent records every real decision on-chain but does **not** place exchange
orders. To also place real testnet trades, set:

```
MOIXA_LIVE_TRADING=true
```

Boot both processes:

```bash
# terminal 1 — the agent (port 3001), real trading loop autostarts
cd agent && source .venv/bin/activate && python main.py

# terminal 2 — the frontend (port 3000)
pnpm dev
```

Open **http://localhost:3000/command**.

---

## 6. Verify it's all real

- **Agent logs**: each cycle prints `[recorder] recorded decision #N tx=0x... block=...`, and on close
  `[recorder] closed decision #N` + `[recorder] updated identity`.
- **Explorer**: open any tx on **https://sepolia.mantlescan.xyz** → see `DecisionRecorded`, then
  `DecisionClosed` / `MoixaLearned`, then `ReputationUpdated` events.
- **UI**: on `/command` and `/decisions`, tx hashes are clickable and resolve to live transactions; the
  price chart and market context show real Bybit/market numbers.
- **Contract read**: on the explorer's **Read** tab for `MoixaBrain`, call `getTotalStats()` and watch
  `totalDecisions` climb.

---

## `.env.local` — the complete picture

```ini
# Mantle (Sepolia testnet)
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
MANTLE_CHAIN_ID=5003
NEXT_PUBLIC_MANTLE_EXPLORER=https://sepolia.mantlescan.xyz
AGENT_PRIVATE_KEY=0x...                       # step 3

# Contracts (auto-filled by the deploy script in step 4b)
NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS=
NEXT_PUBLIC_MOIXA_IDENTITY_ADDRESS=
NEXT_PUBLIC_MOIXA_EXECUTOR_ADDRESS=

# AI brain
OPENAI_API_KEY=sk-...                         # step 2

# Bybit (market data + trading)
BYBIT_TESTNET=true
BYBIT_API_KEY=                                # step 1
BYBIT_API_SECRET=                             # step 1
MOIXA_LIVE_TRADING=false                      # true = place real testnet orders

# Agent runtime
NEXT_PUBLIC_WS_URL=ws://localhost:3001
AGENT_WS_PORT=3001
MOIXA_LOOP_INTERVAL=300                        # seconds between decision cycles
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `RecordingNotConfigured` in agent logs | `AGENT_PRIVATE_KEY` or `NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS` missing — finish step 4. |
| `record_decision failed ... ConnectionError` | RPC unreachable or wallet out of gas — re-check RPC, top up at the faucet. |
| `TradingNotConfigured` | Bybit keys missing — finish step 1, and set `MOIXA_LIVE_TRADING=true`. |
| `Bybit order rejected` | Testnet wallet has no USDT, or symbol/permissions issue — fund testnet, enable Orders permission. |
| Tx links point at mainnet | Set `NEXT_PUBLIC_MANTLE_EXPLORER=https://sepolia.mantlescan.xyz`, restart `pnpm dev`. |
| `not agent` revert on record | `AGENT_ADDRESS` at deploy ≠ wallet behind `AGENT_PRIVATE_KEY`. Redeploy with the matching address. |

---

## Switching to mainnet later (real money — optional)

Config change, not a code change:

```
MANTLE_RPC_URL=https://rpc.mantle.xyz
MANTLE_CHAIN_ID=5000
NEXT_PUBLIC_MANTLE_EXPLORER=https://mantlescan.xyz
BYBIT_TESTNET=false
```

then `AGENT_ADDRESS=0x... pnpm contracts:deploy` and fund the wallet with real MNT. Trades will use your
real Bybit account — only do this when you fully understand the risk.
