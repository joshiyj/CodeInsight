# CodeInsight — Engineering Roadmap & Architecture
> Interactive AI Code Visualization Tool
> Version: 2.0 | Status: Active | Focus: Visualization + Execution Simulation

---

## HOW TO USE THIS DOCUMENT

This document is **self-contained and LLM-portable**.

- Paste this document into any LLM (Claude, Gemini, GPT-4, etc.) at the start of any session
- Say: *"I am continuing development of CodeInsight. Here is the project roadmap. I want to work on Phase X."*
- The LLM will have full context to continue exactly where you left off.

---

## SECTION 1: HIGH-LEVEL ARCHITECTURE

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                     │
│                                                                  │
│  ┌─────────────┐  ┌───────────────────────────────────────────┐  │
│  │   Monaco    │  │         Visualization Engine              │  │
│  │   Editor    │  │                                           │  │
│  │             │  │  ┌──────────────┐  ┌──────────────────┐   │  │
│  │ - Syntax    │  │  │  Diagram     │  │ Execution Sim    │   │  │
│  │ - Markers   │  │  │  Panel       │  │ (CORE FEATURE)   │   │  │
│  │ - Hover     │  │  │              │  │                  │   │  │
│  │ - Themes    │  │  │ - Mermaid    │  │ - Step Tracer    │   │  │
│  └─────────────┘  │  │   Flowcharts │  │ - Variable Panel │   │  │
│                   │  │ - Zoom / Pan │  │ - Call Stack     │   │  │
│  ┌─────────────┐  │  │ - Export PNG │  │ - Array Viz      │   │  │
│  │  AI Insights│  │  └──────────────┘  │ - Recursion Viz  │   │  │
│  │  Panel(SSE) │  │                    │ - Play/Pause/Step│   │  │
│  │             │  │                    │ - Timeline Scrub │   │  │
│  │ - Review    │  │                    │ - AI Step Explain│   │  │
│  │ - Step Expl.│  │                    └──────────────────┘   │  │
│  │ - Streaming │  └───────────────────────────────────────────┘  │
│  └─────────────┘                                                  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                  Global State (Zustand)                    │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTP / SSE
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  AI Gateway      │  │  Diagram Gen     │  │  Execution    │  │
│  │  (PRIMARY)       │  │  (Phase 3)       │  │  Simulator    │  │
│  │                  │  │                  │  │  (Phase 4)    │  │
│  │ - Gemini API     │  │ - mermaidGen.js  │  │               │  │
│  │ - Prompt Mgr     │  │ - AI → Mermaid   │  │ - tracePrompt │  │
│  │ - SSE Stream     │  │ - All languages  │  │ - traceExtract│  │
│  │ - Rate Limiter   │  └──────────────────┘  │ - stepEnricher│  │
│  └──────────────────┘                        │ - varTracker  │  │
│                                              └───────────────┘  │
│  ┌──────────────────┐                                            │
│  │  AST Engine      │  ← Minimal / Slim (Phase 5, low priority) │
│  │  (SLIM ONLY)     │                                            │
│  │ - Basic detect.  │                                            │
│  │ - Syntax parsing │                                            │
│  │ - Simple metrics │                                            │
│  │ - Monaco markers │                                            │
│  └──────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │   External Services   │
                  │  - Gemini API         │
                  └───────────────────────┘
```

---

### Architecture Principles

| Principle | Decision |
|-----------|----------|
| **Visualization First** | Mermaid diagrams and execution simulation are the primary differentiators — ship these before deep static analysis |
| **AI-Powered Everything** | All visualization and simulation is AI-driven (Gemini) — no heavy compiler infrastructure needed |
| **Language Agnostic** | AI-generated diagrams and simulation work for ALL languages — not locked to JS/Java parsers |
| **Streaming First** | All AI responses use SSE for real-time UX — no waiting for full responses |
| **DSA Focus** | Execution simulator is optimized for DSA algorithms: sorting, recursion, search, trees, linked lists |
| **No DB** | All state lives in memory and React state — no persistence needed |
| **Simple Stack** | No overengineering. No enterprise abstractions. Ship impressively, not theoretically. |
| **AST Minimal** | AST/static analysis is kept slim — basic detectors only. Advanced AST work is deferred. |

---

### Core Data Flow

```
User types code in Monaco Editor
         │
         ▼
   [Frontend debounce: 800ms]
         │
         ├─── GET /api/analyze/stream ────► [AI Gateway]
         │         (auto on code change)         │
         │                               [Gemini Streaming]
         │                                       │
         │                          ┌────────────┴────────────┐
         │                          ▼                         ▼
         │                    [SSE tokens]             [Issues JSON]
         │                          │                         │
         │                   [AI Insights              [Monaco Markers
         │                    Panel streams]            + Issue List]
         │
         │    User clicks "Generate Diagram" button
         │         │
         ├─── POST /api/diagram ──────────► [Diagram Generator]
         │    (on-demand only)                    │
         │                               [Gemini — diagram only]
         │                                       │
         │                               [Mermaid string]
         │                                       │
         │                               [DiagramPanel renders]
         │
         │    User clicks "Simulate" button
         │         │
         └─── POST /api/execute ──────────► [Execution Simulator]
              (on-demand only)                    │
                                         [Gemini trace prompt]
                                                 │
                                         [ExecutionStep[] JSON]
                                                 │
                                    [Frontend replays locally:]
                                    - Active line in Monaco
                                    - Variable panel
                                    - Call stack panel
                                    - Array visualizer
                                    - Play / Pause / Scrubber
