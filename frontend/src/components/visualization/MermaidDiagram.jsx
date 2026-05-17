import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

/**
 * Renders a Mermaid flowchart string as an SVG.
 * Falls back to raw text display if the Mermaid syntax is malformed.
 *
 * @param {{ mermaidString: string }} props
 */
export default function MermaidDiagram({ mermaidString }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mermaidString || !containerRef.current) return;

    const id = `mermaid-${Date.now()}`;
    setError(null);

    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, mermaidString);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        // Log the full Mermaid string so you can inspect what failed
        console.warn('[MermaidDiagram] render failed:', err.message);
        console.warn('[MermaidDiagram] failed input:\n', mermaidString);
        setError(mermaidString);
      }
    };

    render();
  }, [mermaidString]);

  if (error) {
    return (
      <div className="p-4">
        <p className="text-yellow-400 text-xs mb-2">
          ⚠️ Could not render diagram — showing raw syntax:
        </p>
        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-gray-900 p-3 rounded">
          {error}
        </pre>
      </div>
    );
  }

  return (
    // overflow-auto gives free pan/scroll on large diagrams
    <div className="overflow-auto w-full h-full p-4">
      <div ref={containerRef} className="min-w-max" />
    </div>
  );
}