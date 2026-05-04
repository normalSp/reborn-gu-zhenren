/**
 * 起源解锁系统单元测试 — P2-10
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateAllConditions,
  areAllConditionsSatisfied,
  formatUnmetConditions,
} from '../engine/unlock-condition-checker';
import type { UnlockCondition } from '../engine/unlock-condition-checker';

describe('unlock-condition-checker', () => {
  describe('evaluateCondition - equality type', () => {
    it('should match boolean flag equality', () => {
      const condition: UnlockCondition = {
        type: 'equality', field: 'hasMetMerchant', value: true,
        description: '结识行商',
      };
      const result = evaluateCondition(condition, { hasMetMerchant: true }, {});
      expect(result.satisfied).toBe(true);
      expect(result.actualValue).toBe(true);
    });

    it('should fail boolean flag when false', () => {
      const condition: UnlockCondition = {
        type: 'equality', field: 'hasMetMerchant', value: true,
        description: '结识行商',
      };
      const result = evaluateCondition(condition, { hasMetMerchant: false }, {});
      expect(result.satisfied).toBe(false);
    });

    it('should match string value equality', () => {
      const condition: UnlockCondition = {
        type: 'equality', field: 'lastDomain', value: '北原',
        description: '最后所在的域是北原',
      };
      const result = evaluateCondition(condition, { lastDomain: '北原' }, {});
      expect(result.satisfied).toBe(true);
    });
  });

  describe('evaluateCondition - threshold type', () => {
    it('should pass gte when value is above threshold', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'totalCurrencyEarned', operator: 'gte', value: 1000,
        description: '累计获得元石≥1000',
      };
      const result = evaluateCondition(condition, { totalCurrencyEarned: 1500 }, {});
      expect(result.satisfied).toBe(true);
      expect(result.actualValue).toBe(1500);
    });

    it('should fail gte when value is below threshold', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'totalCurrencyEarned', operator: 'gte', value: 1000,
        description: '累计获得元石≥1000',
      };
      const result = evaluateCondition(condition, { totalCurrencyEarned: 500 }, {});
      expect(result.satisfied).toBe(false);
    });

    it('should handle lte operator', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'deaths', operator: 'lte', value: 3,
        description: '死亡次数≤3',
      };
      expect(evaluateCondition(condition, { deaths: 2 }, {}).satisfied).toBe(true);
      expect(evaluateCondition(condition, { deaths: 5 }, {}).satisfied).toBe(false);
    });

    it('should handle gt operator', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'kills', operator: 'gt', value: 10,
        description: '击杀>10',
      };
      expect(evaluateCondition(condition, { kills: 11 }, {}).satisfied).toBe(true);
      expect(evaluateCondition(condition, { kills: 10 }, {}).satisfied).toBe(false);
    });
  });

  describe('evaluateCondition - count type', () => {
    it('should pass count when number of visited domains meets threshold', () => {
      const condition: UnlockCondition = {
        type: 'count', field: 'domainsVisited', operator: 'gte', value: 3,
        description: '游历3个以上大域',
      };
      const result = evaluateCondition(condition, { domainsVisited: 4 }, {});
      expect(result.satisfied).toBe(true);
    });

    it('should use persistence state as fallback', () => {
      const condition: UnlockCondition = {
        type: 'count', field: 'achievementCount', operator: 'gte', value: 5,
        description: '累计解锁5个成就',
      };
      const result = evaluateCondition(condition, {}, { achievementCount: 6 });
      expect(result.satisfied).toBe(true);
    });
  });

  describe('evaluateCondition - 嵌套路径', () => {
    it('should resolve dot-path nested values', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'daoHeart.mercy', operator: 'gte', value: 5,
        description: '道心仁心≥5',
      };
      const gameState = { daoHeart: { kill: 2, mercy: 7, scheme: 3, ambition: 1 } };
      const result = evaluateCondition(condition, gameState, {});
      expect(result.satisfied).toBe(true);
      expect(result.actualValue).toBe(7);
    });

    it('should handle invalid dot-path gracefully', () => {
      const condition: UnlockCondition = {
        type: 'threshold', field: 'nonexistent.path', operator: 'gte', value: 5,
        description: '不存在字段',
      };
      const result = evaluateCondition(condition, {}, {});
      expect(result.satisfied).toBe(false);
    });
  });

  describe('evaluateAllConditions', () => {
    it('should evaluate all conditions and return results', () => {
      const conditions: UnlockCondition[] = [
        { type: 'threshold', field: 'kills', operator: 'gte', value: 10, description: '击杀≥10' },
        { type: 'equality', field: 'hasFlag_battlefield', value: true, description: '发现古战场' },
      ];
      const gameState = { kills: 15, hasFlag_battlefield: true };
      const results = evaluateAllConditions(conditions, gameState, {});
      expect(results).toHaveLength(2);
      expect(results[0].satisfied).toBe(true);
      expect(results[1].satisfied).toBe(true);
    });
  });

  describe('areAllConditionsSatisfied', () => {
    it('should return true when all conditions pass', () => {
      const results = [
        { satisfied: true, condition: {} as UnlockCondition },
        { satisfied: true, condition: {} as UnlockCondition },
      ];
      expect(areAllConditionsSatisfied(results)).toBe(true);
    });

    it('should return false when any condition fails', () => {
      const results = [
        { satisfied: true, condition: {} as UnlockCondition },
        { satisfied: false, condition: {} as UnlockCondition },
      ];
      expect(areAllConditionsSatisfied(results)).toBe(false);
    });

    it('should return false for empty results', () => {
      expect(areAllConditionsSatisfied([])).toBe(false);
    });
  });

  describe('formatUnmetConditions', () => {
    it('should return descriptions of unmet conditions', () => {
      const results = [
        { satisfied: true, condition: { type: 'threshold' as const, field: 'kills', operator: 'gte' as const, value: 10, description: '击杀≥10' } },
        { satisfied: false, condition: { type: 'equality' as const, field: 'hasFlag', value: true, description: '发现古战场废墟' } },
      ];
      const unmet = formatUnmetConditions(results);
      expect(unmet).toHaveLength(1);
      expect(unmet[0]).toBe('发现古战场废墟');
    });
  });
});
