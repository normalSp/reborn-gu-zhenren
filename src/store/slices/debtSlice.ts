/**
 * 债务 Slice — P2-6
 * 管理债务状态、利息累加、阈值触发
 */
export interface DebtSlice {
  debt: number;
  debtInterestRate: number;
  /** v1.3: 债务上限=当前月收入×10，防止复利滚雪球 */
  maxDebtMultiple: number;

  incurDebt: (amount: number, reason: string) => void;
  repayDebt: (amount: number) => number;
  getDebtStatus: () => 'none' | 'minor' | 'overdue' | 'collection' | 'crisis';
  applyDebtInterest: () => void;
}

export const createDebtSlice = (set: any, get: any): DebtSlice => ({
  debt: 0,
  debtInterestRate: 0.02, // v1.3: 5%→2%/回合 (约35回合翻倍, 更合理)
  maxDebtMultiple: 10,

  incurDebt: (amount, reason) => {
    const state = get() as DebtSlice;
    const newDebt = state.debt + amount;
    set({ debt: newDebt });
    const logStore = get();
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('economy', `新增债务 +${amount} (${reason})`, { amount, reason, totalDebt: newDebt });
    }
    console.log(`[Debt] 新增债务 +${amount} (${reason})，总债务: ${newDebt}`);
  },

  repayDebt: (amount) => {
    const state = get() as DebtSlice;
    const actualRepay = Math.min(amount, state.debt);
    set({ debt: state.debt - actualRepay });
    const logStore = get();
    if (typeof logStore.addGameLog === 'function') {
      logStore.addGameLog('economy', `偿还债务 -${actualRepay}`, { repaid: actualRepay, remaining: state.debt - actualRepay });
    }
    return actualRepay;
  },

  getDebtStatus: () => {
    const state = get() as DebtSlice;
    if (state.debt <= 0) return 'none';
    if (state.debt < 100) return 'minor';
    if (state.debt < 200) return 'overdue';
    if (state.debt < 500) return 'collection';
    return 'crisis';
  },

  applyDebtInterest: () => {
    const state = get() as DebtSlice;
    if (state.debt <= 0) return;
    const interest = Math.round(state.debt * state.debtInterestRate);
    if (interest > 0) {
      set({ debt: state.debt + interest });
    }
  },
});
