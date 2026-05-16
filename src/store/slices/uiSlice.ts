// ─── 游戏屏幕状态 ───
// title → character_create → game_play → game_over
export type ScreenState =
  | 'title'
  | 'mode_select'
  | 'origin_select'
  | 'timeline_select'
  | 'timeline_config'
  | 'character_create'
  | 'tutorial'
  | 'game_play'
  | 'game_over';
export type GameMode = 'canon' | 'if';

export type PipelinePhase =
  | 'IDLE'
  | 'BUILDING_CONTEXT'
  | 'FETCHING'
  | 'PARSING'
  | 'VALIDATING_L4'
  | 'VALIDATING_L3'
  | 'VALIDATING_L3_RETRY'
  | 'VALIDATING_FORMAT'
  | 'RESOLVED'
  | 'ERROR';

interface UiSlice {
  activeTab: string;
  isSettingsOpen: boolean;
  isSaveDialogOpen: boolean;
  isEventLogExpanded: boolean;
  isAchievementPanelOpen: boolean;
  typewriterSpeed: number;
  screenState: ScreenState;
  gameMode: GameMode;
  pipelinePhase: PipelinePhase;
  pipelineError: string | null;
  l3Warnings: { ruleName: string; details: string }[];
  /** 读档版本计数器：读档后递增，触发 GameScreen 重新拉取 AI 叙事 */
  gameLoadVersion: number;
  setActiveTab: (tab: string) => void;
  toggleSettings: () => void;
  toggleSaveDialog: () => void;
  toggleEventLog: () => void;
  toggleAchievementPanel: () => void;
  setTypewriterSpeed: (speed: number) => void;
  setScreenState: (state: ScreenState) => void;
  setGameMode: (mode: GameMode) => void;
  setPipelinePhase: (phase: PipelinePhase) => void;
  setPipelineError: (error: string | null) => void;
  setL3Warnings: (warnings: { ruleName: string; details: string }[]) => void;
  incrementLoadVersion: () => void;
}

export const createUiSlice = (set: any, get: any): UiSlice => ({
  activeTab: 'attributes',
  isSettingsOpen: false,
  isSaveDialogOpen: false,
  isEventLogExpanded: false,
  isAchievementPanelOpen: false,
  typewriterSpeed: 20,
  screenState: 'title',
  gameMode: 'canon',
  pipelinePhase: 'IDLE',
  pipelineError: null,
  l3Warnings: [],
  gameLoadVersion: 0,
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSettings: () => set((s: UiSlice) => ({ isSettingsOpen: !s.isSettingsOpen })),
  toggleSaveDialog: () => set((s: UiSlice) => ({ isSaveDialogOpen: !s.isSaveDialogOpen })),
  toggleEventLog: () => set((s: UiSlice) => ({ isEventLogExpanded: !s.isEventLogExpanded })),
  toggleAchievementPanel: () => set((s: UiSlice) => ({ isAchievementPanelOpen: !s.isAchievementPanelOpen })),
  setTypewriterSpeed: (speed) => set({ typewriterSpeed: speed }),
  setScreenState: (state) => set({ screenState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),
  setPipelineError: (error) => set({ pipelineError: error }),
  setL3Warnings: (warnings) => set({ l3Warnings: warnings }),
  incrementLoadVersion: () => set((s: UiSlice) => ({ gameLoadVersion: s.gameLoadVersion + 1 })),
});

export type { UiSlice };
