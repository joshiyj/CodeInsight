export default function VariablePanel({ variables = {}, changedVariables = [] }) {
  const entries = Object.entries(variables);
  if (entries.length === 0) return null;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700/50 p-3">
      <p className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest mb-2">Variables</p>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, val]) => {
          const changed  = changedVariables.includes(key);
          const display  = Array.isArray(val)
            ? `[${val.join(', ')}]`
            : String(val);

          return (
            <div
              key={key}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono border transition-colors duration-300
                ${changed
                  ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
                  : 'bg-zinc-800 border-zinc-700/40 text-zinc-300'}`}
            >
              <span className="text-indigo-400">{key}</span>
              <span className="text-zinc-600">=</span>
              <span>{display}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}