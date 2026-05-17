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

  appendInsight:    (text)   => set((s) => ({ insights: s.insights + text })),
  setIssues:        (issues) => set({ issues }),
  setIsStreaming:   (val)    => set({ isStreaming: val }),
  setError:         (error)  => set({ error }),
  setSelectedIssue: (issue)  => set({ selectedIssue: issue }),

  reset: () => {
    // Clear Monaco markers before wiping store state
    _clearMarkersCallback?.();
    set({ insights: '', issues: [], isStreaming: false, error: null, selectedIssue: null });
  },
}));