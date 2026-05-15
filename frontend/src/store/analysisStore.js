// src/store/analysisStore.js
import { create } from 'zustand';

export const useAnalysisStore = create((set) => ({
  insights:    '',
  issues:      [],      // CodeIssue[]
  isStreaming: false,
  error:       null,

  appendInsight:  (text)   => set((s) => ({ insights: s.insights + text })),
  setIssues:      (issues) => set({ issues }),
  setIsStreaming: (val)    => set({ isStreaming: val }),
  setError:       (error)  => set({ error }),
  reset: () => set({ insights: '', issues: [], isStreaming: false, error: null }),
}));