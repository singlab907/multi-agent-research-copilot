"""
Agent Writer
────────────
Calls Gemini to produce a full draft report from subtopics + optional research,
and to revise a report based on evaluator feedback.

Handles two scenarios for run():
  A — research_used=True:  evidence-based report incorporating findings and sources
  B — research_used=False: report from subtopics and model knowledge only

Entry points for main.py:
  async def run(request: WriterRequest) -> WriterResponse
  async def run_revise(request: WriterReviseRequest) -> WriterReviseResponse
"""

import json
import re
import time

from fastapi import HTTPException
from google import genai

import config
from models import WriterRequest, WriterResponse, WriterReviseRequest, WriterReviseResponse, Report, ReportSection

_SYSTEM_PROMPT_WITH_RESEARCH = """\
You are a report writing agent. Write a professional, well-structured research report \
based on the provided query, subtopics, and research data.

The report should include:
- A clear, descriptive title
- An introduction section
- One detailed section per subtopic (use the provided research findings)
- A risks and challenges section
- A conclusion with key takeaways

Incorporate the research findings and cite the sources where relevant. \
If any subtopic includes a personal note from the researcher, incorporate \
those insights naturally into the relevant section.

Respond ONLY in JSON format:
{
  "report": {
    "title": "...",
    "sections": [
      { "heading": "Introduction", "content": "..." },
      { "heading": "...", "content": "..." }
    ]
  }
}"""

_SYSTEM_PROMPT_NO_RESEARCH = """\
You are a report writing agent. Write a professional, well-structured research report \
based on the provided query and subtopics. No external research data was gathered for \
this report — write based on general knowledge.

The report should include:
- A clear, descriptive title
- An introduction section
- One detailed section per subtopic
- A risks and challenges section
- A conclusion with key takeaways

Note within the report that it was generated without external research verification.

Respond ONLY in JSON format:
{
  "report": {
    "title": "...",
    "sections": [
      { "heading": "Introduction", "content": "..." },
      { "heading": "...", "content": "..." }
    ]
  }
}"""


def _extract_json(text: str) -> dict:
    """Strip markdown fences if present, then parse JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def _format_research(research) -> str:
    """Render research items as a readable block for the prompt."""
    lines: list[str] = []
    for item in research:
        lines.append(f'Subtopic: "{item.subtopic_title}" (id: {item.subtopic_id})')
        lines.append(f"Findings: {item.findings}")
        if item.sources:
            src_list = "; ".join(f'{s.title} ({s.url})' for s in item.sources)
            lines.append(f"Sources: {src_list}")
        lines.append("")
    return "\n".join(lines).strip()


async def run(request: WriterRequest) -> WriterResponse:
    start = time.time()

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    subtopics_text = "\n".join(
        f'  - id: "{s.id}", title: "{s.title}", description: "{s.description}"'
        for s in request.subtopics
    )

    if request.research_used and request.research:
        system_prompt = _SYSTEM_PROMPT_WITH_RESEARCH
        research_block = _format_research(request.research)
        prompt = (
            f"{system_prompt}\n\n"
            f"Query: {request.query}\n\n"
            f"Subtopics:\n{subtopics_text}\n\n"
            f"Research data:\n{research_block}"
        )
    else:
        system_prompt = _SYSTEM_PROMPT_NO_RESEARCH
        prompt = (
            f"{system_prompt}\n\n"
            f"Query: {request.query}\n\n"
            f"Subtopics:\n{subtopics_text}\n\n"
            "Research data: No external research was conducted for this report."
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
            detail=f"Writer returned invalid JSON. Raw response: {raw[:300]}",
        ) from exc

    report_data = data.get("report", {})
    sections = [
        ReportSection(
            heading=sec.get("heading", ""),
            content=sec.get("content", ""),
        )
        for sec in report_data.get("sections", [])
    ]

    if not sections:
        raise HTTPException(status_code=502, detail="Writer returned no report sections.")

    report = Report(
        title=report_data.get("title", f"Research Report: {request.query[:80]}"),
        sections=sections,
    )

    duration_ms = int((time.time() - start) * 1000)

    return WriterResponse(
        report=report,
        research_used=request.research_used,
        duration_ms=duration_ms,
    )


_SYSTEM_PROMPT_REVISE = """\
You are a report revision agent. You have received feedback from an evaluator about \
a research report. Your job is to IMPROVE the report based on this feedback.

Revise the report to address the evaluator's concerns. Improve weak areas while \
keeping strong sections intact. Do not completely rewrite — make targeted improvements.

Also provide a brief note explaining what you changed.

Respond ONLY in JSON format:
{
  "report": {
    "title": "...",
    "sections": [
      { "heading": "...", "content": "..." }
    ]
  },
  "revision_notes": "Brief explanation of changes made..."
}"""


def _format_report(report) -> str:
    """Render report sections as readable text for the prompt."""
    lines = [f"Title: {report.title}", ""]
    for section in report.sections:
        lines.append(f"## {section.heading}")
        lines.append(section.content)
        lines.append("")
    return "\n".join(lines).strip()


async def run_revise(request: WriterReviseRequest) -> WriterReviseResponse:
    start = time.time()

    client = genai.Client(api_key=config.GEMINI_API_KEY)

    fb = request.evaluator_feedback
    feedback_block = (
        f"- Accuracy: {fb.accuracy.score}/5 — {fb.accuracy.reasoning}\n"
        f"- Completeness: {fb.completeness.score}/5 — {fb.completeness.reasoning}\n"
        f"- Clarity: {fb.clarity.score}/5 — {fb.clarity.reasoning}\n"
        f"- Overall feedback: {fb.overall_feedback}"
    )

    report_text = _format_report(request.report)

    prompt = (
        f"{_SYSTEM_PROMPT_REVISE}\n\n"
        f"Original query: {request.query}\n\n"
        f"Current report:\n{report_text}\n\n"
        f"Evaluator feedback:\n{feedback_block}"
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
            detail=f"Writer revision returned invalid JSON. Raw response: {raw[:300]}",
        ) from exc

    report_data = data.get("report", {})
    sections = [
        ReportSection(
            heading=sec.get("heading", ""),
            content=sec.get("content", ""),
        )
        for sec in report_data.get("sections", [])
    ]

    if not sections:
        raise HTTPException(status_code=502, detail="Writer revision returned no report sections.")

    revised_report = Report(
        title=report_data.get("title", request.report.title),
        sections=sections,
    )

    duration_ms = int((time.time() - start) * 1000)

    return WriterReviseResponse(
        report=revised_report,
        revision_notes=data.get("revision_notes", "Report revised based on evaluator feedback."),
        duration_ms=duration_ms,
    )