```

---

## SECTION 2: TECH STACK

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool, fast HMR |
| Tailwind CSS | 3.x | Utility-first styling |
| Monaco Editor | 0.46+ | VSCode-grade code editor |
| Mermaid | 10.x | AI-generated flowcharts (Phase 3) |
| Framer Motion | 11.x | Smooth UI animations |
| Zustand | 4.x | Simple global state |
| ReactFlow | 11.x | *(Deferred — Phase 6 optional)* |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express | 4.x | HTTP server |
| @google/generative-ai | latest | Gemini SDK with streaming |
| cors | 2.x | CORS headers |
| express-rate-limit | 7.x | Protect AI endpoints |
| dotenv | 16.x | Environment config |
| @babel/parser | 7.x | JavaScript AST *(Phase 5, slim only)* |
| @babel/traverse | 7.x | AST traversal *(Phase 5, slim only)* |

> **Note:** No `java-parser`, no `java` subprocess, no `javac`. The execution simulator is AI-driven and language-agnostic. This keeps the stack lean and deployment simple.

---

## SECTION 3: FOLDER STRUCTURE

```
codeinsight/
├── frontend/                         # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/
│   │   │   │   ├── CodeEditor.jsx
│   │   │   │   ├── EditorToolbar.jsx
│   │   │   │   └── EditorMarkers.jsx
│   │   │   ├── panels/
│   │   │   │   ├── AIInsightsPanel.jsx
│   │   │   │   ├── IssueListPanel.jsx
│   │   │   │   └── MetricsPanel.jsx          # (Phase 5 - slim)
│   │   │   ├── visualization/
│   │   │   │   ├── DiagramPanel.jsx           # Phase 3 — tabbed host
│   │   │   │   ├── MermaidDiagram.jsx         # Phase 3 — Mermaid render
│   │   │   │   ├── ExecutionSimulator.jsx     # Phase 4 — main container
│   │   │   │   ├── ArrayVisualizer.jsx        # Phase 4 — array boxes
│   │   │   │   ├── VariablePanel.jsx          # Phase 4 — var tracker
│   │   │   │   ├── CallStackPanel.jsx         # Phase 4 — stack cards
│   │   │   │   └── RecursionVisualizer.jsx    # Phase 4 — recursion tree
│   │   │   ├── ui/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── Tabs.jsx
│   │   │   │   └── ErrorBoundary.jsx
│   │   │   └── layout/
│   │   │       ├── AppLayout.jsx
│   │   │       └── Header.jsx
│   │   ├── hooks/
│   │   │   ├── useAnalysis.js
│   │   │   ├── useSSEStream.js
│   │   │   ├── useMonaco.js
│   │   │   └── useExecution.js               # Phase 4
│   │   ├── store/
│   │   │   ├── editorStore.js
│   │   │   ├── analysisStore.js
│   │   │   └── uiStore.js
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── analyze.js
│   │   │   ├── diagram.js                    # Phase 3 — POST /api/diagram
│   │   │   ├── execute.js                    # Phase 4
│   │   │   └── stream.js
│   │   ├── utils/
│   │   │   ├── codeDetector.js
│   │   │   └── formatter.js
│   │   ├── constants/
│   │   │   └── languages.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── analyze.js
│   │   │   ├── stream.js
│   │   │   ├── diagram.js                    # Phase 3 — POST /api/diagram (on-demand)
│   │   │   ├── execute.js                    # Phase 4
│   │   │   └── health.js
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   │   ├── geminiClient.js
│   │   │   │   ├── promptManager.js
│   │   │   │   ├── streamHandler.js
│   │   │   │   └── promptTemplates/
│   │   │   │       ├── review.js
│   │   │   │       ├── explain.js
│   │   │   │       ├── diagram.js            # Phase 3 — Mermaid prompt
│   │   │   │       ├── simulation.js         # Phase 4 — trace prompt
│   │   │   │       └── stepExplain.js        # Phase 4 — per-step explain
│   │   │   ├── visualization/
│   │   │   │   └── mermaidGenerator.js       # Phase 3 — extract <diagram> block
│   │   │   ├── execution/
│   │   │   │   ├── tracePrompt.js            # Phase 4
│   │   │   │   ├── traceExtractor.js         # Phase 4
│   │   │   │   ├── stepEnricher.js           # Phase 4
│   │   │   │   └── variableTracker.js        # Phase 4
│   │   │   └── ast/                          # Phase 5 — slim only
│   │   │       ├── parser.js
│   │   │       ├── visitor.js
│   │   │       ├── metrics.js
│   │   │       └── detectors/
│   │   │           ├── index.js
│   │   │           ├── consoleLogs.js
│   │   │           ├── equalityChecks.js
│   │   │           └── longFunctions.js
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   └── index.js
│   │   └── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## SECTION 4: PHASE ROADMAP

### Quick Reference

| Phase | Name | Key Deliverable | Status | Est. Effort |
|-------|------|----------------|--------|-------------|
| 1 | Foundation | Working editor + streaming AI code review | ✅ DONE | ~1 day |
| 2 | Issue System | Structured issues + Monaco editor markers | ✅ DONE | ~1 day |
| **3** | **Simplified Visualization** | **AI-generated Mermaid flowcharts for ALL languages** | 🔜 **NEXT** | **~1 day** |
| **4** | **Execution Simulator Core** | **DSA step-by-step simulation — THE MAIN FEATURE** | 🔜 | **~2–3 days** |
| 5 | AST Engine (Slim) | Basic detectors + simple metrics only | ⏳ Later | ~0.5 day |
| 6 | Advanced Features | Monaco Pro, ReactFlow, advanced AST (optional) | 🔮 Future | ~2 days |

> **Priority philosophy:** Ship what's *visually impressive and educationally unique* first. Deep compiler engineering can wait. The killer demo is an algorithm coming alive on screen — not a linter.

---

## SECTION 5: DETAILED PHASE SPECIFICATIONS

---

### ═══════════════════════════════════════════
### PHASE 1: Foundation — Core Editor + AI Review  ✅ COMPLETED
### ═══════════════════════════════════════════

**Status: Done.** Monaco editor with syntax highlighting, language selector, SSE streaming AI review panel, Zustand store.

#### What's Working
- React + Vite + Tailwind setup
- Monaco Editor with syntax highlighting
- Language selector (JS / Python / Java / C / C++)
- Node.js + Express backend
- `POST /api/analyze` + `GET /api/analyze/stream` SSE endpoint
- Gemini API with token-by-token streaming
- AI Insights Panel (streaming)
- Basic loading + error handling

