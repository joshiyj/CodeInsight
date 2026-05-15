// src/store/editorStore.js
import { create } from 'zustand';

export const useEditorStore = create((set) => ({
  code:        '// Paste your code here and click Analyze\n',
  language:    'javascript',
  isAnalyzing: false,

  setCode:        (code)        => set({ code }),
  setLanguage:    (language)    => set({ language }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
}));