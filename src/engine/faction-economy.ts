import type { PlayerFaction } from '../types';

export interface FactionEconomyLedger {
  grossIncome: number;
  maintenanceCost: number;
  riskLoss: number;
  feedingReserved: number;
  netIncome: number;
  currencyKind: '元石' | '仙元石';
  resourceTradeValue: number;
}

function stableRatio(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 0xffffffff;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateFactionEconomyLedger(
  faction: PlayerFaction,
  realmGrand: number,
  turn: number,
): FactionEconomyLedger {
  const isImmortal = realmGrand >= 6;
  const members = faction.members?.length || 0;
  const level = Math.max(1, faction.level || 1);
  const riskRatio = 0.12 + stableRatio(`${faction.id}:${turn}:risk`) * 0.18;

  if (isImmortal) {
    const grossIncome = Math.max(2, Math.round(2 + level * 0.9 + members * 0.45));
    const maintenanceCost = Math.max(1, Math.round(level * 0.45 + members * 0.25));
    const riskLoss = Math.max(0, Math.round(grossIncome * riskRatio));
    const feedingReserved = members > 0 ? Math.ceil(members * 0.35) : 0;
    const rawNet = grossIncome - maintenanceCost - riskLoss - feedingReserved;
    const strategicCap = level >= 8 ? 4 : level >= 4 ? 3 : 2;
    const netIncome = clamp(rawNet, -maintenanceCost, strategicCap);
    return {
      grossIncome,
      maintenanceCost,
      riskLoss,
      feedingReserved,
      netIncome,
      currencyKind: '仙元石',
      resourceTradeValue: grossIncome,
    };
  }

  const grossIncome = Math.max(80, Math.round(160 + level * 60 + members * 35));
  const maintenanceCost = Math.max(40, Math.round(level * 45 + members * 25));
  const riskLoss = Math.max(0, Math.round(grossIncome * riskRatio));
  const feedingReserved = members > 0 ? members * 12 : 0;
  const netIncome = Math.max(-maintenanceCost, grossIncome - maintenanceCost - riskLoss - feedingReserved);
  return {
    grossIncome,
    maintenanceCost,
    riskLoss,
    feedingReserved,
    netIncome,
    currencyKind: '元石',
    resourceTradeValue: grossIncome,
  };
}
