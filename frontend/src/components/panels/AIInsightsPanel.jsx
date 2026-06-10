// src/components/panels/AIInsightsPanel.jsx
import ReactMarkdown from 'react-markdown';
import remarkMath    from 'remark-math';
import rehypeKatex   from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { useAnalysisStore } from '../../store/analysisStore.js';

const CARD = `flex items-start gap-2.5 px-3 py-2.5 rounded-lg
              bg-zinc-800/20 border border-zinc-700/30
              hover:bg-zinc-800/35 transition-colors duration-150 text-left`;

const SEV = {
  error: {
    label: 'Error',
    icon: '✕',
    text: 'text-red-400',
    chip: 'bg-red-500/10 border border-red-500/10 text-red-400',
    border: 'border-l-red-500/80',
  },
  warning: {
    label: 'Warning',
    icon: '▲',
    text: 'text-yellow-400',
    chip: 'bg-yellow-500/10 border border-yellow-500/10 text-yellow-400',
    border: 'border-l-yellow-500/80',
  },
  info: {
    label: 'Info',
    icon: 'ℹ',
    text: 'text-blue-400',
    chip: 'bg-blue-500/10 border border-blue-500/10 text-blue-400',
    border: 'border-l-blue-500/80',
  },
  hint: {
    label: 'Hint',
    icon: '◎',
    text: 'text-zinc-400',
    chip: 'bg-zinc-700/20 border border-zinc-700/10 text-zinc-400',
    border: 'border-l-zinc-500/80',
  },
};

/* ─── inline / block code ────────────────────────────────────────────────── */
function CodeNode({ className, children }) {
  const lang    = /language-(\w+)/.exec(className || '')?.[1];
  const content = String(children);
  const isInline = !lang && !content.includes('\n');

  if (isInline) {
    return (
      <code className="font-mono text-[12.5px] bg-zinc-800/80 text-indigo-200/90
                       px-1.5 py-[2px] rounded border border-zinc-700/50
                       mx-[1px] align-middle whitespace-nowrap">
        {children}
      </code>
    );
  }
  return (
    <div className="my-1.5 rounded-md overflow-hidden border border-zinc-700/40"
         style={{ background: '#0d1117' }}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-zinc-800"
           style={{ background: '#161b22' }}>
        <div className="flex gap-1.5">
          <span className="w-[7px] h-[7px] rounded-full bg-zinc-700" />
          <span className="w-[7px] h-[7px] rounded-full bg-zinc-700" />
          <span className="w-[7px] h-[7px] rounded-full bg-zinc-700" />
        </div>
        {lang && (
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{lang}</span>
        )}
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={lang || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0, padding: '9px 13px', background: 'transparent',
          fontSize: '11.5px', fontFamily: '"Fira Code","JetBrains Mono",monospace',
          lineHeight: '1.6',
        }}>
        {content.replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
}

/* ─── section tracker ────────────────────────────────────────────────────── */
let _section = 'default';

/* ─── icons ──────────────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg className="shrink-0 mt-[4px]" width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2.5 6.5L5.2 9.2L10.5 3.8"
          stroke="#34d399" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DotIcon = () => (
  <svg className="shrink-0 mt-[7.5px]" width="5" height="5" viewBox="0 0 5 5" fill="none">
    <circle cx="2.5" cy="2.5" r="2.2" fill="#71717a"/>
  </svg>
);

const BugIcon = () => (
  <svg className="shrink-0 mt-[4.5px]" width="13" height="13" viewBox="0 0 16 16" fill="none">
    <path d="M8 2a2.5 2.5 0 00-2.5 2.5v1h5v-1A2.5 2.5 0 008 2zM5.5 5.5v5a2.5 2.5 0 005 0v-5h-5z" 
          stroke="#f87171" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6h2.5M10.5 6H13M2.5 9h3M10.5 9h3M3.5 12h2M10.5 12h2" 
          stroke="#f87171" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const ArrowIcon = () => (
  <svg className="shrink-0 mt-[4.5px]" width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3"
          stroke="#818cf8" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── list item renderers ────────────────────────────────────────────────── */
function StrengthItem({ children }) {
  return (
    <li className={`${CARD} border-emerald-950/20 hover:border-emerald-500/15 hover:bg-emerald-950/5`}>
      <CheckIcon />
      <span className="flex-1 min-w-0 text-left text-[13.5px] text-zinc-200 leading-[1.72]">{children}</span>
    </li>
  );
}

function IssueItem({ children }) {
  const text = String(children);
  
  // Parse "Line 5: i <= arr.length — will cause an ArrayIndexOutOfBoundsException."
  const lineMatch = text.match(/Line\s*(\d+):?/i);
  const lineVal = lineMatch ? parseInt(lineMatch[1]) : null;
  
  // Find matching issue in store to get severity and category
  const { issues } = useAnalysisStore.getState();
  const matched = lineVal ? issues.find(i => i.line === lineVal) : null;
  
  const severity = matched?.severity || 'warning';
  const category = matched?.category || 'Bug';
  const message = matched?.message || text.replace(/Line\s*\d+:\s*/i, '');
  
  const c = SEV[severity] || SEV.warning;
  
  return (
    <li className={`flex flex-col gap-2 p-3.5 rounded-lg border bg-zinc-900/25 border-zinc-800/85 hover:bg-zinc-900/40 hover:border-zinc-800 transition-all duration-150 text-left ${c.border} border-l-[3px] my-1.5`}>
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold ${c.text}`}>{c.icon}</span>
          <span className={`text-[10.5px] font-semibold uppercase tracking-wider font-mono ${c.text}`}>{severity}</span>
          <span className="text-[10px] text-zinc-600 font-mono">•</span>
          <span className="text-[10.5px] text-zinc-500 font-mono uppercase tracking-wide">{category}</span>
        </div>
        {lineVal && (
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${c.chip}`}>
            Line {lineVal}
          </span>
        )}
      </div>
      <div className="text-[13.5px] text-zinc-200 leading-snug font-medium font-sans">
        {message}
      </div>
    </li>
  );
}

