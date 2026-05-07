import type { PlayerState, RealmInfo, PathType, PathLevel, GameTime, HeavenlyLand, ExtremePhysiqueType } from '../../types';
import { tickHeavenlyLand } from '../../engine/HeavenlyLandEngine';
import { computePathLevel } from '../../engine/path-progression';
import { getMigrationNpcs, crossDomainAffinityDecay, filterNpcByDomain } from '../../engine/npc-cross-domain';
import { deriveCombatStats, extractTalentModifiers } from '../../engine/combat-stats';
import { checkChapterGoals } from '../../engine/goal-checker';
import { triggerBreakthrough } from '../../components/game/BreakthroughAnimation';

// ═══ Fix#5: 十绝体道痕亲和矩阵（内联定义，因 extreme-physique-daomark-affinity.json 尚未创建） ═══
interface ExtremePhysiqueAffinity {
  /** 亲和流派→道痕亲和值(80-100) */
  primaryPaths: Record<string, number>;
  /** 禁制流派（亲和=0，不可修行） */
  forbiddenPaths: string[];
  /** 反噬流派（亲和为负，修行扣HP） */
  backlashPaths?: Record<string, number>;
  /** 修行效率修正 */
  cultivationMod?: {
    type: 'time_based' | 'location_based' | 'flat_bonus';
    /** 白昼倍率（仅 time_based） */
    dayMultiplier?: number;
    /** 夜晚倍率（仅 time_based） */
    nightMultiplier?: number;
    /** 每转额外道痕增长（境界突破时） */
    daoMarkPerRealm?: number;
  };
}

