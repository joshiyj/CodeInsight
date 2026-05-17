import { useRef } from 'react';
// ✂️ Remove: import { toPng } from 'html-to-image';
import MermaidDiagram from './MermaidDiagram';
import { useAnalysisStore } from '../../store/analysisStore';
import { fetchDiagram } from '../../api/diagram';
import { useEditorStore } from '../../store/editorStore';

export default function DiagramPanel() {
  const { code, language } = useEditorStore();
  const {
    diagram,
    isDiagramLoading,
    diagramError,
    isStreaming,
    setDiagram,
    setDiagramLoading,
    setDiagramError,
  } = useAnalysisStore();

  const diagramRef = useRef(null); // ref on the MermaidDiagram wrapper

  const handleGenerate = async () => {
    if (!code?.trim()) return;
    setDiagramLoading(true);
    try {
      const { mermaid } = await fetchDiagram(code, language);
      setDiagram(mermaid);
    } catch (err) {
      setDiagramError(err.message || 'Diagram generation failed');
    }
  };

  const handleExport = () => {
    const svgElement = diagramRef.current?.querySelector('svg');
    if (!svgElement) {
      console.warn('[Export] No SVG found — diagram not rendered yet');
      return;
    }

    // Clone and stamp with proper SVG namespace + explicit dimensions
    const cloned = svgElement.cloneNode(true);
    cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Resolve dimensions from viewBox or bounding box
    const vb = svgElement.viewBox?.baseVal;
    const w  = (vb?.width  > 0 ? vb.width  : svgElement.getBoundingClientRect().width)  || 1200;
    const h  = (vb?.height > 0 ? vb.height : svgElement.getBoundingClientRect().height) || 800;
    cloned.setAttribute('width',  w);
    cloned.setAttribute('height', h);

    // Inject dark background rect as first child
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width',  '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill',   '#0f0f17');
    cloned.insertBefore(bg, cloned.firstChild);

    // Serialize to SVG string
    const svgString = new XMLSerializer().serializeToString(cloned);

    // ── PNG via base64 data URI (avoids canvas cross-origin taint) ──────────
    const SCALE  = 2;
    const canvas = document.createElement('canvas');
    canvas.width  = w * SCALE;
    canvas.height = h * SCALE;

    const ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#0f0f17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // base64 data URI — same-origin, never taints the canvas
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUri = `data:image/svg+xml;base64,${base64}`;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, w, h);
      const a    = document.createElement('a');
      a.download = 'diagram.png';
      a.href     = canvas.toDataURL('image/png');
      a.click();
    };
    img.onerror = (e) => {
      console.error('[Export] Image load failed:', e);
    };
    img.src = dataUri;
  };


  // ── Idle state ───────────────────────────────────────────────
  if (!isDiagramLoading && !diagramError && diagram === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <div className="text-4xl">🗺️</div>
        <p className="text-gray-400 text-sm max-w-xs">
          AI-powered flowchart for any language — JS, Python, Java, C++, and more.
        </p>
        <button
          onClick={handleGenerate}
          disabled={isStreaming || !code?.trim()}
          className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
                     disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg
                     transition-colors"
        >
          {isStreaming ? 'Waiting for review to finish…' : 'Generate Diagram'}
        </button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────
  if (isDiagramLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Generating flowchart…</p>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (diagramError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <div className="text-3xl">⚠️</div>
        <p className="text-red-400 text-sm">{diagramError}</p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────
  if (diagram === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <div className="text-3xl">🤷</div>
        <p className="text-gray-400 text-sm">No diagram available — snippet may be too simple.</p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Diagram state ────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 shrink-0">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Flowchart</span>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Regenerate
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
          >
            Export PNG
          </button>
        </div>
      </div>

      {/* diagramRef wraps the SVG content — export reads the SVG from here */}
      <div className="flex-1 overflow-hidden">
        <div ref={diagramRef} className="h-full">
          <MermaidDiagram mermaidString={diagram} />
        </div>
      </div>
    </div>
  );
}