# CodeInsight — Project Context & Architecture Reference

This document provides a complete context of the **CodeInsight** project, mapping the architecture, codebase file-by-file, data flows, API contracts, and roadmap status. It is optimized to serve as a portable context file for LLMs (like Claude) to seamlessly understand the codebase and resume development.

---

## ⚡ Project Overview
**CodeInsight** is an interactive, developer-centric tool designed to:
1. **Analyze Code Snippets:** Run real-time AI code reviews streaming via Server-Sent Events (SSE).
2. **Flag Inline Issues:** Embed Monaco Editor featuring language detection, line markers (errors, warnings, hints), and scroll-to-line integration.
3. **Generate Flowcharts:** Produce on-demand, interactive control-flow diagrams utilizing Mermaid.js.
4. **Simulate Execution (Upcoming Phase 4):** Play, pause, and step through DSA algorithms, tracking variable values and call stacks in real time.

---

## 🛠️ Technology Stack
* **Frontend:** React 18, Vite, TailwindCSS, Monaco Editor (`@monaco-editor/react`), Zustand (state management), Mermaid.js, Framer Motion, and React-Markdown.
* **Backend:** Node.js (ES Modules), Express, Groq Cloud API SDK (`llama-3.3-70b-versatile` for code reviews; `llama-3.1-8b-instant` for diagrams).
* **API Flow:** Native REST + SSE (Server-Sent Events) for real-time text and structured JSON parsing.

---

## 📂 Directory Structure
```text
CodeInsight/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment variables & configuration
│   │   │   └── index.js
│   │   ├── middleware/         # Custom Express middlewares
│   │   │   └── errorHandler.js
│   │   ├── modules/
│   │   │   ├── ai/             # Groq SDK configuration and prompt templates
│   │   │   │   ├── groqClient.js
│   │   │   │   ├── promptManager.js
│   │   │   │   └── promptTemplates/
│   │   │   │       └── diagram.js
│   │   │   ├── analysis/       # Code issues parsing & sanitization
│   │   │   │   └── issueParser.js
│   │   │   └── visualization/  # Mermaid control graph generator
│   │   │       └── mermaidGenerator.js
│   │   ├── routes/             # REST / SSE endpoints
│   │   │   ├── analyze.js      # Validator middleware
│   │   │   ├── diagram.js      # Diagram generator route
│   │   │   └── stream.js       # SSE streaming review route
│   │   └── server.js           # Server initialization and middleware setups
│   ├── .env                    # PORT & GROQ_API_KEY
│   └── package.json
│
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # API communication layers
│   │   │   ├── client.js       # Base API URL
│   │   │   ├── diagram.js      # REST Diagram triggers
│   │   │   └── stream.js       # SSE stream handler
│   │   ├── components/
│   │   │   ├── editor/         # Monaco Editor wrapper
│   │   │   │   └── CodeEditor.jsx
│   │   │   ├── layout/         # Header and side panel splitter
│   │   │   │   └── AppLayout.jsx
│   │   │   ├── panels/         # Tab panels for Insights & Issues
│   │   │   │   ├── AIInsightsPanel.jsx
│   │   │   │   └── IssueListPanel.jsx
│   │   │   └── visualization/  # Tab panel for Mermaid Flowcharts
│   │   │       ├── DiagramPanel.jsx
│   │   │       └── MermaidDiagram.jsx
│   │   ├── store/              # Zustand global stores
│   │   │   ├── analysisStore.js
│   │   │   └── editorStore.js
│   │   ├── utils/              # Language auto-detect logic
│   │   │   └── codeDetector.js
│   │   ├── index.css           # Styling directives
│   │   ├── main.jsx            # Entry point & Mermaid configuration
│   │   └── App.jsx
│   ├── .env                    # VITE_API_URL
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
```

---

## 🔌 API Endpoints & Core Data Flow

### 1. `GET /api/analyze/stream`
* **Purpose:** Streams a code review (Markdown summary) and issues list (JSON format).
* **Query Parameters:** `code` (string), `language` (string).
* **Protocol:** Server-Sent Events (SSE).
* **Events Emitted:**
  * `token`: Emits Markdown text chunks representing the Overview, Complexity, Strengths, and Recommendations sections.
  * `issues`: Emits a structured JSON array containing details of code bugs, security issues, performance warnings, and hints.
  * `complete`: Marks the end of execution and returns the total issue count.
  * `error`: Returns custom error JSON objects (e.g., rate limits, invalid keys).

