import type { GuInstance, GuHungerState, GuHungerConfig, LifeboundGu, LifeboundDeathPenalty } from '../../types';
import guDatabase from '../../canon/gu-database.json';

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

  addGu: (gu) => {
    const fullStore = get() as any;
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
      inventory: [...s.inventory, { ...gu, hungerCounter: gu.hungerCounter ?? 0 }],
      guHungerCounters: { ...s.guHungerCounters, [gu.id]: gu.hungerCounter ?? 0 },
    }));
    // ═══ 日志埋点: 获得蛊虫
    const logStore = get() as any;
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('gu', `获得蛊虫: ${gu.name} (${gu.tier}转 ${gu.path})`, {
        guId: gu.id, name: gu.name, tier: gu.tier, path: gu.path,
      });
    }
    // 同步更新 aperture.carriedGu
    const aperture = fullStore.aperture;
    if (aperture?.type === 'mortal') {
      fullStore.initializeMortalAperture?.({ ...aperture, carriedGu: currentCount + 1 });
    }
  },
  removeGu: (id) => {
    const fullStore = get() as any;
    const inventory = (get() as GuSlice).inventory;
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
    const aperture = fullStore.aperture;
    if (aperture?.type === 'mortal') {
      fullStore.initializeMortalAperture?.({ ...aperture, carriedGu: newCount });
    }
  },
  updateGuState: (id, state) => set((s: GuSlice) => ({
    inventory: s.inventory.map(g => g.id === id ? { ...g, currentState: state } : g),
  })),
  toggleActive: (id) => set((s: GuSlice) => ({
    inventory: s.inventory.map(g =>
      g.id === id ? { ...g, active: g.bonded ? true : !(g as any).active } : g
    ),
  })),


  // ═══ P2-13: 每轮蛊虫饥饿推进（确定性计数模型） ═══
  tickGuHunger: () => {
    const state = get() as GuSlice;
    const inventory = state.inventory;
    if (!inventory || inventory.length === 0) return;

    const counters = { ...state.guHungerCounters };
    let newInventory = [...inventory];
    let changed = false;

    for (let i = 0; i < newInventory.length; i++) {
      const gu = newInventory[i];
      if (!gu.active && !gu.bonded) continue;
      if (gu.currentState === 'dead') continue;

      // 累加饥饿计数
      const tierAdd = GU_HUNGER_CONFIG.hungerPerTurn[gu.tier] || gu.tier;
      const currentCounter = (counters[gu.id] || 0) + tierAdd;
      counters[gu.id] = currentCounter;

      // 状态迁移判定
      const nextState = computeNextState(gu.currentState, currentCounter);
      if (nextState !== gu.currentState) {
        newInventory[i] = { ...gu, currentState: nextState, hungerCounter: currentCounter };
        changed = true;

        // 受伤状态反噬判定（5%概率，扣除主人10-20生命）
        if (nextState === 'injured' && Math.random() < 0.05) {
          const backlashDmg = 10 + Math.floor(Math.random() * 11); // 10-20
          const fullStore = get() as any;
          if (typeof fullStore.applyHpDelta === 'function') {
            fullStore.applyHpDelta(-backlashDmg);
          }
        }
      } else {
        newInventory[i] = { ...gu, hungerCounter: currentCounter };
      }
    }

    if (changed) {
      set({ inventory: newInventory, guHungerCounters: counters });
    } else {
      set({ guHungerCounters: counters });
    }
  },

  // ═══ P2-13: 喂养蛊虫（P2-P8: 增加食物类型匹配检查） ═══
  feedGuHunger: (guId, foodType?: string) => {
    const state = get() as GuSlice;
    const gu = state.inventory.find(g => g.id === guId);
    if (!gu || gu.currentState === 'dead') return;

    // ═══ P2-P8-1: 食物类型匹配检查 ═══
    if (foodType) {
      const guSpec = (guDatabase as any)[gu.name];
      const requiredType = guSpec?.feedRequirement?.type;
      if (requiredType && foodType !== requiredType) {
        // 食物不匹配 → 反噬：扣减生命，无饱食恢复
        console.warn(`[GuSlice] 食物不匹配! 需要${requiredType}, 尝试喂${foodType}`);
        const fullStore = get() as any;
        const backlashDmg = 15 + Math.floor(Math.random() * 16); // 15-30
        if (typeof fullStore.applyHpDelta === 'function') {
          fullStore.applyHpDelta(-backlashDmg);
        } else if (fullStore.vitals?.health) {
          const newHp = Math.max(1, fullStore.vitals.health.current - backlashDmg);
          fullStore.setHealth?.(newHp, fullStore.vitals.health.max);
        }
        return; // 反噬后不恢复饱食
      }
    }

    const counters = { ...state.guHungerCounters };
    const currentCounter = counters[guId] || 0;
    // 喂养恢复：重置counter为0，状态提升一级
    counters[guId] = Math.max(0, currentCounter - GU_HUNGER_CONFIG.feedRecovery);

    const stateProgression: GuHungerState[] = ['dead', 'injured', 'hungry', 'optimal'];
    const currentIdx = stateProgression.indexOf(gu.currentState);
    const newState: GuHungerState = currentIdx < stateProgression.length - 1
      ? stateProgression[currentIdx + 1]
      : gu.currentState;

    set((s: GuSlice) => ({
      inventory: s.inventory.map(g =>
        g.id === guId ? { ...g, currentState: newState, hungerCounter: counters[guId] } : g
      ),
      guHungerCounters: counters,
    }));
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