#### LLM Continuation Context
```
PROJECT: CodeInsight — Interactive AI Code Visualization Tool
PHASE COMPLETED: Phase 1 (Foundation)
TECH STACK: React + Vite frontend, Node.js + Express backend
STATE: Zustand (editorStore, analysisStore)
API: native EventSource for SSE, fetch for REST
AI PROVIDER: Gemini API with streaming
LAYOUT: 2-column — Monaco left, AI Insights Panel right
ENDPOINTS:
  - POST /api/analyze
  - GET /api/analyze/stream (SSE)
WORKING: Editor, language select, AI code review streaming
```

---

### ═══════════════════════════════════════════
### PHASE 2: Issue System — Structured Analysis  ✅ COMPLETED
### ═══════════════════════════════════════════

**Status: Done.** Structured `CodeIssue` schema, Monaco markers, issue list panel.

#### What's Working
- Structured `CodeIssue` schema (severity / category / line / fix)
- AI prompt emits `<issues>[...]</issues>` JSON block
- Monaco `IMarkerData` red/yellow underlines on specific lines
- Hover tooltip on markers with description + suggested fix
- Issue List Panel with severity filter tabs
- Click issue → editor scrolls to that line

#### Issue Schema (JSDoc)

```javascript
/**
 * @typedef {Object} CodeIssue
 * @property {string} id
 * @property {"error"|"warning"|"info"|"hint"} severity
 * @property {"bug"|"performance"|"security"|"style"|"logic"|"best-practice"} category
 * @property {number} line
 * @property {number} [column]
 * @property {number} [endLine]
 * @property {string} message
 * @property {string} explanation
 * @property {string} [suggestedFix]
 * @property {string} [codeSnippet]
 */
```

#### LLM Continuation Context
```
PROJECT: CodeInsight — Interactive AI Code Visualization Tool
PHASES COMPLETED: Phase 1 (Foundation), Phase 2 (Issue System)
WORKING:
  - Monaco editor with syntax highlighting + markers
  - Streaming AI code review (SSE)
  - Structured issues from AI (<issues> XML tag pattern)
  - Monaco IMarkerData underlines on flagged lines
  - Issue List Panel with severity filter
  - Click issue → scroll to line
ENDPOINTS:
  - POST /api/analyze
  - GET /api/analyze/stream (SSE) — emits: token, issues, complete, error
STATE SHAPE: { insights, aiIssues, isStreaming } in analysisStore
NEXT: Phase 3 — Simplified Visualization Engine (Mermaid flowcharts)
```

---

### ═══════════════════════════════════════════
### PHASE 3: Simplified Visualization Engine  🔜 NEXT
### ═══════════════════════════════════════════

**Goal:** Add AI-generated Mermaid flowcharts that work for *every language* the user pastes — with zero AST dependency. This is CodeInsight's first "wow moment" for non-JS code.

**Why this phase before AST:** A Mermaid diagram generated by Gemini works for Python, Java, C++, Go, Rust — anything. It looks impressive immediately and requires no new parser infrastructure. Ship the visual impact first.

**What this is NOT:** No ReactFlow. No AST call graphs. No deep graph analysis. Keep it simple: one AI-generated Mermaid diagram per analysis, rendered beautifully.

#### Features

- AI-generated Mermaid flowchart for **any language** (JS, Python, Java, C, C++, etc.)
- Mermaid diagram rendered inside a `DiagramPanel` component
- Zoom and pan on the diagram
- Export diagram to PNG
- **Diagram is generated on-demand only** — user must click "Generate Diagram" button
- No diagram tokens wasted during normal code review / issue analysis
- Graceful fallback if Mermaid output is malformed
- "No diagram available" state for code snippets too short to be meaningful

#### Architecture Decisions

- **On-demand, not automatic:** Diagram generation is triggered only when the user explicitly clicks "Generate Diagram". The main `/api/analyze/stream` endpoint never generates Mermaid — keeping AI review fast, issues arriving sooner, and zero tokens spent when the user doesn't need a diagram.
- **Dedicated `POST /api/diagram` endpoint:** Clean separation from the analyze stream. Accepts `{ code, language }` and returns `{ mermaid: string | null }` synchronously (non-streaming — Mermaid strings are short enough that streaming adds no value).
- **AI-generated, not AST-derived:** Gemini reads the code text and produces a Mermaid flowchart. Works for every language with no parser infrastructure.
- **No ReactFlow yet:** ReactFlow requires an AST-derived graph. Deferred to Phase 6 (optional). Mermaid is all we need here.
- **Mermaid 10.x client-side rendering:** `mermaid.render()` runs entirely in the browser — no server-side rendering needed.

#### Backend Steps

1. Create `src/modules/ai/promptTemplates/diagram.js`
   - A focused, standalone prompt — no review text, no issues, diagram only
   - Prompt: *"Generate a Mermaid flowchart for the following {language} code. Use `flowchart TD` syntax. Focus on the main control flow and function calls. Emit ONLY the raw Mermaid code inside `<diagram>...</diagram>` tags — no prose, no explanation, no markdown fences. If the code is too trivial for a meaningful diagram, emit `<diagram>NONE</diagram>`."*
2. Create `src/modules/visualization/mermaidGenerator.js`
   - `generateDiagram(code, language)`:
     - Calls Gemini (non-streaming — Mermaid output is short, no value in streaming it)
     - Extracts the `<diagram>...</diagram>` block from the response
     - Returns the raw Mermaid string, or `null` if value is `"NONE"` or tag is absent
   - `extractDiagram(responseText)` — pure extractor used internally
3. Create `src/routes/diagram.js`
   - `POST /api/diagram`
   - Accepts `{ code: string, language: string }`
   - Validates input (non-empty code, known language)
   - Calls `mermaidGenerator.generateDiagram(code, language)`
   - Returns `{ mermaid: string | null }`
   - On Gemini failure: returns `500` with `{ error: "Diagram generation failed" }`
4. Register the new route in `server.js`: `app.use('/api/diagram', diagramRouter)`
5. **No changes to `/api/analyze/stream`** — the analyze stream stays clean, fast, and diagram-free

#### Frontend Steps

1. Install `mermaid` (v10.x): `npm install mermaid`
2. Create `src/api/diagram.js`
   - `fetchDiagram(code, language)` → `POST /api/diagram` → returns `{ mermaid: string | null }`
