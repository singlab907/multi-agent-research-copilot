"""
Multi-Agent Research Copilot — Backend
───────────────────────────────────────
FastAPI app exposing one endpoint per agent plus a health check.

Run:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Agent status:
  planner    — LIVE (Gemini)
  researcher — LIVE (Gemini)
  writer     — LIVE (Gemini)
  evaluator  — LIVE (Gemini)
  writer/revise — LIVE (Gemini)
"""

import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from models import (
    PlannerRequest, PlannerResponse,
    ResearcherRequest, ResearcherResponse,
    WriterRequest, WriterResponse,
    WriterReviseRequest, WriterReviseResponse,
    EvaluatorRequest, EvaluatorResponse,
)
from agents import planner, researcher, writer, evaluator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("research-copilot")

app = FastAPI(title="Multi-Agent Research Copilot API", version="1.0.0")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        logger.info(
            "%s %s  status=%d  duration=%d ms",
            request.method, request.url.path,
            response.status_code, duration_ms,
        )
        return response
    except Exception as exc:
        duration_ms = int((time.time() - start) * 1000)
        logger.error(
            "%s %s  ERROR=%s  duration=%d ms",
            request.method, request.url.path, exc, duration_ms,
        )
        raise

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ── Agent: Planner ────────────────────────────────────────────────────────────

@app.post("/api/agent/planner", response_model=PlannerResponse)
async def run_planner(request: PlannerRequest) -> PlannerResponse:
    return await planner.run(request)


# ── Agent: Researcher ─────────────────────────────────────────────────────────

@app.post("/api/agent/researcher", response_model=ResearcherResponse)
async def run_researcher(request: ResearcherRequest) -> ResearcherResponse:
    return await researcher.run(request)


# ── Agent: Writer ─────────────────────────────────────────────────────────────

@app.post("/api/agent/writer", response_model=WriterResponse)
async def run_writer(request: WriterRequest) -> WriterResponse:
    return await writer.run(request)


# ── Agent: Writer Revise (evaluator feedback loop) ────────────────────────────

@app.post("/api/agent/writer/revise", response_model=WriterReviseResponse)
async def run_writer_revise(request: WriterReviseRequest) -> WriterReviseResponse:
    return await writer.run_revise(request)


# ── Agent: Evaluator ──────────────────────────────────────────────────────────

@app.post("/api/agent/evaluator", response_model=EvaluatorResponse)
async def run_evaluator(request: EvaluatorRequest) -> EvaluatorResponse:
    return await evaluator.run(request)
