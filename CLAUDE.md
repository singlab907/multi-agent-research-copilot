# CLAUDE.md — Multi-Agent Research Copilot

Project context for Claude Code sessions. Keep this file up to date as the codebase evolves.

---

## 1. Project Structure

```
research-copilot/
├── index.html                        # Entry HTML, Google Fonts, browser title
├── package.json                      # React 18 + Vite 5 + Tailwind 3
├── vite.config.js                    # @vitejs/plugin-react
├── postcss.config.js                 # tailwindcss + autoprefixer
├── tailwind.config.js                # Full design token set (colors, fonts, radii)
├── stitch-exports/                   # Figma/Stitch HTML exports — visual reference only
│   ├── aether_mission_control/DESIGN.md
│   ├── agent_intermediate_output_panel/code.html
│   ├── agent_pipeline_status_bar/code.html
│   ├── evaluation_metrics_sidebar/code.html
│   ├── main_research_report_panel/code.html
│   ├── research_copilot_empty_state/code.html
│   ├── research_copilot_error_state/code.html
│   ├── research_copilot_header_query_input/code.html
│   └── research_copilot_loading_state/code.html
└── src/
    ├── main.jsx                      # React root — mounts <App /> into #root
    ├── index.css                     # Tailwind directives + custom keyframes
    ├── App.jsx                       # State machine + mock data builders + Layout orchestration
    ├── components/
    │   └── Layout.jsx                # Shared shell: top nav, sidebar, main slot
    └── screens/
        ├── WelcomeScreen.jsx         # IDLE state — query input + suggestions
        ├── WizardScreen.jsx          # WIZARD state — 4-step agent wizard (Planner→Evaluator)
        ├── ProcessingScreen.jsx      # (legacy, no longer used by App.jsx)
        ├── ResultsScreen.jsx         # (legacy, no longer used by App.jsx)
        ├── ReportScreen.jsx          # (legacy, no longer used by App.jsx)
        ├── EvaluationScreen.jsx      # (legacy, no longer used by App.jsx)
        ├── SourcesTab.jsx            # (legacy, no longer used by App.jsx)
        └── ErrorScreen.jsx           # ERROR state — retry screen
```

---

## 2. Component Responsibilities

### `App.jsx`
The top-level state machine. Owns all app state, mock data builders, and wires everything together.

**State:**
- `appState`: `'idle' | 'wizard' | 'error'`
- `query`: the user's submitted research question
- `wizardStep`: `1–4` — the current active step the user is working on
- `stepLoading`: `boolean` — whether the current step's simulated loading is in progress
- `viewingStep`: `number | null` — when non-null, the user is viewing a past step read-only in the main area; null means show the current active step
- `plannerOutput`: `string[]` — list of subtopic strings (editable by user)
- `researcherOutput`: `ResearchTopic[]` — per-subtopic findings, sources, personalNote (editable); empty array `[]` means research hasn't been fetched yet (shows pre-decision UI). Shape: `{ heading: string, findings: string[], personalNote: string, sources: { title: string, publication: string, year: string }[] }`
- `writerOutput`: `{ title: string, sections: { heading: string, content: string }[] }` — draft report (editable)
- `evaluationData`: API `EvaluatorResponse | null` — real evaluator scores from backend; null until step 4 API call completes
- `evaluatorDurationMs`: `number | null` — duration from evaluator API response
- `researchSkipped`: `boolean` — true when user bypassed Agent Researcher; shows SKIPPED state in sidebar and stepper
- `history`: `HistorySummary[]` — last 10 entries fetched from `/api/history` on mount; refreshed after each save

**Derived values:**
- `researchRecommended`: `boolean` — computed from query using `isResearchRecommended(query)`. Returns true if query contains any of: `compare, impact, analysis, analyze, analyse, data, statistics, statistic, research, study, evidence, trend, trends, report, market`. This logic is a placeholder for the real planner agent classification.

**Mock data builders** (module-level pure functions):
- `buildPlannerOutput()` → returns 5 hardcoded subtopic strings
- `buildResearcherOutput(subtopics)` → maps subtopics to findings+sources from a 5-item data array (cycles `data[0]` for extras)
- `buildWriterOutput(researcherOutput)` → assembles title + Introduction + per-subtopic sections + Conclusion from researcher output; personal notes are appended inline. When called with empty findings (skip path), sections are created with empty content.

**Sidebar pipeline tracker mapping:**
- `sidebarAgentStep = wizardStep - 1` (so sidebar agent index matches wizard step)
- `sidebarAppState` = `'processing'` during wizard, `'complete'` on step 4 after loading, else mirrors `appState`
- `pipelineStatus` now includes `researchSkipped` — passed to Layout to show SKIPPED state for Agent Researcher

