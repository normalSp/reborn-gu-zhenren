import type { GuInstance, GuHungerState, GuHungerConfig, LifeboundGu, LifeboundDeathPenalty } from '../../types';
import guDatabase from '../../canon/gu-database.json';

/** CR6: 蛊虫进化动画状态 */
export interface GuEvolutionState {
  active: boolean;
  guName: string;
  fromRank: number;
  toRank: number;
}

/** 转数 → 空窍容量映射（原著设定） */
const CAPACITY_BY_RANK: Record<number, number> = { 1: 3, 2: 5, 3: 8, 4: 12, 5: 15 };

/** P2-P6: 从引擎获取当前空窍容量 — 以CAPACITY_BY_RANK(原著设定)为唯一来源 */
function getApertureCapacity(fullStore: any): number {
  const aperture = fullStore.aperture;
  if (aperture?.type === 'mortal' && aperture.capacity) {
    // 同步校正：确保 aperture.capacity 与 CAPACITY_BY_RANK 一致
    // 兜底修复历史存档中过时的capacity值
    const realm = fullStore.profile?.realm?.grand;
    if (realm && realm >= 1 && realm <= 5) {
      const expected = CAPACITY_BY_RANK[realm] || aperture.capacity;
      if (aperture.capacity !== expected) {
        // 自动修正历史存档中的错误容量值
        fullStore.initializeMortalAperture?.({ ...aperture, capacity: expected });
        return expected;
      }
      return aperture.capacity;
    }
    return aperture.capacity;
  }
  const realm = fullStore.profile?.realm?.grand;
  if (realm && realm >= 1 && realm <= 5) {
    return CAPACITY_BY_RANK[realm] || 3;
  }
  return 999; // 6转+蛊仙无空窍容量限制
}

/** P2-13: 蛊虫饥饿参数 */
export const GU_HUNGER_CONFIG: GuHungerConfig = {
  hungerPerTurn: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 },
  thresholds: {
    optimalToHungry: 5,
    hungryToInjured: 12,
    injuredToDead: 25,
  },
  feedRecovery: 10,
};

/** P2补完: 食物类型 → materialBag 食材键名映射 */
export const FEED_MATERIAL_MAP: Record<string, string> = {
  '月光': '月华草',
  '美酒': '美酒',
  '石粉': '石粉',
  '肉食': '兽肉',
  '鲜血': '兽血',
  '草木': '灵草',
  '文字': '古籍残页',
  '时间流逝': '时光之砂',
  '药材': '灵药',
  '毒物': '毒囊',
  '火焰': '火精',
  '寒冰': '冰晶',
  '雷电': '雷击木',
  '光芒': '光耀石',
  '暗影': '暗影尘',
  '金铁': '金属碎块',
};

/** P2-13: 四态模型状态迁移逻辑 */
function computeNextState(current: GuHungerState, counter: number): GuHungerState {
  const { thresholds } = GU_HUNGER_CONFIG;
  if (counter >= thresholds.injuredToDead) return 'dead';
  if (counter >= thresholds.hungryToInjured && current !== 'dead') return 'injured';
  if (counter >= thresholds.optimalToHungry && current !== 'injured' && current !== 'dead') return 'hungry';
  return current;
}

interface GuSlice {
  inventory: GuInstance[];
  /** P2-13: 蛊虫饥饿计数器 guId → counter */
  guHungerCounters: Record<string, number>;
  /** P2-流派: 本命蛊绑定信息 */
  lifeboundGuInfo: LifeboundGu | null;
  /** P2-流派: 本命蛊死亡惩罚 */
  lifeboundDeathPenalty: LifeboundDeathPenalty | null;
  /** P2补完: 累计炼制蛊虫次数（用于成就检测） */
  refinedGuCount: number;
  /** CR6: 蛊虫进化动画触发状态 */
  guEvolutionState: GuEvolutionState;
  /** CR6: 触发蛊虫进化动画 */
  triggerGuEvolution: (guName: string, fromRank: number, toRank: number) => void;
  /** CR6: 清除进化动画状态 */
  clearGuEvolution: () => void;
  addGu: (gu: GuInstance) => void;
  removeGu: (id: string) => void;
  updateGuState: (id: string, state: GuHungerState) => void;
  toggleActive: (id: string) => void;
  /** P2-13: 每轮推进蛊虫饥饿状态机 */
  tickGuHunger: () => void;
  /** P2-13: 喂养蛊虫 — 减少hungerCounter。P2-P8: foodType可选参数，不匹配则触发反噬 */
  feedGuHunger: (guId: string, foodType?: string) => void;
  /** P2-流派: 绑定本命蛊 */
  bindLifeboundGu: (guId: string, turn: number) => boolean;
  /** P2-流派: 解除本命蛊绑定 */
  unbindLifeboundGu: (turn: number) => boolean;
  /** P2-流派: 本命蛊死亡惩罚触发 */
  triggerLifeboundDeathPenalty: (turn: number) => void;
  /** P2-流派: 冷却递减 */
  tickLifeboundCooldown: () => void;
}

