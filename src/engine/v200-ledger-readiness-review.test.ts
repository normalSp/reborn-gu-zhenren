import { describe, expect, it } from 'vitest';
import { buildV200LedgerReadinessReview } from './v200-ledger-readiness-review';
import { createInitialRegionalEventLedger, resolveV200WorldCoreRegionalEventLedgerSync } from './v200-regional-event-ledger';

describe('v2.0-b4 ledger readiness review', () => {
  it('keeps old-save default ledgers readable without creating fields', () => {
    const review = buildV200LedgerReadinessReview({
      regionalEventLedger: createInitialRegionalEventLedger(),
      turn: 1,
    });

    expect(review.status).toBe('old_save_default');
    expect(review.eventCount).toBe(0);
    expect(review.followUpCount).toBe(0);
    expect(review.canWriteSave).toBe(false);
    expect(review.canCreateRunFingerprint).toBe(false);
    expect(review.saveFormatImpact).toBe('none_v25_existing_ledger_only');
    expect(review.rollbackLines.join('\n')).toContain('不写新字段');
    expect(JSON.stringify(review)).not.toContain('regionalLifeState 已创建');
  });

  it('reports ready when existing v25 ledger has public events and follow-ups', () => {
    const resolution = resolveV200WorldCoreRegionalEventLedgerSync({
      livingWorldState: {
        worldClock: { turn: 80, day: 8, phase: 'afternoon', lastActionId: 'v200_b4_test' },
        knownFacts: {
          qingmao_escape_route_preparation_baseline: { id: 'qingmao_escape_route_preparation_baseline', scope: 'region', source: 'engine_result', summary: '公开路线准备。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
          qingmao_escape_tracks_cover_baseline: { id: 'qingmao_escape_tracks_cover_baseline', scope: 'region', source: 'engine_result', summary: '公开遮掩痕迹。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
          qingmao_mountain_pass_route_continuation_candidate: { id: 'qingmao_mountain_pass_route_continuation_candidate', scope: 'region', source: 'engine_result', summary: '公开山路候选。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
          qingmao_supply_feeding_preparation_baseline: { id: 'qingmao_supply_feeding_preparation_baseline', scope: 'region', source: 'engine_result', summary: '公开补给缺口。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
          qingmao_market_window_candidate_baseline: { id: 'qingmao_market_window_candidate_baseline', scope: 'region', source: 'engine_result', summary: '公开市场窗口。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
          v018_qingmao_route_candidate_continuation_view: { id: 'v018_qingmao_route_candidate_continuation_view', scope: 'region', source: 'engine_result', summary: '公开候选承接。', learnedTurn: 80, confidence: 'confirmed', tags: [] },
        },
        actionConsequences: [],
        playerGoals: [],
        hiddenFactRefs: {},
        npcMemories: [],
        factionPressure: [],
        ifDeviations: [],
        regions: {},
      } as any,
      routeLocationState: {
        status: 'outer_edge_projection',
        routeId: 'southern_border_low_rank_route',
        locationScopeId: 'southern_border_outer_edge',
        regionScopeId: 'southern_border_outer_edge',
        authority: 'route_location_engine',
      } as any,
      survivalEconomyState: {
        status: 'pressure_tracked',
        authority: 'survival_economy_engine',
        ledger: [],
      } as any,
      localActionLedger: [{
        id: 'ledger_b4_ready',
        turn: 80,
        sceneId: 'v200_b4_test',
        actionType: 'other',
        source: 'v200:b4',
        cost: 0,
        summary: '盘问、商队、市场、遮蔽和路途压力。',
        systemResult: {},
        risks: [],
      }],
      turn: 80,
    });
    const review = buildV200LedgerReadinessReview({
      regionalEventLedger: resolution.regionalEventLedger,
      turn: 80,
    });

    expect(review.status).toBe('ready_for_replay');
    expect(review.eventCount).toBeGreaterThanOrEqual(3);
    expect(review.followUpCount).toBeGreaterThanOrEqual(3);
    expect(review.cards.find(card => card.id === 't3_ready')?.status).toBe('ok');
    expect(review.canExpandDeepSeekAuthority).toBe(false);
    expect(review.sourceRefs).toEqual(expect.arrayContaining(['v2.0.0-b4:ui-save-rollback-readiness']));
  });

  it('marks invalid edited ledgers as blocked for local review only', () => {
    const review = buildV200LedgerReadinessReview({
      regionalEventLedger: {
        status: 'events_tracked',
        authority: 'deepseek' as any,
        activeRegionKey: 'full_southern_border' as any,
        publicEvents: [],
      },
      turn: 3,
    });

    expect(review.status).toBe('blocked_for_review');
    expect(review.cards.every(card => card.status === 'blocked')).toBe(true);
    expect(review.publicSummary).toContain('不信任其正式结果');
    expect(review.canWriteSave).toBe(false);
  });
});
