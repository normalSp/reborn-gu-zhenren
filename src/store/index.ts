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
          const {
            // 排除 uiSlice 的所有字段（不持久化）
            activeTab: _at,
            isSettingsOpen: _s,
            isSaveDialogOpen: _d,
            isEventLogExpanded: _e,
            typewriterSpeed: _ts,
            screenState: _ss,
            setActiveTab: _sat,
            toggleSettings: _tgls,
            toggleSaveDialog: _tgld,
            toggleEventLog: _tgle,
            setTypewriterSpeed: _sts,
            setScreenState: _sss,
            // 排除触发事件 Set（不可序列化）
            triggeredEvents: _te,
            // 排除加载/错误状态
            isLoading: _il,
            error: _err,
            // 排除方法
            ...rest
          } = state as any;
          return rest;
        },
      }
    ),
    { name: 'GuZhenrenStore' }
  )
);
