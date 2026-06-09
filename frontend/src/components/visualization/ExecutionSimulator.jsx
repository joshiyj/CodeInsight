import { useState }       from 'react';
import { useExecution }   from '../../hooks/useExecution.js';
import VariablePanel      from './VariablePanel.jsx';
import ArrayVisualizer    from './ArrayVisualizer.jsx';
import CallStackPanel     from './CallStackPanel.jsx';

const SPEEDS = [
  { label: '0.5×', ms: 1200 },
  { label: '1×',   ms: 600  },
  { label: '2×',   ms: 300  },
  { label: '4×',   ms: 150  },
];

export default function ExecutionSimulator() {
  const [simInput, setSimInput] = useState('');

  const {
    steps, currentStep, currentStepData,
    isPlaying, speed, isLoading, error, truncated,
    simulate, play, pause, stepForward, stepBack, scrubTo, setSpeed, reset,
  } = useExecution();

  const hasSteps    = steps.length > 0;
  const currentData = currentStepData;

  // Find the primary array variable to display
  const primaryArray = currentData
    ? Object.values(currentData.variables || {}).find(v => Array.isArray(v) && v.length > 0) ?? null
    : null;

  // ── Idle state ────────────────────────────────────────────────
  if (!isLoading && !error && !hasSteps) {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            Simulation Input <span className="text-zinc-600">(optional)</span>
          </label>
          <input
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            placeholder="e.g. arr = [64, 34, 25, 12, 22]"
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-[12px] font-mono
                       rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500
                       placeholder:text-zinc-600"
          />
        </div>

        <button
          onClick={() => simulate(simInput)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500
                     text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          ▶ Simulate
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <span className="text-3xl">⚙️</span>
          <p className="text-[11.5px] text-zinc-500 leading-relaxed px-4">
            Step through DSA algorithms and watch variables,<br />
            array state, and call stack update in real time.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Tracing your algorithm…</p>
        <p className="text-zinc-600 text-[11px]">This may take a few seconds</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => simulate(simInput)}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Simulator state ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Action bar — Discard / Re-simulate ──────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 pt-2">
        <button
          onClick={reset}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50
                     text-zinc-400 hover:text-zinc-200 text-[11px] font-medium transition-colors"
        >
          <span className="text-[10px]">✕</span> Discard
        </button>
        <button
          onClick={() => simulate(simInput)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                     bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30
                     text-indigo-400 hover:text-indigo-300 text-[11px] font-medium transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-[10px]">↺</span> Re-simulate
        </button>
      </div>

      {/* Truncation warning */}
      {truncated && (
        <div className="shrink-0 mx-3 mt-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-[10.5px] text-yellow-400">⚠️ Trace capped at 500 steps for performance</p>
        </div>
      )}


      {/* Step description */}
      {currentData && (
        <div className="shrink-0 mx-3 mt-2 px-3 py-2 bg-zinc-900 border border-zinc-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-0.5">
            <StepTypeIcon type={currentData.stepType} />
            <span className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
              {currentData.stepType ?? 'step'} · Line {currentData.line}
            </span>
            <span className="ml-auto text-[9.5px] font-mono text-zinc-600">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <p className="text-[12px] text-zinc-200 leading-snug">{currentData.description}</p>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {/* Array visualizer — only if primary array exists */}
        {primaryArray && (
          <ArrayVisualizer
            array={primaryArray}
            highlightIndices={currentData?.highlightIndices ?? []}
            stepType={currentData?.stepType}
          />
        )}

        {/* Variables + Call Stack side by side */}
        {currentData && (
          <div className="grid grid-cols-2 gap-2">
            <VariablePanel
              variables={currentData.variables}
              changedVariables={currentData.changedVariables ?? []}
            />
            <CallStackPanel callStack={currentData.callStack} />
          </div>
        )}
      </div>

      {/* Playback controls */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-2 space-y-2">
        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={Math.max(0, steps.length - 1)}
          value={currentStep}
          onChange={e => scrubTo(Number(e.target.value))}
          className="w-full h-1 accent-indigo-500 cursor-pointer"
        />

        {/* Buttons + Speed */}
        <div className="flex items-center gap-1.5">
          {/* Reset */}
          <CtrlBtn onClick={reset} title="Reset">⏮</CtrlBtn>
          {/* Step back */}
          <CtrlBtn onClick={stepBack} title="Step back">◀</CtrlBtn>
          {/* Play / Pause */}
          <button
            onClick={isPlaying ? pause : play}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          {/* Step forward */}
          <CtrlBtn onClick={stepForward} title="Step forward">▶</CtrlBtn>
          {/* Jump to end */}
          <CtrlBtn onClick={() => scrubTo(steps.length - 1)} title="Last step">⏭</CtrlBtn>

          {/* Speed selector */}
          <div className="ml-auto flex gap-1">
            {SPEEDS.map(({ label, ms }) => (
              <button
                key={ms}
                onClick={() => setSpeed(ms)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors
                  ${speed === ms
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800
                 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
    >
      {children}
    </button>
  );
}

function StepTypeIcon({ type }) {
  const icons = {
    compare: '⇔', swap: '↕', assign: '=', call: '→',
    return: '←', loop: '↺', recurse: '⟳',
  };
  return <span className="text-[11px]">{icons[type] ?? '•'}</span>;
}