### 2. `POST /api/diagram`
* **Purpose:** Generates a control-flow flowchart in Mermaid syntax.
* **Payload:** `{ code: string, language: string }`.
* **Response:** `{ mermaid: string | null }`. Returns `null` if the code snippet is too simple/trivial.

---

## 🏗️ Core Architecture & State Management

### Zustand Stores
Zustand is utilized for decoupled state updates between Monaco and the side panels.
1. **`editorStore.js`:** Tracks editor value (`code`), currently selected `language` (supports `javascript`, `python`, `java`, `c`, `cpp`), and `isAnalyzing`.
2. **`analysisStore.js`:** Tracks review status:
   * `insights` (Markdown string accumulators).
   * `issues` (structured array).
   * `diagram` (Mermaid code).
   * `selectedIssue` (handles scrolling Monaco editor dynamically to line numbers).
   * `reset()` method which coordinates clearing Monaco markers and state variables.

---

## 📝 Key Code References

### 1. The SSE Issue-Splicing Mechanism (`backend/src/routes/stream.js`)
To prevent structured JSON from polluting the streamed markdown view, the backend employs a look-ahead buffer. It holds back token emissions once it spots the `<issues>` tag, routing the subsequent text strictly to the `parseIssues` module.
```javascript
let fullText = '';
let sentUpTo = 0;
const ISSUES_TAG = '<issues>';
const LOOKAHEAD = ISSUES_TAG.length;

for await (const chunk of stream) {
  const text = chunk.choices?.[0]?.delta?.content;
  if (!text) continue;
  fullText += text;

  const issuesStart = fullText.indexOf(ISSUES_TAG);
  if (issuesStart === -1) {
    // Hold back LOOKAHEAD chars to avoid partial-tag leaks
    const safeUpTo = Math.max(sentUpTo, fullText.length - LOOKAHEAD);
    if (sentUpTo < safeUpTo) {
      send('token', { text: fullText.slice(sentUpTo, safeUpTo) });
      sentUpTo = safeUpTo;
    }
  } else if (sentUpTo < issuesStart) {
    // Flush display portion cleanly and stop emitting tokens
    send('token', { text: fullText.slice(sentUpTo, issuesStart) });
    sentUpTo = issuesStart;
  }
}
```

### 2. Monaco Editor Marker Cleanup and Register (`frontend/src/store/analysisStore.js`)
Since Monaco instance refs aren't kept directly inside state variables, a module-level registration handler allows the `CodeEditor` to register a marker cleanup callback triggered whenever a new analysis is initiated:
```javascript
let _clearMarkersCallback = null;
export function registerMarkerCleaner(fn) {
  _clearMarkersCallback = fn;
}

// Inside useAnalysisStore:
reset: () => {
  _clearMarkersCallback?.();
  set({ insights: '', issues: [], diagram: null, ... });
}
```

### 3. Canvas-Based Diagram Export (`frontend/src/components/visualization/DiagramPanel.jsx`)
To export clean SVG diagrams as PNG without server overhead, the frontend clones the rendered SVG node, appends an explicit size and dark background (`#0f0f17`), creates an HTML canvas scaled by `2x` for crisp lines, translates the SVG content into a base64 DataURI, and draws it on canvas:
```javascript
const svgString = new XMLSerializer().serializeToString(cloned);
const SCALE = 2;
const canvas = document.createElement('canvas');
canvas.width = w * SCALE;
canvas.height = h * SCALE;
const ctx = canvas.getContext('2d');
ctx.scale(SCALE, SCALE);

const base64 = btoa(unescape(encodeURIComponent(svgString)));
const dataUri = `data:image/svg+xml;base64,${base64}`;
const img = new Image();
img.onload = () => {
  ctx.drawImage(img, 0, 0, w, h);
  const a = document.createElement('a');
  a.download = 'diagram.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
};
```

---

## 🔮 Roadmap & Next Objectives

