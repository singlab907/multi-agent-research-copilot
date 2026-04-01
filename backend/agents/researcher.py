"""
Agent Researcher
────────────────
Calls Gemini to produce per-subtopic findings and sources.

Entry point for main.py: async def run(request: ResearcherRequest) -> ResearcherResponse
"""

import json
import re
import time
import uuid

from fastapi import HTTPException
from google import genai

import config
from models import ResearcherRequest, ResearcherResponse, ResearchItem, Source

_SYSTEM_PROMPT = """\
You are a research agent. Given a research query and specific subtopics to investigate,
gather detailed information for each.

For each subtopic provide:
- Detailed research findings (2-3 paragraphs with specific facts, data points, and insights)
- 2-3 credible source references with real titles and plausible URLs

The subtopics provided may have been edited by the user, so research exactly what is
listed — do not add or skip any.

Respond ONLY in JSON format:
{
  "research": [
    {
      "subtopic_id": "1",
      "subtopic_title": "...",
      "findings": "detailed research text...",
      "sources": [
        { "title": "Source Name", "url": "https://..." }
      ]
    }
  ]
}"""


def _extract_json(text: str) -> dict:
    """Strip markdown fences if present, then parse JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def run(request: ResearcherRequest) -> ResearcherResponse:
    start = time.time()

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    subtopics_text = "\n".join(
        f'  - id: "{s.id}", title: "{s.title}", description: "{s.description}"'
        for s in request.subtopics
    )

    prompt = (
        f"{_SYSTEM_PROMPT}\n\n"
        f"Query: {request.query}\n\n"
        f"Subtopics to research:\n{subtopics_text}"
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
            detail=f"Researcher returned invalid JSON. Raw response: {raw[:300]}",
        ) from exc

    research: list[ResearchItem] = []
    for item in data.get("research", []):
        sources = [
            Source(
                title=s.get("title", ""),
                url=s.get("url", ""),
            )
            for s in item.get("sources", [])
        ]
        research.append(
            ResearchItem(
                subtopic_id=item.get("subtopic_id", str(uuid.uuid4())),
                subtopic_title=item.get("subtopic_title", ""),
                findings=item.get("findings", ""),
                sources=sources,
            )
        )

    if not research:
        raise HTTPException(status_code=502, detail="Researcher returned no research items.")

    duration_ms = int((time.time() - start) * 1000)

    return ResearcherResponse(research=research, duration_ms=duration_ms)
