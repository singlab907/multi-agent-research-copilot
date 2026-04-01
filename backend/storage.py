"""
History storage — reads/writes backend/data/history.json.

Each entry shape:
  {
    "id": str (UUID),
    "query": str,
    "report_title": str,
    "research_used": bool,
    "research_skipped": bool,
    "revision_happened": bool,
    "scores": {
      "accuracy": float,
      "completeness": float,
      "clarity": float,
      "hallucination_risk": str,
      "confidence_score": int
    },
    "full_report": { "title": str, "sections": [...] },
    "full_evaluation": { all EvaluatorResponse fields },
    "timestamp": str (ISO 8601)
  }
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

_HISTORY_FILE = Path(__file__).parent / "data" / "history.json"
_MAX_ENTRIES = 50   # internal cap to keep the file small


def _read() -> list[dict]:
    try:
        return json.loads(_HISTORY_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _write(entries: list[dict]) -> None:
    _HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    _HISTORY_FILE.write_text(json.dumps(entries, indent=2))


def save_result(
    *,
    query: str,
    report: dict,
    evaluation: dict,
    research_used: bool,
    research_skipped: bool,
    revision_happened: bool,
) -> str:
    """Persist a completed pipeline result. Returns the new entry's id."""
    entry_id = str(uuid.uuid4())
    entry = {
        "id": entry_id,
        "query": query,
        "report_title": report.get("title", ""),
        "research_used": research_used,
        "research_skipped": research_skipped,
        "revision_happened": revision_happened,
        "scores": {
            "accuracy":         evaluation.get("accuracy", {}).get("score"),
            "completeness":     evaluation.get("completeness", {}).get("score"),
            "clarity":          evaluation.get("clarity", {}).get("score"),
            "hallucination_risk": evaluation.get("hallucination_risk"),
            "confidence_score": evaluation.get("confidence_score"),
        },
        "full_report":      report,
        "full_evaluation":  evaluation,
        "timestamp":        datetime.now(timezone.utc).isoformat(),
    }

    entries = _read()
    entries.insert(0, entry)          # newest first
    entries = entries[:_MAX_ENTRIES]  # trim
    _write(entries)
    return entry_id


def get_history() -> list[dict]:
    """Return summary fields for the last 10 entries."""
    entries = _read()
    return [
        {
            "id":               e["id"],
            "query":            e["query"],
            "report_title":     e["report_title"],
            "confidence_score": e["scores"]["confidence_score"],
            "timestamp":        e["timestamp"],
        }
        for e in entries[:10]
    ]


def get_result(entry_id: str) -> dict | None:
    """Return the full entry for `entry_id`, or None if not found."""
    for entry in _read():
        if entry["id"] == entry_id:
            return entry
    return None
