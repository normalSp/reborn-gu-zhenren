import { useStore } from '../store';
import { buildExtremePhysiqueCalamityProfile } from '../engine/extreme-physique-calamity';
import { listSquadDispatchTasks } from '../engine/squad-dispatch';
import { resolveTerrainCombatModifier } from '../engine/terrain-combat';

type E2eSave = string | Record<string, unknown>;

interface E2eTerrainPreset {
  terrainId: string;
  formationId?: string;
}

const DOMAIN_TERRAIN_PRESET: Record<string, E2eTerrainPreset> = {
  北原: { terrainId: 'mountain_pass', formationId: 'defensive_screen' },
  西漠: { terrainId: 'mountain_pass', formationId: 'concealment_array' },
  中洲: { terrainId: 'formation_ruins', formationId: 'defensive_screen' },
  南疆: { terrainId: 'dense_forest', formationId: 'concealment_array' },
  东海: { terrainId: 'riverbank', formationId: 'defensive_screen' },
};

declare global {
  interface Window {
    __REBORN_E2E__?: {
      loadSave: (save: E2eSave) => { success: boolean; error?: string };
      getStateSummary: () => Record<string, unknown>;
      clearRuntime: () => void;
    };
  }
}

function isE2eEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('e2e');
}

function summarizeStore(): Record<string, unknown> {
  const state = useStore.getState() as any;
  const currentDomain = state.currentDomain || state.playerPosition?.region || '';
  const terrainPreset = DOMAIN_TERRAIN_PRESET[currentDomain] ?? { terrainId: 'dense_forest' };
  const terrainPreview = resolveTerrainCombatModifier({
    ...terrainPreset,
    actorPath: state.pathBuild?.primary || state.primaryPath || null,
  });
  const hpPercent = state.vitals?.health?.max
    ? (state.vitals.health.current / state.vitals.health.max) * 100
    : 100;
  const aperture = state.aperture ?? state.mortalAperture ?? null;
  const extremePhysiquePressure = buildExtremePhysiqueCalamityProfile(aperture, {
    hpPercent,
    turn: state.turn,
    recentForcedGuUse: Number(state.flags?.recentForcedGuUse || 0),
  });
  const auctionPools = {
    immortalGu: Array.isArray(state.auctionItems) ? state.auctionItems.length : 0,
    materials: Array.isArray(state.materialAuctionItems) ? state.materialAuctionItems.length : 0,
    recipes: Array.isArray(state.recipeAuctionItems) ? state.recipeAuctionItems.length : 0,
    killerMoves: Array.isArray(state.killerMoveAuctionItems) ? state.killerMoveAuctionItems.length : 0,
  };
  const factionMembers = Array.isArray(state.playerFaction?.members) ? state.playerFaction.members : [];

  return {
    screenState: state.screenState,
    turn: state.turn,
    playerName: state.profile?.name || '',
    playerRole: 'original_participant',
    realm: state.profile?.realm?.label || '',
    currentDomain,
    currentChapterId: state.currentChapterId || null,
    partySize: Array.isArray(state.partyState?.members) ? state.partyState.members.length : 0,
    partyFormation: state.partyState?.formation || null,
    squadDispatchActiveCount: Array.isArray(state.squadDispatchState?.activeAssignments)
      ? state.squadDispatchState.activeAssignments.length
      : 0,
    squadDispatchRecentCount: Array.isArray(state.squadDispatchState?.recentResults)
      ? state.squadDispatchState.recentResults.length
      : 0,
    squadDispatchTaskCount: listSquadDispatchTasks().length,
    squadDispatchEligibleMemberCount: factionMembers.filter((member: any) => (
      member?.alive !== false &&
      (!member?.status || member.status === 'idle') &&
      !member?.woundedUntil &&
      !member?.closedDoorUntil &&
      !member?.externalTaskUntil &&
      !member?.factionTaskUntil
    )).length,
    squadCombatPhase: state.squadCombatState?.phase || null,
    duelPhase: state.duelState?.phase || null,
    auctionActive: !!state.isAuctionActive,
    auctionPools,
    auctionPoolCategories: auctionPools,
    terrainPreview: {
      terrainId: terrainPreview.terrainId,
      terrainName: terrainPreview.terrainName,
      formationId: terrainPreview.formationId,
      formationName: terrainPreview.formationName,
      damageMultiplier: terrainPreview.damageMultiplier,
      hitBonus: terrainPreview.hitBonus,
      escapeModifier: terrainPreview.escapeModifier,
      eventRiskModifier: terrainPreview.eventRiskModifier,
      notes: terrainPreview.notes,
    },
    extremePhysiquePressure: extremePhysiquePressure ? {
      physiqueType: extremePhysiquePressure.physiqueType,
      pressureLevel: extremePhysiquePressure.pressureLevel,
      aperturePressure: extremePhysiquePressure.aperturePressure,
      safeTurnsEstimate: extremePhysiquePressure.safeTurnsEstimate,
      warningCount: extremePhysiquePressure.warnings.length,
      blockedActionCount: extremePhysiquePressure.blockedActions.length,
    } : null,
    gameLogCount: Array.isArray(state.gameLog) ? state.gameLog.length : 0,
    eventHistoryCount: Array.isArray(state.eventHistory) ? state.eventHistory.length : 0,
    battleVisualQueueLength: Array.isArray(state.battleVisualQueue) ? state.battleVisualQueue.length : 0,
    currentBgm: state.soundState?.currentBgm || state.audioState?.currentBgm || null,
    voiceActive: !!state.soundState?.voiceActive,
    pipelinePhase: state.pipelinePhase,
    pipelineError: state.pipelineError || null,
  };
}

export function installE2eHarness(): void {
  if (!isE2eEnabled()) return;

  window.__REBORN_E2E__ = {
    loadSave(save: E2eSave) {
      const payload = typeof save === 'string' ? save : JSON.stringify(save);
      const store = useStore.getState() as any;
      const result = store.loadFromFile?.(payload) ?? { success: false, error: 'loadFromFile is unavailable' };
      if (result.success) {
        const next = useStore.getState() as any;
        next.setScreenState?.('game_play');
        next.setGameMode?.('canon');
        useStore.setState({ gameLoadVersion: (next.gameLoadVersion || 0) + 1 } as any);
        const afterLoad = useStore.getState() as any;
        if (String(afterLoad.currentChapterId || '').includes('treasure_yellow_heaven')) {
          afterLoad.initAuction?.();
        }
      }
      return result;
    },
    getStateSummary: summarizeStore,
    clearRuntime() {
      try {
        window.localStorage.removeItem('gu-zhenren-save');
      } catch {
        /* no-op */
      }
      const store = useStore.getState() as any;
      store.resetStore?.();
      store.setScreenState?.('title');
    },
  };
}
