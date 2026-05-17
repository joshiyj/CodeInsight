// src/store/analysisStore.js
import { create } from 'zustand';

// Module-level ref so CodeEditor can register its cleanup fn
let _clearMarkersCallback = null;

export function registerMarkerCleaner(fn) {
  _clearMarkersCallback = fn;
}

export const useAnalysisStore = create((set) => ({
  insights:      '',
  issues:        [],
  isStreaming:   false,
  error:         null,
  selectedIssue: null,
  diagram: null,
  isDiagramLoading: false,
  diagramError: null,

  appendInsight:    (text)   => set((s) => ({ insights: s.insights + text })),
  setIssues:        (issues) => set({ issues }),
  setIsStreaming:   (val)    => set({ isStreaming: val }),
  setError:         (error)  => set({ error }),
  setSelectedIssue: (issue)  => set({ selectedIssue: issue }),
  
  setDiagram:        (diagram) => set({ diagram, isDiagramLoading: false, diagramError: null }),
  setDiagramLoading: (v)       => set({ isDiagramLoading: v, diagramError: null }),
  setDiagramError:   (msg)     => set({ diagramError: msg, isDiagramLoading: false }),

  reset: () => {
    // Clear Monaco markers before wiping store state
    _clearMarkersCallback?.();
    set({ 
      insights: '', issues: [], isStreaming: false, error: null, selectedIssue: null,
      diagram: null, isDiagramLoading: false, diagramError: null 
    });
  },
}));