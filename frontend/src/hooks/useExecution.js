import { useRef, useEffect, useCallback } from 'react';
import { useExecutionStore } from '../store/executionStore.js';
import { useEditorStore }    from '../store/editorStore.js';
import { simulateCode }      from '../api/execute.js';

export function useExecution() {
  const {
    steps, currentStep, isPlaying, speed, isLoading, error, truncated,
    setSteps, setCurrentStep, setIsPlaying, setSpeed, setLoading, setError, reset,
  } = useExecutionStore();

  const intervalRef = useRef(null);

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  // Auto-advance playback — reads store directly to avoid stale closures
  useEffect(() => {
    if (!isPlaying) { clearTimer(); return; }

    intervalRef.current = setInterval(() => {
      const s = useExecutionStore.getState();
      const next = s.currentStep + 1;
      if (next >= s.steps.length) {
        s.setIsPlaying(false);
      } else {
        s.setCurrentStep(next);
      }
    }, speed);

    return clearTimer;
  }, [isPlaying, speed]);

  const simulate = useCallback(async (simulationInput = '') => {
    clearTimer();
    reset();
    const { code, language } = useEditorStore.getState();
    if (code && code.length > 1500) {
      setError('Code exceeds the maximum limit of 1500 characters for simulation.');
      return;
    }
    setLoading(true);
    try {
      const { steps: s, truncated: t } = await simulateCode(code, language, simulationInput);
      setSteps(s, t);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    }
  }, []);

  const play = useCallback(() => {
    const s = useExecutionStore.getState();
    if (s.currentStep >= s.steps.length - 1) s.setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const pause       = useCallback(() => setIsPlaying(false), []);
  const stepForward = useCallback(() => { pause(); const s = useExecutionStore.getState(); setCurrentStep(Math.min(s.currentStep + 1, s.steps.length - 1)); }, []);
  const stepBack    = useCallback(() => { pause(); const s = useExecutionStore.getState(); setCurrentStep(Math.max(s.currentStep - 1, 0)); }, []);
  const scrubTo     = useCallback((i) => { pause(); setCurrentStep(i); }, []);

  return {
    steps,
    currentStep,
    currentStepData: steps[currentStep] ?? null,
    isPlaying,
    speed,
    isLoading,
    error,
    truncated,
    simulate,
    play,
    pause,
    stepForward,
    stepBack,
    scrubTo,
    setSpeed,
    reset,
  };
}