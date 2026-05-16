import { describe, expect, it } from 'vitest';

import {
  buildQingmaoRegionActionEntries,
  formatQingmaoRegionContextForPrompt,
  resolveQingmaoRegionIdentity,
  resolveQingmaoRegionAction,
  validateQingmaoRegionCandidate,
} from './v010-qingmao-region-engine';

describe('v0.10.0-a2 Qingmao regional clue pool and action entry', () => {
  it('resolves Gu Yue start and exposes clan-school plus mountain action entries', () => {
    const identity = resolveQingmaoRegionIdentity({
      startProfileId: 'start_qingmaoshan_guyue',
    });
    expect(identity.scope.role).toBe('guyue_clan_member');

    const entries = buildQingmaoRegionActionEntries({
      startProfileId: 'start_qingmaoshan_guyue',
      sceneId: 'qingmao_clan_school',
      locationId: 'guyue_clan_school',
      remainingAp: 2,
      turn: 7,
    });

    expect(entries.some(entry => entry.source.id === 'clan_school_notice' && entry.actionSlot.id === 'clan_school_training')).toBe(true);
    expect(entries.some(entry => entry.source.id === 'mountain_path_patrol' && entry.actionSlot.id === 'mountain_patrol')).toBe(true);
    expect(entries.some(entry => entry.source.id === 'caravan_rumor')).toBe(false);

    const clanEntry = entries.find(entry => entry.source.id === 'clan_school_notice' && entry.actionSlot.id === 'clan_school_training');
    expect(clanEntry?.canDepart).toBe(true);
    expect(clanEntry?.candidate.domain).toBe('training_ground');
    expect(clanEntry?.candidate.source).toBe('faction');
  });

  it('keeps caravan identity on rumor-only entries and blocks formal commission departure in a2', () => {
    const entries = buildQingmaoRegionActionEntries({
      startProfileId: 'start_qingmaoshan_shangjia_caravan',
      sceneId: 'qingmao_caravan_edge',
      locationId: 'caravan_road',
      remainingAp: 1,
      turn: 8,
    });

    expect(entries.every(entry => entry.identity.role === 'caravan_observer')).toBe(true);
    expect(entries.some(entry => entry.source.id === 'clan_school_notice')).toBe(false);

    const rumor = entries.find(entry => entry.source.id === 'caravan_rumor' && entry.actionSlot.id === 'mountain_patrol');
    expect(rumor?.status).toBe('rumor_only');
    expect(rumor?.canDepart).toBe(false);

    const commission = entries.find(entry => entry.actionSlot.id === 'three_clan_commission');
    expect(commission?.status).toBe('persistent_state_blocked');
    expect(commission?.blockers.join('\n')).toContain('持久化区域状态');
  });

  it('blocks non-Gu-Yue identity rewrite and high-rank lore overreach from AI candidates', () => {
    const validation = validateQingmaoRegionCandidate({
      sourceId: 'mountain_path_patrol',
      actionSlotId: 'mountain_patrol',
      title: '古月族学密令',
      summary: '你作为古月族人得到仙蛊线索，并准备进入宝黄天交易。',
    }, {
      startProfileId: 'start_qingmaoshan_xiongjia',
      remainingAp: 2,
    });

    expect(validation.valid).toBe(false);
    expect(validation.blockers.join('\n')).toContain('身份越界');
    expect(validation.blockers.join('\n')).toContain('运行时禁区');
    expect(validation.candidate?.blockers.join('\n')).toContain('身份越界');
  });

  it('explains AP blockers without changing save format or store state', () => {
    const entries = buildQingmaoRegionActionEntries({
      startProfileId: 'start_qingmaoshan_tiejia_patrol',
      remainingAp: 0,
      sceneId: 'front_mountain_patrol',
      turn: 12,
    });
    const patrol = entries.find(entry => entry.actionSlot.id === 'mountain_patrol');

    expect(patrol?.status).toBe('ap_blocked');
    expect(patrol?.candidate.blockers.join('\n')).toContain('场景 AP 不足');
    expect(formatQingmaoRegionContextForPrompt({ startProfileId: 'start_qingmaoshan_tiejia_patrol', remainingAp: 0 }))
      .toContain('当前身份：outside_patrol_observer');
  });

  it('closes clan-school training through the local training-ground engine', () => {
    const result = resolveQingmaoRegionAction({
      sourceId: 'clan_school_notice',
      actionSlotId: 'clan_school_training',
      title: '古月族学炼蛊台竹牌',
      summary: '族学告示指向青茅山炼蛊台，由本地道场引擎结算。',
      seed: 'b1-clan-school',
    }, {
      startProfileId: 'start_qingmaoshan_guyue',
      remainingAp: 2,
      turn: 14,
      store: {
        currentChapterId: 'qingmaoshan',
        currentDomain: '南疆',
        profile: { realm: { grand: 2, sub: '中阶', label: '二转中阶' } },
        attributes: { 资质: 8, 心智: 7, 气运: 5 },
        pathBuild: { primary: '炼道', secondary: [], dao_marks: {} },
        currency: 1000,
        immortalCurrency: 0,
        flags: { _start_profile: 'start_qingmaoshan_guyue' },
        sceneSessionState: { actionBudget: { remaining: 2, remainingAp: 2 }, localActionLedger: [] },
      },
    });

    expect(result.trainingGround).toBeTruthy();
    expect(result.worldActionCandidate?.domain).toBe('training_ground');
    expect(result.worldActionDeparture?.mode).toBe('local_resolution');
    expect(result.worldActionLedgerEntry?.actionType).toBe('training_ground');
    expect(result.worldActionLedgerEntry?.cost).toBe(1);
    expect(result.narrativeReturnContext?.promptSummary).toContain('本地引擎结算');
    expect(result.saveFormatImpact).toBe('none');
  });

  it('closes mountain patrol through field-action without direct rewards or save migration', () => {
    const result = resolveQingmaoRegionAction({
      sourceId: 'mountain_path_patrol',
      actionSlotId: 'mountain_patrol',
      title: '青茅山前山巡查',
      summary: '沿山道巡查雾气和足迹，只登记风险与候选线索。',
      seed: 3,
    }, {
      startProfileId: 'start_qingmaoshan_tiejia_patrol',
      remainingAp: 2,
      turn: 15,
      store: {
        currentChapterId: 'qingmaoshan',
        currentDomain: '南疆',
        profile: { realm: { grand: 1, sub: '初阶', label: '一转初阶' } },
        attributes: { 资质: 6, 心智: 7, 气运: 6 },
        flags: { _start_profile: 'start_qingmaoshan_tiejia_patrol' },
        sceneSessionState: { actionBudget: { remaining: 2, remainingAp: 2 }, localActionLedger: [] },
      },
    });

    expect(result.fieldAction).toBeTruthy();
    expect(result.worldActionCandidate?.domain).toBe('field_action');
    expect(result.worldActionLedgerEntry?.actionType).toBe('field_action');
    expect(result.worldActionResolution?.rewardPolicy).toBe('local_engine_only');
    expect(result.worldActionResolution?.localFacts.join('\n')).toContain('青茅山山道巡查由本地 field-action 引擎结算');
    expect(result.worldActionResolution?.localFacts.join('\n')).toContain('不直接解锁正式地点、蛊虫、仙材或奖励');
    expect(result.saveFormatImpact).toBe('none');
  });

  it('keeps three-clan commission blocked until persistent region state is approved', () => {
    const result = resolveQingmaoRegionAction({
      sourceId: 'caravan_rumor',
      actionSlotId: 'three_clan_commission',
      title: '三寨委托传闻',
      summary: '商队听见三寨有人悬赏核验山道异动。',
    }, {
      startProfileId: 'start_qingmaoshan_shangjia_caravan',
      remainingAp: 2,
    });

    expect(result.success).toBe(false);
    expect(result.saveFormatImpact).toBe('requires_persistent_region_state');
    expect(result.worldActionDeparture?.mode).toBe('blocked');
    expect(result.worldActionLedgerEntry?.cost).toBe(0);
    expect(result.worldActionResolution?.blockedReasons.join('\n')).toContain('更完整的青茅区域状态机');
  });
});