function RecommendationItem({ children }) {
  const childArray = Array.isArray(children) ? children.flat(Infinity) : [children];

  // detect diff: any string child containing → or ->
  let hasDiff = false;
  for (const c of childArray) {
    if (typeof c === 'string' && /→|->/.test(c)) { hasDiff = true; break; }
  }

  if (hasDiff) {
    const before = [];
    const after  = [];
    let crossed  = false;

    for (const c of childArray) {
      if (typeof c === 'string') {
        const parts = c.split(/(→|->)/);
        for (const part of parts) {
          if (part === '→' || part === '->') { crossed = true; continue; }
          if (part) (crossed ? after : before).push(part);
        }
      } else {
        (crossed ? after : before).push(c);
      }
    }

    return (
      <li className="flex flex-col text-left list-none my-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 font-mono text-[12px]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-900 bg-zinc-900/50 text-[10px] text-zinc-500 uppercase tracking-wider font-sans select-none">
          <span>Code Refactor Suggestion</span>
          <span className="text-[9px] font-mono text-zinc-600">diff</span>
        </div>
        {/* Diff Content */}
        <div className="divide-y divide-zinc-900/40">
          {/* was */}
          <div className="flex items-start bg-red-950/15 hover:bg-red-950/20 transition-colors py-2.5 px-3.5">
            <span className="w-4 text-red-500/60 select-none text-[12.5px] font-bold pr-2">-</span>
            <span className="flex-1 text-red-300/90 pl-3 leading-relaxed whitespace-pre-wrap">{before}</span>
          </div>
          {/* use */}
          <div className="flex items-start bg-emerald-950/15 hover:bg-emerald-950/20 transition-colors py-2.5 px-3.5">
            <span className="w-4 text-emerald-500/60 select-none text-[12.5px] font-bold pr-2">+</span>
            <span className="flex-1 text-emerald-200/90 pl-3 leading-relaxed whitespace-pre-wrap">{after}</span>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className={`${CARD} border-indigo-950/20 hover:border-indigo-500/15 hover:bg-indigo-950/5`}>
      <ArrowIcon />
      <span className="flex-1 min-w-0 text-left text-[13.5px] text-zinc-200 leading-[1.72]">{children}</span>
    </li>
  );
}

/* ─── markdown component map ─────────────────────────────────────────────── */
const md = {
  h1: ({ children }) => (
    <h1 className="text-[18px] font-bold text-zinc-100 text-center mb-4 pb-2 border-b border-zinc-800/80 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[18px] font-bold text-zinc-100 text-center mb-4 pb-2 border-b border-zinc-800/80 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => {
    const label = String(children).trim().toLowerCase();
    _section = label;

    // Only the thin accent bar keeps a hint of color — everything else is neutral
    const bar =
      label === 'strengths'       ? 'bg-emerald-500/60' :
      label === 'issues'          ? 'bg-red-500/60'     :
      label === 'recommendations' ? 'bg-indigo-500/60'  :
      'bg-zinc-600/60';

    return (
      <div className={`flex items-center gap-2 mb-2 ${label === 'overview' ? 'mt-1' : 'mt-5'}`}>
        <span className={`w-[2px] h-3 rounded-full shrink-0 ${bar}`} />
        <h3 className="text-[9px] font-semibold text-zinc-500 uppercase tracking-[0.16em]">
          {children}
        </h3>
        <span className="flex-1 h-px bg-zinc-800/80" />
      </div>
    );
  },

  /* overview paragraph */
  p: ({ children }) => (
    <p className="text-left text-[13.5px] text-zinc-300 leading-[1.75] mb-2.5 last:mb-0">
      {children}
    </p>
  ),

  strong: ({ children }) => <strong className="font-semibold text-zinc-200">{children}</strong>,
  em:     ({ children }) => <em className="text-zinc-500 italic">{children}</em>,
  code:   CodeNode,

  ul: ({ children }) => <ul className="my-1.5 flex flex-col gap-1 list-none p-0 m-0">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 flex flex-col gap-1 list-none p-0 m-0">{children}</ol>,

  li: ({ children }) => {
    if (_section === 'strengths')       return <StrengthItem>{children}</StrengthItem>;
    if (_section === 'issues')          return <IssueItem>{children}</IssueItem>;
    if (_section === 'recommendations') return <RecommendationItem>{children}</RecommendationItem>;
    return (
      <li className="flex items-start gap-2.5 text-left text-[13.5px] text-zinc-300 leading-[1.72]">
        <DotIcon />
        <span className="flex-1 min-w-0 text-left">{children}</span>
      </li>
    );
  },

  span: ({ className, children, ...props }) => {
    if (className && className.includes('math-inline')) {
      return (
        <span className="inline-flex items-center bg-indigo-950/25 border border-indigo-500/20 rounded px-1.5 py-0.5 mx-0.5 text-indigo-300 font-mono text-[12.5px]" {...props}>
          {children}
        </span>
      );
    }
    return <span className={className} {...props}>{children}</span>;
  },

  div: ({ className, children, ...props }) => {
    if (className && className.includes('math-display')) {
      return (
        <div className="my-2.5 p-3 bg-zinc-800/40 border border-zinc-700/50 rounded-lg text-center overflow-x-auto text-indigo-300 font-mono text-[13px]" {...props}>
          {children}
        </div>
      );
    }
    return <div className={className} {...props}>{children}</div>;
  },

  hr:         () => <hr className="my-4 border-zinc-800" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-zinc-700 pl-3 text-[12px] text-zinc-500 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-700/50">
      <table className="w-full text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-900 border-b border-zinc-800">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left text-[9.5px] font-semibold text-zinc-500 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="px-3 py-1.5 text-zinc-400 border-b border-zinc-800/50">{children}</td>,
  tr: ({ children }) => <tr className="hover:bg-zinc-800/20">{children}</tr>,
};

function processMath(text) {
  return text.replace(/(?<!\$)\bO\(([^)]+)\)/g, (_, inner) => {
    const latexInner = inner.replace(/\^(\w+)/g, '^{$1}').replace(/log\s*n/g, '\\log n').replace(/\s+/g, ' ').trim();
    return `$\\mathcal{O}(${latexInner})$`;
  });
}

