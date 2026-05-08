import dispatchTasksRaw from '../canon/squad-dispatch-tasks.json';
import type { SquadMember } from '../types';
import { isRuntimePathAllowed } from './path-registry';

export type DispatchRisk = 'low' | 'medium' | 'high';

export interface SquadDispatchTask {
  id: string;
  name: string;
  durationTurns: number;
  risk: DispatchRisk;
  requiredTrust: number;
  preferredPaths: string[];
  rewardTags: string[];
  baseSuccess: number;
  failureCost: {
    morale?: number;
    trust?: number;
    reputation?: number;
    yuanStone?: number;
  };
  successReward: {
    yuanStone?: number;
    materials?: number;
    rumors?: number;
    reputation?: number;
    relationship?: number;
  };
}

export interface DispatchEvaluation {
  taskId: string;
  memberId: string;
  canDispatch: boolean;
  successChance: number;
  reasons: string[];
  risk: DispatchRisk;
  durationTurns: number;
}

export interface DispatchOutcome {
  taskId: string;
  memberId: string;
  success: boolean;
  roll: number;
  successChance: number;
  rewards: SquadDispatchTask['successReward'];
  costs: SquadDispatchTask['failureCost'];
  relationDelta: {
    trust: number;
    morale: number;
    reputation: number;
  };
  generatedRumor?: string;
}

const TASKS = ((dispatchTasksRaw as any).tasks || []) as SquadDispatchTask[];
const TASK_BY_ID = new Map(TASKS.map(task => [task.id, task]));

function stableScore(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash / 0xffffffff;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function listSquadDispatchTasks(): SquadDispatchTask[] {
  return TASKS;
}

export function getSquadDispatchTask(taskId: string): SquadDispatchTask | undefined {
  return TASK_BY_ID.get(taskId);
}

export function evaluateSquadDispatch(
  member: SquadMember,
  taskId: string,
  context: { morale?: number; turn?: number } = {},
): DispatchEvaluation {
  const task = getSquadDispatchTask(taskId);
  if (!task) {
    return {
      taskId,
      memberId: member.id,
      canDispatch: false,
      successChance: 0,
      reasons: [`未知外派任务 ${taskId}`],
      risk: 'high',
      durationTurns: 0,
    };
  }

  const reasons: string[] = [];
  if (!member.alive) reasons.push('成员已阵亡');
  if ((member.adventureTrust ?? 0) < task.requiredTrust) {
    reasons.push(`信任不足，需要 ${task.requiredTrust}`);
  }
  if (member.path && !isRuntimePathAllowed(member.path)) {
    reasons.push(`${member.path} 不是运行时确认流派，不能作为外派优势`);
  }

  const trustFactor = ((member.adventureTrust ?? 50) - task.requiredTrust) / 160;
  const interestFactor = ((member.interestDrive ?? 40) - 40) / 300;
  const moraleFactor = ((context.morale ?? 50) - 50) / 500;
  const pathBonus = member.path && task.preferredPaths.includes(member.path) && isRuntimePathAllowed(member.path)
    ? 0.08
    : 0;
  const riskPenalty = task.risk === 'high' ? -0.06 : task.risk === 'medium' ? -0.03 : 0;
  const successChance = clamp01(task.baseSuccess + trustFactor + interestFactor + moraleFactor + pathBonus + riskPenalty);

  return {
    taskId,
    memberId: member.id,
    canDispatch: reasons.length === 0,
    successChance: Math.round(successChance * 100) / 100,
    reasons,
    risk: task.risk,
    durationTurns: task.durationTurns,
  };
}

export function resolveSquadDispatchOutcome(
  member: SquadMember,
  taskId: string,
  seed: string,
  context: { morale?: number; turn?: number; location?: string } = {},
): DispatchOutcome {
  const task = getSquadDispatchTask(taskId);
  if (!task) throw new Error(`Unknown squad dispatch task: ${taskId}`);

  const evaluation = evaluateSquadDispatch(member, taskId, context);
  const roll = Math.round(stableScore(`${seed}:${member.id}:${taskId}:${context.turn ?? 0}`) * 100) / 100;
  const success = evaluation.canDispatch && roll <= evaluation.successChance;

  return {
    taskId,
    memberId: member.id,
    success,
    roll,
    successChance: evaluation.successChance,
    rewards: success ? { ...task.successReward } : {},
    costs: success ? {} : { ...task.failureCost },
    relationDelta: {
      trust: success ? 2 : -(task.failureCost.trust ?? 0),
      morale: success ? 2 : -(task.failureCost.morale ?? 0),
      reputation: success ? (task.successReward.reputation ?? 0) : -(task.failureCost.reputation ?? 0),
    },
    generatedRumor: success && task.successReward.rumors
      ? `${member.name}在${context.location || task.name}外派中带回了${task.name}线索。`
      : undefined,
  };
}
