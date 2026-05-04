/**
 * 元石经济 Slice — P1预留，P2填充完整经济闭环
 * 参照大纲第十一部分：蛊界经济子系统
 */

export interface YuanStoneRecord {
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  relatedNpc?: string;
  relatedEvent?: string;
  timestamp: number;
}

export interface YuanStoneSlice {
  /** 当前元石余额（初始200，与 playerSlice.currency 共享存储） */
  currency: number;
  /** 元石收支日志（保留最近50条） */
  currencyLog: YuanStoneRecord[];
  /** P2使用：state_update中 wealth.delta 的累积追踪 */
  yuanStoneDelta: number;

  /** 收入元石并记录日志 */
  addYuanStone: (amount: number, reason: string, npcId?: string, eventId?: string) => void;
  /** 支出元石，余额不足返回 false */
  spendYuanStone: (amount: number, reason: string, npcId?: string, eventId?: string) => boolean;
  /** P2使用：获取按分类汇总的收入/支出 */
  getCurrencySummary: () => { totalEarned: number; totalSpent: number; net: number };
  /** P4数值修复：直接设置元石余额（用于时间线起点初始化） */
  setCurrency: (amount: number) => void;
}

export const createYuanStoneSlice = (set: any, get: any): YuanStoneSlice => ({
  currency: 200,
  currencyLog: [],
  yuanStoneDelta: 0,

  addYuanStone: (amount, reason, npcId, eventId) => {
    const state = get() as YuanStoneSlice;
    const record: YuanStoneRecord = {
      type: 'earn',
      amount,
      reason,
      relatedNpc: npcId,
      relatedEvent: eventId,
      timestamp: Date.now(),
    };
    const log = [...state.currencyLog, record].slice(-50); // 保留最近50条
    const fullStore = get() as any;
    const currentEarned = fullStore.totalCurrencyEarned || 0;
    set({
      currency: state.currency + amount,
      currencyLog: log,
      yuanStoneDelta: state.yuanStoneDelta + amount,
      // ═══ P0.2: 累计元石（仅正收入） ═══
      totalCurrencyEarned: amount > 0 ? currentEarned + amount : currentEarned,
    });
    // ═══ 日志埋点: 元石收入（≥50时记录）
    if (amount >= 50) {
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('economy', `元石 +${amount}: ${reason}`, { amount, reason, npcId });
      }
    }
  },

  spendYuanStone: (amount, reason, npcId, eventId) => {
    const state = get() as YuanStoneSlice;
    if (state.currency < amount) return false;
    const record: YuanStoneRecord = {
      type: 'spend',
      amount,
      reason,
      relatedNpc: npcId,
      relatedEvent: eventId,
      timestamp: Date.now(),
    };
    const log = [...state.currencyLog, record].slice(-50);
    set({
      currency: state.currency - amount,
      currencyLog: log,
      yuanStoneDelta: state.yuanStoneDelta - amount,
    });
    // ═══ 日志埋点: 元石支出（≥50时记录）
    if (amount >= 50) {
      const logStore = get() as any;
      if (typeof logStore.addGameLog === 'function') {
        logStore.addGameLog('economy', `元石 -${amount}: ${reason}`, { amount, reason, npcId });
      }
    }
    return true;
  },

  getCurrencySummary: () => {
    const state = get() as YuanStoneSlice;
    let totalEarned = 0;
    let totalSpent = 0;
    for (const r of state.currencyLog) {
      if (r.type === 'earn') totalEarned += r.amount;
      else totalSpent += r.amount;
    }
    return { totalEarned, totalSpent, net: totalEarned - totalSpent };
  },

  setCurrency: (amount) => set({ currency: amount }),
});
