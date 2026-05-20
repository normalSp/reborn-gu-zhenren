import {
  buildV120LowRankSurvivalEconomyProjection,
} from '../../engine/v120-low-rank-survival-economy-projection';
import {
  createInitialSurvivalEconomyState,
  resolveV120SurvivalEconomyLedgerSync,
  type V120SurvivalEconomyLedgerResolution,
} from '../../engine/v120-survival-economy-state';
import type { SurvivalEconomyState } from '../../types';

export interface SurvivalEconomySlice {
  survivalEconomyState: SurvivalEconomyState;
  syncSurvivalEconomyLedgerAction: () => V120SurvivalEconomyLedgerResolution;
}

export const createSurvivalEconomySlice = (
  set?: (...args: any[]) => void,
  get?: () => any,
): SurvivalEconomySlice => ({
  survivalEconomyState: createInitialSurvivalEconomyState(),
  syncSurvivalEconomyLedgerAction: () => {
    const store = get?.() || {};
    const projection = buildV120LowRankSurvivalEconomyProjection({
      livingWorldState: store.livingWorldState,
      routeLocationState: store.routeLocationState,
      materialBag: store.materialBag,
      turn: store.turn,
    });
    const resolution = resolveV120SurvivalEconomyLedgerSync({
      projection,
      previousState: store.survivalEconomyState,
      turn: store.turn,
    });

    if (resolution.success && set) {
      set((state: any) => ({
        survivalEconomyState: resolution.survivalEconomyState,
        flags: {
          ...(state.flags || {}),
          lastSurvivalEconomyLedgerPatch: {
            source: 'v120_survival_economy_ledger',
            actionId: resolution.actionId,
            applied: resolution.applied,
            rejected: resolution.rejected,
            ledgerCount: resolution.survivalEconomyState.ledger.length,
          },
        },
      }));
    }

    store.addGameLog?.(resolution.success ? 'system' : 'danger', resolution.message, {
      actionId: resolution.actionId,
      applied: resolution.applied,
      rejected: resolution.rejected,
      saveFormatImpact: projection.saveFormatImpact,
      pressureScore: resolution.survivalEconomyState.pressureScore,
      ledgerCount: resolution.survivalEconomyState.ledger.length,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
    });

    return resolution;
  },
});