3. Create `src/components/visualization/MermaidDiagram.jsx`
   - Accepts `mermaidString` prop
   - Calls `mermaid.render(id, mermaidString)` inside a `useEffect`
   - Wraps render in `try/catch` — on error, shows raw Mermaid text as code block fallback
   - Renders output SVG via `dangerouslySetInnerHTML`
   - Wrap the SVG container in a scrollable `div` with `overflow: auto` for built-in pan
4. Create `src/components/visualization/DiagramPanel.jsx`
   - **Default / idle state:** Show a "Generate Diagram" button with a small description: *"AI-powered flowchart for any language"*
   - **Loading state:** Show a spinner + *"Generating flowchart…"* — triggered when button is clicked
   - **Diagram state:** Render `<MermaidDiagram>` + Export PNG button in the header
   - **Empty state:** Show *"No diagram available for this snippet"* when `mermaid === null`
   - **Error state:** Show *"Diagram generation failed — try again"* with a retry button
   - Button is disabled while the main AI review is still streaming (avoid parallel Gemini calls)
5. Add Export PNG button
   - Use `html-to-image` (`npm install html-to-image`)
   - `toPng(containerRef.current)` → trigger browser download as `diagram.png`
6. Update `analysisStore.js` — add `diagram: null`, `isDiagramLoading: false`, `diagramError: null` + their setters
7. Wire the "Generate Diagram" button click → call `fetchDiagram(code, language)` → dispatch to store
8. Initialize Mermaid once in `App.jsx` or `main.jsx`:
   ```javascript
   import mermaid from 'mermaid';
   mermaid.initialize({ startOnLoad: false, theme: 'dark' });
   ```
9. **No changes to `src/api/stream.js`** — the `diagram` SSE event is gone entirely

#### Key API Contract

```
POST /api/diagram
Request body:
{
  code: string,      // source code to visualize
  language: string   // "javascript" | "python" | "java" | "c" | "cpp" | etc.
}

Success response (200):
{
  mermaid: string | null
  // string = valid Mermaid flowchart syntax
  // null   = code too trivial or AI skipped it
}

Error response (400/500):
{
  error: string,
  message?: string
}
```

#### Deliverables After Phase 3

- [ ] "Generate Diagram" button is visible in the DiagramPanel idle state
- [ ] Button is disabled while the main AI review stream is still running
- [ ] Clicking the button calls `POST /api/diagram` and shows a loading spinner
- [ ] Mermaid flowchart renders correctly for JavaScript, Python, Java, C, C++ paste
- [ ] Zoom / pan works (native SVG scroll)
- [ ] Export to PNG produces a clean download
- [ ] Malformed Mermaid output gracefully falls back to raw text — never crashes
- [ ] `null` response from API shows "No diagram available" empty state
- [ ] Network/Gemini error shows a retry button
- [ ] Main AI review and issues are completely unaffected — same speed as before Phase 3
- [ ] No `diagram` event in the SSE stream — stream is clean

#### LLM Continuation Context
```
PROJECT: CodeInsight — Interactive AI Code Visualization Tool
PHASES COMPLETED: Phase 1, Phase 2, Phase 3 (Mermaid Visualization)
WORKING:
  - Monaco editor + streaming AI review + structured issues + Monaco markers
  - AI-generated Mermaid flowcharts (all languages) — ON-DEMAND via button click
  - DiagramPanel with idle / loading / diagram / error states
  - "Generate Diagram" button triggers POST /api/diagram (separate from analyze stream)
  - DiagramPanel: zoom/pan + export PNG
  - Mermaid initialized with theme: dark, startOnLoad: false
DIAGRAM ENDPOINT: POST /api/diagram { code, language } → { mermaid: string | null }
STORE: analysisStore has { insights, aiIssues, diagram, isDiagramLoading, diagramError, isStreaming }
IMPORTANT: /api/analyze/stream has NO diagram logic — stays fast and clean
NEXT: Phase 4 — Execution Simulator Core (THE MAIN FEATURE)
```

---

### ═══════════════════════════════════════════
### PHASE 4: Execution Simulator Core  🔜 THE MAIN FEATURE
### ═══════════════════════════════════════════

**Goal:** Step-by-step execution simulation of DSA algorithms. Paste code (any language), hit "Simulate", and watch every variable, the call stack, and the active line evolve at each step. No runtime on the server — Gemini simulates it.

**Why this is the killer feature:** No browser tool does this well for interview-prep DSA code. Watching a sorting algorithm play out visually — array elements swapping, the recursion stack growing, loop counters updating in real time — makes abstract code immediately intuitive. This is the reason to use CodeInsight over anything else.

#### Priority-1: DSA Algorithms (Must Work Flawlessly)

| Algorithm | Trace Quality Target | Key Visuals |
|-----------|---------------------|-------------|
| Bubble Sort | ★★★★★ | Array boxes with swap animations |
| Selection Sort | ★★★★★ | Min-index tracking |
| Insertion Sort | ★★★★★ | Shift operation visual |
| Binary Search | ★★★★★ | `lo` / `hi` / `mid` updating per step |
| Merge Sort | ★★★★☆ | Recursion call stack depth |
| Quick Sort | ★★★★☆ | Pivot + partition visualization |
| Factorial (recursive) | ★★★★★ | Classic call stack demo |
| Fibonacci (recursive) | ★★★★★ | Recursion tree in call stack |
| Linked List traversal | ★★★★☆ | Pointer tracking |
| Stack / Queue push-pop | ★★★★★ | State changes very clear |
| Binary Tree traversal | ★★★★☆ | Node visit order |

#### Priority-2: Non-DSA Code (Supported Later)

General function-heavy code, nested loops, event handlers — these can be supported as a follow-up once DSA simulation is polished.

#### Architecture Decisions

