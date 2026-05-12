import { describe, expect, it } from 'vitest';
import {
  buildCombatEventCandidateFromTrigger,
  detectCombat,
} from './combat-router';

describe('v0.9.0-b2 combat router compatibility closure', () => {
  it('converts legacy duel triggers into battlefield combat candidates', () => {
    const text = '商路尽头忽然杀气骤起，劫匪从林间伏击而出，劫匪首领拦路逼战。';
    const trigger = detectCombat(text, 'shanglu_qiusheng');

    expect(trigger?.combatType).toBe('duel');

    const candidate = buildCombatEventCandidateFromTrigger(trigger!, text, 'shanglu_qiusheng', 12);

    expect(candidate).toEqual(expect.objectContaining({
      type: 'ambush',
      source: 'engine',
      scale: '1v1',
      createdTurn: 12,
    }));
    expect(candidate?.title).toContain('劫匪首领');
    expect(candidate?.summary).toContain('本地 battlefield 引擎结算');
  });

  it('converts legacy narrative combat constraints into formal candidates instead of transient settlement prompts', () => {
    const text = '青茅山外狼潮压近，寨墙下全寨防守，老蛊师正在分发蛊虫。';
    const trigger = detectCombat(text, 'qingmaoshan');

    expect(trigger?.combatType).toBe('narrative');

    const candidate = buildCombatEventCandidateFromTrigger(trigger!, text, 'qingmaoshan', 21);

    expect(candidate).toEqual(expect.objectContaining({
      source: 'engine',
      scale: 'battle',
      createdTurn: 21,
    }));
    expect(candidate?.summary).toContain('正式入场、胜负、伤害与掉落');
  });
});
