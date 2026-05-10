import type {
  BattleResolutionStep,
  BattlefieldAction,
  BattlefieldActionType,
  BattlefieldActionValidation,
  BattlefieldCell,
  BattlefieldCombatState,
  BattlefieldUnit,
  GuExpressionSpec,
  KillerMoveExpressionSpec,
} from '../types';
import {
  createBattlefieldCombatState,
  listBattlefieldActionTargets,
  validateBattlefieldAction,
} from './v080-battlefield-combat-engine';
import {
  getGuExpressionSpec,
  getKillerMoveExpressionSpec,
  isGuNormalCombatUsable,
  listKillerMoveExpressionSpecs,
} from './gu-expression-registry';

export type BattlefieldActionTab = 'gu' | 'killer_move' | 'formation' | 'movement' | 'observe' | 'retreat';

export interface BattlefieldActionCard {
  id: string;
  tab: BattlefieldActionTab;
  label: string;
  action: BattlefieldAction | null;
  validation: BattlefieldActionValidation | null;
  disabledReason?: string;
  path?: string;
  shape?: string;
  costText: string;
  cooldownText: string;
  counters: string[];
  sceneUtilities: string[];
  visualTint: string;
  uniqueness: string;
}

export interface BattlefieldDemoSource {
  profile?: {
    name?: string;
    realm?: { grand?: number; label?: string };
  };
  vitals?: {
    health?: { current?: number; max?: number };
    essence?: { current?: number; max?: number };
  };
  pathBuild?: {
    primary?: string;
    dao_marks?: Record<string, number>;
  };
  primaryPath?: string | null;
  daoMarks?: Record<string, number>;
  inventory?: Array<{ name?: string; guName?: string; path?: string; tier?: number }>;
  apertureInventory?: {
    gu?: Array<{ name?: string; guName?: string; path?: string; tier?: number }>;
  };
  killMoves?: Array<{ name?: string }>;
}

const DEMO_GU_NAMES = [
  '月光蛊',
  '小光蛊',
  '月芒蛊',
  '石皮蛊',
  '岩枪蛊',
  '青丝蛊',
  '种蛊',
  '力气蛊',
  '水龙蛊',
  '破风蛊',
  '净水蛊',
  '金钟蛊',
  '金罡蛊',
  '治愈蛊',
  '金风送爽蛊',
];

const DEMO_ENEMY_GU_NAMES = ['岩枪蛊', '石皮蛊', '春雷蛊', '力气蛊'];

const DEMO_KILLER_MOVES = ['月刃连斩', '石皮护体', '木灵缠绕', '水龙卷', '金钟不破'];

const REASON_TEXT: Record<string, string> = {
  actor_not_found_or_defeated: '行动者已失去战力',
  battle_already_ended: '战斗已经结算',
  missing_target: '需要先指定目标格',
  target_out_of_bounds: '目标格不在棋盘内',
  target_out_of_range: '目标超出射程',
  target_cell_occupied: '目标格已被占据',
  line_of_sight_blocked: '路径被遮蔽阻断',
  gu_not_found: '蛊虫未登记',
  gu_not_owned: '当前单位未持有此蛊',
  passive_gu_not_active_action: '被动蛊不能主动发动',
  scene_gate_required: '需要强场景门槛',
  gu_not_normal_combat_usable: '非普通凡战行动',
  cooldown_active: '冷却尚未结束',
  insufficient_essence: '真元不足',
  missing_target_unit: '射程内没有可作用单位',
  killer_move_not_found: '杀招未登记',
  killer_move_not_learned: '尚未学会此杀招',
  unsupported_action: '当前行动暂未接入',
  retreat_failed: '撤退失败',
};

export function describeBattlefieldReason(reason?: string): string {
  if (!reason) return '';
  if (reason.startsWith('missing_core_gu:')) return `缺少核心蛊：${reason.split(':')[1]}`;
  if (reason.startsWith('missing_auxiliary_gu:')) return `缺少辅助蛊：${reason.split(':')[1]}`;
  return REASON_TEXT[reason] ?? reason;
}

