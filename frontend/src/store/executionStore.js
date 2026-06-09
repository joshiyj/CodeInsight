import { create } from 'zustand';

export const useExecutionStore = create((set) => ({
  steps:       [],
  currentStep: 0,
  isPlaying:   false,
  speed:       600,     // ms per step
  isLoading:   false,
  error:       null,
  truncated:   false,

  setSteps:       (steps, truncated) => set({ steps, truncated, currentStep: 0, isPlaying: false, isLoading: false }),
  setCurrentStep: (i)  => set({ currentStep: i }),
  setIsPlaying:   (v)  => set({ isPlaying: v }),
  setSpeed:       (v)  => set({ speed: v }),
  setLoading:     (v)  => set({ isLoading: v, error: null }),
  setError:       (e)  => set({ error: e, isLoading: false }),

  reset: () => set({
    steps: [], currentStep: 0, isPlaying: false,
    isLoading: false, error: null, truncated: false,
  }),
}));