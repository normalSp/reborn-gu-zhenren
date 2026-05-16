import { describe, expect, it } from 'vitest';
import {
  buildQingmaoCanonAnchorPromptContext,
  getQingmaoAllowedLowRankIfAxes,
  getQingmaoCanonAnchor,
  getQingmaoForbiddenHighLevelAxes,
  listQingmaoCanonAnchors,
  listQingmaoCanonAnchorsForFactCard,
} from './v012-qingmao-canon-anchors';

describe('v0.12.0-a1 Qingmao canon anchor helper', () => {
  it('lists cloned anchors and resolves anchors by id or fact card', () => {
    const all = listQingmaoCanonAnchors();
    expect(all.length).toBeGreaterThanOrEqual(10);

    const route = getQingmaoCanonAnchor('qingmao_caravan_and_route_window');
    expect(route).toEqual(expect.objectContaining({
      id: 'qingmao_caravan_and_route_window',
      anchorType: 'if_window',
    }));
    expect(route?.lowRankIfAxes).toContain('route_escape');

    const firstLever = all[0].allowedPlayerLevers[0];
    all[0].allowedPlayerLevers[0] = 'mutated_in_test';
    expect(listQingmaoCanonAnchors()[0].allowedPlayerLevers[0]).toBe(firstLever);

    const anchorsForCaravan = listQingmaoCanonAnchorsForFactCard('qingmao_caravan_trade_window');
    expect(anchorsForCaravan.map(anchor => anchor.id)).toContain('qingmao_caravan_and_route_window');
  });

  it('builds a prompt-safe context with hidden guards but no hidden summaries', () => {
    const context = buildQingmaoCanonAnchorPromptContext({
      anchorIds: ['fang_yuan_hidden_causality_guard', 'qingmao_caravan_and_route_window'],
    });

    expect(context.anchors.map(anchor => anchor.id)).toEqual([
      'fang_yuan_hidden_causality_guard',
      'qingmao_caravan_and_route_window',
    ]);
    expect(context.anchors[0].playerVisibleFactIds).toEqual(['flower_wine_monk_public_legend']);
    expect(context.hiddenGuards).toEqual([
      expect.objectContaining({
        anchorId: 'fang_yuan_hidden_causality_guard',
        guard: 'hidden_ref_only',
        hiddenFactRefIds: expect.arrayContaining([
          'fang_yuan_private_causality_hidden_anchor',
          'flower_wine_inheritance_hidden_location_ref',
        ]),
      }),
    ]);

    const serializedHiddenGuards = JSON.stringify(context.hiddenGuards);
    expect(serializedHiddenGuards).not.toContain('summary');
    expect(serializedHiddenGuards).not.toContain('playerVisibleSummary');
    expect(serializedHiddenGuards).not.toContain('sourcePointers');
  });

  it('resolves context from fact-card ids for route and pressure work', () => {
    const routeContext = buildQingmaoCanonAnchorPromptContext({
      factCardIds: ['qingmao_caravan_trade_window'],
    });
    const wolfTideContext = buildQingmaoCanonAnchorPromptContext({
      factCardIds: ['qingmao_wolf_tide_recurring_pressure'],
    });

    expect(routeContext.anchors.map(anchor => anchor.id)).toEqual(['qingmao_caravan_and_route_window']);
    expect(routeContext.anchors[0].ifDeviationPointIds).toContain('qingmao_caravan_trade_window');
    expect(routeContext.anchors[0].deepSeekForbidden).toContain('declare_escape_success');

    expect(wolfTideContext.anchors.map(anchor => anchor.id)).toEqual(expect.arrayContaining([
      'qingmao_wolf_tide_pressure_chain',
      'qingmao_resource_and_crisis_chain',
    ]));
    expect(wolfTideContext.anchors.some(anchor => anchor.lowRankIfAxes.includes('canon_anchor_pressure'))).toBe(true);
  });

  it('keeps v0.12 low-rank axes separate from high-level fate or immortal axes', () => {
    const allowed = getQingmaoAllowedLowRankIfAxes();
    const forbidden = getQingmaoForbiddenHighLevelAxes();

    expect(allowed).toEqual(expect.arrayContaining([
      'npc_attention',
      'faction_pressure',
      'resource_control',
      'route_escape',
      'hidden_fact_probe',
      'local_survival',
      'canon_anchor_pressure',
    ]));
    expect(forbidden).toEqual(expect.arrayContaining([
      'protect_fate',
      'break_fate',
      'venerable_balance',
      'immortal_trade',
      'rank_nine_acquisition',
      'treasure_yellow_heaven_transaction',
    ]));
    expect(allowed.some(axis => forbidden.includes(axis))).toBe(false);
  });
});