**Handlers:**
- `handleSubmit(q)` — sets query, initialises plannerOutput, sets appState to `'wizard'`, triggers 2s loading; resets `researchSkipped`
- `handleProceedFromPlanner()` — navigates to step 2 with empty researcherOutput and no loading (shows pre-decision UI)
- `handleRunResearch()` — called from researcher pre-decision screen; builds researcherOutput, triggers 3s loading
- `handleSkipToWriter()` — builds writerOutput from planner subtopics (no findings/sources), sets `researchSkipped=true`, advances to step 3 with 3s loading
- `handleSkipResearch()` — alias for `handleSkipToWriter()`; called from the researcher pre-decision "Skip Research" button
- `handleProceedFromResearcher()` — builds writerOutput from current researcherOutput, advances to step 3, triggers 3s loading
- `handleProceedFromWriter()` — advances to step 4, triggers 2s loading
- `handleViewStep(step)` — sets `viewingStep` to a past step number; sidebar calls this when user clicks a completed agent
- `handleBackToCurrentStep()` — clears `viewingStep` to null; called by the "Back to current step" banner in WizardScreen
- `handleNewResearch()` — resets all state to idle (including `viewingStep`, `researchSkipped`)
- `handleRetry()` — resets appState to idle
- `handleSaveResult({ report, evaluation, revisionHappened })` — POSTs to `/api/history`; on success re-fetches `/api/history` and updates `history` state; failures are silent (no error state change)
- `handleLoadHistoryEntry(id)` — GETs `/api/history/{id}`; populates `query`, `writerOutput`, `evaluationData`, `researchSkipped`, sets `wizardStep=4`, `appState='wizard'` so EvaluatorStep renders the saved result read-only

**Render:** `key={appState === 'wizard' ? \`wizard-${viewingStep ?? wizardStep}\` : appState}` on the wrapper div — triggers fadeSlideIn on every step transition and when switching to/from a past-step view.

### `components/Layout.jsx`
Persistent shell that wraps every screen. Never re-mounts.
- **Top nav**: multi-agent network SVG icon (4 corner nodes + center hub, connected with lines, all in `#FF702E`) + "MULTI-AGENT RESEARCH COPILOT" wordmark + "WORKSPACE" link + settings icon + v1.0 badge
- **Left sidebar** (260 px, hidden on mobile):
  - User/session indicator (Analyst_01 + pulse dot)
  - "Research" nav item (only active item)
  - Pipeline status tracker: reads `pipelineStatus` prop and shows STANDBY / ACTIVE / COMPLETE with per-agent indicators (spinner → check). Completed agents are clickable — clicking calls `onViewStep(step)`. The currently-viewed past step shows a "VIEW" badge instead of "OK". Non-completed steps are not clickable.
  - **Recent Queries section**: shows last 5 entries from `history` prop. Each entry is a clickable button that calls `onLoadHistory(id)`. Shows "No past queries yet" when `history` is empty. Styled as a bordered panel matching the pipeline tracker, with `history` icon per item and truncated query text.
  - "+ New Research" orange CTA — calls `onNewResearch` prop
  - Support + Docs footer links (non-functional, decorative)
- **Main slot**: flex-column wrapper — `{children}` fills available space, `<footer>` pinned at bottom with "Powered by Gemini 2.0 Flash | Multi-Agent Research Copilot v1.0" in `font-mono text-[9px] text-on-surface/20`
- **Mobile bottom nav**: single "Research" item mirrors the sidebar
- Pipeline tracker: completed agents now show duration below label (e.g. "1.2s") in `text-emerald-400/50`; sourced from `agentDurations` prop (index 0–3 = Planner/Researcher/Writer/Evaluator)

Props:
```js
{
  activeNav:      string,           // default 'Research'
  activeTopNav:   string,           // default 'Workspace'
  pipelineStatus: { appState, agentStep, researchSkipped },
  agentDurations: string[],         // e.g. ['1.2s', '18.4s', '12.1s', '5.3s'] — null entries hidden
  onNewResearch:  () => void,
  viewingStep:    number | null,    // which past step is being viewed (for VIEW badge)
  onViewStep:     (step: number) => void,  // called when user clicks a completed pipeline agent
  history:        HistorySummary[],        // default []
  onLoadHistory:  (id: string) => void,    // called when user clicks a recent query
}
```

`pipelineItemState(index, appState, agentStep, researchSkipped)` — extended to return `'skipped'` for index 1 (Agent Researcher) when `researchSkipped=true`. Skipped items render with `remove_circle` icon, strikethrough label, and "SKIP" badge. They are not clickable.

### `screens/WelcomeScreen.jsx`
- Default export `WelcomeScreen` — wraps `WelcomeContent` in its own `Layout`; used for standalone rendering only
- Named export `WelcomeContent` — used by `App.jsx` (already inside Layout, so no double-wrap)
- Props: `{ onSubmit: (query: string) => void }`
- On mount, fetches `GET /api/health` with a 3-second timeout. If the request fails or returns non-ok, sets `backendDown=true` and shows a red warning banner: "Cannot connect to backend server. Please ensure the server is running on port 8000." The banner sits at the absolute top of the content area. Failure is silent beyond the banner (no error state change).
- Has a controlled `<textarea>` + "Generate Report" button (disabled when empty)
- Four suggestion chip buttons that auto-fill and submit the query
- Cmd/Ctrl+Enter keyboard shortcut to submit

### `screens/WizardScreen.jsx`
The main screen during the `'wizard'` app state. Contains all 4 step sub-components and the shared Stepper.

**Default export `WizardScreen`** — used by App.jsx.