- **No runtime required:** Running `javac`, `python`, `node` as subprocesses creates security risks, environment dependencies, and deployment complexity. Gemini simulates execution for DSA algorithms with high accuracy. No JDK, no Python interpreter on the server.
- **Language agnostic:** Phase 6 of the original roadmap was Java-only due to `java-parser`. This version accepts *any language* — Python, Java, C++, JavaScript, etc. The simulation prompt works for all of them.
- **Collect-then-replay:** The full trace arrives as one JSON payload. The frontend replays it locally using a timer — zero streaming complexity during playback.
- **500-step cap:** DSA algorithms rarely need more than 200–300 steps to be educational. Cap at 500 for manageable response size and snappy UI.
- **Dedicated endpoint:** `POST /api/execute` is separate from `/api/analyze` — clean separation of concerns.
- **DSA-optimized prompt:** The simulation prompt is specifically tuned for algorithm visualization — it requests `highlightIndices`, `stepType`, and detailed `description` fields that drive the visual layer.

#### Execution Step Schema (JSDoc)

```javascript
/**
 * @typedef {Object} ExecutionStep
 * @property {number} stepIndex               // 0-based step counter
 * @property {number} line                    // 1-based source line number
 * @property {string} methodName              // currently executing function/method
 * @property {Record<string, any>} variables  // all in-scope variables and their current values
 * @property {string[]} callStack             // method names, bottom to top (e.g. ["main","mergeSort","merge"])
 * @property {string} description             // human-readable label e.g. "Comparing arr[2]=5 with arr[3]=3"
 * @property {number[]} [highlightIndices]    // array indices to visually highlight this step
 * @property {"compare"|"swap"|"assign"|"call"|"return"|"loop"|"recurse"} [stepType] // drives animation
 * @property {string[]} [changedVariables]    // populated by stepEnricher — names of vars that changed vs prev step
 */
```

#### Simulation Prompt Design

```
SYSTEM:
You are a code execution simulator. Given DSA source code, produce a
step-by-step execution trace as a JSON array of ExecutionStep objects.
Emit ONLY the trace inside <trace>[...]</trace> tags — no prose, no markdown, no preamble.
Cap at 500 steps.

For each step include:
  stepIndex    : integer, 0-based
  line         : integer, 1-based line number in the source code
  methodName   : string, name of the currently active function or method
  variables    : object, ALL in-scope variables with their current values (use arrays for array types)
  callStack    : array of strings, current call stack from bottom to top
  description  : string, a concise human label for what is happening (e.g. "Swapping arr[1] and arr[3]")
  highlightIndices : array of integers (optional), indices in the primary array being accessed this step
  stepType     : one of "compare", "swap", "assign", "call", "return", "loop", "recurse"

Focus on educational clarity. Every swap, comparison, variable update, function call,
and return must be a separate step. Recursion depth must be accurately reflected in callStack.

LANGUAGE: {language}

SOURCE CODE:
{code}

SIMULATION INPUT (optional):
{simulationInput}    // e.g. "arr = [64, 34, 25, 12, 22, 11, 90]"

Produce the full trace now inside <trace>[...]</trace>.
```

#### Backend — Execution Module Structure

```
src/modules/execution/
├── tracePrompt.js       # buildSimulationPrompt(code, language, input) → prompt string
├── traceExtractor.js    # generateTrace(code, language, input) → { steps, truncated }
├── stepEnricher.js      # enrichSteps(steps) → add changedVariables diff between consecutive steps
└── variableTracker.js   # diff(prevVars, currVars) → string[] of changed variable names
```

#### Backend Steps

1. Create `src/modules/execution/tracePrompt.js`
   - `buildSimulationPrompt(code, language, simulationInput)` → returns the full prompt string
   - Inject language, code, and simulationInput into the template above
2. Create `src/modules/execution/traceExtractor.js`
   - `generateTrace(code, language, simulationInput)`:
     - Build prompt via `tracePrompt.js`
     - Call Gemini (non-streaming — trace must arrive complete): `model.generateContent(prompt)`
     - Extract `<trace>...</trace>` block via regex
     - `JSON.parse()` the block into `ExecutionStep[]`
     - Validate: drop steps missing `stepIndex`, `line`, `methodName`, `variables`, `callStack`, `description`
     - Cap at 500 steps
     - Return `{ steps: enrichedSteps, truncated: boolean, stepCount: number }`
3. Create `src/modules/execution/stepEnricher.js`
   - `enrichSteps(steps)` — compare `variables` between step N and N-1
   - Add `changedVariables: string[]` to each step
4. Create `src/modules/execution/variableTracker.js`
   - `diff(prevVars, currVars)` → `string[]` of keys whose JSON-serialized values changed
5. Create `POST /api/execute` route
   - Accepts `{ code: string, language: string, simulationInput?: string }`
   - Validate: `code` must be non-empty; `language` must be one of the supported values
   - Call `generateTrace()`
   - On success: return `{ steps, truncated, stepCount }`
   - On Gemini failure: return `500` with `{ error: "Simulation failed", message }`
   - On trace parse failure: return `500` with `{ error: "Could not parse trace" }`
   - On empty trace: return `400` with `{ error: "No executable steps found" }`

#### Frontend Steps

1. Create `src/api/execute.js`
   - `simulateCode(code, language, simulationInput)` → `POST /api/execute` → returns `{ steps, truncated, stepCount }`

2. Create `src/hooks/useExecution.js`
   ```javascript
   // State managed:
   // steps[]         — full ExecutionStep array from backend
   // currentStep     — index into steps
   // isPlaying       — playback running
   // speed           — ms per step (default 600ms)
   // isLoading       — waiting for backend trace
   // error           — string | null
   //
   // Actions:
   // simulate(code, language, input) — POST to /api/execute, store steps
   // play()       — setInterval advancing currentStep at `speed`
   // pause()      — clear interval
   // stepForward()
   // stepBack()
   // scrubTo(index)
   // reset()      — currentStep = 0, isPlaying = false
   //
   // Derived:
   // currentStepData = steps[currentStep]
   ```

3. Create `src/components/visualization/ExecutionSimulator.jsx` (main container)
   - Simulation input field: `"Provide test input (optional) e.g. arr = [5, 3, 8, 1]"`
   - "Simulate" button → calls `useExecution.simulate()`
   - Loading state: animated bar + *"Gemini is tracing your algorithm…"*
   - On truncation: show a notice *"Trace capped at 500 steps for performance"*
   - Renders: `VariablePanel`, `CallStackPanel`, `ArrayVisualizer`, controls bar, and step description badge

