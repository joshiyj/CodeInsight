// src/components/editor/CodeEditor.jsx
import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore }   from '../../store/editorStore.js';
import { useAnalysisStore, registerMarkerCleaner } from '../../store/analysisStore.js';
import { detectLanguage }   from '../../utils/codeDetector.js';

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
  s.textContent = `.ci-line-highlight { background: rgba(99,102,241,0.15); border-left: 2px solid rgba(99,102,241,0.7); }`;
  document.head.appendChild(s);
}

export default function CodeEditor() {
  const { code, language, setCode, setLanguage } = useEditorStore();
  const { issues, selectedIssue }                = useAnalysisStore();
  const editorRef      = useRef(null);
  const monacoRef      = useRef(null);
  const decorationsRef = useRef([]);

  // ── Toast state for detection notification ────────────────
  const toastRef      = useRef(null);
  const toastTimerRef = useRef(null);

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

  // ── Line highlight on issue select ────────────────────────
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
    <div className="h-full w-full rounded-lg overflow-hidden border border-zinc-700">
      <Editor
        height="100%"
        language={MONACO_LANGUAGE_MAP[language] ?? 'javascript'}
        value={code}
        onChange={(val) => setCode(val ?? '')}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          fontSize:             14,
          fontFamily:           '"Fira Code", "Cascadia Code", monospace',
          fontLigatures:        true,
          minimap:              { enabled: false },
          scrollBeyondLastLine: false,
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
  );
}