export function formatBattlefieldCost(cost?: { essencePct?: number; immortalEssence?: number; primevalStones?: number }): string {
  if (!cost) return '无消耗';
  const parts = [];
  if (cost.essencePct) parts.push(`真元 ${cost.essencePct}`);
  if (cost.immortalEssence) parts.push(`仙元 ${cost.immortalEssence}`);
  if (cost.primevalStones) parts.push(`元石 ${cost.primevalStones}`);
  return parts.length ? parts.join(' / ') : '无消耗';
}

export function getBattlefieldActor(state: BattlefieldCombatState, preferredId = 'player'): BattlefieldUnit | undefined {
  return state.units.find(unit => unit.id === preferredId && unit.hp > 0)
    ?? state.units.find(unit => (unit.side === 'player' || unit.side === 'ally') && unit.hp > 0);
}

export function extractNormalCombatGuNames(source: BattlefieldDemoSource): string[] {
  const names = new Set<string>();
  const addName = (name?: string) => {
    if (name && isGuNormalCombatUsable(name)) names.add(name);
  };
  for (const gu of source.inventory ?? []) addName(gu.name ?? gu.guName);
  for (const gu of source.apertureInventory?.gu ?? []) addName(gu.name ?? gu.guName);

  if (names.size < 3) {
    for (const guName of DEMO_GU_NAMES) addName(guName);
  }
  return [...names];
}

export function extractKillerMoveNames(source: BattlefieldDemoSource, guNames: string[]): string[] {
  const learned = new Set((source.killMoves ?? []).map(move => move.name).filter(Boolean) as string[]);
  const guSet = new Set(guNames);
  const usable = listKillerMoveExpressionSpecs()
    .filter(move => learned.has(move.moveName) || DEMO_KILLER_MOVES.includes(move.moveName))
    .filter(move => [...move.coreGu, ...move.auxiliaryGu].every(guName => guSet.has(guName)))
    .map(move => move.moveName);
  return usable.length ? usable : ['月刃连斩'];
}

