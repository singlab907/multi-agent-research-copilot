
MULTI-AGENT RESEARCH COPILOT
AI-Powered Research Assistant with Integrated Evaluation Framework

Product & Technical Report
Built as an AI Product Manager
April 2026
Architecture: Multi-Agent Sequential Pipeline |  LLM: Gemini 2.5 Flash  |  Stack: React + FastAPI
 
1. Executive Summary
Multi-Agent Research Copilot is a production-grade AI system that transforms a single research query into a structured, evaluated report through a coordinated pipeline of four specialized AI agents. Unlike conventional single-prompt AI tools that generate unverified content, this system separates generation from evaluation, introducing a built-in quality assessment layer that scores every output for accuracy, completeness, clarity, and hallucination risk. The system solves a fundamental trust problem in AI-generated content: users have no way to know if an AI output is reliable. By integrating an Evaluator Agent that independently scores the Writer Agent’s output—and automatically triggers a revision cycle when quality falls below threshold—the system creates a self-correcting pipeline that produces measurably better results. This project was conceived, designed, and shipped as an AI Product Manager, demonstrating end-to-end product thinking: from system architecture and agent orchestration to evaluation framework design, human-in-the-loop workflows, and deployment strategy.

2. The Problem This System Solves

2.1 The Trust Gap in AI-Generated Content
Organizations and individuals increasingly rely on AI to generate research reports, analyses, and summaries. However, current AI tools suffer from three critical problems:
•	No quality signal: Users receive AI output with zero indication of its reliability. A factually accurate report looks identical to a hallucinated one.
•	No structured decomposition: Single-prompt systems attempt to handle research, writing, and quality assessment in one pass, creating a monolithic black box with no transparency into the reasoning process.
•	No correction mechanism: When AI output is poor, the only option is to regenerate from scratch. There is no feedback loop between quality assessment and content improvement.

2.2 The Industry Context
According to LangChain’s 2026 State of AI Agents report, 57% of organizations now have agents in production, with quality cited as the top barrier to deployment by 32% of respondents. The shift from single-model deployments to multi-agent architectures reflects a broader industry recognition that complex tasks require specialized, coordinated agents rather than monolithic prompts.
Research from Stanford indicates that combining automated and human evaluation improves agent quality metrics by 40%. This system implements exactly this principle: automated evaluation by the Evaluator Agent, combined with human-in-the-loop control at every pipeline stage.

2.3 Real-World Use Cases
•	Enterprise Research Teams: Analysts who need structured reports on market trends, competitive landscapes, or technology assessments—with confidence scores they can cite to stakeholders.
•	Consulting Firms: Consultants generating client deliverables who need to verify AI-assisted research before presentation, with the ability to inject domain expertise at any stage.
•	Academic and Policy Research: Researchers using AI as a first-pass tool who need transparent evaluation of output quality before building on AI-generated findings.
•	Compliance-Sensitive Industries: Financial services, healthcare, and legal teams where hallucinated content carries material risk and every output needs a quantified reliability assessment.

3. System Architecture: Multi-Agent Sequential Pipeline

3.1 Why Multi-Agent, Not Single-Prompt
A single-prompt system asks one LLM to simultaneously plan research, gather information, write a report, and assess its own quality. This approach fails because self-evaluation is inherently unreliable—the same model that generated a hallucination cannot reliably detect it. Multi-agent architectures solve this by assigning distinct cognitive tasks to specialized agents, each with focused prompts and independent context. This system uses a sequential pipeline architecture where each agent’s output becomes the next agent’s input, creating a chain of specialized transformations:

AGENT	ROLE	INPUT	OUTPUT
Agent Planner	Task Decomposition	User query	Structured subtopics + research recommendation
Agent Researcher	Information Gathering	Subtopics (edited by user)	Research findings + sources per subtopic
Agent Writer	Report Composition	Research data + user notes	Structured report with sections
Agent Evaluator	Quality Assessment	Final report	Scores, reasoning, confidence, revision flag

3.2 Intelligent Routing: The Planner’s Decision Layer
The Planner Agent does more than decompose queries. It makes a routing decision: does this query require external research, or can it be addressed through the Writer Agent’s general knowledge alone? This decision is communicated to the user with a clear recommendation and reasoning. The user retains full control—they can override the recommendation in either direction. This routing capability prevents unnecessary computation for simple queries (opinion pieces, creative writing) while ensuring complex factual queries receive proper research treatment. It reflects a core product principle: the system should be smart enough to adapt its pipeline to the task, but never override the user’s judgment.

3.3 The Skip-Research Path
When the Planner determines that research is unnecessary—or when the user chooses to skip—the Writer Agent operates with subtopics only, generating a report from the LLM’s training knowledge. The UI clearly signals this with a context indicator: “Generating without research data.” This transparency prevents users from mistaking an unreferenced report for a researched one.

4. Evaluation Framework: Quantifying Output Quality

4.1 The Four Evaluation Dimensions
The Evaluator Agent scores every report across four dimensions. These are not arbitrary metrics—they map directly to the failure modes that make AI-generated content unreliable in professional settings:

