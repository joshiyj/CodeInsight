// src/components/panels/IssueListPanel.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath    from 'remark-math';
import rehypeKatex   from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { useAnalysisStore } from '../../store/analysisStore.js';
import { useEditorStore }   from '../../store/editorStore.js';

const SEV = {
  error:   { label: 'Error',   icon: '✕', accent: '#ef4444', text: 'text-red-400',    chip: 'bg-zinc-800/80 border border-zinc-700/40 text-zinc-300', border: 'border-l-red-500',    hover: 'hover:bg-zinc-800/20', open: 'bg-zinc-800/30' },
  warning: { label: 'Warning', icon: '▲', accent: '#eab308', text: 'text-yellow-400', chip: 'bg-zinc-800/80 border border-zinc-700/40 text-zinc-300', border: 'border-l-yellow-500', hover: 'hover:bg-zinc-800/20', open: 'bg-zinc-800/30' },
  info:    { label: 'Info',    icon: 'ℹ', accent: '#3b82f6', text: 'text-blue-400',   chip: 'bg-zinc-800/80 border border-zinc-700/40 text-zinc-300', border: 'border-l-blue-500',   hover: 'hover:bg-zinc-800/20', open: 'bg-zinc-800/30' },
  hint:    { label: 'Hint',    icon: '◎', accent: '#71717a', text: 'text-zinc-500',   chip: 'bg-zinc-800/80 border border-zinc-700/40 text-zinc-300', border: 'border-l-zinc-700',   hover: 'hover:bg-zinc-800/20', open: 'bg-zinc-800/30' },
};

const FILTERS = ['all', 'error', 'warning', 'info', 'hint'];

// ── Inline code pill ───────────────────────────────────────────────────────
function ICode({ className, children }) {
  const lang    = /language-(\w+)/.exec(className || '')?.[1];
  const content = String(children);
  if (!lang && !content.includes('\n')) {
    return (
      <code className="font-mono text-[11px] bg-zinc-800 text-indigo-300
                       px-1.5 py-[1px] rounded border border-zinc-700/50
                       mx-[1px] align-middle whitespace-nowrap">
        {children}
      </code>
    );
  }
  return (
    <pre className="my-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700/60 overflow-x-auto">
      <code className="text-[11px] font-mono text-zinc-200">{children}</code>
    </pre>
  );
}

