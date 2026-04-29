interface UiSlice {
  activeTab: string;
  isSettingsOpen: boolean;
  isSaveDialogOpen: boolean;
  isEventLogExpanded: boolean;
  typewriterSpeed: number;
  screenState: 'title' | 'input_key' | 'testing' | 'result';
  setActiveTab: (tab: string) => void;
  toggleSettings: () => void;
  toggleSaveDialog: () => void;
  toggleEventLog: () => void;
  setTypewriterSpeed: (speed: number) => void;
  setScreenState: (state: UiSlice['screenState']) => void;
}

export const createUiSlice = (set: any, get: any): UiSlice => ({
  activeTab: 'attributes',
  isSettingsOpen: false,
  isSaveDialogOpen: false,
  isEventLogExpanded: false,
  typewriterSpeed: 20,
  screenState: 'title',
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSettings: () => set((s: UiSlice) => ({ isSettingsOpen: !s.isSettingsOpen })),
  toggleSaveDialog: () => set((s: UiSlice) => ({ isSaveDialogOpen: !s.isSaveDialogOpen })),
  toggleEventLog: () => set((s: UiSlice) => ({ isEventLogExpanded: !s.isEventLogExpanded })),
  setTypewriterSpeed: (speed) => set({ typewriterSpeed: speed }),
  setScreenState: (state) => set({ screenState: state }),
});
