"""
Agent Planner
─────────────
Calls Gemini to break a query into structured subtopics and decide
whether external research is needed.

Entry point for main.py: async def run(request: PlannerRequest) -> PlannerResponse
"""

import json
import re
import time
import uuid

from fastapi import HTTPException
from google import genai

import config
from models import PlannerRequest, PlannerResponse, Subtopic

_SYSTEM_PROMPT = """\
You are a research planning agent. Given a user's research query, do TWO things:

1. Break the query into 4-6 structured subtopics that a research report should cover.
   Each subtopic needs a title and brief description.

2. Decide whether external research is NEEDED for this query.
   Research is needed for: factual claims, data-driven topics, comparisons,
   technical analysis, current events.
   Research is NOT needed for: opinion pieces, creative writing, personal
   reflections, simple explanations of well-known concepts.

Respond ONLY in JSON format:
{
  "subtopics": [
    { "id": "1", "title": "...", "description": "..." }
  ],
  "research_recommended": true or false,
  "research_recommendation_reason": "Brief explanation of why research is or isn't needed"
}"""


def _extract_json(text: str) -> dict:
    """Strip markdown fences if present, then parse JSON."""
    text = text.strip()
    # Remove ```json ... ``` or ``` ... ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def run(request: PlannerRequest) -> PlannerResponse:
    start = time.time()

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    prompt = f"{_SYSTEM_PROMPT}\n\nQuery: {request.query}"

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
            detail=f"Planner returned invalid JSON. Raw response: {raw[:300]}",
        ) from exc

    subtopics = [
        Subtopic(
            id=item.get("id", str(uuid.uuid4())),
            title=item["title"],
            description=item.get("description", ""),
        )
        for item in data.get("subtopics", [])
    ]

    if not subtopics:
        raise HTTPException(status_code=502, detail="Planner returned no subtopics.")

    duration_ms = int((time.time() - start) * 1000)

    return PlannerResponse(
        subtopics=subtopics,
        research_recommended=bool(data.get("research_recommended", True)),
        research_recommendation_reason=data.get("research_recommendation_reason", ""),
        duration_ms=duration_ms,
    )
