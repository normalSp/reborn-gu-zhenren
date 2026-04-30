import { useStore } from '../store';
import type { StateUpdate, ButterflyEffect } from '../types';

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
  const store = useStore.getState();

  // ─── Player 更新（直接调用 store 方法） ───
  if (update.player) {
    const p = update.player;
    // 直接调用 playerSlice 的方法
    if (typeof (store as any).applyStateUpdate === 'function') {
      (store as any).applyStateUpdate(p);
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
      for (const gu of inv.add) {
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

  // ─── 势力好感度更新 ───
  if (update.faction) {
    for (const [factionId, data] of Object.entries(update.faction)) {
      store.updateStanding(factionId, data.standing);
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
}