Props:
```js
{
  step:                    number,             // 1–4, the current active wizard step
  stepLoading:             boolean,
  query:                   string,
  plannerOutput:           string[],
  researcherOutput:        ResearchTopic[],    // empty [] = research not yet fetched (pre-decision)
  writerOutput:            { title, sections },
  onPlannerChange:         (subtopics: string[]) => void,
  onResearcherChange:      (research: ResearchTopic[]) => void,
  onWriterChange:          (report: WriterOutput) => void,
  onProceedFromPlanner:    () => void,         // navigates to step 2, no loading
  onSkipToWriter:          () => void,         // skips researcher, goes to step 3
  onRunResearch:           () => void,         // triggers research fetch from pre-decision UI
  onProceedFromResearcher: () => void,         // proceeds to Writer after research
  onSkipResearch:          () => void,         // skips from researcher pre-decision to Writer
  onProceedFromWriter:     () => void,
  onNewResearch:           () => void,
  displayStep:             number | null,      // null = show current step; past step = read-only view
  onBackToCurrentStep:     () => void,         // called by the read-only banner to dismiss view
  researchRecommended:     boolean,            // drives recommendation box + button prominence
  researchSkipped:         boolean,            // drives stepper skipped state
}
```

**Internal sub-components:**

`Stepper({ currentStep, researchSkipped })` — horizontal progress bar at top of each step. Steps before current show green check; current step highlighted orange with a glow ring (`boxShadow: '0 0 0 3px rgba(255,112,46,0.15)'`); future steps greyed out; skipped step (index 1) shows a `remove` icon with strikethrough label. Connectors between steps are `chevron_right` Material Symbol icons (green when preceding step is done, faint otherwise). Labels use the full "Agent Planner / Agent Researcher / Agent Writer / Agent Evaluator" naming.

`LoadingState({ message })` — layered spinner (outer track ring + spinning border ring + inner ring + center dot) with three staggered pulsing dots (`animationDelay` 0/150/300ms) and pulsing mono text below. Shown while `stepLoading` is true.

`ReadOnlyBanner({ currentStep, onBack })` — shown above step content when `displayStep` is a past step. Displays "Viewing past output — read only" and a "Back to Agent X" link that calls `onBack` to return to the current active step.

`ProceedButton({ onClick, disabled, children })` — shared orange primary CTA button.

`PlannerStep({ loading, subtopics, onChange, onProceed, onSkipToWriter, researchRecommended, readOnly })`:
- Shows the Planner Agent output: an ordered list of editable text inputs (one per subtopic)
- User can edit each subtopic title inline; inputs have `cursor-text`, `hover:border-outline-variant/40`, `focus:bg-surface-container-low`
- "×" button removes a subtopic
- "+ Add subtopic" is a full-width dashed ghost button (`border-dashed border-outline-variant/20 hover:border-primary/30`)
- **Research Recommendation box**: shown below the subtopic list
  - `researchRecommended=true` → green box (`bg-emerald-400/5 border-emerald-400/20`) with `check_circle` icon and "Research recommended" message
  - `researchRecommended=false` → orange box (`bg-primary/5 border-primary/20`) with `bolt` icon and "No research required" message
- **Dual action buttons**: "Proceed to Agent Researcher →" and "Skip to Agent Writer →" always both visible
  - `researchRecommended=true`: Proceed = primary orange, Skip = secondary outline
  - `researchRecommended=false`: Skip = primary orange, Proceed = secondary outline
  - Both disabled when all subtopic fields are empty

`ResearcherStep({ loading, research, onChange, onProceed, onSkipResearch, onRunResearch, researchRecommended, readOnly })`:
- **Pre-decision UI**: shown when `research.length === 0 && !loading && !readOnly`. Displays "Run the Research Agent?" with "Run Research →" (primary) and "Skip Research →" (secondary) buttons. If `researchRecommended=false`, shows a note: "The planner suggested skipping research for this query, but you can still run it if you'd like." Clicking "Run Research →" calls `onRunResearch` which triggers actual research loading. Clicking "Skip Research →" calls `onSkipResearch` which skips to Writer.
- Shows per-subtopic research: editable multi-line findings (one `<textarea>` per bullet), a personal note textarea, and a sources list
- Finding textareas have `cursor-text`, `hover:border-outline-variant/35`, `focus:bg-surface-container-low`
- Personal note textarea uses `border-dashed` to signal it's optional; converts to `focus:border-solid` on focus
- Sources show title + year; hover reveals "×" to remove
- "Add source" inline input + button appends a new user-defined source
- `newSourceUrls` local state (`string[]`, one entry per subtopic, initialised to `research.map(() => '')`) tracks the add-source input value per subtopic — not lifted to App

`WriterStep({ loading, report, onChange, onProceed, readOnly, researchSkipped })`:
- **Context banner** at the top (shown in both editable and read-only modes):
  - `researchSkipped=false` → green-tinted bar (`bg-emerald-400/5 border-emerald-400/15`) with `bar_chart` icon: "Using research data from Agent Researcher"
  - `researchSkipped=true` → orange-tinted bar (`bg-primary/5 border-primary/15`) with `edit_note` icon: "Generating without research data — based on planner subtopics only"
