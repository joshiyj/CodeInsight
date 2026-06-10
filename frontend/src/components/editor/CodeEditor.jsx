// src/components/editor/CodeEditor.jsx
import { useRef, useEffect, useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore }      from '../../store/editorStore.js';
import { useAnalysisStore, registerMarkerCleaner } from '../../store/analysisStore.js';
import { useExecutionStore }   from '../../store/executionStore.js';
import { detectLanguage }      from '../../utils/codeDetector.js';

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python:     'python',
  java:       'java',
  c:          'c',
  cpp:        'cpp',
};

const MarkerSeverity = { Hint: 1, Info: 2, Warning: 4, Error: 8 };
const SEVERITY_MAP   = { error: 8, warning: 4, info: 2, hint: 1 };

const STYLE_ID = 'codeinsight-line-highlight';
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  // Indigo: issue highlight (fades). Amber: simulation step highlight (persistent).
  s.textContent = [
    `.ci-line-highlight { background: rgba(99,102,241,0.15); border-left: 2px solid rgba(99,102,241,0.7); }`,
    `.ci-sim-highlight   { background: rgba(251,191,36,0.12); border-left: 3px solid rgba(251,191,36,0.85); }`,
    `.ci-sim-glyph::before { content: '▶'; color: rgba(251,191,36,0.9); font-size: 11px; margin-left: 4px; }`,
  ].join('\n');
  document.head.appendChild(s);
}

function getFileIcon(lang) {
  switch (lang) {
    case 'javascript':
      return (
        <span className="text-yellow-500 font-bold font-mono text-[9px] bg-yellow-500/10 border border-yellow-500/25 px-1 py-0.5 rounded leading-none select-none">JS</span>
      );
    case 'python':
      return (
        <span className="text-sky-450 font-bold font-mono text-[9px] bg-sky-500/10 border border-sky-500/25 px-1 py-0.5 rounded leading-none select-none">PY</span>
      );
    case 'java':
      return (
        <span className="text-orange-450 font-bold font-mono text-[9px] bg-orange-500/10 border border-orange-500/25 px-1 py-0.5 rounded leading-none select-none">JV</span>
      );
    case 'c':
      return (
        <span className="text-blue-400 font-bold font-mono text-[9px] bg-blue-500/10 border border-blue-500/25 px-1 py-0.5 rounded leading-none select-none">C</span>
      );
    case 'cpp':
      return (
        <span className="text-indigo-400 font-bold font-mono text-[9px] bg-indigo-500/10 border border-indigo-500/25 px-1 py-0.5 rounded leading-none select-none">C++</span>
      );
    default:
      return (
        <span className="text-zinc-400 font-bold font-mono text-[9px] bg-zinc-500/10 border border-zinc-500/25 px-1 py-0.5 rounded leading-none select-none">TXT</span>
      );
  }
}

function getFileName(lang) {
  switch (lang) {
    case 'javascript': return 'index.js';
    case 'python':     return 'main.py';
    case 'java':       return 'Main.java';
    case 'c':          return 'main.c';
    case 'cpp':        return 'main.cpp';
    default:           return 'scratch.txt';
  }
}