4. Create `src/components/visualization/VariablePanel.jsx`
   - Reads `steps[currentStep].variables`
   - Each variable → `name = value` monospace pill
   - Highlight names in `changedVariables` with Framer Motion yellow fade-in pulse
   - For array-type values: delegate to `ArrayVisualizer` row instead of showing raw JSON

5. Create `src/components/visualization/ArrayVisualizer.jsx`
   - Accepts `array` (values) + `highlightIndices` + `stepType`
   - Each element → labeled box with index below
   - `highlightIndices` → orange highlight (comparing) or green (sorted/placed)
   - Framer Motion scale pop on value change
   - Supports `stepType: "swap"` → animated swap between two boxes

6. Create `src/components/visualization/CallStackPanel.jsx`
   - Reads `steps[currentStep].callStack` — array of strings, bottom to top
   - Render as vertical stack of method-name cards, newest on top
   - Framer Motion layout animation: slide up on push, slide down + fade on pop
   - Stack depth badge: *"Stack depth: N"*
   - For recursion: highlight recursive calls with a distinct color

7. Create `src/components/visualization/RecursionVisualizer.jsx` *(optional enhancement)*
   - Show a simplified recursion tree when `stepType === "recurse"`
   - Renders call chain as indented nodes

8. Sync Monaco active line highlight:
   - `editor.deltaDecorations([], [{ range: { startLineNumber: step.line, ... }, options: { isWholeLine: true, className: 'active-execution-line' } }])`
   - Blue gutter + line background color — distinct from issue markers

9. Create execution controls bar
   - **Step description:** `steps[currentStep].description` in a prominent badge above controls
   - **Step type icon:** different icon per `stepType` (compare = ⇔, swap = ↕, call = →, return = ←, loop = ↺, assign = =)
   - **Buttons:** ⏮ Reset | ◀ Step Back | ▶ / ⏸ Play/Pause | Step Forward ▶ | ⏭ Last Step
   - **Speed control:** slider with labels 0.5× / 1× / 2× / 4×
   - **Timeline scrubber:** `<input type="range" min={0} max={steps.length - 1} value={currentStep} />`
   - **Progress label:** `Step {currentStep + 1} / {steps.length}`

10. "Explain this step" button (AI integration)
    - `POST /api/analyze` with `{ analysisType: "explain-step", stepData: currentStepData, code, language }`
    - Stream result into the AI Insights Panel

#### Key API Contract

```
POST /api/execute
Request body:
{
  code: string,            // source code to simulate
  language: string,        // "javascript" | "python" | "java" | "c" | "cpp" | "go" | etc.
  simulationInput?: string // optional e.g. "arr = [5, 3, 8, 1]"
}

Success response (200):
{
  steps: ExecutionStep[],  // see schema above
  truncated: boolean,      // true if capped at 500
  stepCount: number        // total steps in trace
}

Error response (400/500):
{
  error: string,
  message?: string
}
```

#### Deliverables After Phase 4

- [ ] Bubble sort traced: array boxes animate comparisons and swaps step by step
- [ ] Merge sort: recursive call stack grows and shrinks correctly
- [ ] Binary Search: `lo`, `hi`, `mid` update per step with active index highlighted
- [ ] Factorial / Fibonacci: call stack depth shown as animated stacked cards
- [ ] Variable panel highlights changed values between steps (yellow flash)
- [ ] Monaco highlights the currently executing line in blue
- [ ] Play / Pause / Step Forward / Step Back all work
- [ ] Timeline scrubber jumps to any step instantly
- [ ] Speed slider changes playback rate in real time
- [ ] "Explain this step" streams an AI explanation into the insight panel
- [ ] Truncation notice shown cleanly when trace > 500 steps
- [ ] Simulation works for JavaScript, Python, Java, C++ code
- [ ] Empty or non-executable code shows a clear error state
- [ ] No regressions in Phase 1–3 features

#### LLM Continuation Context
```
PROJECT: CodeInsight — Interactive AI Code Visualization Tool
PHASES COMPLETED: Phase 1, Phase 2, Phase 3, Phase 4 (Execution Simulator)
THE MAIN FEATURE IS LIVE.
WORKING:
  - Monaco editor + streaming AI review + structured issues + Monaco markers
  - AI-generated Mermaid flowcharts (all languages)
  - Step-by-step execution simulator for DSA code (all languages, AI-driven)
  - Variable panel with change highlighting
  - Call stack panel with push/pop animations
  - Array visualizer with comparison/swap animations
  - Monaco active-line sync during playback
  - Play / Pause / Step / Scrubber / Speed controls
  - "Explain this step" → streams AI explanation
EXECUTION ENDPOINT: POST /api/execute → { steps: ExecutionStep[], truncated, stepCount }
TRACE FORMAT: <trace>[...]</trace> XML block from Gemini, parsed to ExecutionStep[]
NEXT: Phase 5 — AST Engine (Slim) — basic detectors only
```

---

### ═══════════════════════════════════════════
### PHASE 5: AST Engine — Minimal & Slim  ⏳ LOW PRIORITY
### ═══════════════════════════════════════════

**Goal:** Add a lightweight AST-based layer for JavaScript — basic code quality detectors only. This is intentionally kept small and fast. No overengineering. No advanced graph analysis.

**What this is NOT:**
- No ReactFlow AST call graphs (deferred to Phase 6)
- No `astToGraph.js`
- No cyclomatic complexity deep-dive
- No advanced pattern matching

**Why keep it at all:** Basic AST detectors (console.log, == vs ===, empty catches) are fast, reliable, and complement the AI review. They appear in under 100ms while Gemini is still streaming — that's genuinely useful.

#### Features (Slim Set Only)

- `@babel/parser` for JavaScript/JSX AST generation
- Three to five lightweight detectors only:
  - `console.log` statements left in code
  - `==` instead of `===`
  - Empty catch blocks
  - Functions over 50 lines
- Simple metrics: LOC, function count, a basic complexity score
- AST issues merged into the existing Monaco markers system (same `CodeIssue` schema, source tagged `"AST"`)
- Metrics panel (small widget)

#### Architecture Decisions

