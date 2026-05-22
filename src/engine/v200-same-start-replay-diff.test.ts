import { describe, expect, it } from 'vitest';
import { buildV200SameStartReplayDiff } from './v200-same-start-replay-diff';
import type { RegionalEventLedger, RegionalPublicEvent, RegionalPublicEventKind } from '../types';

function event(id: string, eventKind: RegionalPublicEventKind, turn = 80): RegionalPublicEvent {
  return {
    id,
    turn,
    eventKind,
    sourceActionRefs: [`action:${id}`],
    sourceFactRefs: [`fact:${eventKind}`],
    sourceRefs: [`source:${eventKind}`],
    publicSummaryKey: `summary:${eventKind}`,
    publicSummary: `${eventKind} 公开压力。`,
    pressureTags: [eventKind],
    status: 'observed',
    forbiddenOutcomes: ['runFingerprint', 'formal_location_unlock', 'npc_death'],
  };
}

function ledger(events: RegionalPublicEvent[]): RegionalEventLedger {
  return {
    schemaVersion: 1,
    status: 'events_tracked',
    authority: 'worldcore_region_engine',
    activeRegionKey: 'southern_border_outer_edge_low_rank',
    publicEvents: events,
    pendingFollowUps: events.map(item => ({
      id: `followup:${item.id}`,
      turn: item.turn,
      eventId: item.id,
      eventKind: item.eventKind,
      publicSummary: `${item.publicSummary} 后续待复核。`,
      nextStep: '继续收集公开证据。',
      sourceRefs: item.sourceRefs,
      status: 'pending',
      forbiddenOutcomes: item.forbiddenOutcomes,
    })),
    pressureSummary: {
      level: 'high',
      score: 80,
      tags: ['replay'],
      activeEventKinds: [...new Set(events.map(item => item.eventKind))],
      visibleEventCount: events.length,
    },
    evidenceRefs: events.flatMap(item => item.sourceFactRefs),
    sourceRefs: ['v2.0.0-b2:regional-event-continuity-dedupe'],
    lastUpdatedAtTurn: 80,
    audit: {
      lastWorldCoreActionId: 'v200_worldcore_regional_event_ledger_sync',
      sourcePolicy: 'reviewed_source_pointer_only',
      deepSeekPolicy: 'narrative_only_no_ledger_writes',
      hiddenFactPolicy: 'refs_only_no_hidden_body',
      forbiddenOutcomePolicy: 'record_and_block_not_resolve',
      notes: ['test ledger'],
    },
  };
}

describe('v2.0-b3 same-start replay diff', () => {
  it('derives replay lanes from existing regionalEventLedger without creating runFingerprint', () => {
    const projection = buildV200SameStartReplayDiff({
      regionalEventLedger: ledger([
        event('event_checkpoint', 'checkpoint_questioning'),
        event('event_caravan', 'caravan_contact'),
        event('event_labor', 'temporary_labor'),
        event('event_market', 'market_pressure'),
        event('event_shelter', 'shelter_debt'),
        event('event_road', 'road_conflict_pressure'),
        event('event_gate', 'gate_threshold'),
      ]),
      variantIndex: 2,
    });

    expect(projection.status).toBe('replay_diff_visible');
    expect(projection.audit.pass).toBe(true);
    expect(projection.audit.visibleLaneCount).toBeGreaterThanOrEqual(5);
    expect(projection.activeLaneId).toBe('market_supply');
    expect(projection.canWriteSave).toBe(false);
    expect(projection.canCreateRunFingerprint).toBe(false);
    expect(projection.saveFormatImpact).toBe('none_v25_existing_ledger_only');
    expect(projection.boundaryLines.join('\n')).toContain('不新增 runFingerprint');
    expect(projection.boundaryLines.join('\n')).toContain('hidden/private 不得随机变化');
    expect(JSON.stringify(projection)).not.toContain('private-body-redacted');
    expect(JSON.stringify(projection)).not.toContain('source_text');
    expect(JSON.stringify(projection)).not.toContain('春秋蝉');
  });

  it('changes active replay lane by variantIndex while keeping stable facts and event count intact', () => {
    const baseLedger = ledger([
      event('event_checkpoint', 'checkpoint_questioning'),
      event('event_caravan', 'caravan_contact'),
      event('event_market', 'market_pressure'),
      event('event_shelter', 'shelter_debt'),
    ]);
    const first = buildV200SameStartReplayDiff({ regionalEventLedger: baseLedger, variantIndex: 0 });
    const second = buildV200SameStartReplayDiff({ regionalEventLedger: baseLedger, variantIndex: 1 });

    expect(first.activeLaneId).not.toBe(second.activeLaneId);
    expect(first.audit.uniqueEventKindCount).toBe(second.audit.uniqueEventKindCount);
    expect(first.visibleSourceRefs).toEqual(expect.arrayContaining(['v2.0.0-b2:regional-event-continuity-dedupe']));
    expect(first.canExpandDeepSeekAuthority).toBe(false);
    expect(second.canExpandDeepSeekAuthority).toBe(false);
  });

  it('stays blocked when the ledger lacks enough public event families', () => {
    const projection = buildV200SameStartReplayDiff({
      regionalEventLedger: ledger([
        event('event_checkpoint', 'checkpoint_questioning'),
      ]),
      variantIndex: 0,
    });

    expect(projection.status).toBe('needs_regional_event_ledger');
    expect(projection.audit.pass).toBe(false);
    expect(projection.audit.visibleLaneCount).toBe(1);
    expect(projection.nextStep).toContain('先登记更多公开区域事件');
  });
});
