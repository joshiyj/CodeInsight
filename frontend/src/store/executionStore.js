import { create } from 'zustand';

export const useExecutionStore = create((set, get) => ({
  steps:          [],
  currentStep:    0,
  simulationLine: null,   // the source-code line number the current step lives on
  isPlaying:      false,
  speed:          600,     // ms per step
  isLoading:      false,
  error:          null,
  truncated:      false,

  setSteps: (steps, truncated) => set({
    steps, truncated, currentStep: 0, isPlaying: false, isLoading: false,
    simulationLine: steps[0]?.line ?? null,
  }),

  setCurrentStep: (i) => {
    const { steps } = get();
    set({ currentStep: i, simulationLine: steps[i]?.line ?? null });
  },

  setIsPlaying:   (v)  => set({ isPlaying: v }),
  setSpeed:       (v)  => set({ speed: v }),
  setLoading:     (v)  => set({ isLoading: v, error: null }),
  setError:       (e)  => set({ error: e, isLoading: false }),

  reset: () => set({
    steps: [], currentStep: 0, simulationLine: null, isPlaying: false,
    isLoading: false, error: null, truncated: false,
  }),
}));