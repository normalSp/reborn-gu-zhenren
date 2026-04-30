// ─── 游戏屏幕状态 ───
// title → character_create → game_play → game_over
export type ScreenState = 'title' | 'mode_select' | 'origin_select' | 'character_create' | 'game_play' | 'game_over';
export type GameMode = 'canon' | 'if';

export type PipelinePhase = 'IDLE' | 'BUILDING_CONTEXT' | 'FETCHING' | 'PARSING' | 'VALIDATING_L3' | 'VALIDATING_FORMAT' | 'RESOLVED' | 'ERROR';

interface UiSlice {
  activeTab: string;
  isSettingsOpen: boolean;
  isSaveDialogOpen: boolean;
  isEventLogExpanded: boolean;
  typewriterSpeed: number;
  screenState: ScreenState;
  gameMode: GameMode;
  pipelinePhase: PipelinePhase;
  pipelineError: string | null;
  l3Warnings: { ruleName: string; details: string }[];
  setActiveTab: (tab: string) => void;
  toggleSettings: () => void;
  toggleSaveDialog: () => void;
  toggleEventLog: () => void;
  setTypewriterSpeed: (speed: number) => void;
  setScreenState: (state: ScreenState) => void;
  setGameMode: (mode: GameMode) => void;
  setPipelinePhase: (phase: PipelinePhase) => void;
  setPipelineError: (error: string | null) => void;
  setL3Warnings: (warnings: { ruleName: string; details: string }[]) => void;
}

export const createUiSlice = (set: any, get: any): UiSlice => ({
  activeTab: 'attributes',
  isSettingsOpen: false,
  isSaveDialogOpen: false,
  isEventLogExpanded: false,
  typewriterSpeed: 20,
  screenState: 'title',
  gameMode: 'canon',
  pipelinePhase: 'IDLE',
  pipelineError: null,
  l3Warnings: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSettings: () => set((s: UiSlice) => ({ isSettingsOpen: !s.isSettingsOpen })),
  toggleSaveDialog: () => set((s: UiSlice) => ({ isSaveDialogOpen: !s.isSaveDialogOpen })),
  toggleEventLog: () => set((s: UiSlice) => ({ isEventLogExpanded: !s.isEventLogExpanded })),
  setTypewriterSpeed: (speed) => set({ typewriterSpeed: speed }),
  setScreenState: (state) => set({ screenState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),
  setPipelineError: (error) => set({ pipelineError: error }),
  setL3Warnings: (warnings) => set({ l3Warnings: warnings }),
});

export type { UiSlice };