- **JavaScript only:** Only Babel AST is in the stack. No Python, Java, or C parsers. AI handles other languages.
- **Instant, not comprehensive:** AST issues appear in <100ms. That's the value. Keep the detector list short.
- **No `astToGraph.js`:** Graph generation for ReactFlow is deferred. Remove this file from scope entirely for now.
- **No `nestedCallbacks.js` complexity:** Keep detectors trivially simple — each file is <30 lines.

#### AST Module Structure (Slim)

```
src/modules/ast/
├── parser.js         # parseCode(code) → AST, handle errors gracefully
├── visitor.js        # visitAST(ast, detectors) → CodeIssue[]
├── metrics.js        # getMetrics(ast) → { loc, functionCount, complexityScore }
└── detectors/
    ├── index.js          # runs all detectors, returns merged CodeIssue[]
    ├── consoleLogs.js
    ├── equalityChecks.js
    ├── emptyBlocks.js
    └── longFunctions.js
```

#### Backend Steps

1. Install `@babel/parser @babel/traverse`
2. Create `src/modules/ast/parser.js` — `parseCode(code)` → Babel AST, catch errors
3. Create `src/modules/ast/visitor.js` — `visitAST(ast, detectors)` wrapping `@babel/traverse`
4. Create the four detector files (keep each one focused and short)
5. Create `src/modules/ast/metrics.js` — LOC count, function count, simple complexity score
6. Update `src/routes/analyze.js` — for JavaScript only, run AST sync before starting SSE stream; return `{ astIssues, metrics }` in the initial POST response

#### Frontend Steps

1. Update `analysisStore.js` — add `astIssues: []`, `metrics: null`
2. Update `src/api/analyze.js` — read `astIssues` and `metrics` from POST response, dispatch to store
3. Update `IssueListPanel.jsx` — add `"AST"` / `"AI"` source badge per issue
4. Create `src/components/panels/MetricsPanel.jsx` — LOC, function count, complexity score with traffic-light color

#### Deliverables After Phase 5

- [ ] AST issues appear in <100ms for JavaScript before AI streaming begins
- [ ] Each issue shows its source (`AST` or `AI`)
- [ ] Metrics panel shows LOC, function count, complexity score
- [ ] All four detectors flag correct patterns in sample JS code
- [ ] AST parse errors are caught and shown gracefully — never crash
- [ ] No impact on non-JS analysis (Python, Java, etc. skip AST silently)

---

### ═══════════════════════════════════════════
### PHASE 6: Advanced Features  🔮 FUTURE / OPTIONAL
### ═══════════════════════════════════════════

**Goal:** Polish and extend the platform with advanced capabilities — only after Phase 4 (Execution Simulator) is solid.

**This is not a priority.** Implement only when the core experience (Phases 3 + 4) is stable, demo-ready, and genuinely impressive.

#### Possible Features (Select as Needed)

- **ReactFlow AST Call Graph** — interactive function call graph from Babel AST (JS only)
  - `astToGraph.js` → `{ nodes, edges }` in ReactFlow format
  - Node click → AI explanation in sidebar
  - Hidden tab for non-JS languages
- **Monaco Pro**
  - Hover providers — rich tooltip with full issue explanation and fix
  - Code actions (lightbulb) — "Apply Fix" inline
  - Custom dark theme matched to app design
  - `Ctrl+Shift+A` keyboard shortcut to trigger analysis
  - Language auto-detection from code content heuristics
- **Diff Viewer** — Monaco diff editor showing original vs. AI-suggested refactored code
- **Advanced Execution Simulator**
  - Tree visualization panel (for BST/heap algorithms)
  - Linked list node pointer visualization
  - Priority-2: general non-DSA code simulation
- **Advanced AST Detectors** — more sophisticated pattern detection, deeper complexity metrics

---

## SECTION 6: CROSS-CUTTING CONCERNS

### Error Handling

```
Level 1: Input validation — reject malformed or oversized requests at the route
Level 2: Business logic errors — return structured { error, message }
Level 3: AI failures — gracefully degrade (analysis continues without diagram or trace)
Level 4: Network failures — frontend SSE reconnects with exponential backoff (max 3 retries)
Level 5: Unhandled errors — React ErrorBoundary in UI, global 500 handler in Express
```

### Environment Variables

```bash
# backend/.env
GEMINI_API_KEY=your_key_here
PORT=3001
NODE_ENV=development

# frontend/.env
VITE_API_URL=http://localhost:3001
```

### Known Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Gemini rate limits | High | Debounce analysis trigger (800ms); rate-limit middleware on AI endpoints |
| Gemini trace inaccuracy for complex code | Medium | Scope simulator to well-known DSA patterns; show disclaimer; validate step count |
| AI returns malformed trace JSON | Medium | Parse defensively in `traceExtractor.js`; drop bad steps, never crash; show partial trace |
| AI returns malformed Mermaid | Low | Wrap `mermaid.render()` in try/catch; show raw text fallback |
| AI returns malformed JSON issues | Medium | Parse defensively; fall back to text-only mode, never crash |
| Monaco bundle size | Medium | Lazy-load Monaco with dynamic `import()` on first editor mount |
| SSE connection drops | Low | Frontend reconnection with exponential backoff |
| Large code files slow analysis | Medium | Truncate input to 8,000 tokens before sending to Gemini |
| Simulation trace > 500 steps | Low | Hard cap at 500 with a clean truncation notice in the UI |
| Non-DSA code yields inaccurate trace | Medium | Prompt includes a disclaimer; UI shows "Best results with DSA algorithms" |

---

## SECTION 7: KEY CODE PATTERNS

### SSE Endpoint Pattern
```javascript
// backend/src/routes/stream.js
// NOTE: No diagram logic here. Diagram is on-demand via POST /api/diagram.
router.get('/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = await geminiClient.streamAnalysis(req.query.code, req.query.language);
    let fullText = '';
    for await (const chunk of stream) {
      const token = chunk.text();
      fullText += token;
      sendEvent('token', { text: token });
    }
    const issues = issueParser.extract(fullText);
    sendEvent('issues', issues);
    sendEvent('complete', { done: true });
  } catch (error) {
    sendEvent('error', { message: 'Analysis failed' });
  } finally {
    res.end();
  }
});
```

