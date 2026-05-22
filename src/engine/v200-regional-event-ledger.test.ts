import { describe, expect, it } from 'vitest';
import { SAVE_FORMAT_VERSION } from '../store/initialState';
import {
  createInitialRegionalEventLedger,
  normalizeRegionalEventLedger,
  resolveV200WorldCoreRegionalEventLedgerSync,
} from './v200-regional-event-ledger';
import type { LivingWorldState, LocalActionLedgerEntry, RouteLocationState, SurvivalEconomyState } from '../types';

function knownFact(id: string, summary = '公开事实。') {
  return {
    id,
    scope: 'region' as const,
    source: 'engine_result' as const,
    summary,
    learnedTurn: 12,
    confidence: 'confirmed' as const,
    tags: ['public'],
  };
}

function regionalLifeWorld(turn = 70): Partial<LivingWorldState> {
  return {
    worldClock: {
      turn,
      day: 6,
      phase: 'afternoon',
      lastActionId: 'v200_worldcore_regional_event_probe',
    },
    regions: {},
    knownFacts: {
      qingmao_escape_route_preparation_baseline: knownFact('qingmao_escape_route_preparation_baseline', '离山路线准备已有公开痕迹。'),
      qingmao_escape_tracks_cover_baseline: knownFact('qingmao_escape_tracks_cover_baseline', '遮掩痕迹已有公开解释。'),
      qingmao_mountain_pass_route_continuation_candidate: knownFact('qingmao_mountain_pass_route_continuation_candidate', '山路候选承接已出现，外缘盘问需要解释身份。'),
      qingmao_supply_feeding_preparation_baseline: knownFact('qingmao_supply_feeding_preparation_baseline', '补给与喂养缺口已被看见。'),
      qingmao_market_window_candidate_baseline: knownFact('qingmao_market_window_candidate_baseline', '商队/市场窗口只作为公开接触，压价和询价都可能发生。'),
      v018_qingmao_route_candidate_continuation_view: knownFact('v018_qingmao_route_candidate_continuation_view', '候选承接可读，但不写正式路线。'),
    },
    hiddenFactRefs: {
      fang_yuan_private_causality_hidden_anchor: {
        id: 'fang_yuan_private_causality_hidden_anchor',
        scope: 'npc',
        sourcePointer: '春秋蝉/重生/回溯/private-body-redacted',
        revealPolicyId: 'never_show_private_body',
        guard: 'hidden',
        lastCheckedTurn: 70,
      },
    },
    playerGoals: [{
      id: 'goal_escape_qingmao',
      intentType: 'long_term_goal',
      targetRef: 'region:outside_qingmao',
      rationale: '逃离青茅山并在南疆低阶外缘寻找短期遮蔽。',
      status: 'active',
      createdTurn: 3,
      lastUpdatedTurn: 70,
      blockedByRefIds: [],
      nextStepHints: ['解释身份', '找商队短工', '打听补给'],
    }],
    factionPressure: [{
      id: 'faction_pressure_caravan_window',
      factionId: 'outer_caravan',
      pressureType: 'opportunity',
      delta: 8,
      reason: '商队窗口出现，但正式加入商队、奖励已发放都必须阻断。',
      turn: 67,
      visibility: 'player_visible',
    }],
    npcMemories: [],
    actionConsequences: [{
      id: 'consequence_v200_public_route_probe',
      actionId: 'v200_public_route_probe',
      turn: 69,
      scope: 'region',
      publicSummary: '候选承接已经进入公开准备，守卫盘问、商队短工和临时市场都只是压力窗口。',
      effectRefs: ['v200_public_regional_life_pressure'],
      followUpRefs: ['followup:review_regional_event_ledger'],
    }],
    ifDeviations: [],
  };
}