METRIC	SCALE	WHAT IT MEASURES	WHY IT MATTERS
Accuracy	1.0 – 5.0	Factual correctness of claims, data points, and cited information	Directly addresses hallucination—the highest-risk failure mode in AI content

Completeness	1.0 – 5.0	Coverage of all relevant aspects of the query across subtopics	Prevents partial answers that miss critical dimensions of a topic

Clarity	1.0 – 5.0	Readability, structure, logical flow, and professional presentation	Ensures output is usable without extensive human rewriting

Hallucination Risk	Low / Med / High	Likelihood that the report contains fabricated facts, sources, or claims	The single most critical safety metric for AI content in professional use

4.2 Confidence Score: The Aggregated Trust Signal
The four dimension scores are synthesized into a single Confidence Score (0–100%), which serves as the system’s primary trust signal. This score is the first thing users see on the evaluation screen, displayed as a circular gauge that immediately communicates whether the output is trustworthy. The Confidence Score is not a simple average. The Evaluator Agent weighs accuracy and hallucination risk more heavily than clarity, reflecting the reality that a well-written but factually wrong report is more dangerous than an accurate but poorly formatted one.

4.3 Alignment with Risk-Aware Evaluation Frameworks
This evaluation framework draws from established approaches in AI safety and quality assurance:
•	LLM-as-Judge Pattern: The Evaluator Agent implements the LLM-as-Judge paradigm, where a separate model instance critically assesses another model’s output. Research consistently shows that separating generation from evaluation produces more reliable quality signals than self-evaluation.
•	Multi-Dimensional Scoring: Rather than a single pass/fail, the framework uses composite scoring across independent dimensions—matching the approach recommended by Monte Carlo’s agent evaluation framework, which advocates combining helpfulness, accuracy, faithfulness, and clarity into composite assessments.
•	Threshold-Based Remediation: The 70% confidence threshold for triggering automatic revision mirrors clinical safety frameworks that use likelihood-consequence matrices to determine when intervention is required. Below the threshold, the system intervenes automatically; above it, the output is deemed acceptable.
•	Hallucination-Specific Detection: The dedicated Hallucination Risk dimension aligns with emerging frameworks like HalluLens and HHEM that treat hallucination as a distinct failure mode requiring its own evaluation pathway, separate from general accuracy.

5. The Writer–Evaluator Feedback Loop
   
5.1 How Automatic Revision Works
This is the system’s self-correction mechanism. When the Evaluator Agent determines that a report’s confidence score falls below 70%—or any individual metric scores below 3.0—it sets a needs_revision flag and generates structured feedback explaining exactly what needs improvement. The system then automatically:
Sends the original report and the Evaluator’s feedback back to the Writer Agent
The Writer Agent revises the report, making targeted improvements based on the specific criticisms (not a full rewrite)
The revised report is sent back to the Evaluator Agent for re-assessment
The new scores are displayed alongside a revision summary explaining what changed

5.2 Why Only One Revision Cycle
The system caps revision at one cycle. This is a deliberate product decision, not a technical limitation:
•	Diminishing returns: Research on iterative refinement shows that the largest quality improvement occurs on the first revision. Subsequent iterations yield progressively smaller gains while multiplying API costs and latency.
•	Avoiding infinite loops: Without a hard cap, a poorly calibrated evaluator could trigger endless revision cycles, creating a system that never terminates.
•	User agency: After one revision, the user has the manual “Resend to Writer” button if they believe further improvement is possible. This keeps the human in control of additional iterations.

5.3 Manual Resend Capability
Even when the automatic loop does not trigger (confidence >= 70%), users can manually click “Resend to Agent Writer” to request one revision. This button uses the Evaluator’s reasoning as input, ensuring the Writer has specific, actionable feedback. After one use (automatic or manual), the button disables to enforce the single-revision cap.

6. Human-in-the-Loop: User Control at Every Stage
   
6.1 The Step-by-Step Wizard
Rather than a “fire-and-forget” interface where the user submits a query and waits for a final result, the system implements a guided wizard where each agent’s output is presented to the user for review and optional editing before proceeding.
This design pattern serves three purposes:
•	Transparency: Users see exactly what each agent produced, eliminating the black-box problem.
•	Control: Users can modify, add to, or override any agent’s output before it feeds into the next stage.
•	Domain Expertise Injection: Subject matter experts can add personal findings, correct inaccuracies, or redirect the research focus at any point—ensuring the AI amplifies human expertise rather than replacing it.

6.2 What Users Can Edit at Each Stage
•	Planner Output: Add, remove, or modify subtopics. Redirect the research focus entirely if the AI’s decomposition misses the point.
•	Researcher Output: Edit research findings, add personal notes and domain knowledge, manage source references. This is where subject matter expertise has the highest impact.
•	Writer Output: Edit the full draft report—rewrite sections, adjust tone, add context that only a human expert would know.
•	Evaluator Output: Read-only. Evaluation integrity requires that users cannot modify their own scores. However, users can trigger a revision or start a new research session.

