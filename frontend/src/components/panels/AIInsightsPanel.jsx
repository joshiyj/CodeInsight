// src/components/panels/AIInsightsPanel.jsx
import ReactMarkdown from 'react-markdown';
import remarkMath    from 'remark-math';
import rehypeKatex   from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { useAnalysisStore } from '../../store/analysisStore.js';

function CodeBlock({ language, children }) {
  const code = String(children).replace(/\n$/, '');
  return (
    <div className="my-2 rounded-lg overflow-hidden border border-zinc-700/50" style={{ background: '#0d1117' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700/40" style={{ background: '#161b22' }}>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
        </div>
        {language && <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">{language}</span>}
      </div>
      <SyntaxHighlighter style={vscDarkPlus} language={language || 'text'} PreTag="div"
        customStyle={{ margin: 0, padding: '10px 14px', background: 'transparent', fontSize: '12px', fontFamily: '"Fira Code", monospace', lineHeight: '1.6' }}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function CodeNode({ className, children }) {
  const lang    = /language-(\w+)/.exec(className || '')?.[1];
  const content = String(children);
  const isInline = !lang && !content.includes('\n');
  if (isInline) {
    return (
      <code className="font-mono text-[11.5px] bg-zinc-800 text-indigo-300
                       px-1.5 py-[1px] rounded border border-zinc-700/50
                       mx-[1px] align-middle whitespace-nowrap">
        {children}
      </code>
    );
  }
  return <CodeBlock language={lang}>{children}</CodeBlock>;
}

// Track whether we're inside the Overview section to style it as a card
let _inOverview = false;

const md = {
  h1: ({ children }) => (
    <h1 className="text-[14px] font-bold text-white mb-3 pb-2 border-b border-zinc-700/60 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[14px] font-bold text-white mb-3 pb-2 border-b border-zinc-700/60 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => {
    const label = String(children).trim().toLowerCase();
    const isOverview = label === 'overview';

    // Color the accent bar per section
    const accent =
      label === 'strengths'       ? 'bg-emerald-500' :
      label === 'issues'          ? 'bg-red-500'      :
      label === 'recommendations' ? 'bg-indigo-500'   :
      'bg-zinc-500';

    return (
      <div className={`flex items-center gap-2 mt-4 mb-1.5 ${isOverview ? 'mt-1' : ''}`}>
        <span className={`w-[3px] h-3.5 rounded-full shrink-0 ${accent}`} />
        <h3 className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-[0.15em]">{children}</h3>
      </div>
    );
  },

  // Overview paragraph gets a subtle card treatment
  p: ({ children }) => (
    <p className="text-[12.5px] text-zinc-300 leading-[1.7] mb-2 last:mb-0 text-left bg-zinc-800/30 rounded-lg px-3 py-2 border border-zinc-700/30">
      {children}
    </p>
  ),

  strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
  em:     ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
  code:   CodeNode,

  ul: ({ children }) => <ul className="my-1.5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 space-y-1 list-none">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-[12.5px] text-zinc-300 leading-[1.65] text-left
                   bg-zinc-800/20 rounded-md px-2.5 py-1.5 border border-zinc-700/20">
      <span className="mt-[6px] w-1 h-1 rounded-full bg-indigo-400/60 shrink-0" />
      <span className="flex-1 min-w-0">{children}</span>
    </li>
  ),

  hr: () => <hr className="my-4 border-zinc-800" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-indigo-500/40 pl-3 text-[12px] text-zinc-400 italic">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-700/60">
      <table className="w-full text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-900 border-b border-zinc-700/60">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-1.5 text-left text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{children}</th>,
  td: ({ children }) => <td className="px-3 py-1.5 text-zinc-300 border-b border-zinc-800/60">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-zinc-800/20 transition-colors">{children}</tr>,
};

export default function AIInsightsPanel() {
  const { insights, isStreaming } = useAnalysisStore();

  if (!insights && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <span className="text-2xl text-zinc-700 select-none">✦</span>
        <p className="text-[11.5px] text-zinc-600 text-center leading-relaxed px-6">
          Click <span className="text-zinc-400 font-medium">Analyze</span> to generate<br />an AI-powered code review.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-4 pb-8">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-zinc-800/60">
          <span className="text-[9.5px] font-mono text-zinc-600 uppercase tracking-[0.18em]">Analysis Report</span>
          {isStreaming && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-[9.5px] font-mono text-indigo-400/70">streaming</span>
            </div>
          )}
        </div>

        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={md}>
          {insights}
        </ReactMarkdown>

        {isStreaming && (
          <span className="inline-block w-[2px] h-3 bg-indigo-400 ml-1 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  );
}