function outerEdgeRoute(): Partial<RouteLocationState> {
  return {
    status: 'outer_edge_projection',
    routeId: 'southern_border_low_rank_route',
    locationScopeId: 'southern_border_outer_edge',
    regionScopeId: 'southern_border_outer_edge',
    authority: 'route_location_engine',
    evidenceLedgerEntryIds: ['v018_qingmao_route_candidate_continuation_view'],
    sourceRefs: ['v200:test:outer_edge_projection'],
    lastUpdatedAtTurn: 70,
  };
}

function survivalState(): Partial<SurvivalEconomyState> {
  return {
    schemaVersion: 1,
    status: 'pressure_tracked',
    authority: 'survival_economy_engine',
    pressureScore: 24,
    ledger: [
      {
        id: 'survival_ledger_route_supply',
        turn: 70,
        category: 'route_supply',
        pressure: 'medium',
        publicSummary: '路线补给压力已登记。',
        nextStep: '先确认补给和遮蔽。',
        evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
        sourceRefs: ['v120:test:pressure_ledger'],
        blockedWrites: ['inventory_delta'],
      },
      {
        id: 'survival_ledger_trade_window',
        turn: 70,
        category: 'trade_window',
        pressure: 'low',
        publicSummary: '临时市场窗口已登记。',
        nextStep: '只询价，不成交。',
        evidenceRefs: ['fact:qingmao_market_window_candidate_baseline'],
        sourceRefs: ['v120:test:trade_window'],
        blockedWrites: ['formal_price_table', 'formal_shop_inventory'],
      },
    ],
    evidenceRefs: ['fact:qingmao_supply_feeding_preparation_baseline'],
    sourceRefs: ['v120:test:pressure_ledger'],
    lastUpdatedAtTurn: 70,
  };
}

function localLedger(id = 'ledger_v200_low_rank_region_life', turn = 70): LocalActionLedgerEntry[] {
  return [{
    id,
    turn,
    sceneId: 'v200_test',
    actionType: 'other',
    source: 'v200:test',
    cost: 0,
    summary: '玩家被盘问后考虑商队短工、临时市场询价和求助遮蔽。',
    systemResult: {},
    risks: ['outer_edge_interrogation', 'caravan_labor_window', 'shelter_debt'],
  }];
}

