"""
Agent Evaluator
───────────────
Calls Gemini to critically assess a research report and return quality scores,
confidence, hallucination risk, and a revision recommendation.

Entry point for main.py:
  async def run(request: EvaluatorRequest) -> EvaluatorResponse
"""

import json
import re
import time

from fastapi import HTTPException
from google import genai

import config
from models import (
    EvaluatorRequest,
    EvaluatorResponse,
    ScoreWithReasoning,
)

_CONFIDENCE_THRESHOLD = 70  # below this → needs_revision = True

_SYSTEM_PROMPT = """\
You are an evaluation agent. Critically assess the quality of this research report. \
Be honest and thorough in your evaluation.

Evaluate across these dimensions:
1. Accuracy (1.0-5.0): Is the information factually correct and well-supported?
2. Completeness (1.0-5.0): Are all relevant aspects of the query covered?
3. Clarity (1.0-5.0): Is the report readable, well-structured, and coherent?
4. Hallucination Risk: Low / Medium / High — are there unsupported claims or fabricated facts?
5. Overall Confidence Score (0-100): your overall confidence in the report quality.

Determine if the report needs revision:
- Set needs_revision to true if confidence_score < 70 OR if any individual score is below 3.0
- Set needs_revision to false otherwise

Provide an overall_feedback field with 2-3 sentences of constructive feedback \
explaining what could be improved.

Respond ONLY in JSON format:
{
  "accuracy": { "score": 4.2, "reasoning": "..." },
  "completeness": { "score": 4.5, "reasoning": "..." },
  "clarity": { "score": 4.6, "reasoning": "..." },
  "hallucination_risk": "Low",
  "confidence_score": 85,
  "needs_revision": false,
  "overall_feedback": "..."
}"""


def _extract_json(text: str) -> dict:
    """Strip markdown fences if present, then parse JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _format_report(report) -> str:
    """Render report sections as readable text for the prompt."""
    lines = [f"Title: {report.title}", ""]
    for section in report.sections:
        lines.append(f"## {section.heading}")
        lines.append(section.content)
        lines.append("")
    return "\n".join(lines).strip()


async def run(request: EvaluatorRequest) -> EvaluatorResponse:
    start = time.time()

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    report_text = _format_report(request.report)

    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"Original query: {request.query}\n\n"
        f"Report:\n{report_text}"
    )

    try:
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=prompt,
        )
        raw = response.text
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc

    try:
        data = _extract_json(raw)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Evaluator returned invalid JSON. Raw response: {raw[:300]}",
        ) from exc

    def _score(key: str) -> ScoreWithReasoning:
        item = data.get(key, {})
        return ScoreWithReasoning(
            score=float(item.get("score", 3.0)),
            reasoning=item.get("reasoning", ""),
        )

    accuracy = _score("accuracy")
    completeness = _score("completeness")
    clarity = _score("clarity")
    confidence_score = int(data.get("confidence_score", 70))
    hallucination_risk = data.get("hallucination_risk", "Medium")
    overall_feedback = data.get("overall_feedback", "")

    needs_revision = (
        confidence_score < _CONFIDENCE_THRESHOLD
        or accuracy.score < 3.0
        or completeness.score < 3.0
        or clarity.score < 3.0
    )

    duration_ms = int((time.time() - start) * 1000)

    return EvaluatorResponse(
        accuracy=accuracy,
        completeness=completeness,
        clarity=clarity,
        hallucination_risk=hallucination_risk,
        confidence_score=confidence_score,
        needs_revision=needs_revision,
        overall_feedback=overall_feedback,
        duration_ms=duration_ms,
    )