const EXTREME_PHYSIQUE_AFFINITIES: Record<ExtremePhysiqueType, ExtremePhysiqueAffinity> = {
  '太日阳莽体': {
    primaryPaths: { '宇道': 90 },
    forbiddenPaths: ['暗道', '魂道'],
    backlashPaths: { '影道': -30 },
    cultivationMod: { type: 'time_based', dayMultiplier: 2.0, nightMultiplier: 0.2, daoMarkPerRealm: 5 },
  },
  '古月阴荒体': {
    primaryPaths: { '宙道': 90 },
    forbiddenPaths: ['光道', '炎道'],
    backlashPaths: { '阳道': -30 },
    cultivationMod: { type: 'time_based', dayMultiplier: 0.3, nightMultiplier: 2.5, daoMarkPerRealm: 5 },
  },
  '北冥冰魄体': {
    primaryPaths: { '冰道': 90, '水道': 70 },
    forbiddenPaths: ['炎道', '火道'],
    backlashPaths: { '炎道': -40, '火道': -30 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '森海轮回体': {
    primaryPaths: { '木道': 90 },
    forbiddenPaths: ['金道'],
    backlashPaths: { '金道': -20 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '炎煌雷泽体': {
    primaryPaths: { '炎道': 85, '雷道': 85 },
    forbiddenPaths: ['水道', '冰道'],
    backlashPaths: { '水道': -35, '冰道': -35 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '万金妙华体': {
    primaryPaths: { '金道': 95 },
    forbiddenPaths: ['木道', '炎道'],
    backlashPaths: { '木道': -20 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '大力真武体': {
    primaryPaths: { '力道': 100 },
    forbiddenPaths: ['智道', '魂道'],
    backlashPaths: { '智道': -25 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '逍遥智心体': {
    primaryPaths: { '智道': 95 },
    forbiddenPaths: ['力道'],
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '厚土元央体': {
    primaryPaths: { '土道': 90 },
    forbiddenPaths: ['风道'],
    cultivationMod: { type: 'location_based', daoMarkPerRealm: 5 },
  },
  '宇宙大衍体': {
    primaryPaths: { '变化道': 90, '宇道': 70 },
    forbiddenPaths: [],
    backlashPaths: { '雷道': -20 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 5 },
  },
  '纯梦求真体': {
    primaryPaths: { '梦道': 80 },
    forbiddenPaths: ['魂道'],
    backlashPaths: { '魂道': -50 },
    cultivationMod: { type: 'flat_bonus', daoMarkPerRealm: 3 },
  },
};

/** 获取当前玩家十绝体类型（从 aperture 中读取） */
function getExtremePhysiqueType(get: any): ExtremePhysiqueType | null {
  try {
    const aperture = get().aperture;
    if (aperture?.extremePhysiqueType) {
      return aperture.extremePhysiqueType as ExtremePhysiqueType;
    }
    // 备选：从 profile 或 flags 中读取
    const flags = get().flags || {};
    if (flags._extremePhysiqueType) {
      return flags._extremePhysiqueType as ExtremePhysiqueType;
    }
  } catch { /* aperture state not loaded */ }
  return null;
}

/** Fix#5: 十绝体境界突破时应用道痕亲和增长 */
function applyExtremePhysiqueRealmGrowth(set: any, get: any, newGrand: number) {
  const physiqueType = getExtremePhysiqueType(get);
  if (!physiqueType) return;

  const affinity = EXTREME_PHYSIQUE_AFFINITIES[physiqueType];
  if (!affinity) return;

  const daoMarkPerRealm = affinity.cultivationMod?.daoMarkPerRealm ?? 5;
  const currentDaoMarks = { ...(get().pathBuild?.dao_marks || {}) };
  let daoMarksChanged = false;

  // 亲和流派 +N 道痕/转
  for (const [path, baseAffinity] of Object.entries(affinity.primaryPaths)) {
    const growth = Math.round(daoMarkPerRealm * (baseAffinity / 100));
    currentDaoMarks[path] = (currentDaoMarks[path] || 0) + growth;
    daoMarksChanged = true;
    console.log(`[ExtremePhysique] ${physiqueType} 境界突破: ${path} +${growth}道痕 (newGrand=${newGrand})`);
  }

  if (daoMarksChanged) {
    set((s: PlayerSlice) => ({
      pathBuild: { ...s.pathBuild, dao_marks: currentDaoMarks },
    }));
  }
}

interface PlayerSlice extends PlayerState {
  gameTime: GameTime;
  turn: number;
  isDead: boolean;
  deathCause: string;
  deathTurn: number;
  /** P2补完: 累计死亡次数（用于成就检测） */
  deathCount: number;
  currency: number;
  immortalCurrency: number;
  /** P0.2: 达到过的最高境界转数 */
  maxRealmReached: number;
  /** P0.2: 累计获得元石总额 */
  totalCurrencyEarned: number;
  /** P0.2: 人祖传说听闻次数 */
  renZuLegendsHeard: number;
  /** P2: 战斗状态 */
  battleState: import('../../types').CombatState | null;
  /** P2: 死亡记录（死亡时填充摘要） */
  deathRecord: import('../../types').DeathRecord | null;
  /** P2-14: 洞天/福地状态 */
  heavenlyLand: HeavenlyLand | null;
  /** P2-14: 洞天福地产出的蛊材背包 */
  materialBag: Record<string, number>;
  /** P4: 蛊材物资袋容量（随境界增长） */
  materialBagCapacity: number;
  /** P4: 获取当前物资袋容量 */
  getMaterialBagCapacity: () => number;
  spendCurrency: (amount: number) => boolean;
  addCurrency: (amount: number) => void;
  getApertureCapacity: () => number;
  feedGu: (guId: string, targetState: string, cost: number) => boolean;
  applyStateUpdate: (update: import('../../types').StateUpdate['player']) => void;
  setRealm: (realm: RealmInfo) => void;
  addAttribute: (attr: '资质' | '体魄' | '心智' | '气运', delta: number) => void;
  setHealth: (current: number, max: number) => void;
  /** P0.1: 对玩家造成固定数值的HP变更（正=恢复，负=伤害），附带来源追踪 */
  applyHpDelta: (amount: number, source?: string) => void;
  /** P0.1: 对玩家造成百分比HP变更（正=恢复，负=伤害），基于maxHP计算 */
  applyHpPercent: (pct: number, source?: string) => void;
  setEssence: (current: number, max: number) => void;
  setPrimaryPath: (path: PathType) => void;
  advanceTurn: () => void;
  setFlag: (key: string, value: any) => void;
  removeFlag: (key: string) => void;
  /** P2-14: 向蛊材背包添加材料 */
  addMaterial: (materialName: string, quantity: number) => void;
  /** P4数值修复：直接设置仙元石余额（用于时间线起点初始化） */
  setImmortalCurrency: (amount: number) => void;
  /** P4数值修复: 战斗属性桥接 — 体魄/资质/境界→HP/ATK/DEF */
  combatStats: { hp: number; maxHp: number; attack: number; defense: number; accuracy: number; evasion: number } | null;
  setCombatStats: (stats: { hp: number; maxHp: number; attack: number; defense: number; accuracy: number; evasion: number }) => void;
}

const PERIODS: GameTime['period'][] = ['morning', 'noon', 'evening', 'night'];
const SEASONS: GameTime['season'][] = ['spring', 'summer', 'autumn', 'winter'];

/** P2补完: 从角色属性+境界+天赋重新推导战斗数值（HP/ATK/DEF/命中/闪避） */
function recalcCombatStats(set: any, get: any) {
  const state = get() as PlayerSlice & { selectedTalents?: Array<{ benefits?: string[]; costs?: string[] }> };
  const { physique, aptitude, mind } = state.attributes;
  const realmGrand = state.profile.realm.grand;
  const selectedTalents = state.selectedTalents;
  const talentModifiers = selectedTalents ? extractTalentModifiers(selectedTalents as any[]) : [];
  const cStats = deriveCombatStats({ physique: physique ?? 5, aptitude: aptitude ?? 5, mind: mind ?? 5, realmGrand: realmGrand ?? 1, talentModifiers });

  // ═══ v0.8.0-immortal: 根据能量类型设置不同上限 ═══
  const isImmortal = realmGrand >= 6;
  const essenceType = (isImmortal ? 'immortal' : 'mortal') as 'mortal' | 'immortal';
  // 游戏中途重推导时保留当前essence值，只更新上限
  const currentEssence = state.vitals?.essence;
  let newEssence: { current: number; max: number };
  if (currentEssence) {
    const maxEssence = isImmortal ? 2000 : (100 + realmGrand * 30);
    newEssence = { current: Math.min(currentEssence.current, maxEssence), max: maxEssence };
  } else {
    newEssence = isImmortal ? { current: 2000, max: 2000 } : { current: 100 + realmGrand * 30, max: 100 + realmGrand * 30 };
  }

  set({
    combatStats: cStats,
    vitals: {
      health: { current: cStats.maxHp, max: cStats.maxHp },
      essence: newEssence,
      essenceType,
    },
  });
}

export const createPlayerSlice = (set: any, get: any): PlayerSlice => ({
  profile: { name: '', realm: { grand: 1, sub: '初阶', label: '一转初阶' }, background: '南疆' },
  attributes: { 资质: 5, 体魄: 5, 心智: 5, 气运: 5 },
  vitals: { health: { current: 100, max: 100 }, essence: { current: 100, max: 100 }, essenceType: 'mortal' as const },
  pathBuild: { primary: '' as PathType, secondary: [], path_levels: {}, dao_marks: {} },
  daoHeart: { kill: 0, mercy: 0, scheme: 0, ambition: 0 },
  flags: {},
  turn: 1,
  isDead: false,
  deathCause: '',
  deathTurn: 0,
  deathCount: 0,
  currency: 200,
  immortalCurrency: 0,
  // ═══ P0.2: 幽灵计数器初始值 ═══
  maxRealmReached: 1,
  totalCurrencyEarned: 0,
  renZuLegendsHeard: 0,
  combatStats: null,
  battleState: null,
  deathRecord: null,
  heavenlyLand: null,
  materialBag: {},
  materialBagCapacity: 20,
  gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 1, month: 1, year: 1, season: 'spring' },

  applyStateUpdate: (update) => {
    if (!update) return;
    const state = get() as PlayerSlice;
    let needsCombatRecalc = false; // P2补完: 追踪是否需要重推导战斗数值
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
        needsCombatRecalc = true; // P2补完: 境界变化 → 重新推导战斗数值

        // ═══ v0.8.0-immortal: 升仙时自动切换 essenceType + 填充仙元池 ═══
        if (realmInfo.grand >= 6) {
          const updated = get() as PlayerSlice;
          if (updated.vitals.essenceType !== 'immortal') {
            set((s: PlayerSlice) => ({
              vitals: {
                ...s.vitals,
                essenceType: 'immortal',
                essence: { current: 2000, max: 2000 },
              },
            }));
            const logStore = get() as any;
            if (typeof logStore.addGameLog === 'function') {
              logStore.addGameLog('system', '⚡升仙质变！真元化作仙元，仙元池充盈（2000/2000）', {
                realm: realmInfo.label, essenceType: 'immortal',
              });
            }
          }
        }

        // ═══ Fix#5: 十绝体境界突破时应用道痕亲和增长 ═══
        applyExtremePhysiqueRealmGrowth(set, get, realmInfo.grand);
        // ═══ P0.2: 更新最高境界 ═══
        const current = get() as PlayerSlice;
        if (realmInfo.grand > current.maxRealmReached) {
          set({ maxRealmReached: realmInfo.grand } as any);
        }
        // ═══ 日志埋点: 境界突破
        const logStore = get() as any;
        if (typeof logStore.addGameLog === 'function') {
          logStore.addGameLog('system', `境界突破: ${realmInfo.label}`, {
            realm: realmInfo.label, grand: realmInfo.grand, turn: state.turn,
          });
        }

        // ═══ 空窍状态推进：若当前为 MortalAperture，按新境界更新 ═══
        const fullStore = get() as any;
        const currentAperture = fullStore.aperture;
        if (currentAperture && currentAperture.type === 'mortal') {
          const newRank = realmInfo.grand;
          const newSubRank = realmInfo.sub as '初阶' | '中阶' | '高阶' | '巅峰';
          // 元海颜色：按转数映射
          const colorNameByRank: Record<number, '青铜' | '赤铁' | '白银' | '黄金' | '紫晶'> = {
            1: '青铜', 2: '赤铁', 3: '赤铁', 4: '白银', 5: '黄金',
          };
          const colorMap: Record<string, string> = {
            '青铜': '#4a8c5c', '赤铁': '#8c4a4a', '白银': '#8c8c9a', '黄金': '#c9a84a', '紫晶': '#7a4a9a',
          };
          const colorName = colorNameByRank[newRank] || '青铜';
          // 窍壁状态：初/中阶坚实，高阶潮汐初现，巅峰潮汐涌动
          const wallStateBySub: Record<string, '坚实' | '潮汐初现' | '潮汐涌动' | '壁薄如纸'> = {
            '初阶': '坚实', '中阶': '坚实', '高阶': '潮汐初现', '巅峰': '潮汐涌动',
          };
          // 容量：按转数
          const capacityByRank: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 15 };
          // 保持现有 fillPercent（十绝体100%）或根据资质更新
          const existingFill = currentAperture.primevalSea?.fillPercent ?? 50;
          const updatedAperture = {
            ...currentAperture,
            rank: newRank,
            subRank: newSubRank,
            primevalSea: {
              ...currentAperture.primevalSea,
              color: colorMap[colorName],
              colorName,
              fillPercent: existingFill,
            },
            apertureWall: {
              ...currentAperture.apertureWall,
              state: wallStateBySub[newSubRank] || '坚实',
              opacity: newSubRank === '巅峰' ? 0.7 : (newSubRank === '高阶' ? 0.85 : 1),
              description: newSubRank === '巅峰'
                ? '窍壁已薄如纸，真元满溢而出——距升仙仅一步之遥'
                : newSubRank === '高阶'
                  ? '潮汐之力冲刷窍壁，真元流转愈发汹涌'
                  : '窍壁坚实，真元流转自如',
            },
            capacity: capacityByRank[newRank] || currentAperture.capacity,
          };
          fullStore.initializeMortalAperture?.(updatedAperture);
        }
      }
    }
    // ─── 属性更新 ───
    if (update.attributes) {
      const attrs = update.attributes;
      if (attrs.资质) { set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 资质: Math.max(0, Math.min(10, s.attributes.资质 + attrs.资质!.value)) } })); needsCombatRecalc = true; }
      if (attrs.体魄) { set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 体魄: Math.max(0, Math.min(10, s.attributes.体魄 + attrs.体魄!.value)) } })); needsCombatRecalc = true; }
      if (attrs.心智) { set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 心智: Math.max(0, Math.min(10, s.attributes.心智 + attrs.心智!.value)) } })); needsCombatRecalc = true; }
      if (attrs.气运) set((s: PlayerSlice) => ({ attributes: { ...s.attributes, 气运: Math.max(0, Math.min(10, s.attributes.气运 + attrs.气运!.value)) } }));
    }
    // ─── 元石变动（wealth.delta） ───
    if ((update as any).wealth?.delta) {
      const delta = (update as any).wealth.delta;
      set((s: PlayerSlice) => ({
        currency: Math.max(0, s.currency + delta),
        // ═══ P0.2: 累计元石（仅正收入） ═══
        totalCurrencyEarned: delta > 0 ? s.totalCurrencyEarned + delta : s.totalCurrencyEarned,
      }));
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
        const currentDeathCount = (get() as PlayerSlice).deathCount || 0;
        set({
          isDead: true,
          deathCause: '生命耗尽',
          deathTurn: state.turn,
          deathCount: currentDeathCount + 1,
        });
      }
    }
    if (update.essence) {
      set({ vitals: { ...state.vitals, essence: { current: Math.min(update.essence.current, update.essence.max), max: update.essence.max } } });
    }
    // ═══ v0.8.0-immortal: 能量类型切换（AI叙事触发升仙时同步切换） ═══
    if (update.essenceType) {
      set((s: PlayerSlice) => ({
        vitals: {
          ...s.vitals,
          essenceType: update.essenceType!,
          essence: update.essenceType === 'immortal'
            ? { current: 2000, max: 2000 }
            : s.vitals.essence,
        },
      }));
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('system', `能量类型切换: ${update.essenceType}`, {
          essenceType: update.essenceType,
        });
      }
    }
    // ─── 道痕更新（增量合并到现有 dao_marks） ───
    if (update.dao_marks) {
      const currentDaoMarks = { ...state.pathBuild.dao_marks };
      for (const [path, delta] of Object.entries(update.dao_marks)) {
        currentDaoMarks[path] = (currentDaoMarks[path] || 0) + delta;
      }
      set((s: PlayerSlice) => ({
        pathBuild: { ...s.pathBuild, dao_marks: currentDaoMarks },
      }));
      // 同步到 pathSlice.daoMarks（如存在）
      const fullStore = get() as any;
      if (typeof fullStore.addDaoMarks === 'function') {
        for (const [path, delta] of Object.entries(update.dao_marks)) {
          fullStore.addDaoMarks(path, delta);
        }
      }
    }
    // ─── 流派境界更新 ───
    if (update.path_levels) {
      const currentLevels = { ...state.pathBuild.path_levels };
      for (const [path, level] of Object.entries(update.path_levels)) {
        currentLevels[path] = level;
      }
      set((s: PlayerSlice) => ({
        pathBuild: { ...s.pathBuild, path_levels: currentLevels },
      }));
    }
    // ═══ P2补完: 境界或属性发生变化时，重新推导战斗数值 ═══
    if (needsCombatRecalc) {
      recalcCombatStats(set, get);
    }
  },
  setRealm: (realm) => set({ profile: { ...get().profile, realm } }),
  addAttribute: (attr, delta) => {
    set((s: PlayerSlice) => ({
      attributes: { ...s.attributes, [attr]: Math.max(0, Math.min(10, s.attributes[attr] + delta)) }
    }));
    // P2补完: 属性变化后重新推导战斗数值
    recalcCombatStats(set, get);
  },
  setHealth: (current, max) => set({ vitals: { ...get().vitals, health: { current: Math.min(current, max), max } } }),
  // ═══ P0.1: 固定数值HP变更（正=恢复，负=伤害） ═══
  applyHpDelta: (amount, source = 'system') => {
    const state = get() as PlayerSlice;
    const { vitals } = state;
    const newCurrent = Math.max(0, Math.min(vitals.health.current + amount, vitals.health.max));
    set({ vitals: { ...vitals, health: { current: newCurrent, max: vitals.health.max } } });

    // 事件日志：记录HP变动来源
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      const sign = amount >= 0 ? '+' : '';
      logStore.addGameLog('combat', `生命 ${sign}${amount} (${source}) → ${newCurrent}/${vitals.health.max}`, {
        delta: amount, source, currentHp: newCurrent, maxHp: vitals.health.max,
      });
    }

    // 死亡检测
    if (newCurrent <= 0) {
      const currentDeathCount = (get() as PlayerSlice).deathCount || 0;
      set({ isDead: true, deathCause: source, deathTurn: state.turn, deathCount: currentDeathCount + 1 });
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('combat', `💀 角色死亡: ${source}`, { turn: state.turn });
      }
    }
  },
  // ═══ P0.1: 百分比HP变更（正=恢复，负=伤害） ═══
  applyHpPercent: (pct, source = 'system') => {
    const state = get() as PlayerSlice;
    const amount = Math.floor(state.vitals.health.max * pct / 100);
    (get() as any).applyHpDelta(amount, source);
  },
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
    // ═══ v0.8.0-immortal: 蛊师真元消耗与元石补充 ═══
    const realmGrand = (get() as PlayerSlice).profile.realm.grand;
    const vitals = (get() as PlayerSlice).vitals;
    if (realmGrand < 6 && vitals.essenceType !== 'immortal') {
      // 蛊师每回合消耗微量真元维持空窍运转；低于50%自动吸收元石
      const essencePct = vitals.essence.current / vitals.essence.max;
      if (essencePct < 0.5) {
        const currency = (get() as PlayerSlice).currency;
        const STONE_COST = 1; // 1元石
        if (currency >= STONE_COST) {
          // 元石补充真元量（参照economy.json：一转100→二转70→三转40→四转20→五转10）
          const essenceGain: Record<number, number> = { 1: 100, 2: 70, 3: 40, 4: 20, 5: 10 };
          const gain = essenceGain[realmGrand] || 10;
          const newEssence = Math.min(vitals.essence.current + gain, vitals.essence.max);
          set((s: PlayerSlice) => ({
            currency: s.currency - STONE_COST,
            vitals: {
              ...s.vitals,
              essence: { ...s.vitals.essence, current: newEssence },
            },
          }));
          // 日志记录
          const logStore = get() as any;
          if (typeof logStore.addGameLog === 'function') {
            logStore.addGameLog('system', `吸收元石恢复真元+${gain} (${STONE_COST}元石消耗)`, {
              essenceGain: gain, essenceCurrent: newEssence, essenceMax: vitals.essence.max,
            });
          }
        }
      }
    }

    // ═══ P2-13: 蛊虫饥饿推进（确定性计数模型，替代旧概率模型） ═══
    const guStore = get() as any;
    if (typeof guStore.tickGuHunger === 'function') {
      guStore.tickGuHunger();
    } else {
      // 旧概率模型兜底（存量系统兼容）
      const inventory = guStore.inventory || [];
      const stateOrder = ['optimal', 'hungry', 'injured', 'dead'] as const;
      for (const gu of inventory) {
        if (!gu.active && !gu.bonded) continue;
        const prob = { 1: 0.05, 2: 0.10, 3: 0.15, 4: 0.20, 5: 0.25 }[gu.tier] || 0.1;
        if (Math.random() >= prob) continue;
        const idx = stateOrder.indexOf(gu.currentState);
        if (idx >= 0 && idx < stateOrder.length - 1) {
          guStore.updateGuState?.(gu.id, stateOrder[idx + 1]);
        }
      }
    }

    // ═══ P2-14: 洞天/福地推进（HeavenlyLandEngine纯函数集成） ═══
    const currentStore = get() as any;
    const land = currentStore.heavenlyLand as HeavenlyLand | null;
    if (land && land.accessible) {
      const landState = currentStore as PlayerSlice;
      // 推进洞天/福地
      const result = tickHeavenlyLand(
        land,
        {
          totalDaoDensity: currentStore.aperture?.dao_mark_density
            ? Object.values(currentStore.aperture.dao_mark_density as Record<string, number>).reduce((a: number, b: number) => a + b, 0)
            : 0,
          realmGrand: landState.profile.realm.grand,
          turn: landState.turn,
        },
        landState.profile.realm.grand,
        landState.turn,
      );
      // 资源产出写入materialBag
      if (result.resourceYield > 0) {
        const mats = currentStore.materialBag || {};
        const key = `${land.domain}灵材`;
        mats[key] = (mats[key] || 0) + result.resourceYield;
        set({ materialBag: { ...mats } });
      }
      // 灾劫叙事注入到narrativeSlice
      if (result.narrativeInjection && typeof currentStore.appendNarrative === 'function') {
        currentStore.appendNarrative(result.narrativeInjection, 'system');
      }
      // 更新heavenlyLand状态（已被tickHeavenlyLand就地修改）
      set({ heavenlyLand: { ...land } });
    }

    // ═══ P2-13: NPC关系网络自然漂移 ═══
    if (typeof guStore.tickNpcRelations === 'function') {
      guStore.tickNpcRelations();
    }

    // ═══ P2补完: 跨域NPC亲和衰减（离开某域后该域NPC好感每10轮-1） ═══
    try {
      const factionStore = get() as any;
      const currentDomain = factionStore.currentDomain || (get() as PlayerSlice).profile?.background || '南疆';
      const turn = (get() as PlayerSlice).turn;
      if (turn % 10 === 0) {
        crossDomainAffinityDecay(factionStore, currentDomain);
      }
    } catch { /* npc cross-domain not ready */ }

    // ═══ CR2: 域内NPC过滤 — 每回合将活跃NPC池限制在40-60人 ═══
    try {
      const factionStore = get() as any;
      const currentDomain = factionStore.currentDomain || (get() as PlayerSlice).profile?.background || '南疆';
      const currentFaction = factionStore.currentFaction || '';
      // 从 NPC 关系矩阵中提取活跃 NPC 列表构建 NpcRecord[]
      const npcMatrix = factionStore.npcRelations?.matrix || {};
      const npcRecords = Object.entries(npcMatrix).map(([id, data]: [string, any]) => ({
        id,
        name: (data as any).name || id,
        faction: (data as any).faction || '',
        domain: (data as any).domain || currentDomain,
        role: (data as any).role || 'minor',
        personality: (data as any).personality || '',
        relationship: (data as any).relationship || 'neutral',
      }));
      if (npcRecords.length > 0) {
        const { filtered } = filterNpcByDomain(npcRecords, currentDomain, currentFaction);
        // 存储过滤后的活跃NPC池供下游系统使用
        factionStore.activeNpcPool || (set as any)({ activeNpcPool: filtered });
        if (typeof factionStore.setActiveNpcPool === 'function') {
          factionStore.setActiveNpcPool(filtered);
        }
      }
    } catch { /* filterNpcByDomain not ready */ }

    // ═══ P2-流派: 本命蛊冷却递减 ═══
    if (typeof guStore.tickLifeboundCooldown === 'function') {
      guStore.tickLifeboundCooldown();
    }

    // ═══ P0.3: 杀招冷却递减 ═══
    const killStore = get() as any;
    if (typeof killStore.tickCooldowns === 'function') {
      killStore.tickCooldowns();
    }

    // ═══ P1.1: 拍卖会触发 + NPC竞价推进 ═══
    const auctionStore = get() as any;
    if (typeof auctionStore.tickAuction === 'function') {
      auctionStore.tickAuction();
    }
    if (typeof auctionStore.initAuction === 'function') {
      const currentTurn = (get() as PlayerSlice).turn;
      const lastAuction = auctionStore.auctionLastTurn || 0;
      if (currentTurn >= 10 && currentTurn % 10 === 0 && currentTurn > lastAuction) {
        auctionStore.initAuction();
      }
    }

    // ═══ P1.2: 章节目标推进检测 ═══
    const chapterStore = get() as any;
    // ═══ P2补完: 先执行目标检测，再检查推进 ═══
    try {
      checkChapterGoals(chapterStore, {
        chapterId: chapterStore.currentChapterId || null,
        currentDomain: chapterStore.currentDomain || '南疆',
        realmGrand: (get() as PlayerSlice).profile.realm.grand,
        turn: (get() as PlayerSlice).turn,
        currency: (get() as PlayerSlice).currency,
        flags: chapterStore.flags || {},
      });
    } catch { /* goal checker not ready */ }
    if (typeof chapterStore.checkProgression === 'function') {
      const result = chapterStore.checkProgression() as any;
      if (result?.shouldTransition && result?.nextChapterId) {
        if (typeof chapterStore.activateChapter === 'function') {
          chapterStore.activateChapter(result.nextChapterId);
        }
      }
    }

    // ═══ P1.4: 流派晋升检测 ═══
    if (typeof chapterStore.addDaoMarks === 'function') {
      // 读取当前各流派道痕 → 计算期望境界 → 与当前比较 → 晋升通知
      const currentDaoMarks = (get() as any).daoMarks || (get() as PlayerSlice).pathBuild?.dao_marks || {};
      const currentPathLevels = (get() as any).pathLevels || (get() as PlayerSlice).pathBuild?.path_levels || {};
      let anyPromoted = false;
      const newPathLevels: Record<string, any> = { ...currentPathLevels };
      for (const [path, marks] of Object.entries(currentDaoMarks)) {
        if (typeof marks !== 'number') continue;
        const expectedLevel = computePathLevel(marks);
        if (expectedLevel !== (currentPathLevels[path] || '普通')) {
          newPathLevels[path] = expectedLevel;
          anyPromoted = true;
        }
      }
      if (anyPromoted) {
        set((s: PlayerSlice) => ({
          pathBuild: { ...s.pathBuild, path_levels: newPathLevels },
        }));
        // 同步到 pathSlice
        for (const [path, level] of Object.entries(newPathLevels)) {
          if (typeof chapterStore.setPathLevel === 'function') chapterStore.setPathLevel(path, level);
        }
        const logStore = get() as any;
        if (typeof logStore.addGameLog === 'function') {
          logStore.addGameLog('system', '流派境界晋升！', { pathLevels: newPathLevels });
        }
        // P4: 流派晋升时触发突破动画
        const promotedPaths = Object.entries(newPathLevels).filter(([p, l]) => l !== (currentPathLevels[p] || '普通'));
        if (promotedPaths.length > 0) {
          const [mainPath, mainLevel] = promotedPaths[0] as [string, string];
          try { triggerBreakthrough({ path: mainPath, level: mainLevel, realm: state.profile?.realm?.grand ? `${state.profile.realm.grand}转` : '未知' }); } catch {}
        }
      }
    }

    // ═══ P1.3: NPC 跨域迁移检测（每10回合检测当前章节的迁移事件） ═══
    const nsl = get() as any;
    if (nsl.turn % 10 === 0) {
      const currentChapterId = nsl.currentChapterId || '';
      if (currentChapterId) {
        const migrations = getMigrationNpcs(currentChapterId);
        if (migrations.length > 0) {
          for (const m of migrations) {
            if (typeof nsl.updateNpcRelation === 'function') {
              nsl.updateNpcRelation(m.npcId, 'player', 0, 0);
            }
          }
          if (typeof nsl.addGameLog === 'function') {
            nsl.addGameLog('system', `跨域迁移: ${migrations.map((m: any) => m.npcName).join('、')} 移至 ${migrations[0]?.toDomain || '异域'}`, {
              npcCount: migrations.length,
            });
          }
        }
      }
    }

    // ═══ B1.2: 仙窍资源节点产出（蛊仙→每回合自动产出蛊材） ═══
    const apertureStore = get() as any;
    if (typeof apertureStore.tickAperture === 'function') {
      apertureStore.tickAperture(1); // 每回合推进1天
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
    currency: Math.max(0, s.currency + amount),
    // ═══ P0.2: 累计获得元石（仅正收入） ═══
    totalCurrencyEarned: amount > 0 ? s.totalCurrencyEarned + amount : s.totalCurrencyEarned,
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
  addMaterial: (materialName: string, quantity: number) => {
    set((s: PlayerSlice) => {
      const bag = { ...s.materialBag };
      bag[materialName] = (bag[materialName] || 0) + quantity;
      // P4: 超容量警告（不阻止写入，但返回容量信息）
      const totalCount = Object.values(bag).reduce((a: number, b: number) => a + b, 0);
      if (totalCount > s.materialBagCapacity) {
        console.warn(`[MaterialBag] 容量超限！${totalCount}/${s.materialBagCapacity} — 请清理无用蛊材`);
      }
      return { materialBag: bag };
    });
  },
  getMaterialBagCapacity: () => {
    const state = get() as PlayerSlice;
    const realm = state.profile?.realm?.grand || 1;
    if (realm >= 6) return 200; // 仙窍
    if (realm >= 5) return 60;
    if (realm >= 3) return 40;
    return 20;
  },

  setImmortalCurrency: (amount) => set({ immortalCurrency: amount }),

  setCombatStats: (stats) => set({ combatStats: stats, vitals: { health: { current: stats.maxHp, max: stats.maxHp }, essence: { current: 100, max: 100 }, essenceType: 'mortal' as const } }),
});
