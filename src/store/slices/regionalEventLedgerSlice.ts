import {
  createInitialRegionalEventLedger,
  resolveV200WorldCoreRegionalEventLedgerSync,
  type V200WorldCoreLedgerResolution,
} from '../../engine/v200-regional-event-ledger';
import type { RegionalEventLedger } from '../../types';

export interface RegionalEventLedgerSlice {
  regionalEventLedger: RegionalEventLedger;
  syncRegionalEventLedgerAction: () => V200WorldCoreLedgerResolution;
}

export const createRegionalEventLedgerSlice = (
  set?: (...args: any[]) => void,
  get?: () => any,
): RegionalEventLedgerSlice => ({
  regionalEventLedger: createInitialRegionalEventLedger(),
  syncRegionalEventLedgerAction: () => {
    const store = get?.() || {};
    const resolution = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: store.livingWorldState,
      routeLocationState: store.routeLocationState,
      survivalEconomyState: store.survivalEconomyState,
      localActionLedger: store.sceneSessionState?.localActionLedger || [],
      materialBag: store.materialBag,
      combatEventCandidates: store.flags?.combatEventCandidates || [],
      battleResolutionSteps: store.battlefieldPlaybackSteps || [],
      battleOutcomeSummary: store.combatEncounterState?.outcomeSummary || null,
      profile: store.profile,
      inventory: store.inventory || [],
      currentChapterId: store.currentChapterId,
      turn: store.turn,
      previousLedger: store.regionalEventLedger,
    });

    if (resolution.success && set) {
      set((state: any) => ({
        regionalEventLedger: resolution.regionalEventLedger,
        flags: {
          ...(state.flags || {}),
          lastRegionalEventLedgerPatch: {
            source: 'v200_worldcore_regional_event_ledger',
            actionId: resolution.actionId,
            applied: resolution.applied,
            rejected: resolution.rejected,
            eventCount: resolution.regionalEventLedger.publicEvents.length,
            followUpCount: resolution.regionalEventLedger.pendingFollowUps.length,
          },
        },
      }));
    }

    store.addGameLog?.(resolution.success ? 'system' : 'warning', resolution.message, {
      actionId: resolution.actionId,
      applied: resolution.applied,
      rejected: resolution.rejected,
      eventCount: resolution.regionalEventLedger.publicEvents.length,
      followUpCount: resolution.regionalEventLedger.pendingFollowUps.length,
      pressureScore: resolution.regionalEventLedger.pressureSummary.score,
      forbiddenUpgrades: resolution.forbiddenUpgrades,
    });

    return resolution;
  },
});
