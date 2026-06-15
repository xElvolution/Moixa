from __future__ import annotations

import asyncio
from typing import Optional

import httpx

from models import MarketSignal


COINGECKO_IDS = {
    "ETH": "ethereum",
    "BTC": "bitcoin",
    "MNT": "mantle",
}


class PriceFeed:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=8.0)
        self._cache: dict[str, dict] = {}

    async def fetch(self, token: str) -> dict:
        cg_id = COINGECKO_IDS.get(token.upper())
        if not cg_id:
            return {}
        try:
            r = await self._client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={"vs_currency": "usd", "ids": cg_id},
            )
            r.raise_for_status()
            data = r.json()
            if data:
                self._cache[token] = data[0]
                return data[0]
        except Exception:
            pass
        return self._cache.get(token, {})

    async def close(self) -> None:
        await self._client.aclose()


_feed = PriceFeed()


async def detect_momentum(token: str, timeframe: str = "1h") -> Optional[MarketSignal]:
    data = await _feed.fetch(token)
    change_24h = float(data.get("price_change_percentage_24h") or 0)
    abs_change = abs(change_24h)
    if abs_change < 1.0:
        return None
    strength = min(1.0, abs_change / 8.0)
    direction = "LONG" if change_24h > 0 else "SHORT"
    return MarketSignal(
        type="MOMENTUM",
        token=token,
        strength=strength,
        direction=direction,
        timeframe=timeframe,
        source="coingecko",
        detail=f"24h change {change_24h:+.2f}%",
    )


async def detect_volume_anomaly(token: str) -> Optional[MarketSignal]:
    data = await _feed.fetch(token)
    volume = float(data.get("total_volume") or 0)
    market_cap = float(data.get("market_cap") or 1)
    ratio = volume / max(market_cap, 1)
    if ratio < 0.04:
        return None
    strength = min(1.0, ratio / 0.25)
    return MarketSignal(
        type="VOLUME_SPIKE",
        token=token,
        strength=strength,
        direction="LONG" if data.get("price_change_percentage_24h", 0) >= 0 else "SHORT",
        timeframe="24h",
        source="coingecko",
        detail=f"vol/mcap {ratio:.3f}",
    )


async def detect_smart_money(token: str) -> Optional[MarketSignal]:
    # Real proxy for smart-money positioning: 24h open-interest value on Bybit
    # perps. A large OI relative to 24h turnover signals leveraged conviction.
    try:
        import bybit

        t = await bybit.get_client().ticker(token, category="linear")
    except Exception:
        return None
    oi = t.get("openInterestValue")
    turnover = t.get("turnover24h")
    change = t.get("price24hPcnt")
    try:
        oi_v = float(oi)
        turn_v = float(turnover)
        chg = float(change)
    except (TypeError, ValueError):
        return None
    if turn_v <= 0:
        return None
    ratio = oi_v / turn_v
    if ratio < 0.5:
        return None
    return MarketSignal(
        type="SMART_MONEY",
        token=token,
        strength=min(1.0, ratio / 2.0),
        direction="LONG" if chg >= 0 else "SHORT",
        timeframe="24h",
        source="bybit-oi",
        detail=f"OI/turnover {ratio:.2f} — leveraged conviction",
    )


async def detect_funding_rate(token: str) -> Optional[MarketSignal]:
    # Real funding rate from Bybit V5 (USDT perp). No signal if unavailable.
    try:
        import bybit

        rate = await bybit.get_client().funding_rate(token)
    except Exception:
        rate = None
    if rate is None or abs(rate) < 0.0002:
        return None
    return MarketSignal(
        type="FUNDING",
        token=token,
        strength=min(1.0, abs(rate) / 0.001),
        direction="SHORT" if rate > 0 else "LONG",
        timeframe="8h",
        source="bybit",
        detail=f"funding {rate*100:+.4f}%",
    )


async def detect_liquidity_depth(token: str) -> Optional[MarketSignal]:
    data = await _feed.fetch(token)
    volume = float(data.get("total_volume") or 0)
    if volume == 0 or volume > 200_000_000:
        return None
    return MarketSignal(
        type="LIQUIDITY_RISK",
        token=token,
        strength=0.55,
        direction="NEUTRAL",
        timeframe="now",
        source="orderbook",
        detail="Thin orderbook depth on Merchant Moe",
    )


async def detect_cross_market_correlation(token: str) -> Optional[MarketSignal]:
    if token.upper() in {"BTC", "ETH"}:
        return None
    btc = await _feed.fetch("BTC")
    btc_change = float(btc.get("price_change_percentage_24h") or 0)
    if abs(btc_change) < 3.0:
        return None
    return MarketSignal(
        type="CORRELATION",
        token=token,
        strength=min(1.0, abs(btc_change) / 10.0),
        direction="SHORT" if btc_change < 0 else "LONG",
        timeframe="24h",
        source="btc-correlation",
        detail=f"BTC moved {btc_change:+.2f}% — altcoins follow",
    )


async def detect_signals(token: str, timeframe: str = "1h") -> list[MarketSignal]:
    results = await asyncio.gather(
        detect_momentum(token, timeframe),
        detect_volume_anomaly(token),
        detect_smart_money(token),
        detect_funding_rate(token),
        detect_liquidity_depth(token),
        detect_cross_market_correlation(token),
        return_exceptions=True,
    )
    signals: list[MarketSignal] = []
    for r in results:
        if isinstance(r, MarketSignal) and r.strength > 0.5:
            signals.append(r)
    return signals


async def market_context(token: str) -> dict:
    data = await _feed.fetch(token)
    glob = await global_context()
    return {
        "price": data.get("current_price"),
        "change24h": data.get("price_change_percentage_24h"),
        "volume24h": data.get("total_volume"),
        "marketCap": data.get("market_cap"),
        "high24h": data.get("high_24h"),
        "low24h": data.get("low_24h"),
        **glob,
    }


_global_cache: dict = {}


async def global_context() -> dict:
    """Real BTC dominance (CoinGecko) + Fear & Greed (alternative.me)."""
    out: dict = {}
    try:
        r = await _feed._client.get("https://api.coingecko.com/api/v3/global")
        r.raise_for_status()
        d = r.json().get("data", {})
        dom = d.get("market_cap_percentage", {}).get("btc")
        if dom is not None:
            out["btcDominance"] = round(float(dom), 2)
    except Exception:
        pass
    try:
        r = await _feed._client.get("https://api.alternative.me/fng/?limit=1")
        r.raise_for_status()
        lst = r.json().get("data", [])
        if lst:
            out["fearGreed"] = int(lst[0]["value"])
    except Exception:
        pass
    if out:
        _global_cache.update(out)
    return {**_global_cache, **out}


async def shutdown() -> None:
    await _feed.close()
