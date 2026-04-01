"""
Full pipeline integration test.

Run from the backend/ directory with the server already running:
    python test_pipeline.py

Requires:
    pip install requests
"""

import json
import time
import requests

BASE = "http://localhost:8000"


def post(path: str, body: dict) -> dict:
    r = requests.post(f"{BASE}{path}", json=body, timeout=120)
    r.raise_for_status()
    return r.json()


def separator(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print('─' * 60)


# ─────────────────────────────────────────────────────────────
# PATH A — Full research pipeline
# ─────────────────────────────────────────────────────────────

separator("PATH A — Full research pipeline")
pipeline_start = time.time()

QUERY = "Impact of AI on healthcare diagnostics"

# 1. Planner
separator("Step 1 — Agent Planner")
planner = post("/api/agent/planner", {"query": QUERY})
print(f"Research recommended : {planner['research_recommended']}")
print(f"Reason               : {planner['research_recommendation_reason']}")
print(f"Subtopics ({len(planner['subtopics'])}):")
for s in planner["subtopics"]:
    print(f"  [{s['id']}] {s['title']}")
print(f"Duration             : {planner['duration_ms']} ms")

# 2. Researcher
separator("Step 2 — Agent Researcher")
researcher = post("/api/agent/researcher", {
    "query": QUERY,
    "subtopics": planner["subtopics"],
})
print(f"Research items returned: {len(researcher['research'])}")
for item in researcher["research"]:
    snippet = item["findings"][:120].replace("\n", " ")
    print(f"  [{item['subtopic_id']}] {item['subtopic_title']}")
    print(f"       {snippet}…")
    print(f"       Sources: {len(item['sources'])}")
print(f"Duration: {researcher['duration_ms']} ms")

# 3. Writer (with research)
separator("Step 3 — Agent Writer (with research)")
writer = post("/api/agent/writer", {
    "query": QUERY,
    "subtopics": planner["subtopics"],
    "research": researcher["research"],
    "research_used": True,
})
report = writer["report"]
print(f"Report title    : {report['title']}")
print(f"Section count   : {len(report['sections'])}")
for sec in report["sections"]:
    print(f"  - {sec['heading']}")
print(f"Duration        : {writer['duration_ms']} ms")

# 4. Evaluator
separator("Step 4 — Agent Evaluator")
evaluator = post("/api/agent/evaluator", {
    "query": QUERY,
    "report": report,
})
print(f"Accuracy        : {evaluator['accuracy']['score']}/5  — {evaluator['accuracy']['reasoning'][:80]}…")
print(f"Completeness    : {evaluator['completeness']['score']}/5  — {evaluator['completeness']['reasoning'][:80]}…")
print(f"Clarity         : {evaluator['clarity']['score']}/5  — {evaluator['clarity']['reasoning'][:80]}…")
print(f"Hallucination   : {evaluator['hallucination_risk']}")
print(f"Confidence      : {evaluator['confidence_score']}/100")
print(f"Needs revision  : {evaluator['needs_revision']}")
print(f"Overall feedback: {evaluator['overall_feedback'][:120]}…")
print(f"Duration        : {evaluator['duration_ms']} ms")

# 5. Revision loop (if needed)
final_report = report
final_eval = evaluator

if evaluator["needs_revision"]:
    separator("Step 5 — Writer Revision (triggered by evaluator)")
    revise = post("/api/agent/writer/revise", {
        "query": QUERY,
        "report": report,
        "evaluator_feedback": {
            "accuracy": evaluator["accuracy"],
            "completeness": evaluator["completeness"],
            "clarity": evaluator["clarity"],
            "overall_feedback": evaluator["overall_feedback"],
        },
    })
    final_report = revise["report"]
    print(f"Revision notes  : {revise['revision_notes'][:200]}")
    print(f"Revised sections: {len(final_report['sections'])}")
    print(f"Duration        : {revise['duration_ms']} ms")

    separator("Step 5b — Re-evaluation after revision")
    final_eval = post("/api/agent/evaluator", {
        "query": QUERY,
        "report": final_report,
    })
    print(f"Accuracy        : {final_eval['accuracy']['score']}/5")
    print(f"Completeness    : {final_eval['completeness']['score']}/5")
    print(f"Clarity         : {final_eval['clarity']['score']}/5")
    print(f"Confidence      : {final_eval['confidence_score']}/100")
    print(f"Needs revision  : {final_eval['needs_revision']}")
    print(f"Duration        : {final_eval['duration_ms']} ms")
else:
    print("\nNo revision needed — report passed quality threshold.")

pipeline_a_ms = int((time.time() - pipeline_start) * 1000)
separator("PATH A — Complete")
print(f"Total pipeline duration: {pipeline_a_ms} ms")


# ─────────────────────────────────────────────────────────────
# PATH B — Skip research path
# ─────────────────────────────────────────────────────────────

separator("PATH B — Skip research path")
path_b_start = time.time()

QUERY_B = "Write a motivational speech about overcoming challenges"

# 11. Planner
separator("Step 1 — Agent Planner")
planner_b = post("/api/agent/planner", {"query": QUERY_B})
print(f"Research recommended : {planner_b['research_recommended']}")
print(f"Reason               : {planner_b['research_recommendation_reason']}")
print(f"Subtopics ({len(planner_b['subtopics'])}):")
for s in planner_b["subtopics"]:
    print(f"  [{s['id']}] {s['title']}")
print(f"Duration             : {planner_b['duration_ms']} ms")

# 12. Researcher skipped — log it
print("\n[Researcher skipped — no external research for this query]")

# 13. Writer (no research)
separator("Step 3 — Agent Writer (research skipped)")
writer_b = post("/api/agent/writer", {
    "query": QUERY_B,
    "subtopics": planner_b["subtopics"],
    "research": None,
    "research_used": False,
})
report_b = writer_b["report"]
print(f"Report title    : {report_b['title']}")
print(f"Section count   : {len(report_b['sections'])}")
for sec in report_b["sections"]:
    print(f"  - {sec['heading']}")
print(f"Duration        : {writer_b['duration_ms']} ms")

# 14. Evaluator
separator("Step 4 — Agent Evaluator")
eval_b = post("/api/agent/evaluator", {
    "query": QUERY_B,
    "report": report_b,
})
print(f"Accuracy        : {eval_b['accuracy']['score']}/5")
print(f"Completeness    : {eval_b['completeness']['score']}/5")
print(f"Clarity         : {eval_b['clarity']['score']}/5")
print(f"Hallucination   : {eval_b['hallucination_risk']}")
print(f"Confidence      : {eval_b['confidence_score']}/100")
print(f"Needs revision  : {eval_b['needs_revision']}")
print(f"Overall feedback: {eval_b['overall_feedback'][:120]}…")
print(f"Duration        : {eval_b['duration_ms']} ms")

path_b_ms = int((time.time() - path_b_start) * 1000)
separator("PATH B — Complete")
print(f"Total pipeline duration: {path_b_ms} ms")

separator("ALL TESTS PASSED")
