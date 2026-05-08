import affinitiesRaw from '../canon/extreme-physique-daomark-affinity.json';
import type { ExtremePhysiqueType, MortalAperture } from '../types';

type AffinitySpec = {
  primaryPaths?: Record<string, number>;
  forbiddenPaths?: string[];
  backlashPaths?: Record<string, number>;
  specialRules?: string[];
};

export interface ExtremePhysiqueCalamityProfile {
  physiqueType: ExtremePhysiqueType;
  pressureLevel: 'stable' | 'strained' | 'critical';
  aperturePressure: number;
  safeTurnsEstimate: number;
  favoredPaths: string[];
  forbiddenPaths: string[];
  calamityTags: string[];
  visualState: {
    fillPercent: number;
    wallState: string;
    tint: string;
    description: string;
  };
  blockedActions: string[];
  warnings: string[];
}

const AFFINITIES = affinitiesRaw as Record<ExtremePhysiqueType, AffinitySpec>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getTint(physiqueType: ExtremePhysiqueType): string {
  if (physiqueType.includes('冰')) return '#8fd7ff';
  if (physiqueType.includes('炎') || physiqueType.includes('阳')) return '#ffb15c';
  if (physiqueType.includes('金')) return '#f6d365';
  if (physiqueType.includes('木') || physiqueType.includes('森')) return '#7bd88f';
  if (physiqueType.includes('智')) return '#c7a6ff';
  if (physiqueType.includes('梦')) return '#e5a2ff';
  return '#d6c49a';
}

export function buildExtremePhysiqueCalamityProfile(
  aperture: MortalAperture | null | undefined,
  options: { hpPercent?: number; turn?: number; recentForcedGuUse?: number } = {},
): ExtremePhysiqueCalamityProfile | null {
  if (!aperture?.extremePhysiqueType || !aperture.capacityLocked) return null;

  const physiqueType = aperture.extremePhysiqueType;
  const spec = AFFINITIES[physiqueType] ?? {};
  const fill = aperture.primevalSea?.fillPercent ?? 100;
  const recentForcedGuUse = options.recentForcedGuUse ?? 0;
  const hpPercent = options.hpPercent ?? 100;
  const pressure = clamp(fill + recentForcedGuUse * 8 + (hpPercent < 20 ? 12 : 0), 0, 140);
  const pressureLevel = pressure >= 115 ? 'critical' : pressure >= 96 ? 'strained' : 'stable';
  const safeTurnsEstimate = Math.max(0, Math.floor((120 - pressure) / 6));
  const blockedActions: string[] = [];
  const warnings: string[] = [];

  if (hpPercent <= 5) blockedActions.push('HP低于5%，禁止强行换蛊、强行承载和高压修炼');
  if (pressureLevel === 'critical') {
    warnings.push('十绝体空窍压力濒临失控，继续强行用蛊可能触发灾劫或自爆线索。');
  } else if (pressureLevel === 'strained') {
    warnings.push('十绝体空窍已进入高压状态，应减少携蛊、调息或寻找压制手段。');
  }

  return {
    physiqueType,
    pressureLevel,
    aperturePressure: Math.round(pressure),
    safeTurnsEstimate,
    favoredPaths: Object.keys(spec.primaryPaths ?? {}),
    forbiddenPaths: spec.forbiddenPaths ?? [],
    calamityTags: [
      '十绝体',
      pressureLevel === 'critical' ? '灾劫临界' : pressureLevel === 'strained' ? '空窍高压' : '暂稳',
      ...(spec.specialRules ?? []).slice(0, 2),
    ],
    visualState: {
      fillPercent: fill,
      wallState: aperture.apertureWall?.state ?? '未知',
      tint: getTint(physiqueType),
      description: `${physiqueType}空窍${pressureLevel === 'stable' ? '暂稳' : pressureLevel === 'strained' ? '高压震荡' : '濒临失控'}，安全回合估计 ${safeTurnsEstimate}。`,
    },
    blockedActions,
    warnings,
  };
}
