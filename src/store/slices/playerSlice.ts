import { create } from 'zustand';
import type { PlayerState, RealmInfo, PathType, PathLevel, GameTime } from '../../types';

interface PlayerSlice extends PlayerState {
  gameTime: GameTime;
  turn: number;
  isDead: boolean;
  deathCause: string;
  deathTurn: number;
  currency: number;
  immortalCurrency: number;
  /** P1预留：战斗状态（P2由战斗引擎填充） */
  battleState: import('../../types').CombatState | null;
  /** P1预留：死亡记录（死亡时填充摘要） */
  deathRecord: import('../../types').DeathRecord | null;
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
  getApertureCapacity: () => number;
  feedGu: (guId: string, targetState: string, cost: number) => boolean;
  applyStateUpdate: (update: import('../../types').StateUpdate['player']) => void;
  setRealm: (realm: RealmInfo) => void;
  addAttribute: (attr: '资质' | '体魄' | '心智' | '气运', delta: number) => void;
  setHealth: (current: number, max: number) => void;
  setEssence: (current: number, max: number) => void;
  setPrimaryPath: (path: PathType) => void;
  advanceTurn: () => void;
  setFlag: (key: string, value: any) => void;
  removeFlag: (key: string) => void;
}

const PERIODS: GameTime['period'][] = ['morning', 'noon', 'evening', 'night'];
const SEASONS: GameTime['season'][] = ['spring', 'summer', 'autumn', 'winter'];

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  profile: { name: '', realm: { grand: 1, sub: '初阶', label: '一转初阶' }, background: '南疆' },
  attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
  vitals: { health: { current: 100, max: 100 }, essence: { current: 100, max: 100 } },
  pathBuild: { primary: '' as PathType, secondary: [], path_levels: {}, dao_marks: {} },
  daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
  flags: {},
  turn: 1,
  isDead: false,
  deathCause: '',
  deathTurn: 0,
  currency: 200,
  immortalCurrency: 0,
  battleState: null,
  deathRecord: null,
  gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },

  applyStateUpdate: (update) => {
    if (!update) return;
    const state = get() as PlayerSlice;
    // ─── 境界更新 ───
    if (update.realm) {
      const realmMap: Record<string, { grand: number; sub: string; label: string }> = {
        '一转初阶': { grand: 1, sub: '初阶', label: '一转初阶' },
        '一转中阶': { grand: 1, sub: '中阶', label: '一转中阶' },
        '一转高阶': { grand: 1, sub: '高阶', label: '一转高阶' },
        '一转巅峰': { grand: 1, sub: '巅峰', label: '一转巅峰' },
        '二转初阶': { grand: 2, sub: '初阶', label: '二转初阶' },
        '二转中阶': { grand: 2, sub: '中阶', label: '二转中阶' },
        '二转高阶': { grand: 2, sub: '高阶', label: '二转高阶' },
        '二转巅峰': { grand: 2, sub: '巅峰', label: '二转巅峰' },
        '三转初阶': { grand: 3, sub: '初阶', label: '三转初阶' },
        '三转中阶': { grand: 3, sub: '中阶', label: '三转中阶' },
        '三转高阶': { grand: 3, sub: '高阶', label: '三转高阶' },
        '三转巅峰': { grand: 3, sub: '巅峰', label: '三转巅峰' },
        '四转初阶': { grand: 4, sub: '初阶', label: '四转初阶' },
        '四转中阶': { grand: 4, sub: '中阶', label: '四转中阶' },
        '四转高阶': { grand: 4, sub: '高阶', label: '四转高阶' },
        '四转巅峰': { grand: 4, sub: '巅峰', label: '四转巅峰' },
        '五转初阶': { grand: 5, sub: '初阶', label: '五转初阶' },
        '五转中阶': { grand: 5, sub: '中阶', label: '五转中阶' },
        '五转高阶': { grand: 5, sub: '高阶', label: '五转高阶' },
        '五转巅峰': { grand: 5, sub: '巅峰', label: '五转巅峰' },
      };
      const realmInfo = realmMap[update.realm.value];
      if (realmInfo) {
        set({ profile: { ...state.profile, realm: realmInfo } });
      }
    }
    // ─── 属性更新 ───
    if (update.attributes) {
      const attrs = update.attributes;
      if (attrs.资质) set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 资质: Math.max(0, Math.min(10, s.attributes.资质 + attrs.资质!.value)) } }));
      if (attrs.体魄) set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 体魄: Math.max(0, Math.min(10, s.attributes.体魄 + attrs.体魄!.value)) } }));
      if (attrs.心智) set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 心智: Math.max(0, Math.min(10, s.attributes.心智 + attrs.心智!.value)) } }));
      if (attrs.气运) set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 气运: Math.max(0, Math.min(10, s.attributes.气运 + attrs.气运!.value)) } }));
    }
    // ─── 元石变动（wealth.delta） ───
    if ((update as any).wealth?.delta) {
      const delta = (update as any).wealth.delta;
      set((s: PlayerSlice) => ({ currency: Math.max(0, s.currency + delta) }));
      // 同步写入 yuanStoneSlice 日志（如果已注册）
      const fullStore = get() as any;
      if (delta > 0 && typeof fullStore.addYuanStone === 'function') {
        fullStore.addYuanStone(delta, '叙事事件-收入', undefined, 'gameplay');
      } else if (delta < 0 && typeof fullStore.spendYuanStone === 'function') {
        fullStore.spendYuanStone(Math.abs(delta), '叙事事件-支出', undefined, 'gameplay');
      }
    }
    // ─── 生命/真元 ───
    if (update.health) {
      const newHealth = Math.max(0, Math.min(update.health.current, update.health.max));
      set({ vitals: { ...state.vitals, health: { current: newHealth, max: update.health.max } } });
      // ═══ 死亡检测（4C.1） ═══
      if (newHealth <= 0) {
        set({
          isDead: true,
          deathCause: '生命耗尽',
          deathTurn: state.turn,
        });
      }
    }
    if (update.essence) {
      set({ vitals: { ...state.vitals, essence: { current: Math.min(update.essence.current, update.essence.max), max: update.essence.max } } });
    }
  },
  setRealm: (realm) => set({ profile: { ...get().profile, realm } }),
  addAttribute: (attr, delta) => set((s: PlayerSlice) => ({
    attributes: { ...s.attributes, [attr]: Math.max(0, Math.min(10, s.attributes[attr] + delta)) }
  })),
  setHealth: (current, max) => set({ vitals: { ...get().vitals, health: { current: Math.min(current, max), max } } }),
  setEssence: (current, max) => set({ vitals: { ...get().vitals, essence: { current: Math.min(current, max), max } } }),
  setPrimaryPath: (path) => set((s: PlayerSlice) => ({ pathBuild: { ...s.pathBuild, primary: path } })),
  advanceTurn: () => {
    const state = get() as PlayerSlice;
    const t = state.gameTime;
    const nextPeriodIdx = (PERIODS.indexOf(t.period) + 1) % 4;
    const isNewDay = nextPeriodIdx === 0;
    const newDay = isNewDay ? t.day + 1 : t.day;
    const isNewMonth = newDay > 30;
    const newMonth = isNewMonth ? (t.month % 12) + 1 : t.month;
    const isNewYear = isNewMonth && newMonth === 1;
    set({
      turn: state.turn + 1,
      gameTime: {
        ap: 3,
        max_ap: 3,
        period: PERIODS[nextPeriodIdx],
        day: isNewMonth ? 1 : newDay,
        month: newMonth,
        year: isNewYear ? t.year + 1 : t.year,
        season: SEASONS[Math.floor(((newMonth - 1) / 3) % 4)],
      },
    });
    // ─── 蛊虫饥饿推进（4D.10） ───
    const guStore = get() as any;
    const inventory = guStore.inventory || [];
    const hungerProbs: Record<number, number> = { 1: 0.05, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.25 };
    const stateOrder = ['optimal', 'fed', 'hungry', 'starving', 'dying'] as const;
    for (const gu of inventory) {
      if (!gu.active && !gu.bonded) continue;
      const prob = hungerProbs[gu.tier] || 0.1;
      if (Math.random() >= prob) continue;
      const idx = stateOrder.indexOf(gu.currentState);
      if (idx >= 0 && idx < stateOrder.length - 1) {
        guStore.updateGuState?.(gu.id, stateOrder[idx + 1]);
      }
    }
  },
  setFlag: (key, value) => set((s: PlayerSlice) => ({ flags: { ...s.flags, [key]: value } })),
  removeFlag: (key) => set((s: PlayerSlice) => {
    const { [key]: _, ...rest } = s.flags;
    return { flags: rest };
  }),
  spendCurrency: (amount) => {
    const state = get() as PlayerSlice;
    if (state.currency < amount) return false;
    set({ currency: state.currency - amount });
    return true;
  },
  addCurrency: (amount) => set((s: PlayerSlice) => ({
    currency: Math.max(0, s.currency + amount)
  })),
  getApertureCapacity: () => {
    const state = get() as PlayerSlice;
    const map: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 15 };
    return map[state.profile.realm.grand] || 20;
  },
  feedGu: (guId, targetState, cost) => {
    const state = get() as PlayerSlice;
    if (state.currency < cost) return false;
    // update gu state via guSlice
    (get() as any).updateGuState?.(guId, targetState);
    set({ currency: state.currency - cost });
    return true;
  },
});
