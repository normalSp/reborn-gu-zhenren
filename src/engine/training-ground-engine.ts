import { createSeededRng } from './combat-formulas';

export interface TrainingGroundSpec {
  id: string;
  name: string;
  domain: string;
  chapterRequired?: string;
  pathType: string;
  type: string;
  tier: number;
  baseYield: number;
  costCurrency: number;
  costImmortalCurrency: number;
  cooldownTurns: number;
  immortalOnly: boolean;
  minRealm?: number;
  failureChance: number;
  failureEffect: string;
  description: string;
}

export interface TrainingGroundContext {
  realmGrand: number;
  isImmortal: boolean;
  currentChapterId?: string;
  primaryPath?: string;
  secondaryPaths?: string[];
  cooldowns?: Record<string, number>;
  turn: number;
  aptitude?: number;
  currency: number;
  immortalCurrency: number;
}

export interface TrainingGroundRuntime {
  poolSeed: number;
  refreshCost: number;
}

export interface TrainingGroundRefreshResolution {
  success: boolean;
  message: string;
  cost: number;
  nextRuntime: TrainingGroundRuntime;
  currencyPatch: { currency?: number; immortalCurrency?: number };
}

export interface TrainingGroundSessionResolution {
  success: boolean;
  message: string;
  cost: number;
  daoMarkGain: number;
  pathType?: string;
  cooldownUntil?: number;
  nextCooldowns: Record<string, number>;
  failureEffect?: string;
  currencyPatch: { currency?: number; immortalCurrency?: number };
  steps: Array<{ kind: string; message: string; metadata?: Record<string, unknown> }>;
}

export function createDefaultTrainingGroundRuntime(isImmortal: boolean, turn = 1): TrainingGroundRuntime {
  return {
    poolSeed: turn,
    refreshCost: isImmortal ? 500 : 200,
  };
}

export function listAvailableTrainingGrounds(grounds: TrainingGroundSpec[], context: TrainingGroundContext): TrainingGroundSpec[] {
  return grounds.filter(ground => {
    if (ground.immortalOnly && !context.isImmortal) return false;
    if (Number.isFinite(ground.minRealm) && context.realmGrand < Number(ground.minRealm)) return false;
    if (ground.chapterRequired && context.currentChapterId && ground.chapterRequired !== context.currentChapterId) return false;
    const cooldownUntil = context.cooldowns?.[ground.id] || 0;
    if (cooldownUntil > context.turn) return false;
    return true;
  });
}

function weightedPick(grounds: TrainingGroundSpec[], context: TrainingGroundContext, seed: string | number, count = 3): TrainingGroundSpec[] {
  const rng = createSeededRng(seed);
  const pool = grounds.map(ground => {
    let weight = 1;
    if (ground.pathType === context.primaryPath) weight = 2;
    else if ((context.secondaryPaths || []).includes(ground.pathType)) weight = 1.5;
    return { ground, weight, roll: rng.next() };
  });
  return pool
    .sort((a, b) => (b.weight + b.roll) - (a.weight + a.roll))
    .slice(0, Math.min(count, pool.length))
    .map(item => item.ground);
}

export function pickTrainingGrounds(
  grounds: TrainingGroundSpec[],
  context: TrainingGroundContext,
  runtime: TrainingGroundRuntime,
): TrainingGroundSpec[] {
  return weightedPick(listAvailableTrainingGrounds(grounds, context), context, `${runtime.poolSeed}:${context.turn}`);
}