- Shows the Writer Agent's draft: editable title (`<input>`) + per-section heading/content (`<input>` + `<textarea>`)
- All editable fields have `cursor-text`, `hover:border-outline-variant/40` (or `/30` for textareas), `focus:border-primary/50`
- Title input gets `focus:bg-surface-container-low` for depth feedback
- All edits update `writerOutput` in App state via `onWriterChange`
- "Get Final Report →" advances to Evaluator

`ConfidenceGauge({ confidence })` — extracted SVG gauge component (r=54, circumference=339.3). Used inside `EvalScores`, reused for both initial and revised evaluations via `activeEval`.

`EvalScores({ evalData })` — extracted scores panel. Uses real API field names: `accuracy/completeness/clarity: { score, reasoning }`, `hallucination_risk`, `confidence_score`, `duration_ms`. Renders the 3 metric cards (score out of 5 with glowing progress bar + reasoning), then a 2-column row with `ConfidenceGauge` + Hallucination Risk badge (Low=emerald, Medium=yellow, else=error; badge text is `{RISK}_LEVEL / Verified`) and an Evaluation Duration display. Scores shown as `{score.toFixed(1)}/5`.

`EvaluatorStep({ loading, report, researcherOutput, query, evalData, durationMs, onNewResearch, onError, onSaveResult })`:
- Receives real API evaluation data via `evalData` prop (API `EvaluatorResponse` shape). `evaluationData` is `null` while loading — the `WizardScreen` renders `<LoadingState>` directly when `evaluationData` is falsy, bypassing `EvaluatorStep` entirely until data arrives.
- Read-only evaluation results: Accuracy / Completeness / Clarity metric cards, SVG confidence gauge, Hallucination Risk badge, Evaluation Duration display
- Full final report rendered read-only; swaps to `activeReport` (revised report) after revision loop completes
- Export buttons use live data: "Report" downloads `buildReportMarkdown(activeReport, researcherOutput)`, "Export Evaluation" downloads `buildEvaluationJSON(query, activeEval)`
- **Feedback loop** (real API calls, no timeouts):
  - `loopPhase`: `'idle' | 'warning' | 'writing' | 'reevaluating' | 'revised'`
  - `revisionUsed`: `boolean` — set to true after loop completes; caps total rewrites at 1
  - `activeEval`: starts as `evalData` prop, swaps to re-evaluation response after revision
  - `activeReport`: starts as `report` prop, swaps to revised report from `writer/revise` response
  - `revisionNotes`: string from `writer/revise` response; shown in a panel below the success banner
  - `revisionDurationMs` / `reEvalDurationMs`: displayed in revision notes panel
  - `sequenceActive` ref: prevents double-trigger of manual resend
  - **Auto-trigger**: on mount, if `evalData.needs_revision === true`, sets `loopPhase='warning'`
  - **`loopPhase='warning'`**: red error banner shown; 2s `setTimeout` then calls `runRevisionLoop()`
  - **`runRevisionLoop(currentReport, currentEval)`**: async function — sets `loopPhase='writing'`, POSTs to `/api/agent/writer/revise` with `{query, report, evaluator_feedback: {accuracy, completeness, clarity, overall_feedback}}`; on success sets `loopPhase='reevaluating'`, POSTs to `/api/agent/evaluator` with revised report; on success sets `activeReport`, `activeEval`, `revisionUsed=true`, `loopPhase='revised'`; on any error calls `onError(msg)`
  - During `writing` phase: orange pill "Revising — Agent Writer" + LoadingState
  - During `reevaluating` phase: orange pill "Re-evaluating — Agent Evaluator" + LoadingState
  - **`loopPhase='revised'`**: green success banner "Report improved after revision — Confidence: X%" + "Maximum revision limit reached (1/1)" + revision notes panel with per-step durations
  - **Manual resend** (`handleManualResend`): sets `loopPhase='warning'` if `!revisionUsed && !sequenceActive.current`; triggers same `runRevisionLoop` via the warning `useEffect`

### `screens/ErrorScreen.jsx`
- Named export `ErrorContent({ errorCode, subsystem, onRetry })`
- Default export `ErrorScreen` (standalone)
- Triangle warning icon with error-red glow
- Ghost-border "RETRY_OPERATION" button calls `onRetry`
- Error code + subsystem metadata display

### Legacy screens (files kept, not used in current flow)
`ProcessingScreen.jsx`, `ResultsScreen.jsx`, `ReportScreen.jsx`, `EvaluationScreen.jsx`, `SourcesTab.jsx` — these were built for the original timer-based flow. They still exist and are valid standalone components but are no longer imported by `App.jsx`. Keep them as reference for backend integration or delete if they become confusing.

---

## 3. App Flow

```
IDLE ──[user submits query]──────────▶ WIZARD
  ◀──[+ New Research]──────────────────────┤
                                           │
                             ┌─────────────┘
                             │
                     STEP 1: PLANNER
                     2s loading → editable subtopic list
                     [Proceed to Research →]
                             │
                     STEP 2: RESEARCHER
                     3s loading → editable findings + sources per subtopic
                     [Proceed to Writer →]
                             │
                     STEP 3: WRITER
                     3s loading → editable draft report (title + sections)
                     [Get Final Report →]
                             │
                     STEP 4: EVALUATOR
                     2s loading → read-only scores + final report display
                     [+ New Research] ──▶ IDLE
                             │
                    ERROR ◀──┘  (wired but not triggered in current flow)
  ◀──[Retry]──────────┘
```

