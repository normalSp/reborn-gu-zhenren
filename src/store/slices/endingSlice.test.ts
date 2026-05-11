import { describe, expect, it, vi } from 'vitest';
import { createDefaultCultivationState } from '../../engine/v080-cultivation-calamity-engine';
import { createDefaultStoryAnchorState } from '../../engine/v080-midgame-anchor-engine';
import { createDefaultEndingFrameworkState } from '../../engine/v080-ending-framework-engine';
import { SAVE_FORMAT_VERSION } from '../initialState';
import { migrateSave } from '../index';
import { createEndingSlice } from './endingSlice';

function readyStoryAnchorState() {
  const base = createDefaultStoryAnchorState({ fateState: 'destroyed', currentAnchorId: 'heavenly_court_late_chapter' });
  return createDefaultStoryAnchorState({
    ...base,
    anchorResults: {
      ...base.anchorResults,
      yi_tian_mountain: { anchorId: 'yi_tian_mountain', status: 'resolved', canonDeviation: 8 },
      reverse_flow_river: { anchorId: 'reverse_flow_river', status: 'resolved', canonDeviation: 8 },
      dream_shadow_sect: { anchorId: 'dream_shadow_sect', status: 'resolved', canonDeviation: 8 },
      fate_war: { anchorId: 'fate_war', status: 'resolved', canonDeviation: 16 },
      venerable_chessboard: { anchorId: 'venerable_chessboard', status: 'active', canonDeviation: 12 },
      heavenly_court_late_chapter: { anchorId: 'heavenly_court_late_chapter', status: 'active', canonDeviation: 12 },
    },
    ifBranchVectors: [
      {
        id: 'if_break_fate_store',
        anchorId: 'fate_war',
        axis: 'break_fate',
        delta: 44,
        cause: 'store test',
        cost: 'heaven pressure',
        downstreamImpact: ['free_will'],
        provenance: 'if-derived',
        createdTurn: 80,
      },
      {
        id: 'if_faction_store',
        anchorId: 'heavenly_court_late_chapter',
        axis: 'faction_shift',
        delta: 36,
        cause: 'store test',
        cost: 'karmic debt',
        downstreamImpact: ['faction'],
        provenance: 'if-derived',
        createdTurn: 90,
      },
    ],
  });
}

function createHarness(overrides: Record<string, any> = {}) {
  let state: any = {
    turn: 120,
    gameMode: 'if',
    currentChapterId: 'heavenly_court_late_chapter',
    currentDomain: 'Central Continent',
    profile: { name: 'Ending Store Tester', realm: { grand: 7, sub: 'high', label: 'rank seven high stage' } },
    playerFaction: { reputation: 84 },
    flags: { playerFactionScore: 84 },
    daoHeart: { kill: 24, mercy: 16, scheme: 46, ambition: 42 },
    totalBattlesFought: 12,
    combatWins: 8,
    squadCombatWins: 3,
    storyAnchorState: readyStoryAnchorState(),
    cultivationState: createDefaultCultivationState(),
    endingState: createDefaultEndingFrameworkState(),
    unlockedAchievements: ['test_achievement'],
    gameLog: [],
    l3Warnings: [],
    screenState: 'game_play',
    ...overrides,
  };
  const set = (patch: any) => {
    const next = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...next };
  };
  const get = () => state;
  state.addGameLog = vi.fn((category: string, message: string, meta: any) => {
    state.gameLog = [...state.gameLog, { category, message, meta }];
  });
  state.setL3Warnings = vi.fn((warnings: any[]) => {
    state.l3Warnings = warnings;
  });
  state = { ...state, ...createEndingSlice(set, get) };
  return { get: () => state };
}

describe('v0.8.0-c1 ending framework store slice', () => {
  it('migrates v17 saves to v18 endingState while preserving b2/b3 states', () => {
    const migrated = migrateSave({
      formatVersion: 17,
      timestamp: 'test',
      meta: { playerName: 'old', realm: 'rank six', turn: 80, gameMode: 'if' },
      state: {
        profile: { name: 'old', realm: { grand: 6, sub: 'mid', label: 'rank six mid' } },
        cultivationState: createDefaultCultivationState({ progress: 55 }),
        storyAnchorState: createDefaultStoryAnchorState({ fateState: 'fractured', currentAnchorId: 'fate_war' }),
        flags: { fateState: 'fractured' },
      },
    } as any);

    expect(migrated.formatVersion).toBe(SAVE_FORMAT_VERSION);
    expect((migrated.state as any).endingState.version).toBe('v0.8.0-c1');
    expect((migrated.state as any).cultivationState.version).toBe('v0.8.0-b2');
    expect((migrated.state as any).storyAnchorState.version).toBe('v0.8.0-b3');
  });

  it('refreshes local ending candidates and mirrors them to compatibility flags', () => {
    const harness = createHarness();
    const result = harness.get().refreshEndingCandidatesAction();

    expect(result.validation.canCommit).toBe(true);
    expect(harness.get().endingState.status).toBe('ready');
    expect(harness.get().endingState.candidates.length).toBeGreaterThan(0);
    expect(harness.get().flags.endingCandidates).toHaveLength(harness.get().endingState.candidates.length);
    expect(harness.get().addGameLog).toHaveBeenCalled();
  });

  it('commits a valid candidate to game_over without AI-side resource or result writes', () => {
    const harness = createHarness();
    const refresh = harness.get().refreshEndingCandidatesAction();
    const candidate = refresh.candidates.find((item: any) => item.canCommit);
    expect(candidate).toBeTruthy();

    const result = harness.get().commitEndingCandidateAction(candidate!.id);

    expect(result.success).toBe(true);
    expect(harness.get().endingState.status).toBe('committed');
    expect(harness.get().screenState).toBe('game_over');
    expect(harness.get().deathRecord.endingFamilyId).toBe(candidate!.familyId);
    expect(harness.get().flags.endingOutcome.familyId).toBe(candidate!.familyId);
  });

  it('blocks premature commits and writes an L3 warning', () => {
    const harness = createHarness({
      turn: 3,
      profile: { name: 'Too Early', realm: { grand: 3, sub: 'mid', label: 'rank three' } },
      playerFaction: { reputation: 5 },
      flags: { playerFactionScore: 5 },
      storyAnchorState: createDefaultStoryAnchorState(),
    });
    const result = harness.get().commitEndingCandidateAction('ending_canon_near');

    expect(result.success).toBe(false);
    expect(harness.get().endingState.status).toBe('blocked');
    expect(harness.get().l3Warnings.length).toBeGreaterThan(0);
    expect(harness.get().screenState).toBe('game_play');
  });

  it('records AI direct ending pressure as blocked local pressure', () => {
    const harness = createHarness();
    const result = harness.get().recordEndingPressureAction('AI writes finalOutcome/rankTen/venerableKill', 'direct state update');

    expect(result.success).toBe(true);
    expect(harness.get().endingState.status).toBe('blocked');
    expect(harness.get().endingState.pressureLog).toHaveLength(1);
    expect(harness.get().l3Warnings.length).toBeGreaterThan(0);
  });
});
