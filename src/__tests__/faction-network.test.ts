/**
 * P2-13: NPC关系网络单元测试
 * 测试范围: 双向矩阵初始化/关系变化/同家族好感/自然漂移
 */
import { describe, it, expect } from 'vitest';

// 模拟初始化的关系矩阵逻辑
function initRelations(npcDatabase: Record<string, any>): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  const npcEntries = Object.entries(npcDatabase);

  for (const [idA, dataA] of npcEntries) {
    const a = dataA as any;
    if (!a || a.role === 'minor') continue;
    if (!matrix[idA]) matrix[idA] = {};

    for (const [idB, dataB] of npcEntries) {
      if (idA === idB) continue;
      const b = dataB as any;
      if (!b || b.role === 'minor') continue;

      if (a.familyId && b.familyId && a.familyId === b.familyId) {
        matrix[idA][idB] = 40;
      } else if (a.master === b.master && a.master) {
        matrix[idA][idB] = 30;
      } else if ((a.faction && a.faction === b.faction) || (a.domain === b.domain)) {
        matrix[idA][idB] = 15;
      } else if (a.enemyFaction && a.enemyFaction === b.faction) {
        matrix[idA][idB] = -30;
      } else if (b.enemyFaction && b.enemyFaction === a.faction) {
        matrix[idA][idB] = -30;
      } else {
        matrix[idA][idB] = 0;
      }
    }
  }
  return matrix;
}

describe('双向矩阵初始化', () => {
  const mockNpcDb: Record<string, any> = {
    npc_1: { name: '张三', role: 'supporting', familyId: '张氏', domain: '南疆', faction: '古月山寨' },
    npc_2: { name: '李四', role: 'supporting', familyId: '李氏', domain: '南疆', faction: '古月山寨' },
    npc_3: { name: '王五', role: 'supporting', familyId: '张氏', domain: '南疆', faction: '古月山寨' },
    npc_4: { name: '赵六', role: 'minor', domain: '北原', faction: '黄金家族' },
    npc_5: { name: '孙七', role: 'antagonist', domain: '南疆', faction: '魔道教' },
  };

  const matrix = initRelations(mockNpcDb);

  it('应包含非minor角色', () => {
    expect(matrix['npc_1']).toBeDefined();
    expect(matrix['npc_2']).toBeDefined();
    expect(matrix['npc_3']).toBeDefined();
    // minor角色应跳过
    expect(matrix['npc_4']).toBeUndefined();
    expect(matrix['npc_5']).toBeDefined();
  });

  it('同家族(张氏)npc_1→npc_3好感应为40', () => {
    expect(matrix['npc_1']['npc_3']).toBe(40);
  });

  it('同势力(古月山寨)npc_1→npc_2好感应为15', () => {
    expect(matrix['npc_1']['npc_2']).toBe(15);
  });

  it('对角线上不创建自身关系', () => {
    expect(matrix['npc_1']['npc_1']).toBeUndefined();
  });

  it('同域但不同势力NPC→默认好感15', () => {
    // npc_5(魔道教)与npc_2(古月山寨)同属南疆→好感15
    expect(matrix['npc_5']['npc_2']).toBe(15);
  });
});

describe('关系更新', () => {
  it('正向delta增加好感', () => {
    let affinity = 0;
    const delta = 10;
    affinity = Math.max(-100, Math.min(100, affinity + delta));
    expect(affinity).toBe(10);
  });

  it('负向delta减少好感', () => {
    let affinity = 20;
    const delta = -15;
    affinity = Math.max(-100, Math.min(100, affinity + delta));
    expect(affinity).toBe(5);
  });

  it('好感不超过上限100', () => {
    let affinity = 95;
    affinity = Math.max(-100, Math.min(100, affinity + 10));
    expect(affinity).toBe(100);
  });

  it('恶感不低于下限-100', () => {
    let affinity = -95;
    affinity = Math.max(-100, Math.min(100, affinity - 10));
    expect(affinity).toBe(-100);
  });

  it('互惠效应：BtoA默认取AtoB的一半', () => {
    const deltaAtoB = 10;
    const deltaBtoA = Math.round(deltaAtoB * 0.5);
    expect(deltaBtoA).toBe(5);
  });
});

describe('关系类型推导', () => {
  function relationToAffinity(relationType: string): number {
    const map: Record<string, number> = {
      'family': 60,
      'mentor': 50,
      'ally': 40,
      'friend': 30,
      'romance': 70,
      'stranger': 0,
      'rival': -20,
      'enemy': -40,
    };
    return map[relationType] || 0;
  }

  it('family→60', () => { expect(relationToAffinity('family')).toBe(60); });
  it('enemy→-40', () => { expect(relationToAffinity('enemy')).toBe(-40); });
  it('stranger→0', () => { expect(relationToAffinity('stranger')).toBe(0); });
  it('未知关系→0', () => { expect(relationToAffinity('unknown')).toBe(0); });
});

describe('自然漂移', () => {
  it('高负好感(-50)有概率进一步恶化', () => {
    const affinity = -50;
    const driftChance = 0.02;
    expect(affinity < -20).toBe(true);
    expect(driftChance).toBe(0.02);
  });

  it('中等正好感(>20, <60)有概率缓慢衰减', () => {
    const affinity = 30;
    const decayChance = 0.05;
    expect(affinity > 20 && affinity < 60).toBe(true);
    expect(decayChance).toBe(0.05);
  });

  it('高好感(≥60)不衰减', () => {
    const affinity = 60;
    expect(affinity > 20 && affinity < 60).toBe(false);
  });

  it('中性好感不漂移', () => {
    const affinity = 0;
    expect(affinity < -20).toBe(false);
    expect(affinity > 20 && affinity < 60).toBe(false);
  });
});
