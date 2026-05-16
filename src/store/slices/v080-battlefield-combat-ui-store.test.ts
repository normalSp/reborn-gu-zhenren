import { describe, expect, it, vi } from 'vitest';
import { EXCLUDE_FROM_SAVE } from '../initialState';
import { createCombatSlice } from './combatSlice';
import {
  buildBattlefieldActionCards,
  buildQingmaoAssetManifest,
  buildQingmaoBattlefieldAtmosphereAsset,
  buildQingmaoBattlefieldAssets,
  buildQingmaoBattlefieldCues,
  buildQingmaoBattlefieldStoryboard,
  isQingmaoMortalBattlefield,
} from '../../engine/v080-battlefield-ui-model';
import { buildQingmaoCombatEventCandidate } from '../../engine/v010-qingmao-combat-pack';

function createHarness() {
  let state: any = {
    profile: { name: '测试蛊师', realm: { grand: 3, label: '三转中阶' } },
    vitals: {
      health: { current: 160, max: 180 },
      essence: { current: 100, max: 100 },
    },
    pathBuild: {
      primary: '月道',
      dao_marks: { 月道: 90 },
    },
    inventory: [],
    apertureInventory: { gu: [] },
    killMoves: [],
    flags: {},
    turn: 82,
    sceneSessionState: {
      version: 'v0.8.0-c2.2',
      sceneId: 'test_scene',
      narrativeTurn: 82,
      locationId: 'qingmao',
      period: 'night',
      safety: 'dangerous',
      actionBudget: { maxAp: 3, remainingAp: 3, grantedBy: 'narrative_scene', exhaustedPolicy: 'advance_narrative' },
      localActionLedger: [],
      pendingAdvanceIntent: null,
      lastNarrativeSummary: '',
    },
    addGameLog: vi.fn(),
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.setFlag = (key: string, value: any) => {
    state = { ...state, flags: { ...(state.flags || {}), [key]: value } };
  };
  state.recordLocalActionLedger = (entry: any) => {
    state = {
      ...state,
      sceneSessionState: {
        ...state.sceneSessionState,
        localActionLedger: [...state.sceneSessionState.localActionLedger, entry],
      },
    };
  };
  state = { ...state, ...createCombatSlice(set, get) };
  return { get: () => state };
}

describe('v0.8.0-a2 battlefield combat UI store bridge', () => {
  it('creates a non-persistent 5x3 demo battlefield and normal combat action cards', () => {
    const harness = createHarness();

    harness.get().initBattlefieldDemo();
    const battle = harness.get().battlefieldCombatState;

    expect(battle.grid.cells).toHaveLength(15);
    expect(battle.units.some((unit: any) => unit.side === 'enemy')).toBe(true);
    expect(harness.get().battlefieldPlaybackSteps).toEqual([]);
    expect(EXCLUDE_FROM_SAVE.has('battlefieldCombatState')).toBe(true);
    expect(EXCLUDE_FROM_SAVE.has('battlefieldPlaybackSteps')).toBe(true);

    const cards = buildBattlefieldActionCards(battle, 'player', 'gu');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(card => card.action?.type === 'gu')).toBe(true);
    expect(cards.some(card => card.label === '月光蛊')).toBe(true);
    expect(cards.some(card => !card.disabledReason)).toBe(true);
    expect(cards.every(card => !['被动蛊不能主动发动', '需要强场景门槛', '非普通凡战行动'].includes(card.disabledReason || ''))).toBe(true);
  });

  it('selects target, executes via local engine, appends trace steps, and can retreat', () => {
    const harness = createHarness();
    harness.get().initBattlefieldDemo();

    harness.get().selectBattlefieldAction({ type: 'gu', actorId: 'player', guName: '月光蛊' });
    expect(harness.get().battlefieldValidation.validTargetCellIds).toContain('c3_1');

    harness.get().selectBattlefieldTarget('c3_1');
    expect(harness.get().battlefieldValidation.ok).toBe(true);

    harness.get().executeSelectedBattlefieldAction();
    const steps = harness.get().battlefieldPlaybackSteps;
    expect(steps.some((step: any) => step.kind === 'gu_use')).toBe(true);
    expect(steps.some((step: any) => step.kind === 'resource_spend')).toBe(true);
    expect(harness.get().battlefieldCombatState.units.find((unit: any) => unit.id === 'player').essence.current).toBeLessThan(100);

    harness.get().selectBattlefieldAction({ type: 'retreat', actorId: 'player' });
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.tags.includes('retreat'))).toBe(true);
  });

  it('creates the v0.9.0-b3 Qingmao mortal visual slice without turning Liquor Worm into an attack button', () => {
    const harness = createHarness();

    harness.get().initQingmaoMortalBattlefieldDemo();
    const battle = harness.get().battlefieldCombatState;

    expect(isQingmaoMortalBattlefield(battle)).toBe(true);
    expect(battle.grid.cells).toHaveLength(15);
    expect(battle.activeTerrainId).toBe('moonlit_courtyard');
    expect(battle.activeFormationId).toBe('qingmao_aperture_ring');

    const cards = buildBattlefieldActionCards(battle, 'player', 'gu');
    const moonlightCard = cards.find(card => card.label === '月光蛊');
    expect(moonlightCard && !moonlightCard.disabledReason).toBe(true);
    expect(moonlightCard?.rangeText).toContain('3格');
    expect(moonlightCard?.targetText).toContain('格');
    expect(moonlightCard?.counterText).toContain('遮蔽');
    expect(cards.some(card => card.label === '白玉蛊' && !card.disabledReason)).toBe(true);
    expect(cards.some(card => card.label === '酒虫')).toBe(false);

    const cues = buildQingmaoBattlefieldCues(battle);
    expect(cues.map(cue => cue.id)).toEqual(['moonlight-gu', 'white-jade-gu', 'liquor-worm', 'art-boundary']);
    expect(cues.find(cue => cue.id === 'liquor-worm')?.text).toContain('不作为普通攻击按钮');
    expect(cues.find(cue => cue.id === 'art-boundary')?.text).toContain('不暗示仙蛊');

    const assets = buildQingmaoBattlefieldAssets(battle);
    expect(assets.map(asset => asset.id)).toEqual(['moonlight-gu', 'white-jade-gu', 'liquor-worm']);
    expect(assets.every(asset => asset.src.startsWith('/rebrng/gu/s0-qingmao/'))).toBe(true);
    expect(assets.every(asset => asset.sceneBinding === 'generic')).toBe(true);
    expect(assets.every(asset => asset.admission === 'runtime_active')).toBe(true);
    expect(assets.find(asset => asset.id === 'liquor-worm')?.boundary).toContain('不进入普通攻击按钮');

    const atmosphere = buildQingmaoBattlefieldAtmosphereAsset(battle);
    expect(atmosphere?.id).toBe('qingmao-mortal-battlefield-generic-atmosphere');
    expect(atmosphere?.role).toBe('background');
    expect(atmosphere?.runtimeLayer).toBe('scene_background');
    expect(atmosphere?.sceneBinding).toBe('generic');
    expect(atmosphere?.admission).toBe('runtime_active');
    expect(atmosphere?.compositionContractId).toBe('c035-qingmao-generic-battlefield-atmosphere');
    expect(atmosphere?.src).toBe('/rebrng/scenes/s0-qingmao/qingmao-mortal-battlefield-generic-atmosphere.svg');
    expect(atmosphere?.boundary).toContain('不绑定方源');

    const manifest = buildQingmaoAssetManifest();
    expect(manifest.some(asset => asset.status === 'review-only' && asset.role === 'scene_reference')).toBe(true);
    expect(manifest.some(asset => asset.status === 'active' && asset.role === 'scene_reference')).toBe(false);
    expect(manifest.filter(asset => asset.status === 'active' && asset.role === 'background')).toHaveLength(1);
    expect(manifest.filter(asset => asset.sceneBinding === 'scene_specific').every(asset => asset.status === 'review-only')).toBe(true);
    expect(manifest.find(asset => asset.id === 'spring-autumn-cicada')?.status).toBe('blocked');
    expect(manifest.find(asset => asset.id === 'spring-autumn-cicada')?.admission).toBe('blocked');
    expect(manifest.find(asset => asset.id === 'spring-autumn-cicada')?.boundary).toContain('当前 UI 禁用');

    const idleStoryboard = buildQingmaoBattlefieldStoryboard(battle);
    expect(idleStoryboard.map(beat => beat.id)).toEqual([
      'moon-blade-chain',
      'white-jade-shell',
      'liquor-worm-support',
      'forbidden-threshold',
    ]);
    expect(idleStoryboard.find(beat => beat.id === 'liquor-worm-support')?.active).toBe(true);
    expect(idleStoryboard.find(beat => beat.id === 'forbidden-threshold')?.active).toBe(false);

    const activeStoryboard = buildQingmaoBattlefieldStoryboard(battle, {
      id: 'test_moon_step',
      round: 1,
      kind: 'killer_move',
      actorId: 'player',
      sourceName: '月刃连斩',
      affectedCellIds: ['c3_1'],
      message: '月刃连斩扫过中线',
      visual: { motif: 'crescent_chain', primaryTint: '#E0C78A', motion: 'straight_arc', intensity: 'high' },
      tags: ['killer_move'],
    });
    expect(activeStoryboard.find(beat => beat.id === 'moon-blade-chain')?.active).toBe(true);
    expect(activeStoryboard.find(beat => beat.id === 'moon-blade-chain')?.boundary).toContain('不追加伤害');
  });

  it('creates a non-persistent group demo, switches active actor, and appends group steps', () => {
    const harness = createHarness();
    harness.get().initBattlefieldGroupDemo();
    const battle = harness.get().battlefieldCombatState;

    expect(battle.mode).toBe('group');
    expect(battle.grid.cells).toHaveLength(15);
    expect(battle.units.filter((unit: any) => unit.side === 'ally' || unit.side === 'player').length).toBeGreaterThan(1);
    expect(battle.units.some((unit: any) => unit.side === 'neutral')).toBe(true);
    expect(battle.objectives.length).toBeGreaterThan(0);
    expect(EXCLUDE_FROM_SAVE.has('battlefieldCombatState')).toBe(true);

    const formationCards = buildBattlefieldActionCards(battle, 'player', 'formation');
    expect(formationCards.some(card => card.action?.type === 'guard')).toBe(true);
    expect(formationCards.some(card => card.action?.type === 'assist')).toBe(true);
    expect(formationCards.some(card => card.action?.type === 'rally')).toBe(true);
    expect(formationCards.some(card => card.action?.type === 'formation')).toBe(true);

    harness.get().selectBattlefieldAction({ type: 'observe', actorId: 'player' });
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.kind === 'ambush')).toBe(true);

    harness.get().selectBattlefieldActor('ally_guard');
    expect(harness.get().battlefieldCombatState.activeUnitId).toBe('ally_guard');
    const allyCards = buildBattlefieldActionCards(harness.get().battlefieldCombatState, 'ally_guard', 'formation');
    expect(allyCards.length).toBeGreaterThan(0);

    harness.get().selectBattlefieldAction({ type: 'rally', actorId: 'ally_guard' });
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.kind === 'morale')).toBe(true);
  });

  it('ends the friendly group phase and resolves deterministic enemy actions', () => {
    const harness = createHarness();
    harness.get().initBattlefieldGroupDemo();

    harness.get().advanceBattlefieldRoundAction();
    const steps = harness.get().battlefieldPlaybackSteps;

    expect(steps.some((step: any) => step.tags.includes('enemy_turn_start'))).toBe(true);
    expect(steps.some((step: any) => step.tags.includes('enemy_turn_end'))).toBe(true);
    expect(steps.some((step: any) => step.tags.includes('player_turn_start'))).toBe(true);
    expect(harness.get().battlefieldCombatState.phase).toBe('player_turn');
    expect(harness.get().battlefieldCombatState.actedUnitIdsThisRound).toEqual([]);
  });

  it('creates a non-persistent 7x5 large group demo and keeps old 5x3 entry intact', () => {
    const harness = createHarness();

    harness.get().initBattlefieldGroupDemo();
    expect(harness.get().battlefieldCombatState.grid.cells).toHaveLength(15);

    harness.get().initBattlefieldLargeGroupDemo();
    const battle = harness.get().battlefieldCombatState;

    expect(battle.mode).toBe('group');
    expect(battle.gridPresetId).toBe('ambush_7x5');
    expect(battle.grid.width).toBe(7);
    expect(battle.grid.height).toBe(5);
    expect(battle.grid.cells).toHaveLength(35);
    expect(battle.grid.cells.some((cell: any) => cell.flags.includes('escort_exit'))).toBe(true);
    expect(battle.objectives.some((objective: any) => objective.type === 'escort' && objective.cellId === 'c0_3')).toBe(true);

    harness.get().selectBattlefieldActor('ally_scout');
    harness.get().selectBattlefieldAction({ type: 'observe', actorId: 'ally_scout' });
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.kind === 'ambush')).toBe(true);

    harness.get().selectBattlefieldAction({ type: 'formation', actorId: 'player', targetCellId: 'c2_2' });
    harness.get().selectBattlefieldTarget('c2_2');
    harness.get().executeSelectedBattlefieldAction();
    expect(harness.get().battlefieldPlaybackSteps.some((step: any) => step.kind === 'formation')).toBe(true);
  });

  it('enters narrative combat candidates and writes battle outcome back to the scene ledger', () => {
    const harness = createHarness();
    harness.get().setFlag('combatEventCandidates', [{
      id: 'candidate_duel',
      type: 'ambush',
      title: '林间截杀',
      summary: '山道旁有一名蛊师拦路试探。',
      risk: 'medium',
      scale: 'duel',
      source: 'ai-rumor',
      engineValidation: 'pending',
    }]);

    expect(harness.get().acceptCombatEventCandidate('candidate_duel')).toBe(true);
    expect(harness.get().combatEncounterState.status).toBe('active');
    expect(harness.get().combatEncounterState.spec.scale).toBe('duel');
    expect(harness.get().battlefieldCombatState.units.filter((unit: any) => unit.side === 'enemy')).toHaveLength(1);

    const outcome = harness.get().resolveNarrativeCombatOutcome('retreat');
    expect(outcome.result).toBe('retreat');
    expect(harness.get().combatEncounterState.status).toBe('resolved');
    expect(harness.get().sceneSessionState.localActionLedger.at(-1).actionType).toBe('combat');
    expect(EXCLUDE_FROM_SAVE.has('combatEncounterState')).toBe(true);
  });

  it('keeps Qingmao low-rank combat outcomes local-engine-only without loot activation', () => {
    const harness = createHarness();
    const built = buildQingmaoCombatEventCandidate('qingmao_encounter_clan_school_spar', harness.get());
    expect(built.candidate?.dropPolicyId).toBe('local_engine_only');
    expect(built.candidate?.engineValidation).toBe('pending');
    harness.get().setFlag('combatEventCandidates', [built.candidate]);

    expect(harness.get().acceptCombatEventCandidate(built.candidate!.id!)).toBe(true);
    expect(harness.get().flags.combatEventCandidates[0].engineValidation).toBe('accepted');
    expect(harness.get().combatEncounterState.spec.dropPolicyId).toBe('local_engine_only');

    const outcome = harness.get().resolveNarrativeCombatOutcome('retreat');
    expect(outcome.result).toBe('retreat');
    expect(outcome.beastLoot).toBeUndefined();
    expect(harness.get().flags.lastBattleOutcomeSummary.beastLoot).toBeUndefined();
    const ledger = harness.get().sceneSessionState.localActionLedger.at(-1);
    expect(ledger.actionType).toBe('combat');
    expect(ledger.systemResult.beastLoot).toBeUndefined();
    expect(harness.get().addGameLog).toHaveBeenCalledWith(
      'combat',
      expect.stringContaining('剧情战斗回流'),
      expect.objectContaining({ encounterId: built.candidate!.id }),
    );
  });
});
