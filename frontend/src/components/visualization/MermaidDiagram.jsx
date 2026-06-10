import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

/**
 * Renders a Mermaid flowchart string as an SVG with interactive zoom, pan, and fit capabilities.
 * Falls back to raw text display if the Mermaid syntax is malformed.
 *
 * @param {{ mermaidString: string }} props
 */
export default function MermaidDiagram({ mermaidString }) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [error, setError] = useState(null);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom & pan when diagram content changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [mermaidString]);

  useEffect(() => {
    if (!mermaidString || !containerRef.current) return;

    const id = `mermaid-${Date.now()}`;
    setError(null);

    const render = async () => {
      try {
        const { svg } = await mermaid.render(id, mermaidString);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // Ensure the SVG fills container bounds nicely without being cut off
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.display = 'block';
            svgEl.style.margin = 'auto';
          }
        }
      } catch (err) {
        console.warn('[MermaidDiagram] render failed:', err.message);
        setError(mermaidString);
      }
    };

    render();
  }, [mermaidString]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click drags
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch/Mobile Drag Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.x;
    const dy = e.touches[0].clientY - dragStart.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  // Handle wheel zoom with non-passive event listener to avoid browser console warnings
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const factor = 1.1;
      let nextZoom = zoom;
      if (e.deltaY < 0) {
        nextZoom = Math.min(5, zoom * factor); // zoom in
      } else {
        nextZoom = Math.max(0.2, zoom / factor); // zoom out
      }
      setZoom(nextZoom);
    };

    wrapper.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      wrapper.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom]);

  // Button toolbar handlers
  const zoomIn = () => setZoom((z) => Math.min(5, z * 1.25));
  const zoomOut = () => setZoom((z) => Math.max(0.2, z / 1.25));
  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (error) {
    return (
      <div className="p-4 select-text">
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
    <div
      ref={wrapperRef}
      className={`relative w-full h-full overflow-hidden bg-zinc-950/20 select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
    >
      {/* Zoom / Pan Toolbar */}
      <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); zoomIn(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-base font-bold shadow-lg transition-all duration-150 cursor-pointer select-none active:scale-95"
          title="Zoom In"
        >
          ＋
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); zoomOut(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-base font-bold shadow-lg transition-all duration-150 cursor-pointer select-none active:scale-95"
          title="Zoom Out"
        >
          －
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); resetViewport(); }}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white text-sm font-bold shadow-lg transition-all duration-150 cursor-pointer select-none active:scale-95"
          title="Reset Fit"
        >
          ↺
        </button>
      </div>

      {/* Floating Instructions */}
      <div className="absolute left-4 bottom-4 pointer-events-none text-[9.5px] text-zinc-500 font-mono select-none bg-zinc-950/60 px-2.5 py-1 rounded-md border border-zinc-900/80 backdrop-blur-sm shadow-md">
        Drag to Pan • Scroll to Zoom
      </div>

      {/* Transforming Viewport Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.1, 0.8, 0.3, 1)',
        }}
        className="w-full h-full flex items-center justify-center p-8"
      >
        <div ref={containerRef} className="flex items-center justify-center w-full" />
      </div>
    </div>
  );
}