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
      startBattlefieldDemo: () => Record<string, unknown>;
      startBattlefieldGroupDemo: () => Record<string, unknown>;
      startNarrativeGuAffordanceDemo: () => Record<string, unknown>;
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
    battlefieldCombat: state.battlefieldCombatState ? {
      battleId: state.battlefieldCombatState.battleId,
      mode: state.battlefieldCombatState.mode || 'duel',
      phase: state.battlefieldCombatState.phase,
      round: state.battlefieldCombatState.round,
      activeUnitId: state.battlefieldCombatState.activeUnitId || null,
      cellCount: Array.isArray(state.battlefieldCombatState.grid?.cells) ? state.battlefieldCombatState.grid.cells.length : 0,
      unitCount: Array.isArray(state.battlefieldCombatState.units) ? state.battlefieldCombatState.units.length : 0,
      hiddenUnitCount: Array.isArray(state.battlefieldCombatState.units) ? state.battlefieldCombatState.units.filter((unit: any) => unit.revealed === false).length : 0,
      objectiveCount: Array.isArray(state.battlefieldCombatState.objectives) ? state.battlefieldCombatState.objectives.length : 0,
      thirdPartyCount: Array.isArray(state.battlefieldCombatState.thirdParties) ? state.battlefieldCombatState.thirdParties.length : 0,
      morale: state.battlefieldCombatState.morale || null,
      stepCount: Array.isArray(state.battlefieldPlaybackSteps) ? state.battlefieldPlaybackSteps.length : 0,
      traceCursor: Number(state.battlefieldTraceCursor || 0),
      result: state.battlefieldCombatState.result || null,
    } : null,
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

function skipTutorialForE2e(): void {
  try {
    window.localStorage.setItem('gu-zhenren-tutorial-skipped', 'true');
  } catch {
    /* no-op */
  }
  useStore.setState({ tutorialState: 'skipped', currentStep: 0 } as any);
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
    startBattlefieldDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      useStore.setState({ turn: Math.max(Number(store.turn || 1), 2) } as any);
      store.setScreenState?.('game_play');
      store.setGameMode?.('canon');
      store.initBattlefieldDemo?.();
      return summarizeStore();
    },
    startBattlefieldGroupDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      useStore.setState({ turn: Math.max(Number(store.turn || 1), 2) } as any);
      store.setScreenState?.('game_play');
      store.setGameMode?.('canon');
      store.initBattlefieldGroupDemo?.();
      return summarizeStore();
    },
    startNarrativeGuAffordanceDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      useStore.setState({
        turn: Math.max(Number(store.turn || 1), 2),
        tutorialState: 'skipped',
        currentStep: 0,
        inventory: [
          {
            id: 'e2e_moonlight_gu',
            name: '月光蛊',
            tier: 1,
            path: '光道',
            rarity: '普通',
            description: '可凝出月刃切断绳索或示警。',
            currentState: 'normal',
          },
          {
            id: 'e2e_woman_heart_gu',
            name: '妇人心蛊',
            tier: 4,
            path: '毒道',
            rarity: '禁忌',
            description: '毒道禁忌蛊，只能在强场景门槛下候选使用。',
            currentState: 'sealed',
          },
        ],
        currentNarrative: {
          narrative: {
            text: '山道尽头有一处被藤索封住的暗门，商队护卫催促你尽快决定。暗处还有尸毒气息残留，任何蛊虫手段都必须经过场景校验，不能把尝试直接写成奖励或胜负。',
            choices: [
              {
                id: 'c1',
                text: '使用月光蛊切断藤索，先开一条缝观察里面',
                risk: 'medium',
                risk_note: '月刃声响可能惊动附近巡夜人',
                guAffordances: [{
                  sourceType: 'gu',
                  sourceName: '月光蛊',
                  utilityId: 'cut_rope',
                  category: 'obstacle_breaking',
                  categoryLabel: '破障',
                  label: '月光蛊 · 破障',
                  status: 'available',
                  reason: '你持有月光蛊，可作为切断藤索的剧情解法候选。',
                  risk: 'medium',
                  riskHint: '结果仍由本地规则校验。',
                  owned: true,
                  sceneGated: false,
                  forbidden: false,
                }],
              },
              {
                id: 'c2',
                text: '寻找追踪蛊线索，判断有没有人先进去过',
                risk: 'low',
                risk_note: '你尚未持有追踪蛊，只能打听线索',
                guAffordances: [{
                  sourceType: 'gu',
                  sourceName: '追踪蛊',
                  utilityId: 'follow_fugitive',
                  category: 'tracking',
                  categoryLabel: '追踪',
                  label: '追踪蛊 · 追踪',
                  status: 'missing',
                  reason: '你尚未持有追踪蛊，此选项只能作为线索。',
                  risk: 'medium',
                  riskHint: '缺蛊时不能显示为可执行使用。',
                  owned: false,
                  sceneGated: false,
                  forbidden: false,
                }],
              },
              {
                id: 'c3',
                text: '压下妇人心蛊的毒意，只记录尸毒门槛',
                risk: 'high',
                risk_note: '禁忌蛊若无强场景授权会引发反噬和声名风险',
                guAffordances: [{
                  sourceType: 'gu',
                  sourceName: '妇人心蛊',
                  utilityId: 'forbidden_poison_refinement',
                  category: 'detox',
                  categoryLabel: '解毒',
                  label: '妇人心蛊 · 禁忌门槛',
                  status: 'forbidden',
                  reason: '妇人心蛊需要强剧情门槛，不能当普通安全解法。',
                  risk: 'high',
                  riskHint: '需要 sceneValidated=true 后才可候选执行。',
                  owned: true,
                  sceneGated: true,
                  forbidden: true,
                }],
              },
            ],
          },
          state_update: {},
        },
        pipelinePhase: 'RESOLVED',
        pipelineError: null,
      } as any);
      const next = useStore.getState() as any;
      next.setScreenState?.('game_play');
      next.setGameMode?.('canon');
      return summarizeStore();
    },
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