export const createGuSlice = (set: any, get: any): GuSlice => ({
  inventory: [],
  guHungerCounters: {},
  lifeboundGuInfo: null,
  lifeboundDeathPenalty: null,
  refinedGuCount: 0,
  guEvolutionState: { active: false, guName: '', fromRank: 0, toRank: 0 },

  triggerGuEvolution: (guName, fromRank, toRank) => {
    set({ guEvolutionState: { active: true, guName, fromRank, toRank } });
    // 自动3秒后清除
    setTimeout(() => {
      set({ guEvolutionState: { active: false, guName: '', fromRank: 0, toRank: 0 } });
    }, 3000);
  },

  clearGuEvolution: () => {
    set({ guEvolutionState: { active: false, guName: '', fromRank: 0, toRank: 0 } });
  },

  addGu: (gu) => {
    const fullStore = get() as any;
    // ═══ v0.7.0: 十绝体放入蛊虫扣5%HP — 设计大纲§5.2 ═══
    const aperture = fullStore.aperture;
    if (aperture?.type === 'mortal' && aperture.extremePhysiqueType && aperture.capacityLocked) {
      const currentHp = fullStore.vitals?.health?.current;
      const maxHp = fullStore.vitals?.health?.max;
      if (currentHp && maxHp && currentHp < maxHp * 0.05) {
        console.warn('[GuSlice] 窍壁压力过大，当前状态无法承受，阻止放入蛊虫');
        return;
      }
       // 扣5% HP
      const hpLoss = Math.floor(maxHp * 0.05);
      if (typeof fullStore.applyHpDelta === 'function') {
        fullStore.applyHpDelta(-hpLoss);
      }
    }

    // ═══ BugFix: 兜底补全缺失字段，防止调用方遗漏导致 currentState=undefined 等问题 ═══
    const safeGu = {
      id: gu.id || `gu_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      specId: gu.specId || (gu.name || 'unknown').toLowerCase().replace(/\s+/g, '_'),
      name: gu.name || '未知蛊虫',
      tier: gu.tier ?? 1,
      path: gu.path || '未知',
      currentState: gu.currentState || 'optimal',
      hungerCounter: gu.hungerCounter ?? 0,
      proficiency: gu.proficiency ?? 0,
      bonded: gu.bonded ?? false,
      active: gu.active ?? true,
      acquiredAt: gu.acquiredAt || { turn: fullStore.turn || 1, narrative: `获得: ${gu.name || '未知蛊虫'}` },
    };
    // ═══ v1.7: 仙蛊唯一性守门 — 天地间每种仙蛊唯一，已存在则拒绝添加 ═══
    if ((gu as any).isImmortalGu) {
      const existing = (get() as GuSlice).inventory.find(g => g.name === gu.name || g.specId === (gu as any).specId);
      if (existing) {
        console.warn(`[GuSlice] 仙蛊唯一性冲突：「${gu.name}」已存在于空窍中（id:${existing.id}），拒绝重复添加。仙蛊天地间独一无二。`);
        return;
      }
    }
    const cap = getApertureCapacity(fullStore);
    const currentCount = (get() as GuSlice).inventory.length;
    if (currentCount >= cap) {
      console.warn(`[GuSlice] 空窍已满！容量${cap}，无法携带更多蛊虫`);
      return;
    }
    set((s: GuSlice) => ({
      inventory: [...s.inventory, { ...safeGu, hungerCounter: safeGu.hungerCounter }],
      guHungerCounters: { ...s.guHungerCounters, [safeGu.id]: safeGu.hungerCounter },
    }));
    // ═══ 日志埋点: 获得蛊虫
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('gu', `获得蛊虫: ${safeGu.name} (${safeGu.tier}转 ${safeGu.path})`, {
        guId: safeGu.id, name: safeGu.name, tier: safeGu.tier, path: safeGu.path,
      });
    }
    // 同步更新 aperture.carriedGu
    if (aperture?.type === 'mortal') {
      fullStore.initializeMortalAperture?.({ ...aperture, carriedGu: currentCount + 1 });
    }
  },
  removeGu: (id) => {
    const fullStore = get() as any;
    const inventory = (get() as GuSlice).inventory;
    const foundInInventory = inventory.some(g => g.id === id);
    
    if (foundInInventory) {
      // ═══ v0.7.0: 十绝体取出蛊虫扣5%HP — 设计大纲§5.2 ═══
      const aperture = fullStore.aperture;
      if (aperture?.type === 'mortal' && aperture.extremePhysiqueType && aperture.capacityLocked) {
        const currentHp = fullStore.vitals?.health?.current;
        const maxHp = fullStore.vitals?.health?.max;
        if (currentHp && maxHp && currentHp < maxHp * 0.05) {
          console.warn('[GuSlice] 窍壁压力过大，当前状态无法承受，阻止取出蛊虫');
          return;
        }
        const hpLoss = Math.floor(maxHp * 0.05);
        if (typeof fullStore.applyHpDelta === 'function') {
          fullStore.applyHpDelta(-hpLoss);
        }
      }
      // 从空窍 inventory 中移除
      const newCount = inventory.filter(g => g.id !== id).length;
      const { [id]: _, ...restCounters } = (get() as GuSlice).guHungerCounters;
      set({
        inventory: inventory.filter(g => g.id !== id),
        guHungerCounters: restCounters,
      });
      // ═══ 日志埋点: 失去蛊虫
      const removed = inventory.find(g => g.id === id);
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function' && removed) {
        logStore.addGameLog('gu', `失去蛊虫: ${removed.name}`, {
          guId: id, name: removed.name,
        });
      }
      // 同步更新 aperture.carriedGu
      if (aperture?.type === 'mortal') {
        fullStore.initializeMortalAperture?.({ ...aperture, carriedGu: newCount });
      }
    } else {
      // ═══ BugFix v0.7.0: 尝试从仙窍存储中移除 ═══
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      if (apertureInv?.gu) {
        const idx = apertureInv.gu.findIndex(g => g.id === id);
        if (idx >= 0) {
          const removed = apertureInv.gu[idx];
          const newGuList = [...apertureInv.gu];
          newGuList.splice(idx, 1);
          set({ apertureInventory: { ...apertureInv, gu: newGuList } } as any);
          const logStore = get() as any;
          if (typeof logStore.addGameLog === 'function') {
            logStore.addGameLog('gu', `从仙窍中移除蛊虫: ${removed.name}`, {
              guId: id, name: removed.name,
            });
          }
        }
      }
    }
  },
  updateGuState: (id, state) => {
    const s = get() as GuSlice;
    const foundInInventory = s.inventory.some(g => g.id === id);
    if (foundInInventory) {
      set((s2: GuSlice) => ({
        inventory: s2.inventory.map(g => g.id === id ? { ...g, currentState: state } : g),
      }));
    } else {
      // ═══ BugFix v0.7.0: 尝试更新仙窍存储中的蛊虫状态 ═══
      const fullStore = get() as any;
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      if (apertureInv?.gu) {
        const idx = apertureInv.gu.findIndex(g => g.id === id);
        if (idx >= 0) {
          const newGuList = [...apertureInv.gu];
          newGuList[idx] = { ...newGuList[idx], currentState: state };
          set({ apertureInventory: { ...apertureInv, gu: newGuList } } as any);
        }
      }
    }
  },
  toggleActive: (id) => {
    const state = get() as GuSlice;
    const foundInInventory = state.inventory.some(g => g.id === id);
    if (foundInInventory) {
      set((s: GuSlice) => ({
        inventory: s.inventory.map(g =>
          g.id === id ? { ...g, active: g.bonded ? true : !(g as any).active } : g
        ),
      }));
    } else {
      // ═══ BugFix v0.7.0: 尝试在仙窍存储中切换激活状态 ═══
      const fullStore = get() as any;
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      if (apertureInv?.gu) {
        const idx = apertureInv.gu.findIndex(g => g.id === id);
        if (idx >= 0) {
          const gu = apertureInv.gu[idx];
          const newGuList = [...apertureInv.gu];
          newGuList[idx] = { ...gu, active: gu.bonded ? true : !gu.active };
          set({ apertureInventory: { ...apertureInv, gu: newGuList } } as any);
        }
      }
    }
  },


  // ═══ P2-13: 每轮蛊虫饥饿推进（确定性计数模型） ═══
  // v0.7.0 Q1修复: 蛊仙模式下同步遍历仙窍存储(apertureInventory.gu)
  tickGuHunger: () => {
    const state = get() as GuSlice;
    const fullStore = get() as any;
    const isImmortal = fullStore.profile?.realm?.grand >= 6;

    // 构建统一蛊虫列表：凡人走空窍inventory，蛊仙追加仙窍存储
    interface HungryGu { gu: GuInstance; source: 'inventory' | 'aperture' }
    let allGu: HungryGu[] = (state.inventory || []).map(gu => ({ gu, source: 'inventory' as const }));

    if (isImmortal) {
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      const apertureGu: GuInstance[] = apertureInv?.gu || [];
      if (apertureGu.length > 0) {
        allGu = allGu.concat(apertureGu.map(gu => ({ gu, source: 'aperture' as const })));
      }
    }

    if (allGu.length === 0) return;

    const counters = { ...state.guHungerCounters };
    let newInventory = [...(state.inventory || [])];
    let newApertureGu: GuInstance[] | null = null;
    let inventoryChanged = false;
    let apertureChanged = false;

    for (const { gu, source } of allGu) {
      if (!gu.active && !gu.bonded) continue;
      if (gu.currentState === 'dead') continue;

      // 累加饥饿计数
      const tierAdd = GU_HUNGER_CONFIG.hungerPerTurn[gu.tier] || gu.tier;
      const currentCounter = (counters[gu.id] || 0) + tierAdd;
      counters[gu.id] = currentCounter;

      // 状态迁移判定
      const nextState = computeNextState(gu.currentState, currentCounter);
      const updatedGu = { ...gu, currentState: nextState, hungerCounter: currentCounter };

      if (source === 'inventory') {
        const idx = newInventory.findIndex(g => g.id === gu.id);
        if (idx >= 0) {
          newInventory[idx] = updatedGu;
          inventoryChanged = true;
        }
      } else if (source === 'aperture') {
        if (!newApertureGu) {
          const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
          newApertureGu = [...(apertureInv?.gu || [])];
        }
        const idx = newApertureGu.findIndex(g => g.id === gu.id);
        if (idx >= 0) {
          newApertureGu[idx] = updatedGu;
          apertureChanged = true;
        }
      }

      // 受伤状态反噬判定（5%概率，扣除主人10-20生命）
      if (nextState === 'injured' && Math.random() < 0.05) {
        const backlashDmg = 10 + Math.floor(Math.random() * 11); // 10-20
        if (typeof fullStore.applyHpDelta === 'function') {
          fullStore.applyHpDelta(-backlashDmg);
        }
      }
    }

    // 批量更新store
    const update: any = { guHungerCounters: counters };
    if (inventoryChanged) update.inventory = newInventory;
    if (apertureChanged && newApertureGu) {
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      update.apertureInventory = { ...apertureInv, gu: newApertureGu };
    }
    set(update);
  },

  // ═══ P2-13: 喂养蛊虫（P2-P8: 增加食物类型匹配检查） ═══
  // v0.7.0 Q1修复: 蛊仙模式下从apertureInventory.materials消耗食材
  feedGuHunger: (guId, foodType?: string) => {
    const state = get() as GuSlice;
    const fullStore = get() as any;
    let gu = state.inventory.find(g => g.id === guId);
    let guSource: 'inventory' | 'aperture' = 'inventory';

    // ═══ BugFix v0.7.0: 若空窍未找到，检查仙窍存储 ═══
    if (!gu) {
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      gu = apertureInv?.gu?.find(g => g.id === guId);
      if (gu) guSource = 'aperture';
    }
    if (!gu || gu.currentState === 'dead') return;

    // ═══ P2-P8-1: 食物类型匹配检查 ═══
    if (foodType) {
      const guSpec = (guDatabase as any)[gu.name];
      const requiredType = guSpec?.feedRequirement?.type;
      if (requiredType && foodType !== requiredType) {
        // 食物不匹配 → 反噬：扣减生命，无饱食恢复
        console.warn(`[GuSlice] 食物不匹配! 需要${requiredType}, 尝试喂${foodType}`);
        const backlashDmg = 15 + Math.floor(Math.random() * 16); // 15-30
        if (typeof fullStore.applyHpDelta === 'function') {
          fullStore.applyHpDelta(-backlashDmg);
        } else if (fullStore.vitals?.health) {
          const newHp = Math.max(1, fullStore.vitals.health.current - backlashDmg);
          fullStore.setHealth?.(newHp, fullStore.vitals.health.max);
        }
        return; // 反噬后不恢复饱食
      }
      // ═══ P2补完: 食物匹配成功 → 消耗背包食材 ═══
      if (foodType && requiredType && foodType === requiredType) {
        const materialItemName = FEED_MATERIAL_MAP[requiredType];
        if (materialItemName) {
          // v0.7.0 Q1修复: 蛊仙模式优先从仙窍存储消耗，凡人从materialBag消耗
          if (guSource === 'aperture') {
            const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
            const apertureMaterials = apertureInv?.materials || {};
            const currentQty = apertureMaterials[materialItemName] || 0;
            if (currentQty <= 0) {
              // 仙窍无食材 → 尝试从materialBag兜底
              const currentBag = fullStore.materialBag || {};
              const bagQty = currentBag[materialItemName] || 0;
              if (bagQty <= 0) {
                console.warn(`[GuSlice] 食材不足! 需要${materialItemName}, 仙窍和背包均无库存`);
                return;
              }
              const newBag = { ...currentBag };
              newBag[materialItemName] = bagQty - 1;
              set({ materialBag: newBag } as any);
            } else {
              // 从仙窍存储消耗1份食材
              const newMaterials = { ...apertureMaterials };
              newMaterials[materialItemName] = currentQty - 1;
              set({ apertureInventory: { ...apertureInv, materials: newMaterials } } as any);
            }
          } else {
            // 凡人模式：从materialBag消耗
            const currentBag = fullStore.materialBag || {};
            const currentQty = currentBag[materialItemName] || 0;
            if (currentQty <= 0) {
              console.warn(`[GuSlice] 食材不足! 需要${materialItemName}, 当前:${currentQty}`);
              return;
            }
            const newBag = { ...currentBag };
            newBag[materialItemName] = currentQty - 1;
            set({ materialBag: newBag } as any);
          }
        }
      }
    }

    const counters = { ...state.guHungerCounters };
    const currentCounter = counters[guId] || 0;
    // 喂养恢复：重置counter为0，状态提升一级
    counters[guId] = Math.max(0, currentCounter - GU_HUNGER_CONFIG.feedRecovery);

    // ═══ BugFix: 防御 currentState 为 undefined 等非法值 ═══
    if (!gu.currentState) {
      console.warn(`[GuSlice] feedGuHunger 遇到无效 currentState: ${gu.currentState}, guId=${guId}, guName=${gu.name}`);
      return;
    }
    const stateProgression: GuHungerState[] = ['dead', 'injured', 'hungry', 'optimal'];
    const currentIdx = stateProgression.indexOf(gu.currentState);
    const newState: GuHungerState = currentIdx < stateProgression.length - 1
      ? stateProgression[currentIdx + 1]
      : gu.currentState;

    // v0.7.0 Q1修复: 按蛊虫来源更新对应存储位置
    if (guSource === 'aperture') {
      const apertureInv = fullStore.apertureInventory as import('../../types').ApertureStorage | undefined;
      const newGuList = (apertureInv?.gu || []).map(g =>
        g.id === guId ? { ...g, currentState: newState, hungerCounter: counters[guId] } : g
      );
      set({
        apertureInventory: { ...apertureInv, gu: newGuList },
        guHungerCounters: counters,
      } as any);
    } else {
      set((s: GuSlice) => ({
        inventory: s.inventory.map(g =>
          g.id === guId ? { ...g, currentState: newState, hungerCounter: counters[guId] } : g
        ),
        guHungerCounters: counters,
      }));
    }
  },

  // ═══ P2-流派: 绑定本命蛊 ═══
  bindLifeboundGu: (guId, turn) => {
    const state = get() as GuSlice;
    // 已绑定则不可再绑
    if (state.lifeboundGuInfo) return false;
    const gu = state.inventory.find(g => g.id === guId);
    if (!gu || gu.currentState === 'dead') return false;

    const lifeboundGu: LifeboundGu = {
      guId: gu.id,
      guName: gu.name,
      boundAt: turn,
      turnsSinceBound: 0,
      cooldownRemaining: 0,
      upgradeCount: 0,
      onCooldown: false,
    };

    set((s: GuSlice) => ({
      inventory: s.inventory.map(g =>
        g.id === guId ? { ...g, bonded: true, active: true } : g
      ),
      lifeboundGuInfo: lifeboundGu,
    }));
    // ═══ 日志埋点: 绑定本命蛊
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('gu', `绑定本命蛊: ${gu.name}`, {
        guId: gu.id, guName: gu.name, boundAt: turn,
      });
    }
    return true;
  },

  // ═══ P2-流派: 解除本命蛊绑定 ═══
  unbindLifeboundGu: (turn) => {
    const state = get() as GuSlice;
    if (!state.lifeboundGuInfo) return false;

    // 触发30回合冷却
    const lifeboundGu: LifeboundGu = {
      ...state.lifeboundGuInfo,
      cooldownRemaining: 30,
      onCooldown: true,
    };

    set((s: GuSlice) => ({
      inventory: s.inventory.map(g =>
        g.id === state.lifeboundGuInfo!.guId ? { ...g, bonded: false } : g
      ),
      lifeboundGuInfo: null,
    }));

    // 临时存储冷却信息
    const fullStore = get() as any;
    if (typeof fullStore.setFlag === 'function') {
      fullStore.setFlag('lifebound_cooldown', lifeboundGu);
    }
    return true;
  },

  // ═══ P2-流派: 触发本命蛊死亡惩罚 ═══
  triggerLifeboundDeathPenalty: (turn) => {
    const state = get() as GuSlice;
    if (!state.lifeboundGuInfo) return;

    const penalty: LifeboundDeathPenalty = {
      hpPercentLoss: 40,
      daoMarkPercentLoss: 15,
      duration: 10,
      backlashTriggered: true,
    };

    const fullStore = get() as any;
    // 扣除生命
    if (typeof fullStore.applyHpPercent === 'function') {
      fullStore.applyHpPercent(-penalty.hpPercentLoss);
    } else {
      const vitals = fullStore.vitals;
      if (vitals?.health) {
        const loss = Math.floor(vitals.health.current * penalty.hpPercentLoss / 100);
        fullStore.setHealth?.(Math.max(1, vitals.health.current - loss), vitals.health.max);
      }
    }

    set({
      lifeboundGuInfo: null,
      lifeboundDeathPenalty: penalty,
    });
    // ═══ 日志埋点: 本命蛊死亡
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('gu', `本命蛊死亡! 生命-${penalty.hpPercentLoss}% 道痕-${penalty.daoMarkPercentLoss}% (持续${penalty.duration}回合)`, {
        hpLoss: penalty.hpPercentLoss, daoMarkLoss: penalty.daoMarkPercentLoss, duration: penalty.duration,
      });
    }
  },

  // ═══ P2-流派: 本命蛊冷却递减 ═══
  tickLifeboundCooldown: () => {
    const fullStore = get() as any;
    const cooldownData = fullStore.flags?.lifebound_cooldown as LifeboundGu | undefined;
    if (cooldownData && cooldownData.onCooldown) {
      const newCooldown = Math.max(0, cooldownData.cooldownRemaining - 1);
      if (newCooldown <= 0) {
        fullStore.removeFlag?.('lifebound_cooldown');
        // 本命蛊升级次数+1
        set({ lifeboundGuInfo: null });
      } else {
        fullStore.setFlag?.('lifebound_cooldown', { ...cooldownData, cooldownRemaining: newCooldown });
      }
    }

    // 死亡惩罚持续递减
    const deathPenalty = (get() as GuSlice).lifeboundDeathPenalty;
    if (deathPenalty && deathPenalty.duration > 0) {
      const newDuration = deathPenalty.duration - 1;
      if (newDuration <= 0) {
        set({ lifeboundDeathPenalty: null });
      } else {
        set({ lifeboundDeathPenalty: { ...deathPenalty, duration: newDuration } });
      }
    }
  },
});