Step transitions use `key={\`${shownStep}-${isReadOnly}\`}` on the step content wrapper (fadeSlideIn, 0.25s) — keyed on both step number and read-only state so toggling past-step view also triggers the animation.

The sidebar pipeline tracker reflects wizard progress:
- `wizardStep=1` → Planner active
- `wizardStep=2` → Planner done, Researcher active
- `wizardStep=3` → Planner + Researcher done, Writer active
- `wizardStep=4 + loading` → Writer done, Evaluator active
- `wizardStep=4 + loaded` → all done (sidebar shows COMPLETE)

---

## 4. Design System

### Colors (all defined in `tailwind.config.js`)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#FF702E` | Orange accent — CTAs, active states, borders, icons |
| `on-primary` | `#381700` | Text on orange backgrounds |
| `surface` | `#111319` | Base background |
| `surface-container-lowest` | `#0c0e14` | Deepest layer (sidebar, code bg) |
| `surface-container-low` | `#191b22` | Slightly elevated panels |
| `surface-container` | `#1e1f26` | Card backgrounds |
| `surface-container-high` | `#282a30` | Elevated cards |
| `surface-container-highest` | `#33343b` | Top-most surfaces |
| `on-surface` | `#e2e2eb` | Primary text |
| `on-surface-variant` | `#cababa` | Secondary/muted text |
| `outline-variant` | `#4a3e3b` | Subtle borders |
| `error` | `#ffb4ab` | Error state text/icons |

### Fonts (loaded from Google Fonts in `index.html`)

| Tailwind class | Family | Usage |
|---|---|---|
| `font-headline` | Space Grotesk | Nav, headings, buttons, labels |
| `font-body` | Inter | Prose, paragraphs, descriptions |
| `font-label` | Space Grotesk | Small caps, badges, nav items |
| `font-mono` | Space Mono | Timestamps, coordinates, code, metadata |

### Design Principles (from `stitch-exports/aether_mission_control/DESIGN.md`)
- **Sharp edges**: max `4px` border radius — roundness removed for the "terminal" aesthetic
- **No visible borders**: separation via tonal shifts between surface layers, not 1px lines
- **Asymmetric layouts**: content anchored to edges, not centered grids
- **"Ghost Border" fallback**: `outline-variant` at 15% opacity when a border is unavoidable
- **Ambient glows**: `primary` at 5% opacity with 120px blur for floating elements
- Emerald green (`#4ade80`) used for pipeline "done" state — not in the token set, applied inline

### Custom Keyframes (`src/index.css`)

| Name | Description |
|---|---|
| `shimmer` | Left-to-right sweep for skeleton loaders (legacy ProcessingScreen) |
| `pulse-border` | Border color oscillates orange for the active pipeline agent card (legacy) |
| `fadeSlideIn` | 10px upward slide + fade — plays on every wizard step transition and app state change |
| `fadeIn` | Pure opacity fade — plays on tab switches (legacy ResultsScreen) |

---

## 5. What Has Been Completed

- [x] Vite + React + Tailwind CSS scaffold at project root
- [x] Full design token set in `tailwind.config.js` (colors, fonts, radii) from Stitch exports
- [x] `Layout.jsx` — top nav, sidebar with pipeline tracker, mobile bottom nav
- [x] `WelcomeScreen` — query input, suggestion chips, Cmd+Enter shortcut
- [x] `ErrorScreen` — warning icon, retry button, error metadata
- [x] "Multi-Agent Research Copilot" branding throughout
- [x] Navigation pruned to working features only (Workspace nav, Research sidebar)
- [x] All Stitch HTML exports preserved in `stitch-exports/` as visual reference
- [x] **Step-by-step wizard flow** (`WizardScreen.jsx` + `App.jsx` rewrite):
  - [x] Stepper progress bar — 4 steps, active=orange, done=green check, future=grey; labels use full "Agent X" naming
  - [x] Step 1 (Agent Planner) — editable subtopic list, add/remove subtopics, 2s simulated loading
  - [x] Step 2 (Agent Researcher) — editable findings per subtopic, personal notes, add/remove sources, 3s loading
  - [x] Step 3 (Agent Writer) — editable report title + per-section heading/content, 3s loading
  - [x] Step 4 (Agent Evaluator) — read-only metrics (accuracy/completeness/clarity), confidence gauge, hallucination badge, final report display, export buttons, 2s loading
  - [x] Mock data builders in `App.jsx`: `buildPlannerOutput`, `buildResearcherOutput`, `buildWriterOutput`
  - [x] Edited content carries forward: Planner edits → Researcher subtopics; Researcher edits → Writer sections; Writer edits → Evaluator final report
  - [x] Sidebar pipeline tracker stays in sync with wizard step (sidebarAgentStep / sidebarAppState mapping)
  - [x] fadeSlideIn animation on every step transition via `key={wizard-${viewingStep ?? wizardStep}}`
