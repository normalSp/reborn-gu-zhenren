import { describe, expect, it } from 'vitest';
import {
  buildHiddenFactRefFromQingmaoCard,
  buildPlayerKnownFactFromQingmaoCard,
  buildQingmaoFactPromptContext,
  buildQingmaoFactReferenceSet,
  getQingmaoCanonFactCard,
  isHiddenQingmaoCanonFactCard,
  listHiddenQingmaoCanonFactCards,
  listQingmaoCanonFactCards,
  listVisibleQingmaoCanonFactCards,
} from './v011-qingmao-fact-cards';

describe('v0.11.0-b1-2 Qingmao fact-card read helper', () => {
  it('lists cloned fact cards without exposing hidden cards through the visible helper', () => {
    const all = listQingmaoCanonFactCards();
    const visible = listVisibleQingmaoCanonFactCards();
    const hidden = listHiddenQingmaoCanonFactCards();

    expect(all.length).toBeGreaterThanOrEqual(20);
    expect(visible.some(card => card.id === 'fang_yuan_private_causality_hidden_anchor')).toBe(false);
    expect(hidden.map(card => card.id)).toContain('fang_yuan_private_causality_hidden_anchor');

    const firstPointerKeyword = all[0].sourcePointers[0].keywords[0];
    all[0].sourcePointers[0].keywords[0] = 'mutated_in_test';
    expect(listQingmaoCanonFactCards()[0].sourcePointers[0].keywords[0]).toBe(firstPointerKeyword);

    const firstAnchorRef = all[0].anchorRefs?.[0];
    all[0].anchorRefs?.splice(0, 1, 'mutated_anchor_ref');
    expect(listQingmaoCanonFactCards()[0].anchorRefs?.[0]).toBe(firstAnchorRef);
  });

  it('builds visible prompt facts from player-visible summaries only', () => {
    const context = buildQingmaoFactPromptContext({
      visibleFactCardIds: ['qingmao_three_clans_layout', 'baijia_bai_ning_bing_public_talent'],
    });

    expect(context.visibleFacts.map(fact => fact.id)).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect(context.visibleFacts[0].summary).toContain('熊家');
    expect(context.visibleFacts[0].sourcePointerRefs[0]).toMatch(/reverend-insanity\.txt#L\d+/);
    expect(context.hiddenFactRefs).toEqual([]);
  });

  it('redacts hidden facts even when a hidden id is accidentally requested as visible', () => {
    const context = buildQingmaoFactPromptContext({
      visibleFactCardIds: ['fang_yuan_private_causality_hidden_anchor'],
    });

    expect(context.visibleFacts).toEqual([]);
    expect(context.hiddenFactRefs).toEqual([
      expect.objectContaining({
        id: 'fang_yuan_private_causality_hidden_anchor',
        guard: 'hidden',
        runtimeExposure: 'hidden_ref_only',
      }),
    ]);
    expect(JSON.stringify(context.hiddenFactRefs)).not.toContain('春秋蝉');
    expect(JSON.stringify(context.hiddenFactRefs)).not.toContain('回溯');
    expect(JSON.stringify(context.hiddenFactRefs)).not.toContain('summary');
  });

  it('maps free-intent targets to visible and hidden fact-card refs', () => {
    const fangYuan = buildQingmaoFactReferenceSet({
      rawText: '我要跟踪方源',
      targetRef: 'npc:fang_yuan',
      intentType: 'investigate',
    });
    const baiClan = buildQingmaoFactReferenceSet({
      rawText: '我要投靠白家',
      targetRef: 'faction:baijia_zhai',
      intentType: 'join_faction',
    });
    const spiritSpring = buildQingmaoFactReferenceSet({
      rawText: '我要调查灵泉',
      targetRef: 'investigation:unknown:test',
      intentType: 'investigate',
    });

    expect(fangYuan.visibleFactCardIds).toEqual([]);
    expect(fangYuan.hiddenFactCardIds).toContain('fang_yuan_private_causality_hidden_anchor');
    expect(baiClan.visibleFactCardIds).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect(baiClan.hiddenFactCardIds).toEqual([]);
    expect(spiritSpring.hiddenFactCardIds).toContain('guyue_spirit_spring_resource_basis');
  });

  it('maps v0.12 Qingmao route, pressure, resource, and hidden-guard intents', () => {
    const route = buildQingmaoFactReferenceSet({
      rawText: '我要跟着商队逃离青茅山',
      targetRef: 'route:caravan',
      intentType: 'escape_region',
    });
    const wolfTide = buildQingmaoFactReferenceSet({
      rawText: '狼潮来了，我要参加三寨联盟战功巡逻',
      intentType: 'take_patrol',
    });
    const flowerWine = buildQingmaoFactReferenceSet({
      rawText: '我要调查花酒传闻',
      intentType: 'investigate',
    });
    const baiNingBing = buildQingmaoFactReferenceSet({
      rawText: '我要杀死白凝冰阻止他自爆',
      targetRef: 'npc:bai_ning_bing:defeat_or_kill',
      intentType: 'defeat_key_npc',
    });
    const resource = buildQingmaoFactReferenceSet({
      rawText: '我想省元石买月兰花喂养月光蛊',
      intentType: 'manage_resources',
    });

    expect(route.visibleFactCardIds).toEqual(expect.arrayContaining([
      'qingmao_location_guyue_village',
      'qingmao_caravan_trade_window',
    ]));
    expect(wolfTide.visibleFactCardIds).toEqual(expect.arrayContaining([
      'qingmao_wolf_tide_recurring_pressure',
      'qingmao_three_clan_alliance_war_merit',
    ]));
    expect(flowerWine.visibleFactCardIds).toContain('flower_wine_monk_public_legend');
    expect(flowerWine.hiddenFactCardIds).toContain('flower_wine_inheritance_hidden_location_ref');
    expect(baiNingBing.visibleFactCardIds).toContain('baijia_bai_ning_bing_public_talent');
    expect(baiNingBing.hiddenFactCardIds).toContain('bai_ning_bing_extreme_body_hidden_risk_ref');
    expect(resource.visibleFactCardIds).toEqual(expect.arrayContaining([
      'primeval_stone_mortal_currency_and_cultivation',
      'guyue_moon_orchid_feeding_base',
      'guyue_moonlight_gu_local_specialty',
    ]));
  });

  it('creates living-world compatible known facts and hidden refs without leaking hidden summaries', () => {
    const visibleKnownFact = buildPlayerKnownFactFromQingmaoCard('guyue_moonlight_gu_local_specialty', 12);
    const hiddenKnownFact = buildPlayerKnownFactFromQingmaoCard('fang_yuan_private_causality_hidden_anchor', 12);
    const hiddenRef = buildHiddenFactRefFromQingmaoCard('fang_yuan_private_causality_hidden_anchor', 12);

    expect(visibleKnownFact).toEqual(expect.objectContaining({
      id: 'guyue_moonlight_gu_local_specialty',
      source: 'canon_summary',
      learnedTurn: 12,
      confidence: 'confirmed',
    }));
    expect(visibleKnownFact?.summary).toContain('月光蛊');
    expect(hiddenKnownFact).toBeNull();
    expect(hiddenRef).toEqual(expect.objectContaining({
      id: 'fang_yuan_private_causality_hidden_anchor',
      guard: 'hidden',
      lastCheckedTurn: 12,
    }));
    expect((hiddenRef as any).summary).toBeUndefined();
  });

  it('exposes hidden-card classification only to local helper callers', () => {
    const hidden = getQingmaoCanonFactCard('fang_yuan_private_causality_hidden_anchor');
    const visible = getQingmaoCanonFactCard('qingmao_three_clans_layout');

    expect(hidden).not.toBeNull();
    expect(visible).not.toBeNull();
    expect(isHiddenQingmaoCanonFactCard(hidden!)).toBe(true);
    expect(isHiddenQingmaoCanonFactCard(visible!)).toBe(false);
  });
});
