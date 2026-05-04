/**
 * 起源解锁条件检查器 — P2-10
 * 纯函数条件评估引擎，支持三种条件类型：equality / threshold / count
 *
 * 设计原则：
 * - 零副作用，所有数据来自传入参数
 * - 条件表达式由 canon/origins.json 中的 UnlockCondition 定义
 * - 支持组合条件（AND逻辑：所有条件同时满足才算解锁）
 */

/** 条件运算符类型 */
export type ConditionOperator = 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt';

/** 条件类型 */
export type ConditionType = 'equality' | 'threshold' | 'count';

/** 单条解锁条件 */
export interface UnlockCondition {
  type: ConditionType;
  /** 检测的字段名（使用点号分隔嵌套路径） */
  field: string;
  /** 比较运算符 */
  operator?: ConditionOperator;
  /** 比较值 */
  value: number | string | boolean;
  /** 条件描述（展示给玩家） */
  description: string;
}

/** 条件评估结果 */
export interface ConditionEvalResult {
  satisfied: boolean;
  condition: UnlockCondition;
  /** 实际值 vs 期望值 */
  actualValue?: number | string | boolean;
}

/**
 * 评估单条解锁条件
 * @param condition 解锁条件定义
 * @param gameState 当前游戏状态（扁平化键值对）
 * @param persistenceState 跨存档持久化状态（成就计数等）
 * @returns 评估结果
 */
export function evaluateCondition(
  condition: UnlockCondition,
  gameState: Record<string, any>,
  persistenceState: Record<string, any>,
): ConditionEvalResult {
  const { type, field, operator, value } = condition;

  // 获取实际值
  let actualValue: any;
  if (type === 'equality') {
    // 遍历查找flag
    actualValue = resolveDotPath(gameState, field) ?? resolveDotPath(persistenceState, field);
    // equality 检查的是 boolean flag 或特定值匹配
    if (typeof actualValue === 'boolean') {
      return { satisfied: actualValue === true, condition, actualValue };
    }
    // 字符串值匹配
    return { satisfied: actualValue === value, condition, actualValue };
  }

  if (type === 'threshold' || type === 'count') {
    actualValue = resolveDotPath(gameState, field) ?? resolveDotPath(persistenceState, field) ?? 0;
    const numActual = Number(actualValue);
    const numExpected = Number(value);

    if (isNaN(numActual)) {
      return { satisfied: false, condition, actualValue };
    }

    const op = operator || 'gte';
    switch (op) {
      case 'gte': return { satisfied: numActual >= numExpected, condition, actualValue: numActual };
      case 'lte': return { satisfied: numActual <= numExpected, condition, actualValue: numActual };
      case 'gt':  return { satisfied: numActual > numExpected, condition, actualValue: numActual };
      case 'lt':  return { satisfied: numActual < numExpected, condition, actualValue: numActual };
      case 'eq':  return { satisfied: numActual === numExpected, condition, actualValue: numActual };
      case 'neq': return { satisfied: numActual !== numExpected, condition, actualValue: numActual };
      default:    return { satisfied: numActual >= numExpected, condition, actualValue: numActual };
    }
  }

  return { satisfied: false, condition, actualValue };
}

/**
 * 解析点号分隔的嵌套路径
 * 例如 "daoHeart.mercy" → gameState.daoHeart.mercy
 * 例如 "player.realm" → gameState.player.realm (查找 realmNum)
 */
function resolveDotPath(obj: Record<string, any>, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * 批量评估一组条件 — 所有条件必须同时满足（AND逻辑）
 * @param conditions 条件列表
 * @param gameState 当前游戏状态
 * @param persistenceState 跨存档持久化状态
 * @returns 评估结果数组
 */
export function evaluateAllConditions(
  conditions: UnlockCondition[],
  gameState: Record<string, any>,
  persistenceState: Record<string, any>,
): ConditionEvalResult[] {
  return conditions.map(c => evaluateCondition(c, gameState, persistenceState));
}

/**
 * 检查是否所有条件都满足
 */
export function areAllConditionsSatisfied(results: ConditionEvalResult[]): boolean {
  return results.length > 0 && results.every(r => r.satisfied);
}

/**
 * 格式化未满足的条件描述（用于UI提示）
 */
export function formatUnmetConditions(results: ConditionEvalResult[]): string[] {
  return results
    .filter(r => !r.satisfied)
    .map(r => r.condition.description);
}
