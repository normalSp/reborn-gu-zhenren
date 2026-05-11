import { useStore } from '../store';
import { buildExtremePhysiqueCalamityProfile } from '../engine/extreme-physique-calamity';
import { listSquadDispatchTasks } from '../engine/squad-dispatch';
import { resolveTerrainCombatModifier } from '../engine/terrain-combat';
import { createDefaultCultivationState } from '../engine/v080-cultivation-calamity-engine';
import { createDefaultStoryAnchorState } from '../engine/v080-midgame-anchor-engine';
import { createDefaultEndingFrameworkState } from '../engine/v080-ending-framework-engine';
import {
  buildLifeboundEndingEvidence,
  buildOriginEndingEvidence,
  buildOriginLifeboundContextForPrompt,
} from '../engine/v080-origin-lifebound-closure';

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
      startBattlefieldLargeGroupDemo: () => Record<string, unknown>;
      startNarrativeGuAffordanceDemo: () => Record<string, unknown>;
      startCultivationDeepeningDemo: () => Record<string, unknown>;
      startMidgameAnchorDemo: () => Record<string, unknown>;
      startEndingFrameworkDemo: () => Record<string, unknown>;
      startOriginLifeboundClosureDemo: () => Record<string, unknown>;
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
  const originEvidence = buildOriginEndingEvidence(state);
  const lifeboundEvidence = buildLifeboundEndingEvidence(state);

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
      gridPresetId: state.battlefieldCombatState.gridPresetId || null,
      gridWidth: Number(state.battlefieldCombatState.grid?.width || 0),
      gridHeight: Number(state.battlefieldCombatState.grid?.height || 0),
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
    cultivation: state.cultivationState ? {
      progress: Number(state.cultivationState.progress || 0),
      breakthroughCount: Array.isArray(state.cultivationState.breakthroughHistory) ? state.cultivationState.breakthroughHistory.length : 0,
      calamityCount: Array.isArray(state.cultivationState.calamityLedger) ? state.cultivationState.calamityLedger.length : 0,
      lastStepCount: Array.isArray(state.cultivationState.lastResolution) ? state.cultivationState.lastResolution.length : 0,
      threeQi: state.cultivationState.ascension?.threeQi || null,
      heavenWillPressure: Number(state.cultivationState.ascension?.heavenWillPressure || 0),
      nextCalamity: state.cultivationState.nextCalamityPreview?.name || null,
    } : null,
    storyAnchor: state.storyAnchorState ? {
      fateState: state.storyAnchorState.fateState,
      currentAnchorId: state.storyAnchorState.currentAnchorId || null,
      storyCandidateCount: Array.isArray(state.storyAnchorState.storyEventCandidates) ? state.storyAnchorState.storyEventCandidates.length : 0,
      ifVectorCount: Array.isArray(state.storyAnchorState.ifBranchVectors) ? state.storyAnchorState.ifBranchVectors.length : 0,
      pressureCount: Array.isArray(state.storyAnchorState.canonAnchorPressureLog) ? state.storyAnchorState.canonAnchorPressureLog.length : 0,
      heavenWillAttention: Number(state.storyAnchorState.heavenWillLedger?.attention || 0),
      karmicDebt: Number(state.storyAnchorState.karmicDebtLedger?.totalDebt || 0),
      lastStepCount: Array.isArray(state.storyAnchorState.lastResolutionSteps) ? state.storyAnchorState.lastResolutionSteps.length : 0,
    } : null,
    ending: state.endingState ? {
      status: state.endingState.status,
      candidateCount: Array.isArray(state.endingState.candidates) ? state.endingState.candidates.length : 0,
      canCommitCount: Array.isArray(state.endingState.candidates) ? state.endingState.candidates.filter((candidate: any) => candidate.canCommit).length : 0,
      pressureCount: Array.isArray(state.endingState.pressureLog) ? state.endingState.pressureLog.length : 0,
      committedFamilyId: state.endingState.commitRecord?.outcome?.familyId || null,
      lastStepCount: Array.isArray(state.endingState.lastResolutionSteps) ? state.endingState.lastResolutionSteps.length : 0,
    } : null,
    originLifebound: {
      originProfileId: originEvidence.profileId || null,
      originProfileName: originEvidence.profileName || null,
      originDebtLabels: originEvidence.debtLabels || [],
      lifeboundProfileId: lifeboundEvidence.profileId || null,
      lifeboundProfileName: lifeboundEvidence.profileName || null,
      lifeboundGuName: lifeboundEvidence.guName || null,
      lifeboundRiskTags: lifeboundEvidence.riskTags || [],
      contextPreview: buildOriginLifeboundContextForPrompt(state),
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
    startBattlefieldLargeGroupDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      useStore.setState({ turn: Math.max(Number(store.turn || 1), 2) } as any);
      store.setScreenState?.('game_play');
      store.setGameMode?.('canon');
      store.initBattlefieldLargeGroupDemo?.();
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
    startCultivationDeepeningDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      const cultivationState = createDefaultCultivationState({
        progress: 190,
        ascension: {
          threeQi: { human: 72, earth: 68, heaven: 70 },
          preparationScore: 74,
          heavenWillPressure: 8,
          karmicDebt: 2,
        },
      });
      useStore.setState({
        turn: Math.max(Number(store.turn || 1), 8),
        activeTab: 'actions',
        profile: { name: 'b2演武蛊师', background: '升仙演武', realm: { grand: 5, sub: '巅峰', label: '五转巅峰' } },
        attributes: { 资质: 8, 体魄: 7, 心智: 8, 气运: 7 },
        vitals: {
          health: { current: 240, max: 240 },
          essence: { current: 260, max: 260 },
          essenceType: 'mortal',
        },
        gameTime: { ap: 3, max_ap: 3, period: 'night', day: 18, month: 6, year: 1, season: 'summer' },
        pathBuild: {
          primary: '气道',
          secondary: ['炎道'],
          path_levels: { 气道: '大师' },
          dao_marks: { 气道: 240, 炎道: 80 },
        },
        aperture: {
          type: 'mortal',
          rank: 5,
          subRank: '巅峰',
          primevalSea: { color: '#c9a84a', colorName: '黄金', fillPercent: 94 },
          apertureWall: { state: '壁薄如纸', opacity: 0.62, description: '窍壁已薄如纸，三气牵引升仙机缘。' },
          capacity: 15,
          carriedGu: 3,
          capacityLocked: false,
        },
        inventory: [
          { id: 'b2_rank5_core', specId: 'moonlight_gu', name: '月芒蛊', tier: 5, path: '光道', currentState: 'optimal', hungerCounter: 0, proficiency: 2, bonded: true, active: true, acquiredAt: { turn: 1, narrative: 'e2e' } },
          { id: 'b2_rank4_support', specId: 'stone_skin_gu', name: '石皮蛊', tier: 4, path: '土道', currentState: 'optimal', hungerCounter: 0, proficiency: 1, bonded: false, active: true, acquiredAt: { turn: 1, narrative: 'e2e' } },
        ],
        killMoves: [{ id: 'b2_qi_guard', name: '三气护窍', path: '气道', level: 5, baseCost: 60, multiplier: 1.1, cooldown: 3, description: '升仙前护住窍壁的演武杀招。' }],
        cultivationState,
        flags: { ...(store.flags || {}), cultivationProgress: 190 },
        pipelinePhase: 'RESOLVED',
        pipelineError: null,
      } as any);
      const next = useStore.getState() as any;
      next.setScreenState?.('game_play');
      next.setGameMode?.('canon');
      return summarizeStore();
    },
    startMidgameAnchorDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      const storyAnchorState = createDefaultStoryAnchorState({
        currentAnchorId: 'fate_war',
        fateState: 'fractured',
        ifBranchVectors: [{
          id: 'e2e_break_fate_vector',
          anchorId: 'fate_war',
          axis: 'break_fate',
          delta: 18,
          cause: '玩家在侧翼战场保护撤退窗口，同时偏向毁宿命阵营。',
          cost: '天意排斥与天庭关注上升',
          downstreamImpact: ['heaven_will_debt', 'faction_shift'],
          provenance: 'if-derived',
          createdTurn: 12,
        }],
        heavenWillLedger: {
          attention: 42,
          correction: 28,
          rejection: 18,
          ambiguity: 45,
          lastTriggers: [{
            kind: 'fate_mutation',
            delta: 12,
            reason: '宿命战侧翼 IF 偏移演武',
            anchorId: 'fate_war',
            turn: 12,
          }],
        },
        karmicDebtLedger: {
          totalDebt: 18,
          byKind: { heavenly_court_attention: 10, chaos_debt: 8 },
          pendingReturns: [],
        },
        storyEventCandidates: [{
          id: 'e2e_fate_side_rescue',
          anchorId: 'fate_war',
          type: 'side_event',
          title: '宿命战侧翼救援',
          summary: '玩家只能争取救援与撤退窗口，不能夺取宿命蛊或替代核心战果。',
          risk: 'high',
          source: 'engine',
          engineValidation: 'accepted',
          validationIssues: [],
          createdTurn: 12,
          chapterId: 'fate_war',
          domain: '中洲',
          resolutionHint: '侧翼战场可进入战斗或关系变化，不结算核心宿命结果。',
        }],
        ifBranchCandidates: [{
          id: 'e2e_if_break_fate_candidate',
          anchorId: 'fate_war',
          axis: 'break_fate',
          proposedDelta: 18,
          summary: '协助毁宿命一方争取侧翼窗口',
          costHint: '天意排斥与势力仇怨',
          downstreamHint: ['heaven_will_debt'],
          source: 'engine',
          engineValidation: 'accepted',
          validationIssues: [],
          createdTurn: 12,
          chapterId: 'fate_war',
          domain: '中洲',
        }],
        canonAnchorPressureLog: [{
          id: 'e2e_pressure_fate_gu',
          anchorId: 'fate_war',
          pressure: 100,
          reason: '玩家不能获得宿命蛊。',
          attemptedMutation: '玩家获得宿命蛊',
          engineDecision: 'block',
          fallbackNarrativeHint: '改为侧翼见证或撤退压力。',
          createdTurn: 12,
          chapterId: 'fate_war',
          domain: '中洲',
        }],
        lastResolutionSteps: [{
          id: 'e2e_anchor_step',
          kind: 'block',
          anchorId: 'fate_war',
          turn: 12,
          message: '宿命战核心结果由本地引擎保护，玩家行动降级为侧翼战场。',
          severity: 'danger',
        }],
      });
      useStore.setState({
        turn: Math.max(Number(store.turn || 1), 12),
        tutorialState: 'skipped',
        currentStep: 0,
        currentDomain: '中洲',
        currentChapterId: 'fate_war',
        profile: { name: 'b3锚点演武蛊师', background: '宿命侧翼', realm: { grand: 6, sub: '初阶', label: '六转初阶' } },
        storyAnchorState,
        flags: {
          ...(store.flags || {}),
          fateState: storyAnchorState.fateState,
          currentCanonAnchorId: storyAnchorState.currentAnchorId,
          ifBranchVectors: storyAnchorState.ifBranchVectors,
          heavenWillLedger: storyAnchorState.heavenWillLedger,
          karmicDebtLedger: storyAnchorState.karmicDebtLedger,
          storyEventCandidates: storyAnchorState.storyEventCandidates,
          canonAnchorPressureLog: storyAnchorState.canonAnchorPressureLog,
        },
        currentNarrative: {
          narrative: {
            text: '中洲天穹低压，宿命战的风暴从正面战场漫到侧翼。你能抢救一队撤退的蛊师，或在 IF 模式下记录一次偏移，但不能替代原著核心因果。',
            choices: [
              {
                id: 'anchor_side_rescue',
                text: '进入侧翼战场，护送受伤蛊师撤出阵纹余波',
                risk: 'medium',
                risk_note: '可影响关系与局部战果，不改变宿命蛊核心归属。',
                anchorTags: [{
                  kind: 'canon_side',
                  label: '正史侧翼',
                  anchorId: 'fate_war',
                  reason: '侧翼救援属于正史允许变化。',
                  severity: 'medium',
                }],
              },
              {
                id: 'anchor_if_break',
                text: '记录毁宿命侧的 IF 偏移意图，等待本地引擎校验代价',
                risk: 'high',
                risk_note: 'IF 倾向会写入向量，并提升天意与因果压力。',
                anchorTags: [{
                  kind: 'if_deviation',
                  label: 'IF偏移',
                  anchorId: 'fate_war',
                  reason: 'break_fate 是宿命战允许 IF 轴，但必须付代价。',
                  severity: 'high',
                }],
              },
              {
                id: 'anchor_forbidden_fate_gu',
                text: '试图夺取宿命蛊本体',
                risk: 'high',
                risk_note: '禁区操作会被本地锚点引擎拦截。',
                anchorTags: [{
                  kind: 'forbidden_block',
                  label: '禁区拦截',
                  anchorId: 'fate_war',
                  reason: '玩家获得宿命蛊属于 b3 禁区。',
                  severity: 'high',
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
      next.setGameMode?.('if');
      return summarizeStore();
    },
    startEndingFrameworkDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      const storyAnchorState = createDefaultStoryAnchorState({
        currentAnchorId: 'heavenly_court_late_chapter',
        fateState: 'destroyed',
        ifBranchVectors: [
          {
            id: 'e2e_c1_break_fate',
            anchorId: 'fate_war',
            axis: 'break_fate',
            delta: 62,
            cause: '宿命战侧翼演武后偏向毁宿命。',
            cost: '天意排斥、正道敌意、尊者棋局压力',
            downstreamImpact: ['fate_destroyed_struggle', 'venerable_balance'],
            provenance: 'if-derived',
            createdTurn: 88,
          },
          {
            id: 'e2e_c1_faction',
            anchorId: 'venerable_chessboard',
            axis: 'faction_shift',
            delta: 38,
            cause: '玩家势力在乱世中保住一处立足点。',
            cost: '各方势力开始计入玩家变量。',
            downstreamImpact: ['player_faction_foothold'],
            provenance: 'if-derived',
            createdTurn: 96,
          },
        ],
        heavenWillLedger: {
          attention: 58,
          correction: 34,
          rejection: 42,
          ambiguity: 36,
          lastTriggers: [],
        },
        karmicDebtLedger: {
          totalDebt: 36,
          byKind: { chaos_debt: 18, venerable_attention: 18 },
          pendingReturns: [],
        },
      });
      useStore.setState({
        turn: Math.max(Number(store.turn || 1), 120),
        tutorialState: 'skipped',
        currentStep: 0,
        currentDomain: '中洲',
        currentChapterId: 'heavenly_court_late_chapter',
        profile: { name: 'c1终局演武蛊师', background: '武家边支外务', realm: { grand: 7, sub: '中阶', label: '七转中阶' } },
        vitals: {
          health: { current: 420, max: 480 },
          essence: { current: 1800, max: 2400 },
          essenceType: 'immortal',
        },
        playerFaction: {
          id: 'e2e_player_faction',
          name: '墨痕别院',
          reputation: 82,
          members: [],
        },
        totalBattlesFought: 18,
        combatWins: 12,
        squadCombatWins: 4,
        squadMemberDeaths: 1,
        squadMemberWoundedRescues: 2,
        storyAnchorState,
        endingState: createDefaultEndingFrameworkState(),
        flags: {
          ...(store.flags || {}),
          playerFactionScore: 82,
          fateState: storyAnchorState.fateState,
          currentCanonAnchorId: storyAnchorState.currentAnchorId,
          ifBranchVectors: storyAnchorState.ifBranchVectors,
          heavenWillLedger: storyAnchorState.heavenWillLedger,
          karmicDebtLedger: storyAnchorState.karmicDebtLedger,
        },
        pipelinePhase: 'RESOLVED',
        pipelineError: null,
      } as any);
      const next = useStore.getState() as any;
      next.setScreenState?.('game_play');
      next.setGameMode?.('if');
      next.refreshEndingCandidatesAction?.();
      return summarizeStore();
    },
    startOriginLifeboundClosureDemo() {
      const store = useStore.getState() as any;
      skipTutorialForE2e();
      useStore.setState({
        turn: Math.max(Number(store.turn || 1), 16),
        tutorialState: 'skipped',
        currentStep: 0,
        currentDomain: '南疆',
        currentChapterId: 'shang_clan_city',
        activeTab: 'gu_inventory',
        profile: {
          name: 'c1.2演武蛊师',
          background: '商家商队外线',
          realm: { grand: 3, sub: '高阶', label: '三转高阶' },
        },
        flags: {
          ...(store.flags || {}),
          _start_profile: 'start_default_shangjia',
          _start_role: '商家外围商队学徒',
          _faction_name: '商家',
          currentCanonAnchorId: 'shang_clan_city',
        },
        inventory: [
          {
            id: 'c12_moonlight_lifebound',
            specId: 'moonlight_gu',
            name: '月光蛊',
            tier: 1,
            path: '月道',
            currentState: 'optimal',
            hungerCounter: 0,
            proficiency: 18,
            bonded: true,
            active: true,
            acquiredAt: { turn: 1, narrative: 'c1.2 e2e 本命蛊演示' },
          },
          {
            id: 'c12_bookworm',
            specId: 'bookworm',
            name: '书虫',
            tier: 1,
            path: '信道',
            currentState: 'optimal',
            hungerCounter: 0,
            proficiency: 12,
            bonded: false,
            active: true,
            acquiredAt: { turn: 1, narrative: 'c1.2 e2e 出身深线演示' },
          },
        ],
        guHungerCounters: {
          c12_moonlight_lifebound: 0,
          c12_bookworm: 0,
        },
        lifeboundGuInfo: {
          guId: 'c12_moonlight_lifebound',
          guName: '月光蛊',
          boundAt: 3,
          turnsSinceBound: 13,
          cooldownRemaining: 0,
          upgradeCount: 1,
          onCooldown: false,
        },
        lifeboundDeathPenalty: null,
        currentNarrative: {
          narrative: {
            text: '商家城外的商路灯火压着夜色，商队管事提醒你：出身、资源入口和本命蛊都必须按本地系统解释。',
            choices: [
              {
                id: 'c12_origin_choice',
                text: '以商路蛊师身份递交货单，避免被误写成古月族学弟子',
                risk: 'low',
                risk_note: '出身深线会降级跨身份越权。',
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
