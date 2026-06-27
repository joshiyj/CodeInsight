// src/components/layout/AppLayout.jsx
import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditorStore }        from '../../store/editorStore.js';
import { useAnalysisStore }      from '../../store/analysisStore.js';
import { createAnalysisStream }  from '../../api/stream.js';
import CodeEditor                from '../editor/CodeEditor.jsx';
import AIInsightsPanel           from '../panels/AIInsightsPanel.jsx';
import IssueListPanel            from '../panels/IssueListPanel.jsx';
import DiagramPanel              from '../visualization/DiagramPanel.jsx';
import ExecutionSimulator from '../visualization/ExecutionSimulator.jsx';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python',     label: 'Python'     },
  { value: 'java',       label: 'Java'       },
  { value: 'c',          label: 'C'          },
  { value: 'cpp',        label: 'C++'        },
];

const SparklesIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.187L15 15l-5.187.813zM18 10.5l-.5-3.5-3.5-.5.5-3.5 3.5.5.5 3.5-3.5.5z" />
  </svg>
);

const IssuesIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const DiagramIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const SimulateIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function AppLayout() {
  const { code, language, isAnalyzing, setLanguage, setIsAnalyzing } = useEditorStore();
  const { issues, appendInsight, setIssues, setIsStreaming, setError, reset } = useAnalysisStore();

  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'issues' | 'diagram'
  const cleanupRef = useRef(null);

  // Resizer states
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [wasExpandedForSimulate, setWasExpandedForSimulate] = useState(false);

  // Mobile resizer states
  const [mobileEditorHeight, setMobileEditorHeight] = useState(300);
  const [isMobileResizing, setIsMobileResizing] = useState(false);
  const bodyRef = useRef(null);

  // Monitor screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setPanelWidth(prev => Math.min(prev, window.innerWidth - 300));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle activeTab changes for automatic expansion on 'simulate'
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'simulate') {
      if (panelWidth < 580) {
        setPanelWidth(580);
        setWasExpandedForSimulate(true);
      }
    } else {
      if (wasExpandedForSimulate) {
        setPanelWidth(420);
        setWasExpandedForSimulate(false);
      }
    }
  }, [panelWidth, wasExpandedForSimulate]);

  // Desktop horizontal resize (column sizing)
  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    // Set boundaries: min 320px, max viewport width - 300px (to keep at least 300px for the editor)
    if (newWidth >= 320 && newWidth <= window.innerWidth - 300) {
      setPanelWidth(newWidth);
      setWasExpandedForSimulate(false); // User overrode width manually
    }
  }, [isResizing]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, resize, stopResize]);

  // Mobile vertical resize (row sizing)
  const startMobileResize = useCallback((e) => {
    e.preventDefault();
    setIsMobileResizing(true);
  }, []);

  const resizeMobile = useCallback((e) => {
    if (!isMobileResizing) return;
    
    // Prevent screen scroll pull-down-to-refresh on mobile while dragging
    if (e.cancelable) {
      e.preventDefault();
    }

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const bodyRect = bodyRef.current?.getBoundingClientRect();
    if (!bodyRect) return;

    const newHeight = clientY - bodyRect.top;
    // Keep height between 150px and remaining screen space minus 150px
    const maxHeight = window.innerHeight - bodyRect.top - 150;
    if (newHeight >= 150 && newHeight <= maxHeight) {
      setMobileEditorHeight(newHeight);
    }
  }, [isMobileResizing]);

  const stopMobileResize = useCallback(() => {
    setIsMobileResizing(false);
  }, []);

  useEffect(() => {
    if (isMobileResizing) {
      window.addEventListener('mousemove', resizeMobile);
      window.addEventListener('mouseup', stopMobileResize);
      window.addEventListener('touchmove', resizeMobile, { passive: false });
      window.addEventListener('touchend', stopMobileResize);
    } else {
      window.removeEventListener('mousemove', resizeMobile);
      window.removeEventListener('mouseup', stopMobileResize);
      window.removeEventListener('touchmove', resizeMobile);
      window.removeEventListener('touchend', stopMobileResize);
    }
    return () => {
      window.removeEventListener('mousemove', resizeMobile);
      window.removeEventListener('mouseup', stopMobileResize);
      window.removeEventListener('touchmove', resizeMobile);
      window.removeEventListener('touchend', stopMobileResize);
    };
  }, [isMobileResizing, resizeMobile, stopMobileResize]);

  const handleAnalyze = useCallback(() => {
    if (isAnalyzing) return;
    if (code && code.length > 1500) {
      setError('Code exceeds the maximum limit of 1500 characters for code review.');
      handleTabChange('insights');
      return;
    }
    cleanupRef.current?.();
    reset();
    setIsAnalyzing(true);
    setIsStreaming(true);
    handleTabChange('insights'); // Switch to insights when analysis starts

    cleanupRef.current = createAnalysisStream(code, language, {
      onToken:    (text) => appendInsight(text),
      onIssues:   (list) => setIssues(list),
      onComplete: ()     => { setIsAnalyzing(false); setIsStreaming(false); },
      onError:    (msg) => {
        setError(msg || 'Connection error — check the backend is running and your API key is valid.');
        setIsAnalyzing(false);
        setIsStreaming(false);
      },
    });
  }, [code, language, isAnalyzing, reset, appendInsight, setIssues, setIsAnalyzing, setIsStreaming, setError, handleTabChange]);

  return (
    <div className={`flex flex-col h-screen bg-zinc-950 text-white overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center gap-3.5 px-6 py-3 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 mr-auto select-none">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/35 shadow-[0_0_12px_rgba(99,102,241,0.15)] p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full">
              <defs>
                <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" /> 
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
                
                <linearGradient id="bracketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F8FAFC" /> 
                  <stop offset="100%" stopColor="#94A3B8" />
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="12" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <path 
                d="M 190 150 L 70 256 L 190 362" 
                fill="none" 
                stroke="url(#bracketGradient)" 
                strokeWidth="44" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              <path 
                d="M 322 150 L 442 256 L 322 362" 
                fill="none" 
                stroke="url(#bracketGradient)" 
                strokeWidth="44" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              <path 
                d="M 256 120 C 256 210 210 256 120 256 C 210 256 256 302 256 392 C 256 302 302 256 392 256 C 302 256 256 210 256 120 Z" 
                fill="url(#sparkGradient)" 
                filter="url(#glow)"
              />
            </svg>
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            CodeInsight
          </span>
        </div>

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all duration-150"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 disabled:from-zinc-800 disabled:to-zinc-850 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/10 border border-indigo-500/25"
        >
          {isAnalyzing ? (
            <>
              <span className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
              <span>Analyzing…</span>
            </>
          ) : (
            <>
              <span className="text-xs">✦</span>
              <span>Analyze</span>
            </>
          )}
        </button>
      </header>

      {/* ── Body ────────────────────────────────────────────── */}
      <div ref={bodyRef} className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>

        {/* ── Left: Code Editor (takes all remaining space) ──── */}
        <div 
          style={isMobile ? { height: `${mobileEditorHeight}px` } : {}} 
          className={`${isMobile ? 'shrink-0' : 'flex-1'} p-3 overflow-hidden min-w-0`}
        >
          <CodeEditor />
        </div>

        {/* ── Divider (Mobile only: horizontal) ─────────────────── */}
        {isMobile && (
          <div
            onMouseDown={startMobileResize}
            onTouchStart={startMobileResize}
            className={`h-1.5 hover:h-2 bg-zinc-800 hover:bg-indigo-500 cursor-row-resize transition-all duration-150 shrink-0 select-none relative z-50 w-full ${isMobileResizing ? 'bg-indigo-500 h-2' : ''}`}
          >
            {/* A small drag handle visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-[3px] rounded-full bg-zinc-700/60 pointer-events-none group-hover:bg-indigo-300" />
          </div>
        )}

        {/* ── Divider (Desktop only) ─────────────────────────── */}
        {!isMobile && (
          <div
            onMouseDown={startResize}
            className={`w-1 hover:w-1.5 bg-zinc-800 hover:bg-indigo-500 cursor-col-resize transition-all duration-150 shrink-0 select-none relative z-50 h-full ${isResizing ? 'bg-indigo-500 w-1.5' : ''}`}
          >
            {/* A small drag handle visual */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-zinc-700/60 pointer-events-none group-hover:bg-indigo-300" />
          </div>
        )}

        {/* ── Right: Tabbed Panel ────────────────────────────── */}
        <div
          style={isMobile ? {} : { width: `${panelWidth}px` }}
          className={`${isMobile ? 'w-full flex-1 min-h-[150px]' : 'shrink-0'} flex flex-col overflow-hidden transition-all duration-150 bg-zinc-950`}
        >

          {/* Tab bar */}
          <div className="flex items-center border-b border-zinc-800/80 shrink-0 px-2 bg-zinc-950 gap-0.5 select-none h-11">
            <TabButton
              label="AI Insights"
              active={activeTab === 'insights'}
              onClick={() => handleTabChange('insights')}
              dot={isAnalyzing}
              icon={<SparklesIcon />}
            />
            <TabButton
              label="Issues"
              active={activeTab === 'issues'}
              onClick={() => handleTabChange('issues')}
              badge={issues.length > 0 ? issues.length : null}
              badgeColor={issues.some(i => i.severity === 'error') ? 'bg-red-500' : 'bg-yellow-500'}
              icon={<IssuesIcon />}
            />
            <TabButton
              label="Diagram"
              active={activeTab === 'diagram'}
              onClick={() => handleTabChange('diagram')}
              icon={<DiagramIcon />}
            />
            <TabButton
              label="Simulate"
              active={activeTab === 'simulate'}
              onClick={() => handleTabChange('simulate')}
              icon={<SimulateIcon />}
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'insights' && <AIInsightsPanel />}
            {activeTab === 'issues'   && <IssueListPanel  />}
            {activeTab === 'diagram'  && <DiagramPanel    />}
            {activeTab === 'simulate' && <ExecutionSimulator panelWidth={isMobile ? window.innerWidth : panelWidth} />}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Tab Button ──────────────────────────────────────────────── */
function TabButton({ label, active, onClick, badge, badgeColor, dot, icon }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold transition-all duration-200
                  border-b-2 -mb-px select-none cursor-pointer h-full
                  ${active
                    ? 'text-indigo-400 border-indigo-500 bg-zinc-900/10'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/5'}`}
    >
      {icon}
      <span>{label}</span>

      {/* Pulsing dot for streaming */}
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
      )}

      {/* Issue count badge */}
      {badge != null && (
        <span className={`${badgeColor} text-white text-[9px] font-bold px-1.5 py-px rounded-full min-w-[16px] text-center shrink-0`}>
          {badge}
        </span>
      )}
    </button>
  );
}