export function createBattlefieldDemoState(source: BattlefieldDemoSource = {}): BattlefieldCombatState {
  const primaryPath = source.pathBuild?.primary || source.primaryPath || '月道';
  const daoMarks = source.pathBuild?.dao_marks || source.daoMarks || { [primaryPath]: 60 };
  const guNames = extractNormalCombatGuNames(source);
  const killerMoveNames = extractKillerMoveNames(source, guNames);
  const playerName = source.profile?.name || '演武蛊师';
  const realmNum = Math.max(1, Math.min(5, Number(source.profile?.realm?.grand || 3)));
  const healthMax = Number(source.vitals?.health?.max || 180);
  const healthCurrent = Number(source.vitals?.health?.current || healthMax);
  const essenceMax = Number(source.vitals?.essence?.max || 100);
  const essenceCurrent = Number(source.vitals?.essence?.current || essenceMax);

  return createBattlefieldCombatState({
    battleId: `v080_a2_demo_${Date.now()}`,
    seed: 'v080-a2-battlefield-demo',
    activeTerrainId: 'dense_forest',
    activeFormationId: 'defensive_screen',
    eventWindows: ['scout', 'action', 'counter', 'settlement'],
    cells: [
      { id: 'c1_0', flags: ['cover'] },
      { id: 'c2_0', flags: ['dao_field'], daoFieldPath: primaryPath },
      { id: 'c2_1', flags: ['array_node'] },
      { id: 'c4_0', flags: ['concealment'] },
      { id: 'c2_2', flags: ['hazard'], dangerTags: ['unstable_primeval_tide'] },
    ],
    units: [
      {
        id: 'player',
        name: playerName,
        side: 'player',
        cellId: 'c0_1',
        realmNum,
        path: primaryPath,
        hp: Math.max(1, Math.min(healthCurrent, healthMax)),
        maxHp: healthMax,
        attack: 34 + realmNum * 5,
        defense: 18 + realmNum * 3,
        accuracy: 74,
        evasion: 18,
        daoMarks,
        essence: { current: essenceCurrent, max: essenceMax, type: 'primeval' },
        guNames,
        killerMoveNames,
        cooldowns: {},
        statusEffects: [],
        intent: '以本地引擎演示凡战棋盘、射程与战斗轨迹',
      },
      {
        id: 'ally_shadow',
        name: '护阵弟子',
        side: 'ally',
        cellId: 'c0_2',
        realmNum: Math.max(1, realmNum - 1),
        path: '木道',
        hp: 92,
        maxHp: 120,
        attack: 24,
        defense: 16,
        accuracy: 68,
        evasion: 16,
        daoMarks: { 木道: 32 },
        essence: { current: 76, max: 90, type: 'primeval' },
        guNames: ['青丝蛊', '种蛊', '治愈蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '守住阵位并提供牵制',
      },
      {
        id: 'enemy_cultivator',
        name: '巡山蛊师',
        side: 'enemy',
        cellId: 'c3_1',
        realmNum: Math.max(2, realmNum),
        path: '土道',
        hp: 150,
        maxHp: 150,
        attack: 36,
        defense: 24,
        accuracy: 70,
        evasion: 14,
        daoMarks: { 土道: 58, 雷道: 22 },
        essence: { current: 96, max: 100, type: 'primeval' },
        guNames: DEMO_ENEMY_GU_NAMES.filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '以岩枪压制中线，伺机逼退',
      },
    ],
  });
}

function probeTargetForAction(action: BattlefieldAction, targets: BattlefieldActionValidation, actor: BattlefieldUnit): string | undefined {
  if (action.type === 'retreat' || action.type === 'wait') return undefined;
  if (targets.validTargetCellIds.includes(actor.cellId)) return actor.cellId;
  return targets.validTargetCellIds[0];
}

function validateAnyTarget(
  state: BattlefieldCombatState,
  action: BattlefieldAction,
  targets: BattlefieldActionValidation,
  actor: BattlefieldUnit,
): BattlefieldActionValidation {
  const preferred = probeTargetForAction(action, targets, actor);
  const candidates = [...new Set([preferred, ...targets.validTargetCellIds].filter(Boolean) as string[])];
  if (candidates.length === 0) return validateBattlefieldAction(state, action);
  let firstFailure: BattlefieldActionValidation | null = null;
  for (const targetCellId of candidates) {
    const validation = validateBattlefieldAction(state, { ...action, targetCellId });
    if (validation.ok) return validation;
    if (!firstFailure) firstFailure = validation;
  }
  return firstFailure ?? targets;
}

function cardFromGu(state: BattlefieldCombatState, actor: BattlefieldUnit, spec: GuExpressionSpec): BattlefieldActionCard {
  const baseAction: BattlefieldAction = { type: 'gu', actorId: actor.id, guName: spec.guName };
  const targets = listBattlefieldActionTargets(state, baseAction);
  const validation = validateAnyTarget(state, baseAction, targets, actor);
  return {
    id: `gu:${spec.guName}`,
    tab: 'gu',
    label: spec.guName,
    action: baseAction,
    validation: targets,
    disabledReason: validation.ok ? undefined : describeBattlefieldReason(validation.reason),
    path: spec.path,
    shape: spec.range.shape,
    costText: formatBattlefieldCost(spec.cost),
    cooldownText: spec.cooldown > 0 ? `${spec.cooldown}回合` : '无冷却',
    counters: spec.counters,
    sceneUtilities: spec.sceneUtilities,
    visualTint: spec.visualMotif.primaryTint,
    uniqueness: spec.uniqueness,
  };
}

function cardFromKillerMove(state: BattlefieldCombatState, actor: BattlefieldUnit, move: KillerMoveExpressionSpec): BattlefieldActionCard {
  const baseAction: BattlefieldAction = { type: 'killer_move', actorId: actor.id, killerMoveName: move.moveName };
  const targets = listBattlefieldActionTargets(state, baseAction);
  const validation = validateAnyTarget(state, baseAction, targets, actor);
  return {
    id: `killer:${move.moveName}`,
    tab: 'killer_move',
    label: move.moveName,
    action: baseAction,
    validation: targets,
    disabledReason: validation.ok ? undefined : describeBattlefieldReason(validation.reason),
    path: move.path,
    shape: move.boardPattern.shape,
    costText: formatBattlefieldCost(targets.resourceCost),
    cooldownText: `${Math.max(1, move.level)}回合`,
    counters: [move.failureMode, move.backlash].filter(Boolean),
    sceneUtilities: move.sceneUtilities,
    visualTint: '#C9A96E',
    uniqueness: move.opening,
  };
}

export function buildBattlefieldActionCards(
  state: BattlefieldCombatState,
  actorId: string,
  tab: BattlefieldActionTab,
): BattlefieldActionCard[] {
  const actor = state.units.find(unit => unit.id === actorId && unit.hp > 0);
  if (!actor) return [];

  if (tab === 'gu') {
    return actor.guNames
      .map(getGuExpressionSpec)
      .filter((spec): spec is GuExpressionSpec => !!spec && isGuNormalCombatUsable(spec))
      .map(spec => cardFromGu(state, actor, spec));
  }

  if (tab === 'killer_move') {
    return (actor.killerMoveNames ?? [])
      .map(getKillerMoveExpressionSpec)
      .filter((move): move is KillerMoveExpressionSpec => !!move)
      .map(move => cardFromKillerMove(state, actor, move));
  }

  if (tab === 'movement') {
    const action: BattlefieldAction = { type: 'move', actorId: actor.id };
    const validation = listBattlefieldActionTargets(state, action);
    return [{
      id: 'move:footwork',
      tab,
      label: '身法移步',
      action,
      validation,
      disabledReason: validation.validTargetCellIds.length ? undefined : '没有可移动格',
      costText: '无消耗',
      cooldownText: '即时',
      counters: ['进入危险格会触发地形伤害'],
      sceneUtilities: ['调整阵位', '脱离压制'],
      visualTint: '#7A8EA8',
      uniqueness: '按棋盘空格移动，所有占位与危险由本地引擎判定',
    }];
  }

  if (tab === 'retreat') {
    const action: BattlefieldAction = { type: 'retreat', actorId: actor.id };
    const validation = listBattlefieldActionTargets(state, action);
    return [{
      id: 'retreat:edge',
      tab,
      label: '撤出战场',
      action,
      validation,
      costText: '无消耗',
      cooldownText: '即时',
      counters: ['贴身敌人会降低成功率', '边缘格更利于撤退'],
      sceneUtilities: ['保命', '保留后续剧情压力'],
      visualTint: '#8B3A3A',
      uniqueness: '撤退成败由本地引擎按阵位、敌邻接和束缚状态结算',
    }];
  }

  if (tab === 'observe') {
    return [{
      id: 'observe:intel',
      tab,
      label: '观察战场',
      action: null,
      validation: null,
      costText: '无消耗',
      cooldownText: '即时',
      counters: ['不推进结算'],
      sceneUtilities: ['查看地形', '查看状态', '确认目标'],
      visualTint: '#4B6E8B',
      uniqueness: '观察只展示本地状态，不产生战斗结果',
    }];
  }

  return [{
    id: 'formation:array',
    tab,
    label: '阵位未成',
    action: null,
    validation: null,
    disabledReason: 'a2 只展示阵位与阵纹，不执行完整阵法',
    costText: '无消耗',
    cooldownText: '未接入',
    counters: ['破阵与布阵留到群像战斗阶段'],
    sceneUtilities: ['识别阵位', '识别道痕场'],
    visualTint: '#C9A96E',
    uniqueness: '棋盘已显示阵位格，完整阵法运行时在后续小版本接入',
  }];
}

export function buildCellClassTags(
  cell: BattlefieldCell,
  validation?: BattlefieldActionValidation | null,
  selectedCellId?: string | null,
): string[] {
  const tags = [...cell.flags];
  if (validation?.validTargetCellIds.includes(cell.id)) tags.push('valid_target' as any);
  if (validation?.affectedCellIds.includes(cell.id)) tags.push('affected' as any);
  if (selectedCellId === cell.id) tags.push('selected' as any);
  if (cell.occupantId) tags.push('occupied' as any);
  return tags as string[];
}

export function summarizeBattlefieldStep(step: BattleResolutionStep): string {
  const source = step.sourceName ? `【${step.sourceName}】` : '';
  const damage = typeof step.damage === 'number' ? ` 伤害${step.damage}` : '';
  const statuses = step.statusEffects?.length ? ` 状态:${step.statusEffects.join(',')}` : '';
  const blocked = step.blockedReason ? ` 原因:${describeBattlefieldReason(step.blockedReason)}` : '';
  return `${step.kind}${source} ${step.message}${damage}${statuses}${blocked}`.trim();
}
