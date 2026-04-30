import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { createPlayerSlice } from './slices/playerSlice';
import { createGuSlice } from './slices/guSlice';
import { createKillMoveSlice } from './slices/killMoveSlice';
import { createPathSlice } from './slices/pathSlice';
import { createTalentSlice } from './slices/talentSlice';
import { createFactionSlice } from './slices/factionSlice';
import { createImmortalSlice } from './slices/immortalSlice';
import { createCausalitySlice } from './slices/causalitySlice';
import { createEventSlice } from './slices/eventSlice';
import { createNarrativeSlice } from './slices/narrativeSlice';
import { createMapSlice } from './slices/mapSlice';
import { createUiSlice } from './slices/uiSlice';

type RootStore = ReturnType<typeof createPlayerSlice> &
  ReturnType<typeof createGuSlice> &
  ReturnType<typeof createKillMoveSlice> &
  ReturnType<typeof createPathSlice> &
  ReturnType<typeof createTalentSlice> &
  ReturnType<typeof createFactionSlice> &
  ReturnType<typeof createImmortalSlice> &
  ReturnType<typeof createCausalitySlice> &
  ReturnType<typeof createEventSlice> &
  ReturnType<typeof createNarrativeSlice> &
  ReturnType<typeof createMapSlice> &
  ReturnType<typeof createUiSlice>;

export const useStore = create<RootStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createPlayerSlice(...a),
        ...createGuSlice(...a),
        ...createKillMoveSlice(...a),
        ...createPathSlice(...a),
        ...createTalentSlice(...a),
        ...createFactionSlice(...a),
        ...createImmortalSlice(...a),
        ...createCausalitySlice(...a),
        ...createEventSlice(...a),
        ...createNarrativeSlice(...a),
        ...createMapSlice(...a),
        ...createUiSlice(...a),
      }),
      {
        name: 'gu-zhenren-save',
        version: 1,
        partialize: (state) => {
          const s = state as any;
          const {
            // 排除 uiSlice 的所有字段（不持久化）
            activeTab, isSettingsOpen, isSaveDialogOpen, isEventLogExpanded,
            typewriterSpeed, screenState, gameMode,
            pipelinePhase, pipelineError, l3Warnings,
            setActiveTab, toggleSettings, toggleSaveDialog, toggleEventLog,
            setTypewriterSpeed, setScreenState, setGameMode,
            setPipelinePhase, setPipelineError, setL3Warnings,
            // 排除触发事件 Set（不可序列化）
            triggeredEvents,
            // 排除加载/错误状态
            isLoading, error,
            // 排除当前叙事（每次都重新生成）
            currentNarrative,
            // 保留其余可序列化数据
            ...rest
          } = s;
          return rest;
        },
      }
    ),
    { name: 'GuZhenrenStore' }
  )
);
