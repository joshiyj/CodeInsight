// src/components/layout/AppLayout.jsx
import { useCallback, useRef, useState } from 'react';
import { useEditorStore }        from '../../store/editorStore.js';
import { useAnalysisStore }      from '../../store/analysisStore.js';
import { createAnalysisStream }  from '../../api/stream.js';
import CodeEditor                from '../editor/CodeEditor.jsx';
import AIInsightsPanel           from '../panels/AIInsightsPanel.jsx';
import IssueListPanel            from '../panels/IssueListPanel.jsx';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python'     },
  { value: 'java',       label: 'Java'       },
  { value: 'c',          label: 'C'          },
  { value: 'cpp',        label: 'C++'        },
];

export default function AppLayout() {
  const { code, language, isAnalyzing, setLanguage, setIsAnalyzing } = useEditorStore();
  const { issues, appendInsight, setIssues, setIsStreaming, setError, reset } = useAnalysisStore();

  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'issues'
  const cleanupRef = useRef(null);

  const handleAnalyze = useCallback(() => {
    if (isAnalyzing) return;
    cleanupRef.current?.();
    reset();
    setIsAnalyzing(true);
    setIsStreaming(true);
    setActiveTab('insights'); // switch to insights when analysis starts

    cleanupRef.current = createAnalysisStream(code, language, {
      onToken:    (text) => appendInsight(text),
      onIssues:   (list) => setIssues(list),
      onComplete: ()     => { setIsAnalyzing(false); setIsStreaming(false); },
      onError:    ()     => {
        setError('Connection error — check the backend is running and your API key is valid.');
        setIsAnalyzing(false);
        setIsStreaming(false);
      },
    });
  }, [code, language, isAnalyzing, reset, appendInsight, setIssues, setIsAnalyzing, setIsStreaming, setError]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-indigo-400 text-lg">⚡</span>
          <span className="font-bold text-base tracking-tight text-white">CodeInsight</span>
        </div>

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5
                     focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                     disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed
                     text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-150"
        >
          {isAnalyzing
            ? <><span className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-white rounded-full animate-spin" /> Analyzing…</>
            : '✦ Analyze'
          }
        </button>
      </header>

      {/* ── Body: 2-column ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Code Editor (takes all remaining space) ──── */}
        <div className="flex-1 p-3 overflow-hidden min-w-0">
          <CodeEditor />
        </div>

        {/* ── Divider ──────────────────────────────────────────  */}
        <div className="w-px bg-zinc-800 shrink-0" />

        {/* ── Right: Tabbed Panel (fixed width) ────────────────  */}
        <div className="w-[420px] shrink-0 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-center border-b border-zinc-800 shrink-0 px-1 pt-1">
            <TabButton
              label="AI Insights"
              active={activeTab === 'insights'}
              onClick={() => setActiveTab('insights')}
              dot={isAnalyzing}
            />
            <TabButton
              label="Issues"
              active={activeTab === 'issues'}
              onClick={() => setActiveTab('issues')}
              badge={issues.length > 0 ? issues.length : null}
              badgeColor={issues.some(i => i.severity === 'error') ? 'bg-red-500' : 'bg-yellow-500'}
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'insights'
              ? <AIInsightsPanel />
              : <IssueListPanel  />
            }
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Tab Button ──────────────────────────────────────────────── */
function TabButton({ label, active, onClick, badge, badgeColor, dot }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150
                  border-b-2 -mb-px
                  ${active
                    ? 'text-white border-indigo-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
    >
      {label}

      {/* Pulsing dot for streaming */}
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      )}

      {/* Issue count badge */}
      {badge != null && (
        <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-px rounded-full min-w-[18px] text-center`}>
          {badge}
        </span>
      )}
    </button>
  );
}