### Status Table
| Phase | Feature | Status |
|---|---|---|
| **Phase 1** | Foundation (Monaco + streaming AI review) | ✅ COMPLETED |
| **Phase 2** | Issue System (structured json parser + inline markers) | ✅ COMPLETED |
| **Phase 3** | Simplified Visualization (on-demand Mermaid diagrams) | ✅ COMPLETED |
| **Phase 4** | **Execution Simulator Core (DSA algorithm stepper)** | 🔜 **NEXT** |
| **Phase 5** | AST Engine (Slim syntax analyzer for JS/TS) | ⏳ LATER |

---

## 🚀 Step-by-Step Implementation Guide for Phase 4 (Execution Simulator Core)

The next priority is **Phase 4: Execution Simulator Core**. Below are the specifications and steps required to build it.

### 1. Objective
Enable step-by-step playback of Data Structures and Algorithms (sorting, binary search, recursion, trees) where users can play, pause, step forward/backward, and watch the variables, call stacks, and current active lines update in real time.
* **Important:** Execution simulation must be **AI-driven** via Gemini on the backend. No server-side sandbox environments (like running `node` or `javac` subprocesses) are required. This ensures safety and simplicity.

### 2. Execution Step Schema
The simulation endpoint must return an array of the following structure:
```typescript
interface ExecutionStep {
  stepIndex: number;               // 0-based index
  line: number;                    // 1-based line number in source code
  methodName: string;              // currently active function
  variables: Record<string, any>;  // current values of in-scope variables
  callStack: string[];             // execution stack, bottom to top (e.g. ["main", "mergeSort"])
  description: string;             // human description of what happens at this step
  highlightIndices?: number[];    // array indices (optional) to highlight in visualizers
  stepType?: "compare" | "swap" | "assign" | "call" | "return" | "loop" | "recurse";
  changedVariables?: string[];     // keys of variables changed since previous step (added on server)
}
```

### 3. Backend Implementation Tasks
1. **Prompt Template (`backend/src/modules/execution/tracePrompt.js`):**
   * Write a system prompt that directs the model to behave as an exact, step-by-step execution tracer.
   * Direct the model to output **ONLY** valid JSON arrays wrapped inside `<trace>[...]</trace>` tags.
   * Impose a hard cap of 500 steps to keep payloads lightweight.
2. **Trace Engine (`backend/src/modules/execution/traceExtractor.js`):**
   * Create `generateTrace(code, language, simulationInput)` that queries Gemini.
   * Extract the `<trace>` tag, sanitizes markdown formatting, and runs `JSON.parse()`.
3. **Step Enricher (`backend/src/modules/execution/stepEnricher.js`):**
   * Loop through steps and compare the `variables` key-value pairs between step `i` and `i-1`.
   * Inject a `changedVariables: string[]` property containing changed keys.
4. **Execution Router (`backend/src/routes/execute.js`):**
   * Expose `POST /api/execute` accepting `{ code, language, simulationInput }`.
   * Mount it in `server.js` at `app.use('/api/execute', executeRouter)`.

### 4. Frontend Implementation Tasks
1. **State Hook (`frontend/src/hooks/useExecution.js`):**
   * Expose state variables: `steps`, `currentStep`, `isPlaying`, `speed`, `isLoading`, and `error`.
   * Expose actions: `simulate(code, language, input)`, `play()`, `pause()`, `stepForward()`, `stepBack()`, `scrubTo(index)`, and `reset()`.
2. **Visual Components (`frontend/src/components/visualization/...`):**
   * `ExecutionSimulator.jsx`: Main simulator controller. Holds input, controls, and subpanels.
   * `VariablePanel.jsx`: Monospace labels showing active variables. Add a visual flash effect when variables are in `changedVariables`.
   * `ArrayVisualizer.jsx`: Displays arrays as horizontal boxes. Highlights boxes if their indices are in `highlightIndices` (e.g., swapping items in bubble sort).
   * `CallStackPanel.jsx`: Renders the call stack vertically, animating item push/pop.
3. **Monaco Synced Highlight:**
   * During step playbacks, sync Monaco's active line with `steps[currentStep].line` using Monaco's `deltaDecorations` (use a distinct color theme class like `active-execution-line`).
4. **Scrubber Controls:**
   * A playback control bar containing play/pause, step backward, step forward, a speed multiplier slider (e.g. 0.5x, 1x, 2x), and a timeline range slider (`input type="range"`).
