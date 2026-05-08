import affinitiesRaw from '../canon/extreme-physique-daomark-affinity.json';
import type { ExtremePhysiqueType } from '../types';

type AffinitySpec = {
  primaryPaths?: Record<string, number>;
  forbiddenPaths?: string[];
  backlashPaths?: Record<string, number>;
};

export interface ExtremePhysiqueSquadNotice {
  physiqueType: ExtremePhysiqueType;
  slotPressure: string;
  favoredPaths: string[];
  forbiddenPaths: string[];
  backlashPaths: string[];
  memberWarnings: string[];
}

const AFFINITIES = affinitiesRaw as Record<ExtremePhysiqueType, AffinitySpec>;

export function buildExtremePhysiqueSquadNotice(
  aperture: any,
  memberPaths: string[],
): ExtremePhysiqueSquadNotice | null {
  if (!aperture || aperture.type !== 'mortal' || !aperture.extremePhysiqueType || !aperture.capacityLocked) {
    return null;
  }

  const physiqueType = aperture.extremePhysiqueType as ExtremePhysiqueType;
  const spec = AFFINITIES[physiqueType];
  if (!spec) return null;

  const forbidden = new Set(spec.forbiddenPaths ?? []);
  const backlash = new Set(Object.keys(spec.backlashPaths ?? {}));
  const uniqueMemberPaths = Array.from(new Set(memberPaths.filter(Boolean)));
  const memberWarnings = uniqueMemberPaths
    .filter(path => forbidden.has(path) || backlash.has(path))
    .map(path => {
      if (forbidden.has(path)) return `${path}与${physiqueType}空窍禁制冲突，小队战中应提示不可强行长期承载。`;
      return `${path}与${physiqueType}存在反噬倾向，小队战使用时需承受生命/真元压力。`;
    });

  return {
    physiqueType,
    slotPressure: '十绝体凡窍高压迫：可稳定携带蛊虫极少，战前换蛊与强行承载会消耗生命，HP低于5%时应阻止操作。',
    favoredPaths: Object.keys(spec.primaryPaths ?? {}),
    forbiddenPaths: spec.forbiddenPaths ?? [],
    backlashPaths: Object.keys(spec.backlashPaths ?? {}),
    memberWarnings,
  };
}