- [x] **Agent renaming** — all labels changed to "Agent Planner", "Agent Researcher", "Agent Writer", "Agent Evaluator" everywhere: stepper, sidebar pipeline, step headers, loading messages, proceed button labels
- [x] **Network SVG logo** — multi-agent node/network icon (4 corner nodes + center hub, connected lines, `#FF702E`) added to the left of the wordmark in the top nav
- [x] **Clickable pipeline steps** — completed agents in the sidebar are clickable and show a "VIEW" badge when active; clicking sets `viewingStep` in App state; WizardScreen renders the past step in read-only mode with a `ReadOnlyBanner` and "Back to Agent X" button; the Proceed buttons are hidden in read-only mode; clicking a non-completed step does nothing
- [x] **Export functionality** — "Export Report" (`.md`) and "Export Evaluation" (`.json`) buttons in EvaluatorStep trigger browser downloads via `Blob + URL.createObjectURL`. Filenames include a query slug (`slugify` helper). Buttons styled as outline/secondary (ghost border) in the top-right of the Evaluator header.
- [x] **Stepper polish** — chevron_right connectors replace h-px lines; active step circle has an orange glow ring; done steps show green chevrons
- [x] **LoadingState polish** — layered ring spinner (outer track + spinning ring + inner ring + center dot) with staggered pulsing dots
- [x] **Editable field styling** — all editable inputs/textareas have `cursor-text`, hover border brightening, and focus background deepening to clearly indicate editability
- [x] **Ghost "Add" buttons** — "Add subtopic" and personal note textarea use dashed-border ghost style instead of text-only buttons
- [x] **Animation key fix** — step content wrapper keyed on `${shownStep}-${isReadOnly}` so toggling read-only/live view also plays fadeSlideIn
- [x] **Research recommendation logic** — `isResearchRecommended(query)` keyword matcher in App.jsx; drives recommendation box + button prominence in PlannerStep; placeholder for real planner agent classification
- [x] **Planner skip path** — "Skip to Agent Writer →" button in PlannerStep; prominence swaps with Proceed button based on `researchRecommended`
- [x] **Researcher pre-decision UI** — shown when `researcherOutput` is empty; "Run Research →" / "Skip Research →" buttons; optional planner-hint note when research not recommended
- [x] **Research skipped state** — `researchSkipped` boolean in App state; propagated to Layout (`pipelineStatus`) and WizardScreen (`Stepper`); sidebar shows `remove_circle` icon + strikethrough + SKIP badge; stepper shows `remove` icon + strikethrough
- [x] **`handleRunResearch`** — separate handler for triggering research fetch from pre-decision UI; `handleProceedFromPlanner` now only navigates to step 2 without starting a fetch
- [x] **Writer context banner** — informational bar at top of WriterStep (both editable and read-only modes); green-tinted when research was used, orange-tinted when research was skipped; no interaction, display only
- [x] **Evaluator feedback loop** — automatic revision cycle driven by `needs_revision` from real API; 4-phase state machine (`warning → writing → reevaluating → revised`); real API calls to `/api/agent/writer/revise` then `/api/agent/evaluator`; scores, report, revision notes all swap to live data; capped at 1 revision total
- [x] **Manual "Resend to Writer" button** — outline button beside export buttons; triggers same revision sequence; disabled with "Revision used (1/1)" once revision cap reached (auto or manual)
- [x] **`ConfidenceGauge` + `EvalScores`** — extracted from EvaluatorStep; uses real API field names (`hallucination_risk`, `confidence_score`, `duration_ms`); reused for both eval passes
- [x] **Backend scaffold** — FastAPI app with 6 endpoints, Pydantic models, per-agent modules, config, requirements, `.env.example`; all agents return mock data; ready for Gemini integration
- [x] **Planner agent (live)** — real Gemini call via `google-genai`; structured JSON prompt; `_extract_json()` strips markdown fences; `HTTP 502` on failure; `async def run()`; tested with research and non-research queries
- [x] **Researcher agent (live)** — real Gemini call; prompt includes all user-edited subtopics verbatim; returns per-subtopic `findings` (2–3 paragraphs) + `sources` (2–3 items with title + URL); `_extract_json()` fence stripping; `HTTP 502` on failure; `async def run()`; main.py route updated to `async def` + `await`; tested with healthcare query
- [x] **Writer agent (live)** — real Gemini call; two system prompts (with-research vs no-research); research serialised into prompt with findings + sources; returns full `Report` with title + Introduction + per-subtopic sections + Risks and Challenges + Conclusion; `_extract_json()` fence stripping; `HTTP 502` on failure; `async def run()`; main.py route updated; tested both scenarios
- [x] **Evaluator agent (live)** — real Gemini call; full report text + query sent to Gemini; returns accuracy/completeness/clarity scores with reasoning, hallucination_risk, confidence_score, needs_revision, overall_feedback; `needs_revision` computed in Python (`confidence < 70` OR any score `< 3.0`); `_extract_json()` fence stripping; `HTTP 502` on failure; `async def run()`; main.py route updated; tested with healthcare report
- [x] **Writer revision agent (live)** — `run_revise()` moved from evaluator.py to writer.py; `async def run_revise(request)` sends current report + structured evaluator feedback (per-metric score + reasoning + overall) to Gemini with targeted-improvement instructions; returns revised `Report` + `revision_notes`; `_extract_json()` fence stripping; `HTTP 502` on failure; main.py route updated to `async def` + `await writer.run_revise()`; tested with low-accuracy feedback — Gemini added citations and expanded missing sections
- [x] **Request logging** — HTTP middleware in `main.py` logs every request: method, path, status code, duration in ms using Python `logging` module; format `HH:MM:SS  LEVEL  METHOD /path  status=N  duration=N ms`
- [x] **Full pipeline integration test** — `backend/test_pipeline.py` runs both paths end-to-end against the live server: Path A (planner → researcher → writer → evaluator → conditional revision + re-evaluation); Path B (planner → skip researcher → writer → evaluator); prints structured output with scores, section counts, durations, and total pipeline time; both paths confirmed passing (Path A ~51s, Path B ~31s)
- [x] **Frontend planner + researcher + writer connected to backend** — Planner: `handleSubmit` async → `/api/agent/planner`. Researcher: `handleRunResearch` async → `/api/agent/researcher`; shape mapped to frontend. Writer: shared `_callWriter(researchUsed, researchItems)` helper used by both `handleProceedFromResearcher` (Path A: maps frontend researcherOutput back to API `ResearchItem` shape, `research_used=true`) and `handleSkipToWriter` (Path B: `research=null`, `research_used=false`); API `report` shape matches `writerOutput` directly; `WriterStep` shows "Completed in Xs" badge. All three mocks (`buildPlannerOutput`, `buildResearcherOutput`, `buildWriterOutput`) removed.
- [x] **Frontend evaluator connected to backend** — `handleProceedFromWriter` async → `/api/agent/evaluator`; stores `evaluationData` + `evaluatorDurationMs` in App state; passed to `WizardScreen` → `EvaluatorStep`. Revision loop calls `/api/agent/writer/revise` then `/api/agent/evaluator` with real API data. All mock evaluation constants (`MOCK_EVALUATION`, `MOCK_REVISED_EVALUATION`) removed. Errors routed via `onError` prop to App-level error state. Export buttons use live `activeEval` / `activeReport`.
- [x] **Final polish** — Loading messages use exact agent names ("Agent Planner is analyzing your query…", "Agent Researcher is gathering information…", "Agent Writer is composing your report…", "Agent Evaluator is scoring quality…", "Agent Writer is revising based on feedback…", "Agent Evaluator is re-evaluating…"). Sidebar pipeline tracker shows per-agent duration below label for completed agents. Backend connection error banner on WelcomeScreen (health-check on mount, 3s timeout). Footer "Powered by Gemini 2.0 Flash | Multi-Agent Research Copilot v1.0" in main content area. All mock data removed.
- [x] **History storage** — `backend/storage.py` reads/writes `backend/data/history.json` (max 50 entries, newest first). Three endpoints: `POST /api/history` (save), `GET /api/history` (last 10 summaries), `GET /api/history/{id}` (full entry). `EvaluatorStep` calls `onSaveResult` once on completion — immediately after mount if `needs_revision=false`, or after revision loop finishes; guarded by `savedRef` to prevent double-saves. App fetches history on mount and refreshes after each save. Sidebar shows last 5 queries as clickable buttons; clicking loads the saved report+evaluation into step 4 view via `handleLoadHistoryEntry`.

