from typing import Optional, Any
from pydantic import BaseModel


# ── Shared sub-models ─────────────────────────────────────────────────────────

class Subtopic(BaseModel):
    id: str
    title: str
    description: str


class ReportSection(BaseModel):
    heading: str
    content: str


class Report(BaseModel):
    title: str
    sections: list[ReportSection]


class Source(BaseModel):
    title: str
    url: str


class ResearchItem(BaseModel):
    subtopic_id: str
    subtopic_title: str
    findings: str
    sources: list[Source]


class ScoreWithReasoning(BaseModel):
    score: float
    reasoning: str


class EvaluatorFeedback(BaseModel):
    accuracy: ScoreWithReasoning
    completeness: ScoreWithReasoning
    clarity: ScoreWithReasoning
    overall_feedback: str


# ── Planner ───────────────────────────────────────────────────────────────────

class PlannerRequest(BaseModel):
    query: str


class PlannerResponse(BaseModel):
    subtopics: list[Subtopic]
    research_recommended: bool
    research_recommendation_reason: str
    duration_ms: int


# ── Researcher ────────────────────────────────────────────────────────────────

class ResearcherRequest(BaseModel):
    query: str
    subtopics: list[Subtopic]


class ResearcherResponse(BaseModel):
    research: list[ResearchItem]
    duration_ms: int


# ── Writer ────────────────────────────────────────────────────────────────────

class WriterRequest(BaseModel):
    query: str
    subtopics: list[Subtopic]
    research: Optional[list[ResearchItem]] = None
    research_used: bool


class WriterResponse(BaseModel):
    report: Report
    research_used: bool
    duration_ms: int


# ── Writer Revise ─────────────────────────────────────────────────────────────

class WriterReviseRequest(BaseModel):
    query: str
    report: Report
    evaluator_feedback: EvaluatorFeedback


class WriterReviseResponse(BaseModel):
    report: Report
    revision_notes: str
    duration_ms: int


# ── Evaluator ─────────────────────────────────────────────────────────────────

class EvaluatorRequest(BaseModel):
    query: str
    report: Report


class EvaluatorResponse(BaseModel):
    accuracy: ScoreWithReasoning
    completeness: ScoreWithReasoning
    clarity: ScoreWithReasoning
    hallucination_risk: str   # "Low" | "Medium" | "High"
    confidence_score: int     # 0–100
    needs_revision: bool
    overall_feedback: str
    duration_ms: int


# ── History ───────────────────────────────────────────────────────────────────

class HistorySummary(BaseModel):
    id: str
    query: str
    report_title: str
    confidence_score: Optional[int]
    timestamp: str


class HistoryScores(BaseModel):
    accuracy: Optional[float]
    completeness: Optional[float]
    clarity: Optional[float]
    hallucination_risk: Optional[str]
    confidence_score: Optional[int]


class HistoryEntry(BaseModel):
    id: str
    query: str
    report_title: str
    research_used: bool
    research_skipped: bool
    revision_happened: bool
    scores: HistoryScores
    full_report: Any
    full_evaluation: Any
    timestamp: str


class SaveResultRequest(BaseModel):
    query: str
    report: Any
    evaluation: Any
    research_used: bool
    research_skipped: bool
    revision_happened: bool
