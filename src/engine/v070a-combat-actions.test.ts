import { afterEach, describe, expect, it, vi } from 'vitest';
import { StateUpdateSchema } from '../schemas/narrative.schema';
import { createDuelEnemy, executePlayerTurn, initDuel } from './combat-engine';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('v0.7.0-a combat action gates', () => {
  it('resolves gu_skill as a real battle action with resource cost and damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const state = initDuel({
      name: '测试蛊师',
      realm: '三转',
      path: '力道',
      daoMarks: 120,
      hp: 180,
      maxHp: 180,
      attack: 70,
      defense: 20,
      accuracy: 90,
      evasion: 10,
      essence: { current: 100, max: 100 },
      gu: [],
      moves: [{
        name: '测试杀招',
        damageMultiplier: 2,
        pathBonus: 100,
        description: '测试用杀招',
        killerMoveId: 'km_test',
        requiredCoreGu: [],
      }],
    }, createDuelEnemy({
      name: '测试敌人',
      realm: '三转',
      hp: 120,
      attack: 30,
      defense: 12,
      evasion: 0,
      path: '力道',
      daoMarks: 60,
    }));

    const result = executePlayerTurn({ ...state, phase: 'player_turn' }, 'gu_skill', 0);
    expect(result.state.player.essence.current).toBeLessThan(100);
    expect(result.state.enemy.hp).toBeLessThan(120);
    expect(result.state.log.at(-1)?.action).toBe('测试杀招');
  });

  it('accepts combat_event_candidates but keeps them as engine-validated candidates', () => {
    const parsed = StateUpdateSchema.parse({
      combat_event_candidates: {
        add: [{
          type: 'third_party',
          title: '敌方势力发现战斗',
          summary: '附近势力可能派人旁观或设伏，但不能直接写伤害和奖励。',
          risk: 'high',
          source: 'ai-rumor',
        }],
      },
    });

    expect(parsed.combat_event_candidates?.add?.[0]?.type).toBe('third_party');
  });
});
