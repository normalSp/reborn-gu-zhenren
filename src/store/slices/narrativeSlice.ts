import type { Message, KeyEvent, NarrativeJSON } from '../../types';

interface NarrativeSlice {
  messages: Message[];
  keyEvents: KeyEvent[];
  rollingSummary: string;
  currentNarrative: NarrativeJSON | null;
  isLoading: boolean;
  error: string | null;
  appendMessage: (msg: Message) => void;
  addKeyEvent: (event: KeyEvent) => void;
  updateSummary: (summary: string) => void;
  setCurrentNarrative: (narrative: NarrativeJSON) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const createNarrativeSlice = (set: any, get: any): NarrativeSlice => ({
  messages: [],
  keyEvents: [],
  rollingSummary: '',
  currentNarrative: null,
  isLoading: false,
  error: null,

  appendMessage: (msg) => set((s: NarrativeSlice) => ({
    messages: [...s.messages, msg],
  })),
  addKeyEvent: (event) => set((s: NarrativeSlice) => ({
    keyEvents: [...s.keyEvents, event],
  })),
  updateSummary: (summary) => set({ rollingSummary: summary }),
  setCurrentNarrative: (narrative) => set({ currentNarrative: narrative }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
});
