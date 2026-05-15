// src/components/panels/AIInsightsPanel.jsx
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAnalysisStore } from '../../store/analysisStore.js';

export default function AIInsightsPanel() {
  const { insights, isStreaming, error } = useAnalysisStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [insights]);

  // ── Empty state ─────────────────────────────────────────────
  if (!insights && !isStreaming && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">🔍</div>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Paste your code and click <span className="text-zinc-300 font-medium">Analyze</span> to get a review.
        </p>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-xl">⚠️</div>
        <p className="text-sm text-red-400 leading-relaxed">{error}</p>
      </div>
    );
  }

  // ── Content ─────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Streaming indicator */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-5 py-2 border-b border-zinc-800 bg-indigo-500/5 shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-400 font-medium">Analyzing your code…</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className="text-sm font-bold text-white mt-5 mb-2 pb-1 border-b border-zinc-800">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-sm font-bold text-white mt-4 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mt-4 mb-1.5">{children}</h3>
            ),

            // Paragraphs — left-aligned, readable line length
            p: ({ children }) => (
              <p className="text-[13px] text-zinc-300 leading-6 mb-3 text-left">{children}</p>
            ),

            // Bold / italic
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="text-zinc-400 not-italic font-medium">{children}</em>
            ),

            // Lists
            ul: ({ children }) => (
              <ul className="mb-3 space-y-1.5 pl-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 space-y-1.5 pl-1 list-decimal list-inside">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="flex gap-2 text-[13px] text-zinc-300 leading-6">
                <span className="text-indigo-500 shrink-0 mt-0.5">›</span>
                <span>{children}</span>
              </li>
            ),

            // ── THE KEY FIX: inline vs block code ──────────────
            code: ({ inline, children }) => {
              if (inline) {
                // Stays in the text flow — small, subtle, no line break
                return (
                  <code className="bg-zinc-800 text-indigo-300 rounded px-1 py-px text-[12px] font-mono">
                    {children}
                  </code>
                );
              }
              // Block code — full width, separated
              return (
                <pre className="bg-zinc-900 border border-zinc-700/60 rounded-lg p-3.5 mb-3 overflow-x-auto">
                  <code className="text-[12px] font-mono text-zinc-200 leading-5">{children}</code>
                </pre>
              );
            },

            // Horizontal rule
            hr: () => <hr className="border-zinc-800 my-4" />,

            // Blockquote
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-indigo-500/60 pl-4 my-3 text-zinc-400 italic">
                {children}
              </blockquote>
            ),
          }}
        >
          {insights}
        </ReactMarkdown>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}