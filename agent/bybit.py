"""Bybit V5 API client — real market data + (testnet) order execution.

Public endpoints (tickers, funding rate) need no auth and power MOIXA's real
signals. Trading endpoints are HMAC-signed and only used when API keys are set
AND MOIXA_LIVE_TRADING=true — default is testnet so the demo stays safe.

Docs: https://bybit-exchange.github.io/docs/v5/intro
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from typing import Any, Optional

import httpx


MAINNET = "https://api.bybit.com"
TESTNET = "https://api-testnet.bybit.com"

# MOIXA tokens → Bybit USDT-perp symbols.
SYMBOLS = {
    "ETH": "ETHUSDT",
    "BTC": "BTCUSDT",
    "MNT": "MNTUSDT",
}

_RECV_WINDOW = "5000"


def _base_url() -> str:
    testnet = os.environ.get("BYBIT_TESTNET", "true").lower() != "false"
    return TESTNET if testnet else MAINNET


def symbol_for(token: str) -> Optional[str]:
    return SYMBOLS.get(token.upper())


def has_trading_keys() -> bool:
    return bool(os.environ.get("BYBIT_API_KEY") and os.environ.get("BYBIT_API_SECRET"))


class BybitClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=10.0, base_url=_base_url())

    # ── Public market data (no auth) ──────────────────────────────────────────

    async def ticker(self, token: str, category: str = "linear") -> dict[str, Any]:
        """Latest ticker: lastPrice, volume24h, turnover24h, fundingRate, ..."""
        symbol = symbol_for(token)
        if not symbol:
            return {}
        try:
            r = await self._client.get(
                "/v5/market/tickers",
                params={"category": category, "symbol": symbol},
            )
            r.raise_for_status()
            data = r.json()
            lst = data.get("result", {}).get("list", [])
            return lst[0] if lst else {}
        except Exception:
            return {}

    async def funding_rate(self, token: str) -> Optional[float]:
        """Current funding rate as a decimal fraction (e.g. 0.0001 = 0.01%)."""
        t = await self.ticker(token, category="linear")
        rate = t.get("fundingRate")
        if rate is None or rate == "":
            return None
        try:
            return float(rate)
        except (TypeError, ValueError):
            return None

    async def price(self, token: str) -> Optional[float]:
        t = await self.ticker(token)
        last = t.get("lastPrice")
        try:
            return float(last) if last not in (None, "") else None
        except (TypeError, ValueError):
            return None

    async def kline(
        self, token: str, points: int = 60, interval: str = "5", category: str = "linear"
    ) -> list[dict[str, float]]:
        """Recent candles, oldest→newest. Each item: {t, close}."""
        symbol = symbol_for(token)
        if not symbol:
            return []
        try:
            r = await self._client.get(
                "/v5/market/kline",
                params={
                    "category": category,
                    "symbol": symbol,
                    "interval": interval,
                    "limit": min(points, 200),
                },
            )
            r.raise_for_status()
            rows = r.json().get("result", {}).get("list", [])
            # Bybit returns newest-first: [start, open, high, low, close, vol, turnover]
            out = [
                {"t": int(row[0]), "close": float(row[4])}
                for row in reversed(rows)
            ]
            return out
        except Exception:
            return []

    # ── Authenticated trading (testnet by default) ─────────────────────────────

    def _sign(self, timestamp: str, body: str) -> str:
        secret = os.environ["BYBIT_API_SECRET"]
        api_key = os.environ["BYBIT_API_KEY"]
        payload = f"{timestamp}{api_key}{_RECV_WINDOW}{body}"
        return hmac.new(
            secret.encode(), payload.encode(), hashlib.sha256
        ).hexdigest()

    async def _signed_post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        timestamp = str(int(time.time() * 1000))
        body_str = json.dumps(body, separators=(",", ":"))
        sign = self._sign(timestamp, body_str)
        headers = {
            "X-BAPI-API-KEY": os.environ["BYBIT_API_KEY"],
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": _RECV_WINDOW,
            "X-BAPI-SIGN": sign,
            "X-BAPI-SIGN-TYPE": "2",
            "Content-Type": "application/json",
        }
        r = await self._client.post(path, content=body_str, headers=headers)
        r.raise_for_status()
        return r.json()

    async def place_market_order(
        self,
        token: str,
        side: str,  # "Buy" | "Sell"
        qty: float,
        category: str = "linear",
    ) -> dict[str, Any]:
        """Place a market order. Returns Bybit's result dict (incl. orderId)."""
        symbol = symbol_for(token)
        if not symbol:
            raise ValueError(f"no Bybit symbol for {token}")
        body = {
            "category": category,
            "symbol": symbol,
            "side": side,
            "orderType": "Market",
            "qty": str(qty),
        }
        return await self._signed_post("/v5/order/create", body)

    async def close(self) -> None:
        await self._client.aclose()


_client: Optional[BybitClient] = None


def get_client() -> BybitClient:
    global _client
    if _client is None:
        _client = BybitClient()
    return _client


async def shutdown() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
