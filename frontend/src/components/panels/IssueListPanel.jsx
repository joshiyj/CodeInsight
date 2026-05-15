// src/components/panels/IssueListPanel.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysisStore } from '../../store/analysisStore.js';

const SEVERITY_CONFIG = {
  error:   { label: 'Error',   icon: '✕', textColor: 'text-red-400',    pillBg: 'bg-red-500/15',    pillBorder: 'border-red-500/25',    dot: 'bg-red-400'    },
  warning: { label: 'Warning', icon: '▲', textColor: 'text-yellow-400', pillBg: 'bg-yellow-500/15', pillBorder: 'border-yellow-500/25', dot: 'bg-yellow-400' },
  info:    { label: 'Info',    icon: 'ℹ', textColor: 'text-blue-400',   pillBg: 'bg-blue-500/15',   pillBorder: 'border-blue-500/25',   dot: 'bg-blue-400'   },
  hint:    { label: 'Hint',    icon: '·', textColor: 'text-zinc-400',   pillBg: 'bg-zinc-700/40',   pillBorder: 'border-zinc-600/30',   dot: 'bg-zinc-500'   },
};

const FILTERS = ['all', 'error', 'warning', 'info', 'hint'];

export default function IssueListPanel() {
  const { issues, isStreaming } = useAnalysisStore();
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState(null);

  const filtered = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);

  if (!issues.length && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-600">
        <span className="text-xl">✓</span>
        <p className="text-xs text-center px-4">No issues yet.<br />Run an analysis to see results.</p>
      </div>
    );
  }

  if (!issues.length && isStreaming) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-zinc-500 animate-pulse">Waiting for results…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Filter pills ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-zinc-800 shrink-0">
        {FILTERS.map((f) => {
          const count = f === 'all' ? issues.length : issues.filter((i) => i.severity === f).length;
          if (f !== 'all' && count === 0) return null;
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full capitalize font-medium transition-all duration-150
                ${active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'}`}
            >
              {f === 'all' ? `All (${count})` : `${f[0].toUpperCase() + f.slice(1)} (${count})`}
            </button>
          );
        })}
      </div>

      {/* ── Issue list ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/50">
        <AnimatePresence initial={false}>
          {filtered.map((issue) => {
            const cfg        = SEVERITY_CONFIG[issue.severity] ?? SEVERITY_CONFIG.hint;
            const isOpen     = expanded === issue.id;

            return (
              <motion.div
                key={issue.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
              >
                {/* ── Issue row (always visible) ─────────────── */}
                <button
                  onClick={() => setExpanded(isOpen ? null : issue.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-zinc-800/50 transition-colors duration-100
                              ${isOpen ? 'bg-zinc-800/40' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Severity icon */}
                    <span className={`text-[11px] font-bold mt-0.5 shrink-0 w-3 text-center ${cfg.textColor}`}>
                      {cfg.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Message */}
                      <p className="text-[12px] text-zinc-200 font-medium leading-snug truncate">
                        {issue.message}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-zinc-500">Line {issue.line}</span>
                        <span className={`text-[10px] px-1.5 py-px rounded border font-medium capitalize
                                         ${cfg.textColor} ${cfg.pillBg} ${cfg.pillBorder}`}>
                          {issue.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-px rounded border font-medium capitalize
                                         ${cfg.textColor} ${cfg.pillBg} ${cfg.pillBorder}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <span className={`text-zinc-600 text-[10px] mt-1 shrink-0 transition-transform duration-200
                                      ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* ── Expanded detail ────────────────────────── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`mx-3 mb-3 rounded-lg border p-3 text-xs space-y-2.5 ${cfg.pillBg} ${cfg.pillBorder}`}>

                        {/* Explanation */}
                        <div>
                          <p className={`font-semibold mb-1 text-[11px] uppercase tracking-wide ${cfg.textColor}`}>
                            Explanation
                          </p>
                          <p className="text-zinc-300 leading-relaxed">{issue.explanation}</p>
                        </div>

                        {/* Suggested fix */}
                        {issue.suggestedFix && (
                          <div>
                            <p className={`font-semibold mb-1 text-[11px] uppercase tracking-wide ${cfg.textColor}`}>
                              Suggested Fix
                            </p>
                            <p className="text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-900/60 rounded p-2 border border-zinc-700/50">
                              {issue.suggestedFix}
                            </p>
                          </div>
                        )}

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