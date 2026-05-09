export interface MaterialOverloadStatus {
  total: number;
  capacity: number;
  overloaded: boolean;
  excess: number;
  ratio: number;
  severity: 'none' | 'light' | 'heavy';
  fieldSuccessPenalty: number;
  escapeSuccessPenalty: number;
  riskMultiplier: number;
  message?: string;
}

export function getMaterialBagTotal(materialBag: Record<string, number> | undefined | null): number {
  if (!materialBag) return 0;
  return Object.values(materialBag).reduce((sum, qty) => sum + Math.max(0, Number(qty || 0)), 0);
}

export function getMaterialOverloadStatus(input: {
  materialBag?: Record<string, number> | null;
  capacity?: number;
}): MaterialOverloadStatus {
  const total = getMaterialBagTotal(input.materialBag);
  const capacity = Number.isFinite(input.capacity) ? Math.max(1, Number(input.capacity)) : Infinity;
  if (!Number.isFinite(capacity)) {
    return {
      total,
      capacity,
      overloaded: false,
      excess: 0,
      ratio: 0,
      severity: 'none',
      fieldSuccessPenalty: 0,
      escapeSuccessPenalty: 0,
      riskMultiplier: 1,
    };
  }

  const excess = Math.max(0, total - capacity);
  const ratio = excess / capacity;
  const severity = excess <= 0 ? 'none' : ratio >= 0.35 ? 'heavy' : 'light';
  return {
    total,
    capacity,
    overloaded: excess > 0,
    excess,
    ratio,
    severity,
    fieldSuccessPenalty: severity === 'heavy' ? 0.18 : severity === 'light' ? 0.08 : 0,
    escapeSuccessPenalty: severity === 'heavy' ? 0.22 : severity === 'light' ? 0.1 : 0,
    riskMultiplier: severity === 'heavy' ? 1.35 : severity === 'light' ? 1.15 : 1,
    message: excess > 0
      ? `物资袋超载 ${excess} 份：野外采集、撤离和逃脱会受影响，请先出售或整理蛊材。`
      : undefined,
  };
}

export function applyMaterialOverloadToFieldAction<T extends {
  successRate: number;
  riskChance: number;
  modifierLabels: string[];
}>(
  result: T,
  status: MaterialOverloadStatus,
  kind: 'scout' | 'gather' | 'trap_check' | 'escape_support',
): T {
  if (!status.overloaded) return result;
  const successPenalty = kind === 'escape_support' ? status.escapeSuccessPenalty : status.fieldSuccessPenalty;
  return {
    ...result,
    successRate: Math.max(0.01, result.successRate - successPenalty),
    riskChance: Math.min(0.98, result.riskChance * status.riskMultiplier),
    modifierLabels: Array.from(new Set([
      ...result.modifierLabels,
      status.severity === 'heavy' ? '物资袋严重超载' : '物资袋超载',
    ])),
  };
}