// ── Compact markdown map for explanations ─────────────────────────────────
// Each "point" (Root cause / Impact / Fix) renders as a tight row
const exMd = {
  // paragraphs become compact rows — visually separated
  p: ({ children }) => (
    <p className="text-[12px] text-zinc-300 leading-[1.65] text-left mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-indigo-300 not-italic font-medium">{children}</em>
  ),
  code: ICode,
  ul: ({ children }) => <ul className="my-1 space-y-1">{children}</ul>,
  li: ({ children }) => (
    <li className="flex items-start gap-1.5 text-[12px] text-zinc-300 text-left">
      <span className="mt-[5px] w-1 h-1 rounded-full bg-indigo-400/60 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-zinc-700/50">
      <table className="w-full text-[11.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-900 border-b border-zinc-700/50">{children}</thead>,
  th: ({ children }) => <th className="px-2.5 py-1.5 text-left text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{children}</th>,
  td: ({ children }) => <td className="px-2.5 py-1.5 text-zinc-300 border-b border-zinc-800/60 text-[11.5px]">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-zinc-800/20">{children}</tr>,
};

function parseExplanation(text) {
  let rootCause = '';
  let impact = '';
  let fix = '';

  const lines = text.split('\n').filter(Boolean);
  for (const line of lines) {
    const clean = line.replace(/^\*?\*(Root cause|Impact|Fix):\*?\*\s*/i, '').trim();
    if (/Root cause/i.test(line)) {
      rootCause = clean;
    } else if (/Impact/i.test(line)) {
      impact = clean;
    } else if (/Fix/i.test(line)) {
      fix = clean;
    } else {
      if (!rootCause) rootCause = line;
    }
  }
  return { rootCause, impact, fix };
}

export default function IssueListPanel() {
  const { issues, isStreaming, setSelectedIssue } = useAnalysisStore();
  const { language }                              = useEditorStore();
  const [filter, setFilter]                       = useState('all');
  const [expanded, setExpanded]                   = useState(null);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);

  if (!issues.length && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <span className="text-2xl text-zinc-700">∅</span>
        <p className="text-[11.5px] text-zinc-600 text-center leading-relaxed px-4">
          No issues found.<br />Run an analysis to begin.
        </p>
      </div>
    );
  }
  if (!issues.length && isStreaming) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[11px] font-mono text-zinc-500 animate-pulse">Analyzing…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Filter pills ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-zinc-800 shrink-0">
        {FILTERS.map((f) => {
          const count = f === 'all' ? issues.length : issues.filter((i) => i.severity === f).length;
          if (f !== 'all' && count === 0) return null;
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all duration-150
                ${active ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}>
              {f === 'all' ? `All (${count})` : `${f[0].toUpperCase() + f.slice(1)} (${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Issue list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {filtered.map((issue) => {
            const c      = SEV[issue.severity] ?? SEV.hint;
            const isOpen = expanded === issue.id;

            return (
              <motion.div key={issue.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}
                className={`border-l-[3px] ${c.border} border-b border-zinc-800/50`}>

                {/* ── Collapsed row ──────────────────────────── */}
                <button
                  onClick={() => { setExpanded(isOpen ? null : issue.id); setSelectedIssue(issue); }}
                  className={`w-full text-left px-3 py-2.5 transition-colors duration-100 ${isOpen ? c.open : c.hover}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-bold shrink-0 w-3 text-center ${c.text}`}>{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] text-zinc-100 font-medium leading-snug truncate">{issue.message}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-px rounded border ${c.chip}`}>L{issue.line}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-px rounded border capitalize ${c.chip}`}>{issue.category}</span>
                        <span className={`text-[10px] font-medium ${c.text}`}>{c.label}</span>
                      </div>
                    </div>
                    <span className={`text-zinc-600 text-[9px] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* ── Expanded detail ────────────────────────── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="detail"
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pt-2 pb-3 space-y-2 bg-zinc-900/30">

                        {/* Explanation & Fix Unified Card */}
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 space-y-3.5 select-text text-left">
                          {/* Root Cause */}
                          {parseExplanation(issue.explanation).rootCause && (
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Root Cause</span>
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={exMd}
                              >
                                {parseExplanation(issue.explanation).rootCause}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Impact */}
                          {parseExplanation(issue.explanation).impact && (
                            <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-3 text-left">
                              <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">Impact</span>
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={exMd}
                              >
                                {parseExplanation(issue.explanation).impact}
                              </ReactMarkdown>
                            </div>
                          )}

                          {/* Suggested Fix */}
                          {issue.suggestedFix && (
                            <div className="flex flex-col gap-1 border-t border-zinc-900/60 pt-3 text-left">
                              <span className="text-[9.5px] font-mono text-emerald-500/80 uppercase tracking-wider font-semibold">Suggested Fix</span>
                              <div className="rounded-lg overflow-hidden border border-emerald-500/15 bg-emerald-950/5 mt-2">
                                <div className="flex items-center justify-between px-3 py-1 bg-emerald-950/10 border-b border-emerald-500/10 font-sans">
                                  <span className="text-[8.5px] font-mono text-emerald-400/80 font-bold uppercase tracking-wider">Fix</span>
                                  <span className="text-[8px] font-mono text-emerald-600/70 uppercase">{language || 'javascript'}</span>
                                </div>
                                <SyntaxHighlighter
                                  style={vscDarkPlus} language={language || 'text'} PreTag="div" wrapLongLines
                                  customStyle={{ margin: 0, padding: '10px 14px', background: 'transparent', fontSize: '12px', fontFamily: '"Fira Code", monospace', lineHeight: '1.6' }}
                                >
                                  {issue.suggestedFix}
                                </SyntaxHighlighter>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}