export default function AIInsightsPanel() {
  const { insights, issues, isStreaming, error } = useAnalysisStore();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-full max-w-sm rounded-xl border border-zinc-700/40 bg-zinc-800/20 p-4">
          <p className="text-[12px] font-semibold text-zinc-300 mb-1">Analysis failed</p>
          <p className="text-[12px] text-zinc-500 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 opacity-35 select-none mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-full h-full">
            <defs>
              <linearGradient id="sparkGradientPanel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" /> 
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
              
              <linearGradient id="bracketGradientPanel" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8FAFC" /> 
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>

              <filter id="glowPanel" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path 
              d="M 190 150 L 70 256 L 190 362" 
              fill="none" 
              stroke="url(#bracketGradientPanel)" 
              strokeWidth="44" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            <path 
              d="M 322 150 L 442 256 L 322 362" 
              fill="none" 
              stroke="url(#bracketGradientPanel)" 
              strokeWidth="44" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            <path 
              d="M 256 120 C 256 210 210 256 120 256 C 210 256 256 302 256 392 C 256 302 302 256 392 256 C 302 256 256 210 256 120 Z" 
              fill="url(#sparkGradientPanel)" 
              filter="url(#glowPanel)"
            />
          </svg>
        </div>
        <p className="text-[11.5px] text-zinc-600 text-center leading-relaxed px-6">Click <span className="text-zinc-400 font-medium">Analyze</span> to generate<br />an AI-powered code review.</p>
      </div>
    );
  }

  _section = 'default';
  const safeInsights = processMath(insights.replace(/<issues>[\s\S]*?<\/issues>/g, '').replace(/<issues>[\s\S]*/g, '').trimEnd());

  const totalIssues = issues?.length || 0;
  const errors = issues?.filter(i => i.severity === 'error').length || 0;
  const warnings = issues?.filter(i => i.severity === 'warning').length || 0;
  const info = issues?.filter(i => i.severity === 'info' || i.severity === 'hint').length || 0;
  const score = Math.max(0, 100 - (errors * 15 + warnings * 8 + info * 3));
  let scoreLabel = 'Excellent';
  let scoreColor = '#10b981'; // Emerald
  if (score < 50) {
    scoreLabel = 'Poor';
    scoreColor = '#ef4444'; // Red
  } else if (score < 70) {
    scoreLabel = 'Fair';
    scoreColor = '#f97316'; // Orange
  } else if (score < 90) {
    scoreLabel = 'Good';
    scoreColor = '#f59e0b'; // Amber
  }

  let timeComplexity = null, spaceComplexity = null;
  if (insights) {
    const timeMatch = insights.match(/Time:?\**\s*(?:\\mathcal\{O\}|\$?\\mathcal\{O\}|\$?\bO\b|\bO\b)\(([^)]+)\)/i);
    timeComplexity = timeMatch ? `O(${timeMatch[1]})` : null;
    const spaceMatch = insights.match(/Space:?\**\s*(?:\\mathcal\{O\}|\$?\\mathcal\{O\}|\$?\bO\b|\bO\b)\(([^)]+)\)/i);
    spaceComplexity = spaceMatch ? `O(${spaceMatch[1]})` : null;
  }

  function formatComplexity(str) {
    if (!str) return 'N/A';
    return str.replace(/\\mathcal\{O\}/g, 'O').replace(/\\mathcal/g, '').replace(/[\$\{\}]/g, '').replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\^n/g, 'ⁿ');
  }

  function getComplexityMeta(complexityStr) {
    if (!complexityStr || complexityStr === 'N/A') {
      return {
        rating: 'N/A',
        colorClass: 'text-zinc-400 bg-zinc-800/20 border-zinc-700/30'
      };
    }
    const clean = complexityStr.replace(/\s+/g, '').toLowerCase();
    
    // Constant / Logarithmic / O(1) / O(log n)
    if (clean.includes('o(1)') || clean.includes('o(logn)') || clean.includes('o(log(n))')) {
      return {
        rating: 'Optimal',
        colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
      };
    }
    // Linear / O(n)
    if (clean.includes('o(n)') && !clean.includes('logn') && !clean.includes('log(n)') && !clean.includes('^') && !clean.includes('²') && !clean.includes('log')) {
      return {
        rating: 'Linear',
        colorClass: 'text-teal-400 bg-teal-500/10 border-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.05)]'
      };
    }
    // Linearithmic / O(n log n)
    if (clean.includes('o(nlogn)') || clean.includes('o(nlog(n))') || (clean.includes('o(n') && clean.includes('log'))) {
      return {
        rating: 'Moderate',
        colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]'
      };
    }
    // Quadratic / O(n^2) / Cubic / O(n^3)
    if (clean.includes('o(n^2)') || clean.includes('o(n²)') || clean.includes('o(n^3)') || clean.includes('o(n³)') || clean.includes('^2') || clean.includes('²')) {
      return {
        rating: 'Slow',
        colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.05)]'
      };
    }
    // Exponential / Factorial / O(2^n)
    if (clean.includes('o(2^') || clean.includes('o(2ⁿ)') || clean.includes('o(n!)') || clean.includes('o(m!)') || clean.includes('^n') || clean.includes('ⁿ')) {
      return {
        rating: 'Critical',
        colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.05)]'
      };
    }
    return {
      rating: 'Standard',
      colorClass: 'text-zinc-400 bg-zinc-800/30 border-zinc-700/20'
    };
  }

  const timeMeta = getComplexityMeta(timeComplexity);
  const spaceMeta = getComplexityMeta(spaceComplexity);

  return (
    <div className="h-full overflow-y-auto text-left">
      <div className="px-4 pt-4 pb-10 text-left">

        {/* header */}
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-zinc-800">
          <span className="text-[8.5px] font-mono text-zinc-700 uppercase tracking-[0.18em]">
            Analysis Report
          </span>
          {isStreaming && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-[8.5px] font-mono text-zinc-600">live</span>
            </div>
          )}
        </div>

        {/* Summary Dashboard Row */}
        {insights && (
          <div className="dashboard-container rounded-xl border border-zinc-800/60 bg-zinc-900/25 p-4 mb-6 select-none relative overflow-hidden">
            <div className="dashboard-inner">
              {/* Left side: Quality Score */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Quality Score</span>
                <div className="relative flex items-center justify-center w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <filter id="score-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComponentTransfer in="blur" result="glow">
                          <feFuncA type="linear" slope="0.45" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode in="glow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Track circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#1f1f22" // zinc-850 equivalent
                      strokeWidth="7"
                      fill="transparent"
                    />
                    
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke={scoreColor}
                      strokeWidth="7"
                      fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (score / 100) * 251.2}
                      strokeLinecap="round"
                      filter="url(#score-glow)"
                      style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease' }}
                    />
                  </svg>
                  
                  {/* Center text */}
                  <div className="absolute flex flex-col items-center justify-center text-center font-sans">
                    <span className="text-2xl font-black font-mono tracking-tight" style={{ color: scoreColor, textShadow: `0 0 15px ${scoreColor}30` }}>
                      {score}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 mt-0.5 uppercase tracking-wider">
                      {scoreLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsive Divider */}
              <div className="dashboard-divider" />

              {/* Right side: Complexities */}
              <div className="complexities-list">
                {/* Time Complexity Card */}
                <div className="complexity-card flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/45 border border-zinc-800/60 hover:bg-zinc-800/15 hover:border-zinc-700/50 transition-all duration-150 group">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-400 uppercase tracking-wider transition-colors">Time Complexity</span>
                    <span className="text-[13.5px] font-extrabold font-mono text-zinc-100 mt-0.5 tracking-tight">
                      {formatComplexity(timeComplexity)}
                    </span>
                  </div>
                  <span className={`text-[9.5px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded border select-none transition-all duration-150 ${timeMeta.colorClass}`}>
                    {timeMeta.rating}
                  </span>
                </div>

                {/* Space Complexity Card */}
                <div className="complexity-card flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/45 border border-zinc-800/60 hover:bg-zinc-800/15 hover:border-zinc-700/50 transition-all duration-150 group">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-400 uppercase tracking-wider transition-colors">Space Complexity</span>
                    <span className="text-[13.5px] font-extrabold font-mono text-zinc-100 mt-0.5 tracking-tight">
                      {formatComplexity(spaceComplexity)}
                    </span>
                  </div>
                  <span className={`text-[9.5px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded border select-none transition-all duration-150 ${spaceMeta.colorClass}`}>
                    {spaceMeta.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={md}>
          {safeInsights}
        </ReactMarkdown>

        {isStreaming && (
          <span className="inline-block w-[2px] h-3 bg-zinc-500 ml-1 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  );
}