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
- `researchSkipped`: `boolean` — true when user bypassed Agent Researcher; shows SKIPPED state in sidebar and stepper

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

**Render:** `key={appState === 'wizard' ? \`wizard-${viewingStep ?? wizardStep}\` : appState}` on the wrapper div — triggers fadeSlideIn on every step transition and when switching to/from a past-step view.

### `components/Layout.jsx`
Persistent shell that wraps every screen. Never re-mounts.
- **Top nav**: multi-agent network SVG icon (4 corner nodes + center hub, connected with lines, all in `#FF702E`) + "MULTI-AGENT RESEARCH COPILOT" wordmark + "WORKSPACE" link + settings icon + v1.0 badge
- **Left sidebar** (260 px, hidden on mobile):
  - User/session indicator (Analyst_01 + pulse dot)
  - "Research" nav item (only active item)
  - Pipeline status tracker: reads `pipelineStatus` prop and shows STANDBY / ACTIVE / COMPLETE with per-agent indicators (spinner → check). Completed agents are clickable — clicking calls `onViewStep(step)`. The currently-viewed past step shows a "VIEW" badge instead of "OK". Non-completed steps are not clickable.
  - "+ New Research" orange CTA — calls `onNewResearch` prop
  - Support + Docs footer links (non-functional, decorative)
- **Main slot**: `{children}` — scrollable content area
- **Mobile bottom nav**: single "Research" item mirrors the sidebar

Props:
```js
{
  activeNav:      string,           // default 'Research'
  activeTopNav:   string,           // default 'Workspace'
  pipelineStatus: { appState, agentStep, researchSkipped },
  onNewResearch:  () => void,
  viewingStep:    number | null,    // which past step is being viewed (for VIEW badge)
  onViewStep:     (step: number) => void,  // called when user clicks a completed pipeline agent
}
```

`pipelineItemState(index, appState, agentStep, researchSkipped)` — extended to return `'skipped'` for index 1 (Agent Researcher) when `researchSkipped=true`. Skipped items render with `remove_circle` icon, strikethrough label, and "SKIP" badge. They are not clickable.

### `screens/WelcomeScreen.jsx`
- Default export `WelcomeScreen` — wraps `WelcomeContent` in its own `Layout`; used for standalone rendering only
- Named export `WelcomeContent` — used by `App.jsx` (already inside Layout, so no double-wrap)
- Props: `{ onSubmit: (query: string) => void }`
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

`EvalScores({ evalData })` — extracted scores panel: renders the 3 metric cards (Accuracy / Completeness / Clarity each with a glowing `bg-primary` progress bar), then a 2-column row with `ConfidenceGauge` + Hallucination Risk badge (LOW=emerald, MEDIUM=yellow, else=error; badge text is `{risk}_LEVEL / Verified`) and a token usage bar + latency display. Accepts either `MOCK_EVALUATION` or `MOCK_REVISED_EVALUATION`.

`EvaluatorStep({ loading, report, researcherOutput, query, onNewResearch })`:
- Read-only evaluation results: Accuracy / Completeness / Clarity metric cards (score + glowing progress bar + reasoning text)
- SVG confidence gauge, Hallucination Risk badge, token usage bar, latency display
- Full final report rendered as a read-only article (user's edited draft)
- Export buttons: "Report" (.md) and "Evaluation" (.json) — unchanged
- "+ New Research" button — unchanged
- **"Resend to Writer" button**: secondary outline, placed beside export buttons. Disabled (showing "Revision used (1/1)") once `revisionUsed=true`. Only 1 manual revision allowed total.
- **Feedback loop** (internal state machine, no props changes needed):
  - `loopPhase`: `'idle' | 'warning' | 'sending' | 'writing' | 'reevaluating' | 'revised'`
  - `revisionUsed`: `boolean` — set to true after loop completes; caps total rewrites at 1
  - `activeEval`: `useState(initialEval)` — starts as `MOCK_EVALUATION`, swaps to `MOCK_REVISED_EVALUATION` on revision completion; passed directly to `<EvalScores evalData={activeEval} />`
  - `sequenceActive` ref: prevents double-trigger of manual resend
  - **Auto-trigger**: on mount, if `MOCK_EVALUATION.confidence < 70`, sets `loopPhase='warning'`
  - **Phase timings** (driven by `useEffect` on `loopPhase`):
    - `warning` → `sending` after 2s
    - `sending` → `writing` after 1s
    - `writing` → `reevaluating` after 3s (shows LoadingState with Writer message)
    - `reevaluating` → `revised` after 2s (shows LoadingState with re-eval message); swaps `activeEval` to revised data, sets `revisionUsed=true`
  - During `writing` and `reevaluating` phases, an orange "REVISING — Agent Evaluator" pill header is shown above the loader
  - **`loopPhase='warning'`**: red error banner "Report needs improvement — Confidence score below threshold" with PROCESSING… pulse
  - **`loopPhase='sending'`**: orange info bar "Sending feedback to Agent Writer for revision…" with pulse dot
  - **`loopPhase='revised'`**: green success banner "Report improved after revision — Confidence: 88%" + "Max revision limit reached (1/1)" note
  - **Manual resend** (`handleManualResend`): starts from `'sending'` phase if `!revisionUsed && !sequenceActive.current`
- `MOCK_REVISED_EVALUATION` constant: accuracy 4.5, completeness 4.7, clarity 4.8, confidence 88%, hallucinationRisk LOW
- `MOCK_EVALUATION.confidence` is currently set to **55** for testing the feedback loop. **TODO: restore to 85** after testing.

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
- [x] **Evaluator feedback loop** — automatic revision cycle when `confidence < 70`; 5-phase timed state machine (`warning → sending → writing → reevaluating → revised`); scores swap to `MOCK_REVISED_EVALUATION` on completion; capped at 1 revision total
- [x] **Manual "Resend to Writer" button** — outline button beside export buttons; triggers same revision sequence; disabled with "Revision used (1/1)" once revision cap reached (auto or manual)
- [x] **`ConfidenceGauge` + `EvalScores`** — extracted from EvaluatorStep; reused for both eval passes
- [ ] **Restore `MOCK_EVALUATION.confidence` to 85** — currently set to 55 for feedback loop testing

---

## 6. Still To Do

- [ ] **Error state trigger** — The ERROR state exists and renders correctly but is never reached. Add a simulated trigger (e.g. dev toggle or random chance during loading) so it can be tested and demoed before real API is connected.

- [ ] **Responsive / mobile layout** — Sidebar collapses to bottom nav on mobile, but wizard step content layouts (ResearcherStep grid, EvaluatorStep gauge row) have not been tested or adjusted for small screens.

- [ ] **Backend integration** — Replace `setTimeout` simulations in `App.jsx` with real API calls to the multi-agent backend. Replace mock data builders with API responses streamed into each wizard step. State machine shape (`idle → wizard step 1–4 → idle`) is already correct; swap the handlers.

- [ ] **Legacy screen cleanup** — `ProcessingScreen.jsx`, `ResultsScreen.jsx`, `ReportScreen.jsx`, `EvaluationScreen.jsx`, `SourcesTab.jsx` are no longer used by `App.jsx`. Remove them once backend integration confirms the wizard flow is the permanent UX, or repurpose their content into the wizard steps.

---

## Dev Commands

```bash
npm run dev      # Start dev server (usually http://localhost:5173 or 5174 if port in use)
npm run build    # Production build into dist/
npm run preview  # Preview the production build locally
```
