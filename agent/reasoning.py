from __future__ import annotations

import json
import os
from typing import Optional

from models import DecisionInput, DecisionOutput, MarketSignal

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None  # type: ignore


_client: Optional["AsyncOpenAI"] = None


def _model() -> str:
    return os.environ.get("OPENAI_MODEL", "gpt-4o")


def _is_reasoning_model(model: str) -> bool:
    # o-series and gpt-5 reasoning models reject `temperature` and use
    # `max_completion_tokens` instead of `max_tokens`.
    m = model.lower()
    return m.startswith(("o1", "o3", "o4", "gpt-5"))


async def _chat(client, messages, json_mode=False, temperature=0.2, max_tokens=None):
    """Model-agnostic chat call. Handles gpt vs o-series/gpt-5 param differences."""
    model = _model()
    kwargs: dict = {"model": model, "messages": messages}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    if _is_reasoning_model(model):
        if max_tokens:
            kwargs["max_completion_tokens"] = max_tokens
        # reasoning models don't accept temperature
    else:
        kwargs["temperature"] = temperature
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
    return await client.chat.completions.create(**kwargs)


def _get_client():
    global _client
    if _client is not None:
        return _client
    key = os.environ.get("OPENAI_API_KEY")
    if not key or AsyncOpenAI is None:
        return None
    _client = AsyncOpenAI(api_key=key)
    return _client


SYSTEM_PROMPT = """You are MOIXA, an autonomous AI trading agent on Mantle blockchain. Your decisions are recorded permanently on-chain and your reputation depends on accuracy.

Rules:
- Only trade if confidence > 0.75
- Never risk more than 20% of capital per trade
- Never leverage > 3x unless confidence > 0.9
- Always explain your reasoning in fullReasoning
- Be specific about what signal drove the decision

You MUST respond in this exact JSON format:
{
  "shouldTrade": boolean,
  "direction": "LONG" | "SHORT" | "FLAT",
  "token": "ETH" | "BTC" | "MNT" | "USDC",
  "positionSize": number,
  "leverage": 1 | 2 | 3 | 5,
  "confidenceScore": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "riskReasoning": "one sentence explanation",
  "expectedReturn": number,
  "expectedTimeframe": "X hours",
  "fullReasoning": "detailed multi-sentence explanation"
}
"""


def _fallback_decision(
    signals: list[MarketSignal], decision_input: DecisionInput
) -> DecisionOutput:
    if not signals:
        return DecisionOutput(
            shouldTrade=False,
            direction="FLAT",
            token=decision_input.signals[0].token if decision_input.signals else "ETH",
            positionSize=0,
            leverage=1,
            confidenceScore=0.0,
            riskLevel="LOW",
            riskReasoning="No actionable signals detected.",
            expectedReturn=0,
            expectedTimeframe="0 hours",
            fullReasoning="No signal exceeded the confidence threshold. MOIXA stays FLAT.",
        )

    primary = max(signals, key=lambda s: s.strength)
    avg_strength = sum(s.strength for s in signals) / len(signals)
    confidence = min(0.98, avg_strength * 0.9 + 0.05 * len(signals))
    direction = primary.direction if primary.direction != "NEUTRAL" else "FLAT"
    should = confidence > 0.75 and direction != "FLAT"
    size = round(min(decision_input.availableCapital * 0.2, 500.0), 2) if should else 0
    risk = "LOW" if confidence > 0.85 else ("MEDIUM" if confidence > 0.7 else "HIGH")
    leverage = 1 if confidence < 0.9 else 2

    reasoning_parts = [
        f"Detected {primary.type.lower().replace('_', ' ')} signal on {primary.token}/{('USDC')}.",
        f"Signal strength {primary.strength*100:.1f}% - {primary.detail}.",
        f"Aggregate confidence {confidence*100:.1f}% across {len(signals)} signal{'s' if len(signals) != 1 else ''}.",
    ]
    if should:
        reasoning_parts.append(
            f"Position sized at ${size:.0f} ({(size/decision_input.availableCapital)*100:.1f}% of capital)."
        )
    else:
        reasoning_parts.append("Below threshold - staying FLAT.")

    return DecisionOutput(
        shouldTrade=should,
        direction=direction if should else "FLAT",
        token=primary.token,
        positionSize=size,
        leverage=leverage,
        confidenceScore=confidence,
        riskLevel=risk,
        riskReasoning=f"{risk} risk. {primary.type} signal at {primary.strength*100:.0f}% strength.",
        expectedReturn=200 if should else 0,
        expectedTimeframe="4 hours",
        fullReasoning=" ".join(reasoning_parts),
    )


async def reason_about_decision(
    signals: list[MarketSignal],
    market_context: dict,
    decision_input: DecisionInput,
) -> DecisionOutput:
    client = _get_client()
    if client is None:
        return _fallback_decision(signals, decision_input)

    user_prompt = f"""Current market signals detected:
{json.dumps([s.model_dump() for s in signals], indent=2)}

Market context:
{json.dumps(market_context, indent=2)}

Current positions:
{json.dumps(decision_input.currentPositions, indent=2)}

Available capital: ${decision_input.availableCapital}

Analyze these signals and make a trading decision."""

    try:
        response = await _chat(
            client,
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            json_mode=True,
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        data = json.loads(content)
        return DecisionOutput(**data)
    except Exception as e:
        print(f"[reasoning] model call failed ({_model()}), using fallback: {e}")
        return _fallback_decision(signals, decision_input)


async def generate_learning_note(
    decision_summary: str, actual_return: float, was_correct: bool
) -> str:
    client = _get_client()
    if client is None:
        verdict = "accurate" if was_correct else "missed"
        return (
            f"Signal proved {verdict}. Actual return {actual_return:+.2f}%. "
            "Tighten entry timing on next similar setup."
        )

    prompt = f"""You are MOIXA reflecting on a closed trade.
Decision: {decision_summary}
Actual return: {actual_return:.2f} basis points
Was correct: {was_correct}

Write a 1-2 sentence learning note. What worked? What should MOIXA do differently?
This note is stored on-chain forever, so be specific and concrete."""
    try:
        response = await _chat(
            client,
            [{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=160,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception:
        return f"Closed trade. Actual return {actual_return:+.2f}%. Logged for review."
