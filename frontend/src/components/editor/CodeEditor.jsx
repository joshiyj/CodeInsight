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

const SEVERITY_TO_MONACO = {
  error:   4,   // monaco.MarkerSeverity.Error
  warning: 8,   // monaco.MarkerSeverity.Warning (wrong — see below)
  info:    2,   // monaco.MarkerSeverity.Info
  hint:    1,   // monaco.MarkerSeverity.Hint
};

// Monaco MarkerSeverity enum values
const MarkerSeverity = { Hint: 1, Info: 2, Warning: 4, Error: 8 };

const SEVERITY_MAP = {
  error:   MarkerSeverity.Error,
  warning: MarkerSeverity.Warning,
  info:    MarkerSeverity.Info,
  hint:    MarkerSeverity.Hint,
};

export default function CodeEditor() {
  const { code, language, setCode } = useEditorStore();
  const { issues }                  = useAnalysisStore();
  const editorRef                   = useRef(null);
  const monacoRef                   = useRef(null);

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
      startColumn:     issue.column ?? 1,
      endLineNumber:   issue.endLine ?? issue.line,
      endColumn:       issue.column ? issue.column + 999 : 999,  // highlight full line
      message:         `[${issue.category}] ${issue.message}`,
      source:          'CodeInsight AI',
    }));

    monaco.editor.setModelMarkers(model, 'codeinsight', markers);
  }, [issues]);

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