import { describe, expect, it } from 'vitest';
import { NarrativeJSONSchema } from '../schemas/narrative.schema';
import { validateAIStateUpdate } from './ai-state-update-validator';

const baseNarrative = {
  narrative: {
    text: '你在商队边缘停下脚步，风里有血腥味。护卫们低声催促你离开，危险没有解除，但地上确实散落着一些可疑物件。',
    choices: [{ id: 'c1', text: '谨慎检查地面', risk: 'medium', risk_note: '可能被暗处敌人发现' }],
  },
};

describe('AI state_update 语义验证', () => {
  it('Zod 接收中文材料 key，但语义层拒绝未登记材料并保留线索', () => {
    const parsed = NarrativeJSONSchema.parse({
      ...baseNarrative,
      state_update: {
        materials: { add: { 铁精矿石: 2, 空间石戒指: 1 } },
      },
    });

    const result = validateAIStateUpdate(parsed.state_update, {
      realmGrand: 1,
      currentChapterId: 'shanglu_survival',
      currentDomain: '南疆',
      narrativeText: parsed.narrative.text,
    });

    expect(result.sanitized.materials?.add).toEqual({});
    expect(result.dropped.map(i => i.key)).toContain('铁精矿石');
    expect(result.rumorOnly.map(i => i.key)).toContain('空间石戒指');
    expect(result.sanitized.discoveries?.add?.some(d => d.name === '空间石戒指')).toBe(true);
  });

  it('凡人阶段拒绝仙材道痕结晶，蛊仙阶段允许写入', () => {
    const mortal = validateAIStateUpdate(
      { materials: { add: { 道痕结晶: 1 } } } as any,
      { realmGrand: 1, currentChapterId: 'qingmao_start', currentDomain: '南疆' },
    );
    expect(mortal.sanitized.materials?.add).toEqual({});
    expect(mortal.rumorOnly.map(i => i.key)).toContain('道痕结晶');

    const immortal = validateAIStateUpdate(
      { materials: { add: { 道痕结晶: 1 } } } as any,
      { realmGrand: 6, currentChapterId: 'immortal_market', currentDomain: '中洲' },
    );
    expect(immortal.sanitized.materials?.add).toEqual({ 道痕结晶: 1 });
    expect(immortal.accepted.map(i => i.key)).toContain('道痕结晶');
  });

  it('AI 不能直接解锁蛊方，只能添加已登记残方 ID', () => {
    const result = validateAIStateUpdate(
      {
        recipes: { unlock: ['铁翅蛊'] },
        recipe_fragments: { add: ['frag_ice_crystal_ancient', 'frag_unknown_iron_wing'] },
      } as any,
      { realmGrand: 2, currentChapterId: 'caravan', currentDomain: '南疆', narrativeText: '你获得了铁翅蛊蛊方。' },
    );

    expect((result.sanitized as any).recipes).toBeUndefined();
    expect(result.sanitized.recipe_fragments?.add).toEqual(['frag_ice_crystal_ancient']);
    expect(result.rumorOnly.map(i => i.key)).toContain('铁翅蛊');
    expect(result.dropped.map(i => i.key)).toContain('frag_unknown_iron_wing');
  });

  it('AI 不能直接添加未登记蛊虫或仙蛊', () => {
    const result = validateAIStateUpdate(
      {
        gu_inventory: {
          add: [
            { name: '铁翅蛊', tier: 2, path: '金道', rarity: '稀有', description: '未登记蛊虫' },
            { name: '起死回生蛊', tier: 8, path: '生死道', rarity: 'legendary', description: '仙蛊' },
            { name: '铜皮蛊', tier: 1, path: '金道', rarity: '普通', description: '登记蛊虫' },
          ],
        },
      } as any,
      { realmGrand: 2, currentChapterId: 'caravan', currentDomain: '南疆' },
    );

    expect(result.sanitized.gu_inventory?.add?.map((gu: any) => gu.name)).toEqual(['铜皮蛊']);
    expect(result.rumorOnly.map(i => i.key)).toContain('铁翅蛊');
    expect(result.rumorOnly.map(i => i.key)).toContain('起死回生蛊');
  });

  it('AI 不能直接写入 combat_result 作为正式战斗结算', () => {
    const result = validateAIStateUpdate(
      {
        combat_result: {
          hp_delta: -20,
          loot: [{ name: '狼牙', price: 10 }],
          injury: 'light',
        },
      } as any,
      { realmGrand: 2, currentChapterId: 'qingmaoshan', currentDomain: '南疆' },
    );

    expect((result.sanitized as any).combat_result).toBeUndefined();
    expect(result.rumorOnly.map(i => i.key)).toContain('combat_result');
    expect(result.sanitized.discoveries?.add?.some(d => d.name === 'AI战斗结算尝试')).toBe(true);
  });
});