export function resolveTrainingGroundRefresh(
  context: TrainingGroundContext,
  runtime: TrainingGroundRuntime,
): TrainingGroundRefreshResolution {
  const balance = context.isImmortal ? context.immortalCurrency : context.currency;
  const cost = Math.max(0, Math.round(runtime.refreshCost));
  if (balance < cost) {
    return {
      success: false,
      message: `${context.isImmortal ? '仙元石' : '元石'}不足，无法刷新道场候选。`,
      cost,
      nextRuntime: runtime,
      currencyPatch: {},
    };
  }
  const nextRuntime = {
    poolSeed: runtime.poolSeed + 1,
    refreshCost: Math.min(4000, cost * 2),
  };
  return {
    success: true,
    message: `道场候选已刷新，消耗${cost}${context.isImmortal ? '仙元石' : '元石'}。`,
    cost,
    nextRuntime,
    currencyPatch: context.isImmortal
      ? { immortalCurrency: context.immortalCurrency - cost }
      : { currency: context.currency - cost },
  };
}

export function resolveTrainingGroundSession(
  context: TrainingGroundContext,
  ground: TrainingGroundSpec,
  seed: string | number,
): TrainingGroundSessionResolution {
  const cost = context.isImmortal ? ground.costImmortalCurrency : ground.costCurrency;
  const balance = context.isImmortal ? context.immortalCurrency : context.currency;
  const nextCooldowns = {
    ...(context.cooldowns || {}),
    [ground.id]: context.turn + Math.max(1, ground.cooldownTurns || 1),
  };
  const steps: TrainingGroundSessionResolution['steps'] = [
    { kind: 'training_start', message: `进入${ground.name}，校验${ground.pathType}训练。`, metadata: { groundId: ground.id } },
  ];
  if (balance < cost) {
    return {
      success: false,
      message: `${context.isImmortal ? '仙元石' : '元石'}不足，无法进入${ground.name}。`,
      cost,
      daoMarkGain: 0,
      nextCooldowns: context.cooldowns || {},
      currencyPatch: {},
      steps: [...steps, { kind: 'failure', message: '训练被资源门槛阻断。' }],
    };
  }

  const rng = createSeededRng(seed);
  const failed = rng.next() < Math.max(0, Math.min(0.95, ground.failureChance || 0));
  const currencyPatch = context.isImmortal
    ? { immortalCurrency: context.immortalCurrency - cost }
    : { currency: context.currency - cost };
  if (failed) {
    return {
      success: false,
      message: `修炼失败：${ground.failureEffect || '气机紊乱'}`,
      cost,
      daoMarkGain: 0,
      pathType: ground.pathType,
      cooldownUntil: nextCooldowns[ground.id],
      nextCooldowns,
      failureEffect: ground.failureEffect,
      currencyPatch,
      steps: [
        ...steps,
        { kind: 'resource_spend', message: `消耗${cost}${context.isImmortal ? '仙元石' : '元石'}。` },
        { kind: 'failure', message: `修炼失败：${ground.failureEffect || '气机紊乱'}` },
      ],
    };
  }

  const daoBonus = ground.pathType === context.primaryPath
    ? 0.3
    : (context.secondaryPaths || []).includes(ground.pathType)
      ? 0.15
      : 0;
  const aptitude = Number.isFinite(context.aptitude) ? Math.max(1, Number(context.aptitude)) : 5;
  const daoMarkGain = Math.max(1, Math.floor(ground.baseYield * (1 + aptitude / 20) * (1 + daoBonus)));

  return {
    success: true,
    message: `修炼成功：${ground.pathType}道痕 +${daoMarkGain}`,
    cost,
    daoMarkGain,
    pathType: ground.pathType,
    cooldownUntil: nextCooldowns[ground.id],
    nextCooldowns,
    currencyPatch,
    steps: [
      ...steps,
      { kind: 'resource_spend', message: `消耗${cost}${context.isImmortal ? '仙元石' : '元石'}。` },
      { kind: 'dao_mark_gain', message: `${ground.pathType}道痕 +${daoMarkGain}`, metadata: { pathType: ground.pathType, amount: daoMarkGain } },
      { kind: 'cooldown', message: `${ground.name}冷却至第${nextCooldowns[ground.id]}回。` },
    ],
  };
}
