import { useStore } from '../store';
import type { StateUpdate, ButterflyEffect } from '../types';
import type { EncounterReward } from '../types/encounter';

// ─── 全局自增计数器 ───
let guIdCounter = 1000;

function nextGuId(): string {
  return `gu_${++guIdCounter}_${Date.now()}`;
}

// ─── 境界标签映射 ───
const REALM_LABEL_MAP: Record<string, { grand: number; sub: string; label: string }> = {
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

// ─── 声望级别计算 ───
function calcReputationTier(standing: number): string {
  if (standing >= 90) return '崇拜';
  if (standing >= 70) return '尊敬';
  if (standing >= 40) return '友善';
  if (standing >= 10) return '中立';
  if (standing >= -10) return '冷淡';
  if (standing >= -40) return '敌对';
  return '死敌';
}

// ─── StateUpdate 应用器 ───
export function applyStateUpdate(update: StateUpdate): void {
  if (!update) return; // 5C: 防崩溃守卫——state_update可选时可能为undefined
  const store = useStore.getState();

  // ─── Player 更新（直接调用 store 方法） ───
  if (update.player) {
    const p = update.player;
    // 直接调用 playerSlice 的方法
    if (typeof (store as any).applyStateUpdate === 'function') {
      (store as any).applyStateUpdate(p);
    }
    // ─── 道心四维变更 ───
    if (p.dao_heart) {
      const store2 = useStore.getState();
      const prev = store2.daoHeart;
      useStore.setState({
        daoHeart: {
          kill: prev.kill + (p.dao_heart.kill ?? 0),
          mercy: prev.mercy + (p.dao_heart.mercy ?? 0),
          scheme: prev.scheme + (p.dao_heart.scheme ?? 0),
          ambition: prev.ambition + (p.dao_heart.ambition ?? 0),
        },
      });
    }
  }

  // ─── 财富变更 ───
  if (update.wealth) {
    (store as any).addCurrency?.(update.wealth.delta);
  }

  // ─── 蛊虫库存更新 ───
  if (update.gu_inventory) {
    const inv = update.gu_inventory;
    if (inv.add) {
      // ═══ 日志埋点: 叙事获得蛊虫
      const gLog = useStore.getState() as any;
      if (typeof gLog.addGameLog === 'function' && inv.add.length > 0) {
        const names = inv.add.map(g => g.name).join('、');
        gLog.addGameLog('gu', `叙事获得蛊虫: ${names}`, { count: inv.add.length, names: inv.add.map(g => g.name) });
      }
      for (const gu of inv.add) {
        // ═══ v1.7: AI叙事仙蛊过滤 — 仙蛊不可通过叙事凭空获得 ═══
        if ((gu as any).isImmortalGu) {
          console.warn(`[StateUpdateApplier] AI叙事尝试添加仙蛊「${gu.name}」，已根据仙蛊唯一性原则拦截。`);
          continue;
        }
        store.addGu({
          id: nextGuId(),
          specId: gu.name.toLowerCase().replace(/\s+/g, '_'),
          name: gu.name,
          tier: gu.tier,
          path: gu.path,
          currentState: 'optimal' as const,
          proficiency: 0,
          bonded: false,
          active: true,
          acquiredAt: {
            turn: store.messages.length,
            narrative: `获得${gu.name}: ${gu.description}`,
          },
        });
      }
    }
    if (inv.remove) {
      for (const guName of inv.remove) {
        const existing = store.inventory.find(
          g => g.name === guName || g.id === guName
        );
        if (existing) {
          store.removeGu(existing.id);
        }
      }
    }
  }

  // ─── Flag 更新 ───
  if (update.flags) {
    if (update.flags.set) {
      for (const [key, value] of Object.entries(update.flags.set)) {
        store.setFlag(key, value);
      }
    }
    if (update.flags.remove) {
      for (const key of update.flags.remove) {
        store.removeFlag(key);
      }
    }
  }

  // ═══ v1.7: 杀招学习 — 事件/NPC传授路径接口预留 ═══
  if ((update as any).kill_move?.learn && Array.isArray((update as any).kill_move.learn)) {
    const storeRef = useStore.getState() as any;
    if (typeof storeRef.learnKillMove === 'function') {
      for (const moveName of (update as any).kill_move.learn) {
        const existingCheck = storeRef.killMoves?.find((km: any) => km.name === moveName);
        if (!existingCheck) {
          storeRef.learnKillMove({
            id: `learned_${moveName}_${Date.now()}`,
            name: moveName,
            path: '通用',
            level: 1,
            baseCost: 10,
            multiplier: 1.5,
            cooldown: 4,
            description: `习得杀招: ${moveName}`,
          });
        }
      }
    }
  }

  // ─── 势力好感度更新 ───
  if (update.faction) {
    const logStore = useStore.getState() as any;
    for (const [factionId, data] of Object.entries(update.faction)) {
      store.updateStanding(factionId, data.standing);
      // ═══ 日志埋点: 势力声望变更
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('npc', `势力声望变更: ${factionId} ${data.standing > 0 ? '+' : ''}${data.standing}`, {
          factionId, delta: data.standing,
        });
      }
    }
  }

  // ═══ P2-13: 六转升仙触发洞天/福地初始化 ═══
  if (update.player?.realm) {
    const realmValue = update.player.realm.value;
    const realmNum = parseInt(realmValue) || 0;
    // 六转升仙时自动初始化洞天/福地
    if (realmNum >= 6) {
      const currentStore = useStore.getState() as any;
      if (!currentStore.heavenlyLand) {
        const currentDomain = currentStore.currentDomain || '南疆';
        const landType = Math.random() < 0.7 ? '福地' : '洞天';
        const now = Date.now();
        const areaMu = landType === '洞天' ? 300 + Math.floor(Math.random() * 200) : 100 + Math.floor(Math.random() * 100);
        useStore.setState({
          heavenlyLand: {
            id: `land_${now}`,
            type: landType,
            domain: currentDomain,
            name: `${currentDomain}${landType}`,
            areaMu,
            timeFlowRatio: 1 + Math.random() * 2,
            resourceOutputRate: realmNum * 5,
            earthSpirit: { formed: false, approval: 0 },
            disasterCountdown: 60 + Math.floor(Math.random() * 40),
            nextDisasterType: ['地火', '天水', '风灾', '雷劫'][Math.floor(Math.random() * 4)],
            createdAt: currentStore.turn || 1,
            accessible: true,
          },
        });
        // ═══ 日志埋点: 六转升仙
        if (typeof currentStore.addGameLog === 'function') {
          currentStore.addGameLog('system', `升仙成功! 开辟${landType}: ${currentDomain}${landType} (${areaMu}亩)`, {
            landType, areaMu, domain: currentDomain,
          });
        }
        // ═══ 空窍→仙窍替换：仅当当前为 MortalAperture 时替换为 ImmortalAperture ═══
        const currentAperture = currentStore.aperture;
        const shouldReplace = !currentAperture || currentAperture.type === 'mortal';
        if (shouldReplace) {
          currentStore.initializeAperture?.({
            type: landType,
            area_mu: areaMu,
            time_flow_ratio: 1 + Math.random() * 2,
            resource_nodes: [],
            dao_mark_density: {},
            next_disaster_type: '地火',
            disaster_countdown: 60 + Math.floor(Math.random() * 40),
          });
        }
      }
    }
  }

  // ─── 因果更新 ───
  if (update.causality) {
    if (update.causality.track) {
      store.trackEffect({
        id: `cause_${Date.now()}`,
        cause: update.causality.track,
        consequence: '',
        affected_npcs: [],
        severity: 1,
        timestamp: Date.now(),
      });
    }
    if (update.causality.butterfly_effects) {
      for (const effect of update.causality.butterfly_effects) {
        store.trackEffect({
          id: `bf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          cause: '蝴蝶效应',
          consequence: effect,
          affected_npcs: [],
          severity: 2,
          timestamp: Date.now(),
        });
      }
    }
  }

  // ─── 道痕更新（顶层 dao_marks / path_levels，passthrough兜底） ───
  if ((update as any).dao_marks) {
    const dm = (update as any).dao_marks as Record<string, number>;
    const store2 = useStore.getState() as any;
    for (const [path, delta] of Object.entries(dm)) {
      if (typeof store2.addDaoMarks === 'function') {
        store2.addDaoMarks(path, delta);
      }
    }
  }
  if ((update as any).path_levels) {
    const pl = (update as any).path_levels as Record<string, string>;
    const store2 = useStore.getState() as any;
    const currentBuild = store2.pathBuild || {};
    const currentLevels = { ...currentBuild.path_levels };
    for (const [path, level] of Object.entries(pl)) {
      currentLevels[path] = level;
    }
    useStore.setState({
      pathBuild: { ...currentBuild, path_levels: currentLevels },
    });
  }

  // ─── P2-4b: 战斗结果回写 ───
  if ((update as any).combat_result) {
    const cr = (update as any).combat_result;
    const s = useStore.getState() as any;
    if (cr.hp_delta && typeof s.applyHpDelta === 'function') {
      s.applyHpDelta(cr.hp_delta);
    }
    if (cr.loot && Array.isArray(cr.loot) && cr.loot.length > 0) {
      const currentInventory = s.gu_inventory || [];
      // 蛊材类物品自动兑换元石（name包含蛊材类型关键词的材料）
      const materialKeywords = ['牙','皮','骨','粉','石','草','液','晶','水','土','木','铁','金','血','丝','页','瓶','块','卷','板','盒'];
      let yuanStoneGain = 0;
      const nonMaterialLoot: any[] = [];
      for (const item of cr.loot) {
        const itemName = (item.name || '').toString();
        if (materialKeywords.some(kw => itemName.includes(kw)) && !itemName.includes('蛊')) {
          yuanStoneGain += item.price || (item.tier ? item.tier * 5 : 5);
        } else {
          nonMaterialLoot.push(item);
        }
      }
      if (yuanStoneGain > 0) {
        if (typeof s.addYuanStone === 'function') s.addYuanStone(yuanStoneGain, '战斗战利品兑换');
        else if (typeof s.addCurrency === 'function') s.addCurrency(yuanStoneGain);
      }
      // ═══ v1.7: 战斗战利品修复 — gu_inventory改为调用addGu（自动受益底层仙蛊守门） ═══
      if (typeof (s as any).addGu === 'function') {
        for (const item of nonMaterialLoot) {
          (s as any).addGu({
            id: `loot_${(item.name || 'item').toString().toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
            specId: (item.name || '').toString().toLowerCase().replace(/\s+/g, '_'),
            name: (item.name || '未知战利品').toString(),
            tier: item.tier || 1,
            path: item.path || '未知',
            currentState: 'optimal' as const,
            proficiency: 0,
            bonded: false,
            active: true,
            acquiredAt: {
              turn: (s as any).turn || 1,
              narrative: `战斗中获得: ${item.name || '战利品'}`,
            },
          });
        }
      }
    }
    if (cr.injury && typeof s.applyInjury === 'function') {
      s.applyInjury(cr.injury);
    }
  }
}

