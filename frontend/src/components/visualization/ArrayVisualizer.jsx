export default function ArrayVisualizer({ array = [], highlightIndices = [], stepType }) {
  if (!Array.isArray(array) || array.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700/50 p-3">
      <p className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest mb-3">Array</p>
      <div className="flex gap-1.5 flex-wrap">
        {array.map((val, idx) => {
          const isHighlighted = highlightIndices.includes(idx);
          const color = isHighlighted
            ? stepType === 'swap'    ? 'bg-green-500/20 border-green-400/60 text-green-300'
            : stepType === 'compare' ? 'bg-orange-500/20 border-orange-400/60 text-orange-300'
            : 'bg-indigo-500/20 border-indigo-400/60 text-indigo-300'
            : 'bg-zinc-800 border-zinc-700/40 text-zinc-300';

          return (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <div className={`w-9 h-9 flex items-center justify-center rounded text-[12px] font-mono font-semibold border transition-colors duration-200 ${color}`}>
                {String(val)}
              </div>
              <span className="text-[9px] text-zinc-600 font-mono">{idx}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}