// src/components/editor/CodeEditor.jsx
import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore }   from '../../store/editorStore.js';
import { useAnalysisStore } from '../../store/analysisStore.js';

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python:     'python',
  java:       'java',
  c:          'c',
  cpp:        'cpp',
};

// Monaco MarkerSeverity enum values
const MarkerSeverity = { Hint: 1, Info: 2, Warning: 4, Error: 8 };

const SEVERITY_MAP = {
  error:   MarkerSeverity.Error,
  warning: MarkerSeverity.Warning,
  info:    MarkerSeverity.Info,
  hint:    MarkerSeverity.Hint,
};

// Inject the highlight class once — no external CSS file needed
const STYLE_ID = 'codeinsight-line-highlight';
if (!document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .ci-line-highlight {
      background: rgba(99, 102, 241, 0.15);
      border-left: 2px solid rgba(99, 102, 241, 0.7);
    }
  `;
  document.head.appendChild(style);
}

export default function CodeEditor() {
  const { code, language, setCode } = useEditorStore();
  const { issues, selectedIssue }   = useAnalysisStore();
  const editorRef                   = useRef(null);
  const monacoRef                   = useRef(null);
  const decorationsRef              = useRef([]);   // track active decorations so we can clear them

  // ── Apply markers whenever issues change ──────────────────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const model = editor.getModel();
    if (!model) return;

    const markers = issues.map((issue) => ({
      severity:        SEVERITY_MAP[issue.severity] ?? MarkerSeverity.Warning,
      startLineNumber: issue.line,
      startColumn:     Math.max(1, issue.column || 1),
      endLineNumber:   issue.line, // force it to only underline the single line
      endColumn:       999,        // highlight to the end of that single line
      message:         `[${issue.category}] ${issue.message}`,
      source:          'CodeInsight AI',
    }));

    monaco.editor.setModelMarkers(model, 'codeinsight', markers);
  }, [issues]);

  // ── Scroll + flash highlight when an issue is selected ────
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !selectedIssue) return;

    const line = selectedIssue.line;

    // Scroll that line to the center of the viewport
    editor.revealLineInCenter(line, 0 /* Immediate */);

    // Clear any previous highlight decoration
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine:   true,
          className:     'ci-line-highlight',
        },
      },
    ]);

    // Remove the highlight after 1.5 s
    const timer = setTimeout(() => {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedIssue]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
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