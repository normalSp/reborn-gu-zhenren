import { describe, expect, it } from 'vitest';
import { createInitialLivingWorldState } from '../store/defaultLivingWorldState';
import {
  adjudicateIntentCandidate,
  adjudicateWorldIntent,
  buildWorldIntentContextFromStore,
  createIntentCandidate,
  type WorldIntentContext,
} from './v011-world-intent-engine';

const guyueContext: WorldIntentContext = {
  actorId: 'player',
  turn: 6,
  regionId: 'qingmao_three_clans',
  selectedStartProfileId: 'start_qingmaoshan_guyue',
  playerRealmGrand: 1,
  timelineMode: 'canon',
  livingWorldState: createInitialLivingWorldState(),
};

describe('v0.11.0-a3 World Intent Engine first slice', () => {
  it('downgrades rank-nine Gu acquisition into a non-executable long-term goal', () => {
    const result = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要拿九转蛊',
    });

    expect(result.candidate.intentType).toBe('obtain_item');
    expect(result.candidate.targetRef).toBe('item:rank_nine_gu');
    expect(result.ruling.category).toBe('long_term_goal');
    expect(result.ruling.allowed).toBe(false);
    expect(result.ruling.visibleExplanation).toContain('遥远野心');
    expect(result.suggestedPlayerGoal).toEqual(expect.objectContaining({
      intentType: 'obtain_item',
      targetRef: 'item:rank_nine_gu',
      status: 'deferred',
    }));
    expect(result.statePatchApplied).toBe(false);
    expect(result.route.forbiddenStateWrites).toContain('inventory');
  });

  it('blocks Spring Autumn Cicada and mortal Treasure Yellow Heaven trading as world-rule violations', () => {
    const cicada = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要获得春秋蝉',
    });
    const treasureYellowHeaven = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要去宝黄天交易',
    });

    expect(cicada.candidate.intentType).toBe('obtain_item');
    expect(cicada.ruling.category).toBe('world_rule_blocked');
    expect(cicada.ruling.allowed).toBe(false);
    expect(cicada.ruling.visibleExplanation).not.toContain('方源重生');

    expect(treasureYellowHeaven.candidate.intentType).toBe('travel');
    expect(treasureYellowHeaven.ruling.category).toBe('world_rule_blocked');
    expect(treasureYellowHeaven.ruling.allowed).toBe(false);
    expect(treasureYellowHeaven.ruling.reasons.join('；')).toContain('凡人阶段不能正式交易');
  });

  it('separates Bai clan membership from cross-faction defection attempts', () => {
    const guyueToBai = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要投靠白家',
    });
    const baiHome = adjudicateWorldIntent({
      ...guyueContext,
      selectedStartProfileId: 'start_qingmaoshan_baijia',
      rawText: '我要投靠白家',
    });
    const rogueContact = adjudicateWorldIntent({
      ...guyueContext,
      selectedStartProfileId: 'start_qingmaoshan_sanxiu',
      rawText: '我要投靠白家',
    });

    expect(guyueToBai.candidate.intentType).toBe('join_faction');
    expect(guyueToBai.ruling.category).toBe('requires_prerequisite');
    expect(guyueToBai.ruling.allowed).toBe(false);
    expect(guyueToBai.ruling.visibleExplanation).toContain('不是按钮式换阵营');
    expect(guyueToBai.factCardRefs.visibleFactCardIds).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);
    expect(guyueToBai.deepSeekContract.visibleFactIds).toEqual([
      'qingmao_three_clans_layout',
      'baijia_bai_ning_bing_public_talent',
    ]);

    expect(baiHome.ruling.category).toBe('available');
    expect(baiHome.ruling.allowed).toBe(true);
    expect(baiHome.route.canRouteToActionProtocol).toBe(true);

    expect(rogueContact.ruling.category).toBe('available_with_cost');
    expect(rogueContact.ruling.allowed).toBe(true);
    expect(rogueContact.ruling.visibleExplanation).toContain('不会立刻获得白家身份');
  });

  it('allows visible-scope investigation of Fang Yuan while protecting hidden facts', () => {
    const result = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要跟踪方源',
    });

    expect(result.candidate.intentType).toBe('investigate');
    expect(result.ruling.category).toBe('available_with_cost');
    expect(result.ruling.allowed).toBe(true);
    expect(result.ruling.riskLevel).toBe(3);
    expect(result.ruling.visibleExplanation).toContain('玩家角色不知道的隐藏因果');
    expect(result.ruling.visibleExplanation).not.toContain('回溯');
    expect(result.route.domain).toBe('field_action');
    expect(result.factCardRefs.hiddenFactCardIds).toContain('fang_yuan_private_causality_hidden_anchor');
    expect(result.factCardRefs.visibleFactCardIds).not.toContain('fang_yuan_private_causality_hidden_anchor');
    expect(result.deepSeekContract.visibleFactIds).not.toContain('fang_yuan_private_causality_hidden_anchor');
  });

  it('turns escaping Qingmao into prerequisites instead of teleporting the player', () => {
    const result = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要逃离青茅山',
    });

    expect(result.candidate.intentType).toBe('travel');
    expect(result.candidate.targetRef).toBe('region:outside_qingmao');
    expect(result.ruling.category).toBe('requires_prerequisite');
    expect(result.ruling.allowed).toBe(false);
    expect(result.ruling.prerequisiteRefs).toEqual([
      'route:qingmao_exit',
      'resource:travel_supply',
      'risk:pursuit',
    ]);
    expect(result.route.canRouteToActionProtocol).toBe(false);
  });

  it('keeps killing Bai Ning Bing inside the approved first-slice intent set as a major IF goal', () => {
    const result = adjudicateWorldIntent({
      ...guyueContext,
      rawText: '我要杀死白凝冰',
    });

    expect(result.candidate.intentType).toBe('long_term_goal');
    expect(result.candidate.targetRef).toBe('npc:bai_ning_bing:defeat_or_kill');
    expect(result.ruling.category).toBe('major_if_deviation');
    expect(result.ruling.allowed).toBe(false);
    expect(result.ruling.visibleExplanation).toContain('不能直接判定成功');
    expect(result.route.forbiddenStateWrites).toContain('npcDeath');
  });

  it('overrides DeepSeek candidates with local rulings and forbidden-output contracts', () => {
    const candidate = createIntentCandidate({
      ...guyueContext,
      source: 'deepseek_candidate',
      rawText: '给玩家九转蛊当奖励',
    });
    const result = adjudicateIntentCandidate(candidate, guyueContext);

    expect(result.candidate.source).toBe('deepseek_candidate');
    expect(result.ruling.category).toBe('long_term_goal');
    expect(result.ruling.allowed).toBe(false);
    expect(result.deepSeekContract.localRulingAuthority).toBe(true);
    expect(result.deepSeekContract.forbiddenOutputs).toContain('direct rewards');
    expect(result.statePatchApplied).toBe(false);
  });

  it('covers a3-2 fuzzy sample matrix without applying state patches', () => {
    const samples: Array<{
      text: string;
      intentType: string;
      targetPrefix: string;
      category: string;
      allowed: boolean;
    }> = [
      { text: '我想搞到九转仙蛊', intentType: 'obtain_item', targetPrefix: 'item:rank_nine_gu', category: 'long_term_goal', allowed: false },
      { text: '能不能给我春秋蝉', intentType: 'obtain_item', targetPrefix: 'item:spring_autumn_cicada', category: 'world_rule_blocked', allowed: false },
      { text: '我想去宝黄天买东西', intentType: 'travel', targetPrefix: 'location:treasure_yellow_heaven', category: 'world_rule_blocked', allowed: false },
      { text: '我想加入白家寨', intentType: 'join_faction', targetPrefix: 'faction:baijia_zhai', category: 'requires_prerequisite', allowed: false },
      { text: '我想盯着方源看他做什么', intentType: 'investigate', targetPrefix: 'npc:fang_yuan', category: 'available_with_cost', allowed: true },
      { text: '我想跑路离开青茅山', intentType: 'travel', targetPrefix: 'region:outside_qingmao', category: 'requires_prerequisite', allowed: false },
      { text: '有没有办法弄死白凝冰', intentType: 'long_term_goal', targetPrefix: 'npc:bai_ning_bing:defeat_or_kill', category: 'major_if_deviation', allowed: false },
      { text: '我要变强', intentType: 'long_term_goal', targetPrefix: 'goal:unclassified:', category: 'long_term_goal', allowed: false },
      { text: '我要赚钱', intentType: 'long_term_goal', targetPrefix: 'goal:unclassified:', category: 'long_term_goal', allowed: false },
      { text: '我要找机缘', intentType: 'investigate', targetPrefix: 'investigation:unknown:', category: 'available_with_cost', allowed: true },
      { text: '我要去外面看看', intentType: 'travel', targetPrefix: 'travel:unknown:', category: 'requires_prerequisite', allowed: false },
      { text: '我要换个靠山', intentType: 'join_faction', targetPrefix: 'faction:unknown:', category: 'requires_prerequisite', allowed: false },
      { text: '我要弄到月光蛊', intentType: 'obtain_item', targetPrefix: 'item:unregistered:', category: 'requires_prerequisite', allowed: false },
      { text: '我想观察后山动静', intentType: 'investigate', targetPrefix: 'investigation:unknown:', category: 'available_with_cost', allowed: true },
    ];

    for (const sample of samples) {
      const result = adjudicateWorldIntent({
        ...guyueContext,
        rawText: sample.text,
      });

      expect(result.candidate.intentType, sample.text).toBe(sample.intentType);
      expect(result.candidate.targetRef, sample.text).toMatch(new RegExp(`^${sample.targetPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      expect(result.ruling.category, sample.text).toBe(sample.category);
      expect(result.ruling.allowed, sample.text).toBe(sample.allowed);
      expect(result.statePatchApplied, sample.text).toBe(false);
    }
  });

  it('can derive a minimal context from the current store shape', () => {
    const context = buildWorldIntentContextFromStore({
      turn: 8,
      selectedStartProfileId: 'start_qingmaoshan_guyue',
      profile: { realm: { grand: 1 } },
      gameMode: 'canon',
      livingWorldState: {
        worldClock: { turn: 8 },
        knownFacts: {
          fact_1: { id: 'fact_1' },
        },
      },
    });

    expect(context.turn).toBe(8);
    expect(context.selectedStartProfileId).toBe('start_qingmaoshan_guyue');
    expect(context.playerRealmGrand).toBe(1);
    expect(context.visibleFactIds).toEqual(['fact_1']);
  });
});