### On-Demand Diagram Endpoint Pattern
```javascript
// backend/src/routes/diagram.js
router.post('/', async (req, res) => {
  const { code, language } = req.body;
  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }
  try {
    const mermaid = await mermaidGenerator.generateDiagram(code, language);
    res.json({ mermaid }); // string | null
  } catch (err) {
    res.status(500).json({ error: 'Diagram generation failed', message: err.message });
  }
});
```

### SSE Client Pattern
```javascript
// frontend/src/api/stream.js

/**
 * @param {string} code
 * @param {string} language
 * @param {{ onToken, onIssues, onComplete, onError }} callbacks
 * @returns {() => void} cleanup function
 */
export function createAnalysisStream(code, language, { onToken, onIssues, onComplete, onError }) {
  const url = `${API_URL}/analyze/stream?code=${encodeURIComponent(code)}&language=${language}`;
  const es = new EventSource(url);

  es.addEventListener('token',    (e) => onToken(JSON.parse(e.data).text));
  es.addEventListener('issues',   (e) => onIssues(JSON.parse(e.data)));
  es.addEventListener('complete', ()  => { onComplete(); es.close(); });
  es.addEventListener('error',    (e) => { onError(e); es.close(); });

  return () => es.close();
  // NOTE: No 'diagram' event — diagram is fetched separately via POST /api/diagram on button click
}
```

### Diagram API Client Pattern
```javascript
// frontend/src/api/diagram.js

/**
 * @param {string} code
 * @param {string} language
 * @returns {Promise<{ mermaid: string | null }>}
 */
export async function fetchDiagram(code, language) {
  const res = await fetch(`${API_URL}/diagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Diagram generation failed');
  }
  return res.json(); // { mermaid: string | null }
}
```

### Execution Trace Extractor Pattern
```javascript
// backend/src/modules/execution/traceExtractor.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSimulationPrompt } from './tracePrompt.js';
import { enrichSteps } from './stepEnricher.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @param {string} code
 * @param {string} language
 * @param {string} [simulationInput]
 * @returns {Promise<{ steps: ExecutionStep[], truncated: boolean, stepCount: number }>}
 */
export async function generateTrace(code, language, simulationInput = '') {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = buildSimulationPrompt(code, language, simulationInput);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const match = responseText.match(/<trace>([\s\S]*?)<\/trace>/);
  if (!match) throw new Error('Gemini did not return a <trace> block');

  let steps;
  try {
    steps = JSON.parse(match[1]);
  } catch {
    throw new Error('Trace JSON could not be parsed');
  }

  // Drop steps missing required fields
  const valid = steps.filter(
    (s) => typeof s.stepIndex === 'number'
        && typeof s.line === 'number'
        && s.methodName
        && s.variables
        && s.callStack
        && s.description
  );

  const truncated = valid.length >= 500;
  const capped = valid.slice(0, 500);

  return { steps: enrichSteps(capped), truncated, stepCount: capped.length };
}
```

### Step Enricher Pattern
```javascript
// backend/src/modules/execution/stepEnricher.js

/**
 * Adds changedVariables diff to each step by comparing with the previous step.
 * @param {ExecutionStep[]} steps
 * @returns {ExecutionStep[]}
 */
export function enrichSteps(steps) {
  return steps.map((step, i) => {
    if (i === 0) return { ...step, changedVariables: Object.keys(step.variables) };
    const prev = steps[i - 1].variables;
    const curr = step.variables;
    const changed = Object.keys(curr).filter(
      (k) => JSON.stringify(curr[k]) !== JSON.stringify(prev[k])
    );
    return { ...step, changedVariables: changed };
  });
}
```

### Zustand Store Pattern (Updated)
```javascript
// frontend/src/store/analysisStore.js
import { create } from 'zustand';

export const useAnalysisStore = create((set) => ({
  // Phase 1 + 2
  insights: '',
  aiIssues: [],
  isStreaming: false,

  // Phase 3 — diagram is on-demand, not tied to the analyze stream
  diagram: null,            // Mermaid string | null
  isDiagramLoading: false,
  diagramError: null,

  // Phase 5 (AST slim)
  astIssues: [],
  metrics: null,

  appendInsight:      (text)    => set((s) => ({ insights: s.insights + text })),
  setAiIssues:        (issues)  => set({ aiIssues: issues }),
  setDiagram:         (diagram) => set({ diagram, isDiagramLoading: false, diagramError: null }),
  setDiagramLoading:  (v)       => set({ isDiagramLoading: v, diagramError: null }),
  setDiagramError:    (msg)     => set({ diagramError: msg, isDiagramLoading: false }),
  setAstIssues:       (issues)  => set({ astIssues: issues }),
  setMetrics:         (metrics) => set({ metrics }),
  setStreaming:        (v)       => set({ isStreaming: v }),
  reset: () => set({
    insights: '', aiIssues: [], diagram: null,
    isDiagramLoading: false, diagramError: null,
    astIssues: [], metrics: null, isStreaming: false
  }),
}));
```

---

## SECTION 8: LLM SESSION CONTINUATION PROTOCOL

When starting a new LLM session to continue this project, use this template:

```
I am building CodeInsight — an Interactive AI Code Visualization Tool.

Here is my project roadmap: [paste this document]

CURRENT STATUS:
- Phase 1 (Foundation): DONE
- Phase 2 (Issue System): DONE
- Phase 3 (Mermaid Visualization): [DONE / IN PROGRESS / NOT STARTED]
- Phase 4 (Execution Simulator): [DONE / IN PROGRESS / NOT STARTED]

Current working state:
- [Brief description of what is working]
- [Any issues or blockers encountered]

I want to work on Phase [3 / 4 / 5]: [Phase Name]

Please review the phase specification in the roadmap and guide me through
the implementation step by step. Start with the backend steps.
```

---

*Document Version: 2.0 — Restructured*
*Project: CodeInsight — Interactive AI Code Visualization Tool*
*Priority: Visualization Engine (Phase 3) → Execution Simulator (Phase 4) → AST Slim (Phase 5)*
*For LLM-portable solo development workflow*
