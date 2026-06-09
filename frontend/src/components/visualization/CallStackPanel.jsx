export default function CallStackPanel({ callStack = [] }) {
  if (callStack.length === 0) return null;

  const frames = [...callStack].reverse(); // top of stack first

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700/50 p-3">
      <p className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest mb-2">
        Call Stack <span className="text-zinc-600">({callStack.length})</span>
      </p>
      <div className="flex flex-col gap-1">
        {frames.map((frame, i) => (
          <div
            key={i}
            className={`px-2.5 py-1.5 rounded text-[11px] font-mono border transition-colors
              ${i === 0
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'  // active frame
                : 'bg-zinc-800 border-zinc-700/40 text-zinc-400'}`}
          >
            {i === 0 && <span className="text-[9px] text-indigo-400/60 mr-1.5">▶</span>}
            {frame}
          </div>
        ))}
      </div>
    </div>
  );
}