---

## 6. Still To Do

- [ ] **Responsive / mobile layout** — Sidebar collapses to bottom nav on mobile, but wizard step content layouts (ResearcherStep grid, EvaluatorStep gauge row) have not been tested or adjusted for small screens.

- [ ] **Legacy screen cleanup** — `ProcessingScreen.jsx`, `ResultsScreen.jsx`, `ReportScreen.jsx`, `EvaluationScreen.jsx`, `SourcesTab.jsx` are no longer used by `App.jsx`. Safe to delete.

---

## Dev Commands

```bash
# Frontend
npm run dev      # Start dev server (usually http://localhost:5173 or 5174 if port in use)
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs available at http://localhost:8000/docs
```

---

## 7. Backend

### Structure

```
backend/
├── main.py              # FastAPI app, CORS, all route definitions
├── agents/
│   ├── __init__.py
│   ├── planner.py       # Agent Planner — run(PlannerRequest) → PlannerResponse
│   ├── researcher.py    # Agent Researcher — run(ResearcherRequest) → ResearcherResponse
│   ├── writer.py        # Agent Writer — run(WriterRequest) → WriterResponse
│   │                   #               run_revise(WriterReviseRequest) → WriterReviseResponse
│   └── evaluator.py     # Agent Evaluator — run(EvaluatorRequest) → EvaluatorResponse
├── models.py            # All Pydantic request/response models
├── config.py            # Loads GEMINI_API_KEY from .env via python-dotenv
├── requirements.txt     # fastapi, uvicorn[standard], google-genai, python-dotenv, pydantic
└── .env.example         # GEMINI_API_KEY=your-key-here
```

`backend/.env` is in `.gitignore` and must be created manually from `.env.example`.

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Returns `{"status": "ok"}` |
| `POST` | `/api/agent/planner` | Planner agent |
| `POST` | `/api/agent/researcher` | Researcher agent |
| `POST` | `/api/agent/writer` | Writer agent |
| `POST` | `/api/agent/writer/revise` | Writer revision (evaluator feedback loop) |
| `POST` | `/api/agent/evaluator` | Evaluator agent |