describe('v2.0-b1 regional event ledger', () => {
  it('bumps to v25 and writes only the single WorldCore regionalEventLedger aggregate', () => {
    const resolution = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: regionalLifeWorld(),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: survivalState(),
      localActionLedger: localLedger(),
      turn: 70,
    });

    expect(SAVE_FORMAT_VERSION).toBe(25);
    expect(resolution.success).toBe(true);
    expect(resolution.applied).toEqual(['regionalEventLedger']);
    expect(resolution.rejected).toEqual([]);
    expect(resolution.regionalEventLedger).toMatchObject({
      schemaVersion: 1,
      status: 'events_tracked',
      authority: 'worldcore_region_engine',
      activeRegionKey: 'southern_border_outer_edge_low_rank',
    });
    expect(resolution.regionalEventLedger.publicEvents.length).toBeGreaterThanOrEqual(5);
    expect(resolution.regionalEventLedger.pendingFollowUps.length).toBeGreaterThanOrEqual(5);
    expect(resolution.regionalEventLedger.pressureSummary.visibleEventCount).toBe(resolution.regionalEventLedger.publicEvents.length);
    expect(resolution.regionalEventLedger.sourceRefs).toEqual(expect.arrayContaining([
      'v2.0.0-a1:D-201-003',
      'v2.0.0-b1:regionalEventLedger',
      'v1.9.0-a2:southern_border_low_rank_region_life_v2_prelude_slice:intake-reviewed',
    ]));
    expect(resolution.forbiddenUpgrades).toEqual(expect.arrayContaining([
      'runFingerprint',
      'regionalLifeState',
      'identityRouteState',
      'formal_location_unlock',
      'npc_death',
      'deepseek_ledger_write',
    ]));
    expect(JSON.stringify(resolution.regionalEventLedger)).not.toContain('DeepSeek raw');
    expect(JSON.stringify(resolution.regionalEventLedger)).not.toContain('private-body-redacted');
    expect(JSON.stringify(resolution.regionalEventLedger)).not.toContain('春秋蝉');
    expect(JSON.stringify(resolution.regionalEventLedger)).not.toContain('重生');
    expect(JSON.stringify(resolution.regionalEventLedger)).not.toContain('回溯');
  });

  it('dedupes repeated regional event syncs across turns and carries source refs forward', () => {
    const first = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: regionalLifeWorld(70),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: survivalState(),
      localActionLedger: localLedger('ledger_v200_turn_70', 70),
      turn: 70,
    });
    const second = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: regionalLifeWorld(71),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: survivalState(),
      localActionLedger: localLedger('ledger_v200_turn_71', 71),
      previousLedger: first.regionalEventLedger,
      turn: 71,
    });

    const firstIds = first.regionalEventLedger.publicEvents.map(event => event.id);
    const secondIds = second.regionalEventLedger.publicEvents.map(event => event.id);
    const publicEventIds = new Set(secondIds);

    expect(second.success).toBe(true);
    expect(second.regionalEventLedger.publicEvents).toHaveLength(first.regionalEventLedger.publicEvents.length);
    expect(second.regionalEventLedger.pendingFollowUps).toHaveLength(first.regionalEventLedger.pendingFollowUps.length);
    expect(secondIds).toEqual(firstIds);
    expect(second.regionalEventLedger.publicEvents.every(event => !/_t\d+$/.test(event.id))).toBe(true);
    expect(second.regionalEventLedger.publicEvents.every(event => event.turn === 71)).toBe(true);
    expect(second.regionalEventLedger.publicEvents[0].sourceActionRefs).toEqual(expect.arrayContaining([
      'ledger_v200_turn_70',
      'ledger_v200_turn_71',
    ]));
    expect(second.regionalEventLedger.pendingFollowUps.every(item => publicEventIds.has(item.eventId))).toBe(true);
    expect(second.regionalEventLedger.sourceRefs).toEqual(expect.arrayContaining([
      'v2.0.0-b2:regional-event-continuity-dedupe',
    ]));
    expect(second.regionalEventLedger.audit.notes.join('\n')).toContain('dedupes repeated regional event keys');
  });

  it('upgrades b1 turn-suffixed ledger ids into stable b2 event ids without duplicating events', () => {
    const first = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: regionalLifeWorld(70),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: survivalState(),
      localActionLedger: localLedger('ledger_v200_legacy_seed', 70),
      turn: 70,
    });
    const legacyIdByStableId = new Map<string, string>();
    const legacyEvents = first.regionalEventLedger.publicEvents.map(event => {
      const pressureId = event.id.replace('v200_event_', '');
      const legacyId = `v200b1_${event.eventKind}_${pressureId}_t70`;
      legacyIdByStableId.set(event.id, legacyId);
      return { ...event, id: legacyId, turn: 70 };
    });
    const legacyFollowUps = first.regionalEventLedger.pendingFollowUps.map(item => ({
      ...item,
      id: `${item.id.replace('v200_followup_', 'v200b1_followup_')}_t70`,
      eventId: legacyIdByStableId.get(item.eventId) || item.eventId,
      turn: 70,
    }));

    const fromLegacy = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: regionalLifeWorld(72),
      routeLocationState: outerEdgeRoute(),
      survivalEconomyState: survivalState(),
      localActionLedger: localLedger('ledger_v200_after_legacy', 72),
      previousLedger: {
        ...first.regionalEventLedger,
        publicEvents: legacyEvents,
        pendingFollowUps: legacyFollowUps,
        lastUpdatedAtTurn: 70,
      },
      turn: 72,
    });
    const eventIds = new Set(fromLegacy.regionalEventLedger.publicEvents.map(event => event.id));

    expect(fromLegacy.regionalEventLedger.publicEvents).toHaveLength(first.regionalEventLedger.publicEvents.length);
    expect(fromLegacy.regionalEventLedger.publicEvents.every(event => event.id.startsWith('v200_event_'))).toBe(true);
    expect(fromLegacy.regionalEventLedger.pendingFollowUps.every(item => item.id.startsWith('v200_followup_'))).toBe(true);
    expect(fromLegacy.regionalEventLedger.pendingFollowUps.every(item => eventIds.has(item.eventId))).toBe(true);
    expect(JSON.stringify(fromLegacy.regionalEventLedger)).not.toContain('v200b1_');
  });

  it('keeps empty defaults for new and old saves until WorldCore has visible regional evidence', () => {
    const state = createInitialRegionalEventLedger();
    expect(state).toMatchObject({
      schemaVersion: 1,
      status: 'not_started',
      authority: 'migration_default',
      activeRegionKey: 'southern_border_outer_edge_low_rank',
      publicEvents: [],
      pendingFollowUps: [],
    });

    const inert = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: { knownFacts: {}, playerGoals: [], actionConsequences: [] } as any,
      routeLocationState: null,
      turn: 1,
      previousLedger: state,
    });
    expect(inert.success).toBe(false);
    expect(inert.regionalEventLedger.publicEvents).toEqual([]);
    expect(inert.rejected).toEqual(['needs_regional_life_visible_context']);
  });

  it('normalizes edited ledgers conservatively and removes hidden/raw source refs', () => {
    const normalized = normalizeRegionalEventLedger({
      status: 'events_tracked',
      authority: 'worldcore_region_engine',
      activeRegionKey: 'southern_border_outer_edge_low_rank',
      publicEvents: [{
        id: 'edited_event',
        turn: 80,
        eventKind: 'market_pressure',
        sourceActionRefs: ['visible_action', 'hidden_ref_only:bad'],
        sourceFactRefs: ['public_fact', 'private:bad'],
        sourceRefs: ['v200:test', 'raw_quote:bad'],
        publicSummaryKey: 'edited',
        publicSummary: '春秋蝉、重生、回溯、正式加入商队、进入商家城、奖励已发放、NPC已死亡。',
        pressureTags: ['market_pressure'],
        status: 'observed',
        forbiddenOutcomes: ['formal_price_table', 'npc_death'],
      }],
      pendingFollowUps: [],
      pressureSummary: { level: 'high', score: 90, tags: [], activeEventKinds: [], visibleEventCount: 1 },
      evidenceRefs: ['public_fact', 'private_hidden_ref'],
      sourceRefs: ['v200:test', 'source_text:bad'],
      lastUpdatedAtTurn: 80,
      audit: { notes: ['edited'] },
    } as any, 80);

    const text = JSON.stringify(normalized);
    expect(normalized.publicEvents).toHaveLength(1);
    expect(text).not.toContain('春秋蝉');
    expect(text).not.toContain('重生');
    expect(text).not.toContain('回溯');
    expect(text).not.toContain('private:bad');
    expect(text).not.toContain('raw_quote:bad');
    expect(text).not.toContain('source_text:bad');
    expect(text).toContain('正式商队身份结论已阻断');
    expect(text).toContain('NPC 生死结论已阻断');
  });

  it('blocks invalid authority or region key instead of trusting manual edits', () => {
    const normalized = normalizeRegionalEventLedger({
      status: 'events_tracked',
      authority: 'deepseek',
      activeRegionKey: 'full_southern_border',
      publicEvents: [],
    } as any, 9);

    expect(normalized.status).toBe('blocked');
    expect(normalized.authority).toBe('worldcore_region_engine');
    expect(normalized.activeRegionKey).toBe('unknown_conservative');
    expect(normalized.publicEvents).toEqual([]);
    expect(normalized.migrationNote).toContain('invalid');
  });
});