// ═══ P4.2: 遭遇奖励程序化发放 ═══

export function applyEncounterRewards(rewards: EncounterReward): string[] {
  const s = useStore.getState() as any;
  const messages: string[] = [];

  // 元石奖励
  if (rewards.currency) {
    const [min, max] = rewards.currency;
    const amount = Math.floor(min + Math.random() * (max - min + 1));
    if (amount > 0) {
      if (typeof s.addCurrency === 'function') s.addCurrency(amount);
      messages.push(`元石 +${amount}`);
    }
  }

  // 材料奖励
  if (rewards.materials) {
    const { common, uncommon, rare, count } = rewards.materials;
    const grades: string[] = [];
    if (common) for (let i = 0; i < (common[1] ? Math.floor(common[0] + Math.random() * (common[1] - common[0] + 1)) : common[0]); i++) grades.push('普通蛊材');
    if (uncommon) for (let i = 0; i < (uncommon[1] ? Math.floor(uncommon[0] + Math.random() * (uncommon[1] - uncommon[0] + 1)) : uncommon[0]); i++) grades.push('精品蛊材');
    if (rare) for (let i = 0; i < (rare[1] ? Math.floor(rare[0] + Math.random() * (rare[1] - rare[0] + 1)) : rare[0]); i++) grades.push('稀有蛊材');
    for (const g of grades) {
      if (typeof s.addMaterial === 'function') s.addMaterial(g, 1);
    }
    if (grades.length) messages.push(`蛊材 +${grades.length}份`);
  }

  // 蛊虫奖励
  if (rewards.gu && Math.random() < rewards.gu.chance) {
    // 随机蛊虫逻辑简化
    messages.push('发现了一只蛊虫');
  }

  // 势力声望
  if (rewards.factionStanding) {
    for (const [fid, [min, max]] of Object.entries(rewards.factionStanding)) {
      const delta = Math.floor(min + Math.random() * (max - min + 1));
      if (delta !== 0 && typeof s.updateStanding === 'function') s.updateStanding(fid, delta);
    }
  }

  // 杀招残卷 B2.5a
  if (rewards.killMoveFragment && Math.random() < rewards.killMoveFragment.chance) {
    const [minTier, maxTier] = rewards.killMoveFragment.tierRange;
    messages.push(`发现了杀招残卷（${minTier}-${maxTier}转）`);
    // 延迟处理：由 response-pipeline 调用 learnKillMove
  }

  return messages;
}