CORS is configured to allow `http://localhost:5173` and `http://localhost:5174`.
Interactive API docs: `http://localhost:8000/docs` (Swagger UI).

### Pydantic Models (`models.py`)

**Shared sub-models:**
- `Subtopic` — `{ id: str, title: str, description: str }`
- `ReportSection` — `{ heading: str, content: str }`
- `Report` — `{ title: str, sections: list[ReportSection] }`
- `Source` — `{ title: str, url: str }`
- `ResearchItem` — `{ subtopic_id, subtopic_title, findings: str, sources: list[Source] }`
- `ScoreWithReasoning` — `{ score: float, reasoning: str }`
- `EvaluatorFeedback` — `{ accuracy, completeness, clarity: ScoreWithReasoning, overall_feedback: str }`

**Request/Response pairs:**

| Agent | Request | Response |
|---|---|---|
| Planner | `query: str` | `subtopics`, `research_recommended: bool`, `research_recommendation_reason: str`, `duration_ms: int` |
| Researcher | `query`, `subtopics: list[Subtopic]` | `research: list[ResearchItem]`, `duration_ms` |
| Writer | `query`, `subtopics`, `research: Optional[list[ResearchItem]]`, `research_used: bool` | `report: Report`, `research_used`, `duration_ms` |
| Writer Revise | `query`, `report: Report`, `evaluator_feedback: EvaluatorFeedback` | `report: Report`, `revision_notes: str`, `duration_ms` |
| Evaluator | `query`, `report: Report` | `accuracy`, `completeness`, `clarity: ScoreWithReasoning`, `hallucination_risk: str`, `confidence_score: int`, `needs_revision: bool`, `overall_feedback: str`, `duration_ms` |

### Agent Implementation Notes

**Agent live status:**
- `planner` — LIVE (Gemini)
- `researcher` — LIVE (Gemini)
- `writer` — LIVE (Gemini)
- `evaluator` — LIVE (Gemini)
- `writer/revise` — LIVE (Gemini)

To connect remaining agents with real Gemini calls:
1. Import `google.genai` and use `config.GEMINI_API_KEY`
2. Replace the body of each agent's `run()` / `run_revise()` function
3. The function signatures and return types stay the same — no changes to `main.py` or `models.py` needed

**Planner** (`agents/planner.py`): **LIVE — calls Gemini.** `async def run(request)` sends a structured prompt to Gemini instructing it to return JSON with `subtopics` (4–6 items) + `research_recommended` bool + `research_recommendation_reason`. `_extract_json()` strips markdown fences before parsing. Raises `HTTP 502` on Gemini API error or invalid JSON. The old keyword-based `_research_recommended()` helper has been removed.

**Researcher** (`agents/researcher.py`): **LIVE — calls Gemini.** `async def run(request)` sends subtopics + query to Gemini, instructing it to return JSON with a `research` array (one item per subtopic: `subtopic_id`, `subtopic_title`, `findings` 2–3 paragraphs, `sources` 2–3 items). Subtopics are included in the prompt verbatim so user edits are respected. `_extract_json()` strips markdown fences before parsing. Raises `HTTP 502` on Gemini API error or invalid JSON. The old mock `_MOCK_FINDINGS` bank has been removed.

**Writer** (`agents/writer.py`): **LIVE — calls Gemini.** `async def run(request)` handles two scenarios: Scenario A (`research_used=True`) sends a system prompt instructing evidence-based writing with citations; Scenario B (`research_used=False`) sends a prompt instructing the model to write from general knowledge and note the absence of external research. Research items are serialised into the prompt with findings + sources. `_extract_json()` strips fences. Raises `HTTP 502` on error. Also contains `async def run_revise(request)` — sends the current report + structured evaluator feedback (per-metric score + reasoning + overall) to Gemini with targeted-improvement instructions; returns revised `Report` + `revision_notes`. main.py `/api/agent/writer/revise` route updated to `async def` + `await writer.run_revise()`.

**Evaluator** (`agents/evaluator.py`): **LIVE — calls Gemini.** `async def run(request)` sends the full report text + original query to Gemini and receives JSON with accuracy/completeness/clarity scores (1–5 with reasoning), hallucination_risk (Low/Medium/High), confidence_score (0–100), and overall_feedback. `needs_revision` is computed in Python: `true` if `confidence_score < 70` OR any score `< 3.0`. `_extract_json()` strips fences. Raises `HTTP 502` on error. `run_revise()` has been removed — revision is handled by `writer.run_revise()`.

### Gemini Integration (future)

Package: `google-genai` (`pip install google-genai`)
Config variables (loaded by `config.py` via `python-dotenv` from `backend/.env`):
- `GEMINI_API_KEY` — required; warns on startup if missing
- `GEMINI_MODEL` — model name; defaults to `gemini-2.0-flash` if not set in `.env`

Access in agents: `from config import GEMINI_API_KEY, GEMINI_MODEL`
All LLM calls must use `GEMINI_MODEL` rather than hardcoding the model name.