export default function CodeEditor() {
  const { code, language, setCode, setLanguage } = useEditorStore();
  const { issues, selectedIssue }                = useAnalysisStore();
  const { simulationLine }                       = useExecutionStore();
  const editorRef      = useRef(null);
  const monacoRef      = useRef(null);
  const decorationsRef = useRef([]);    // issue/AI decorations
  const simDecoRef     = useRef([]);    // simulation step decoration

  // ── Toast state for detection notification ────────────────
  const toastRef      = useRef(null);
  const toastTimerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Monitor screen size for mobile font adjustment
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = useCallback((lang) => {
    // Remove previous toast
    toastRef.current?.remove();
    clearTimeout(toastTimerRef.current);

    const el = document.createElement('div');
    el.textContent = `Detected: ${lang}`;
    el.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #3730a3; color: #e0e7ff;
      font-size: 12px; font-family: 'Fira Code', monospace;
      padding: 6px 16px; border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 9999; pointer-events: none;
      animation: ci-toast-in 0.2s ease;
    `;

    // Inject keyframe once
    if (!document.getElementById('ci-toast-style')) {
      const ks = document.createElement('style');
      ks.id = 'ci-toast-style';
      ks.textContent = `@keyframes ci-toast-in { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`;
      document.head.appendChild(ks);
    }

    document.body.appendChild(el);
    toastRef.current = el;

    toastTimerRef.current = setTimeout(() => {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity    = '0';
      setTimeout(() => el.remove(), 300);
    }, 2000);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // ── Monaco markers ────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    monaco.editor.setModelMarkers(model, 'codeinsight', issues.map((issue) => ({
      severity:        SEVERITY_MAP[issue.severity] ?? MarkerSeverity.Warning,
      startLineNumber: issue.line,
      startColumn:     Math.max(1, issue.column || 1),
      endLineNumber:   issue.line,
      endColumn:       999,
      message:         `[${issue.category}] ${issue.message}`,
      source:          'CodeInsight AI',
    })));
  }, [issues]);

  // ── Line highlight on issue select (indigo, fades after 1.5 s) ────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !selectedIssue) return;

    const line = selectedIssue.line;
    editor.revealLineInCenter(line, 0);
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      { range: new monaco.Range(line, 1, line, 1), options: { isWholeLine: true, className: 'ci-line-highlight' } },
    ]);
    const t = setTimeout(() => {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }, 1500);
    return () => clearTimeout(t);
  }, [selectedIssue]);

  // ── Simulation step highlight (amber, persistent while simulator is active) ───
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clear previous sim decoration regardless
    if (editor && monaco) {
      simDecoRef.current = editor.deltaDecorations(simDecoRef.current, []);
    }

    if (!editor || !monaco || simulationLine == null) return;

    // Scroll the active simulation line into view smoothly
    editor.revealLineInCenterIfOutsideViewport(simulationLine, 0);

    // Apply a persistent amber highlight + gutter arrow glyph
    simDecoRef.current = editor.deltaDecorations(simDecoRef.current, [
      {
        range: new monaco.Range(simulationLine, 1, simulationLine, 1),
        options: {
          isWholeLine:       true,
          className:         'ci-sim-highlight',
          glyphMarginClassName: 'ci-sim-glyph',
        },
      },
    ]);
  }, [simulationLine]);

  // ── Language detection on paste ───────────────────────────
  function handleEditorDidMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;

    // ── Register global marker cleaner ────────────────────
    registerMarkerCleaner(() => {
      const model = editor.getModel();
      if (model) monaco.editor.setModelMarkers(model, 'codeinsight', []);
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    });

    editor.onDidPaste(() => {
      setTimeout(() => {
        const content = editor.getValue();

        // Clear markers and decorations on paste
        const model = editor.getModel();
        if (model) monaco.editor.setModelMarkers(model, 'codeinsight', []);
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

        const result = detectLanguage(content);
        if (result && result.language !== useEditorStore.getState().language) {
          setLanguage(result.language);
          showToast(result.language);
        }
      }, 0);
    });
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col shadow-2xl">
      {/* Editor Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 select-none shrink-0 h-11">
        <div className="flex items-center gap-2">
          {getFileIcon(language)}
          <span className="text-[12px] font-semibold text-zinc-300 font-mono">
            {getFileName(language)}
          </span>
        </div>
        
        {/* Right status panel */}
        <div className="flex items-center gap-3">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800/85 bg-zinc-900/40 hover:bg-zinc-800/65 hover:border-zinc-700 text-[10.5px] font-semibold text-zinc-400 hover:text-zinc-200 transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
            title="Copy entire code buffer"
          >
            {copied ? (
              <>
                <svg className="w-3 h-3 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span className="font-medium">Copy</span>
              </>
            )}
          </button>
          
          <span className="text-[10px] font-mono font-medium text-zinc-500">
            {code.length} chars
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Editor active" />
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 min-h-0 relative">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[language] ?? 'javascript'}
          value={code}
          onChange={(val) => setCode(val ?? '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            fontSize:             isMobile ? 11 : 14,
            fontFamily:           '"Fira Code", "Cascadia Code", monospace',
            fontLigatures:        true,
            minimap:              { enabled: false },
            scrollBeyondLastLine: false,
            glyphMargin:          true,   // required for the simulation ▶ gutter arrow
            lineNumbers:          'on',
            renderLineHighlight:  'all',
            padding:              { top: 12, bottom: 12 },
            smoothScrolling:      true,
            cursorBlinking:       'smooth',
            tabSize:              2,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-zinc-900 text-zinc-400 text-sm">
              Loading editor…
            </div>
          }
        />
      </div>
    </div>
  );
}