6.3 Clickable Pipeline: Non-Destructive Review
After proceeding past any step, users can click on completed agent names in the sidebar to review what that agent produced—without losing progress or re-running any agents. This allows backward review (checking what the Planner suggested while viewing Writer output) without disrupting the forward pipeline.

7. Technical Architecture
   
7.1 Frontend
•	React + Vite + Tailwind CSS
•	Single-page application with state-driven view switching (IDLE, PLANNING, RESEARCHING, WRITING, EVALUATING, COMPLETE, ERROR)
•	Step-by-step wizard with stepper progress bar and sidebar pipeline tracker
•	Editable agent outputs using controlled React state
•	Export functionality: Markdown (report) and JSON (evaluation)
•	Deployed on Vercel (free tier, auto-deploys from GitHub)

7.2 Backend
•	Python FastAPI with 5 API endpoints (4 agents + 1 revision)
•	Google Gemini 2.5 Flash (free tier) for all LLM calls
•	Pydantic models for request/response validation
•	Structured JSON prompting with error handling and fallback parsing
•	Duration tracking per agent for performance observability
•	JSON-file-based history storage for query persistence
•	Deployed on Render (free tier, auto-deploys from GitHub)

7.3 API Design: One Endpoint Per Agent
Rather than a single endpoint that runs all agents sequentially, the system exposes individual endpoints for each agent. This design enables the step-by-step wizard—the frontend calls each endpoint only when the user clicks “Proceed,” sending edited data with each request. It also allows future extensibility: agents can be replaced, reordered, or parallelized without changing the API contract.

8. Key Product Decisions and Trade-offs
   
DECISION	RATIONALE	TRADE-OFF: 
Sequential pipeline (not parallel)	Each agent needs the previous agent’s output. Parallel execution is architecturally impossible for this task.	Higher total latency, but each step is independently verifiable.
Single revision cap	Diminishing returns after first revision. Prevents infinite loops and controls API costs.	Output may still be suboptimal after one revision. User retains manual control.
70% confidence threshold	Balances sensitivity (catching bad reports) with specificity (not flagging acceptable ones). Calibrated through testing.	Binary threshold may miss nuanced quality gradients. Future: adaptive thresholds per domain.
Optional research step	Not all queries need research. Skipping saves time and API costs for simple queries.	Reports without research have no source citations. Context indicator mitigates confusion.
Separate evaluator (not self-eval)	Self-evaluation is unreliable. A separate evaluation agent with a critical assessment prompt produces more honest scoring.	Additional API call per query. Justified by significantly higher trust in output quality.

10. What This Project Demonstrates
•	System Design Thinking: Architecting a multi-agent pipeline where each component has a clear responsibility, defined inputs/outputs, and measurable contribution to the final product.
•	Evaluation Framework Design: Defining quality dimensions that map to real user risks, not arbitrary metrics. The accuracy/completeness/clarity/hallucination framework reflects genuine professional concerns about AI content reliability.
•	Human-in-the-Loop Product Design: Building interfaces that keep humans in control without making the AI useless. The editable step-by-step wizard balances automation with agency.
•	Trust Engineering: Treating output quality as a first-class product feature, not an afterthought. The confidence score, evaluation reasoning, and automatic revision create a trust layer that makes AI output actionable in professional contexts.
•	Technical Product Delivery: End-to-end execution from design (Stitch prototyping) through frontend development, backend API design, LLM prompt engineering, and deployment to production infrastructure.
•	Risk-Aware AI Product Thinking: Building in hallucination detection, revision mechanisms, and transparent quality signals—the kinds of safety features that differentiate production AI from demos.

11. Future Enhancements
•	Web Search Integration: Connect the Researcher Agent to real-time web search APIs for live source retrieval instead of LLM-generated references.
•	Multi-Model Evaluation: Run the Evaluator Agent across multiple LLMs and aggregate scores for more robust quality assessment.
•	Domain-Specific Templates: Pre-configured pipeline settings for specific use cases (market research, technical analysis, policy briefing) with tuned evaluation thresholds.
•	Collaborative Workflows: Multi-user support where different team members edit different pipeline stages, with tracked changes and approval flows.
•	Evaluation History Analytics: Dashboard showing evaluation score trends over time, identifying systematic weaknesses in the pipeline for prompt improvement.
•	RAG Integration: Connect agents to enterprise knowledge bases for grounded, organization-specific research output.

12. Conclusion
Multi-Agent Research Copilot demonstrates that the future of AI-assisted work is not about replacing human judgment with AI generation, but about building systems where AI agents collaborate with each other and with humans to produce outputs that are not just generated, but evaluated, scored, and improved.
The separation of generation from evaluation—and the automatic feedback loop between Writer and Evaluator—represents a design pattern that extends far beyond research reports. Any domain where AI generates content that carries professional, financial, or safety risk benefits from this architecture: separate the generator from the judge, give the judge quantified metrics, and close the loop with automatic remediation.
This is what production-grade AI product management looks like: not just making AI work, but making AI work reliably, transparently, and under human control.
