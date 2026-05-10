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
  createBattlefieldGroupCombatState,
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
  group_mode_required: '需要群像战模式',
  no_adjacent_ally_to_guard: '需要相邻队友或目标',
  no_ally_to_assist: '需要可援助的队友',
  no_formation_cell: '射程内没有阵位格',
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
  return state.units.find(unit => unit.id === state.activeUnitId && unit.hp > 0)
    ?? state.units.find(unit => unit.id === preferredId && unit.hp > 0)
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

export function createBattlefieldGroupDemoState(source: BattlefieldDemoSource = {}): BattlefieldCombatState {
  const primaryPath = source.pathBuild?.primary || source.primaryPath || '月道';
  const daoMarks = source.pathBuild?.dao_marks || source.daoMarks || { [primaryPath]: 80 };
  const guNames = extractNormalCombatGuNames(source);
  const killerMoveNames = extractKillerMoveNames(source, guNames);
  const playerName = source.profile?.name || '演武蛊师';
  const realmNum = Math.max(2, Math.min(5, Number(source.profile?.realm?.grand || 3)));
  const healthMax = Number(source.vitals?.health?.max || 180);
  const healthCurrent = Number(source.vitals?.health?.current || healthMax);
  const essenceMax = Number(source.vitals?.essence?.max || 100);
  const essenceCurrent = Number(source.vitals?.essence?.current || essenceMax);

  return createBattlefieldGroupCombatState({
    battleId: `v080_b1_group_demo_${Date.now()}`,
    seed: 'v080-b1-group-battlefield-demo',
    activeTerrainId: 'dense_forest',
    activeFormationId: 'neutral_array_node',
    activeUnitId: 'player',
    morale: { player: 62, enemy: 58, neutral: 50 },
    ambush: {
      side: 'enemy',
      revealed: false,
      openingResolved: false,
      hiddenUnitIds: ['enemy_ambusher'],
      scoutDifficulty: 60,
    },
    thirdParties: [{
      id: 'tie_patrol',
      unitIds: ['third_tie_patrol'],
      entryRound: 2,
      entered: false,
      stance: 'attack_high_threat',
    }],
    objectives: [
      {
        id: 'protect_merchant',
        type: 'protect',
        label: '护住商队账房',
        status: 'active',
        unitId: 'merchant',
      },
      {
        id: 'escort_merchant',
        type: 'escort',
        label: '护送账房抵达边缘格',
        status: 'active',
        unitId: 'merchant',
        requiredEdge: true,
      },
      {
        id: 'defeat_enemy_leader',
        type: 'defeat_key',
        label: '击破伏击头目',
        status: 'active',
        targetUnitId: 'enemy_leader',
      },
    ],
    cells: [
      { id: 'c1_0', flags: ['cover'] },
      { id: 'c2_0', flags: ['dao_field'], daoFieldPath: primaryPath },
      { id: 'c2_1', flags: ['array_node'] },
      { id: 'c3_1', flags: ['concealment'] },
      { id: 'c2_2', flags: ['hazard'], dangerTags: ['unstable_primeval_tide'] },
      { id: 'c4_2', flags: ['concealment'] },
    ],
    units: [
      {
        id: 'player',
        name: playerName,
        side: 'player',
        role: 'leader',
        cellId: 'c1_1',
        realmNum,
        path: primaryPath,
        hp: Math.max(1, Math.min(healthCurrent, healthMax)),
        maxHp: healthMax,
        attack: 36 + realmNum * 5,
        defense: 20 + realmNum * 3,
        accuracy: 76,
        evasion: 18,
        daoMarks,
        morale: 62,
        threat: 62,
        revealed: true,
        essence: { current: essenceCurrent, max: essenceMax, type: 'primeval' },
        guNames,
        killerMoveNames,
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['command'],
        intent: '群像战演武主控单位，负责蛊虫、阵位和士气抉择',
      },
      {
        id: 'ally_guard',
        name: '护阵弟子',
        side: 'ally',
        role: 'guard',
        cellId: 'c0_1',
        realmNum: Math.max(1, realmNum - 1),
        path: '木道',
        hp: 118,
        maxHp: 130,
        attack: 24,
        defense: 22,
        accuracy: 68,
        evasion: 14,
        daoMarks: { 木道: 38 },
        morale: 60,
        threat: 36,
        revealed: true,
        essence: { current: 78, max: 90, type: 'primeval' },
        guNames: ['青丝蛊', '种蛊', '治愈蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '贴身守护与牵制',
      },
      {
        id: 'merchant',
        name: '商队账房',
        side: 'ally',
        role: 'objective',
        cellId: 'c0_2',
        realmNum: 1,
        path: '信道',
        hp: 54,
        maxHp: 60,
        attack: 8,
        defense: 8,
        accuracy: 48,
        evasion: 8,
        daoMarks: 0,
        morale: 48,
        threat: 80,
        revealed: true,
        essence: { current: 20, max: 30, type: 'primeval' },
        guNames: [],
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['protect', 'escort'],
        intent: '保护/护送目标',
      },
      {
        id: 'enemy_leader',
        name: '伏击头目',
        side: 'enemy',
        role: 'leader',
        cellId: 'c4_1',
        realmNum: Math.max(2, realmNum),
        path: '土道',
        hp: 160,
        maxHp: 160,
        attack: 38,
        defense: 24,
        accuracy: 72,
        evasion: 14,
        daoMarks: { 土道: 62, 雷道: 22 },
        morale: 58,
        threat: 72,
        revealed: true,
        essence: { current: 96, max: 100, type: 'primeval' },
        guNames: DEMO_ENEMY_GU_NAMES.filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['key_enemy'],
        intent: '压制阵位并逼迫撤退',
      },
      {
        id: 'enemy_ambusher',
        name: '林中暗手',
        side: 'enemy',
        role: 'scout',
        cellId: 'c3_1',
        realmNum: Math.max(2, realmNum - 1),
        path: '暗道',
        hp: 92,
        maxHp: 100,
        attack: 30,
        defense: 14,
        accuracy: 74,
        evasion: 24,
        daoMarks: { 暗道: 44 },
        morale: 58,
        threat: 46,
        revealed: false,
        essence: { current: 76, max: 90, type: 'primeval' },
        guNames: ['幽影随行蛊', '破风蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '未侦察时获得伏击先手',
      },
      {
        id: 'third_tie_patrol',
        name: '铁家巡使',
        side: 'neutral',
        role: 'third_party',
        cellId: 'c4_2',
        realmNum: 3,
        path: '金道',
        hp: 120,
        maxHp: 120,
        attack: 32,
        defense: 22,
        accuracy: 70,
        evasion: 16,
        daoMarks: { 金道: 48 },
        morale: 50,
        threat: 54,
        revealed: false,
        essence: { current: 90, max: 90, type: 'primeval' },
        guNames: ['金钟蛊', '金缕衣蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '第二回合按本地规则介入，优先压制高威胁方',
      },
    ],
  });
}

export function createBattlefieldLargeGroupDemoState(source: BattlefieldDemoSource = {}): BattlefieldCombatState {
  const primaryPath = source.pathBuild?.primary || source.primaryPath || '月道';
  const daoMarks = source.pathBuild?.dao_marks || source.daoMarks || { [primaryPath]: 90 };
  const guNames = extractNormalCombatGuNames(source);
  const killerMoveNames = extractKillerMoveNames(source, guNames);
  const playerName = source.profile?.name || '演武蛊师';
  const realmNum = Math.max(2, Math.min(5, Number(source.profile?.realm?.grand || 3)));
  const healthMax = Number(source.vitals?.health?.max || 190);
  const healthCurrent = Number(source.vitals?.health?.current || healthMax);
  const essenceMax = Number(source.vitals?.essence?.max || 110);
  const essenceCurrent = Number(source.vitals?.essence?.current || essenceMax);

  return createBattlefieldGroupCombatState({
    battleId: `v080_b11_large_group_demo_${Date.now()}`,
    seed: 'v080-b11-large-group-battlefield-demo',
    gridPresetId: 'ambush_7x5',
    activeTerrainId: 'mountain_pass',
    activeFormationId: 'valley_neutral_array_nodes',
    activeUnitId: 'player',
    morale: { player: 64, enemy: 60, neutral: 50 },
    ambush: {
      side: 'enemy',
      revealed: false,
      openingResolved: false,
      hiddenUnitIds: ['enemy_shadow_1', 'enemy_shadow_2'],
      scoutDifficulty: 68,
    },
    thirdParties: [{
      id: 'tie_valley_patrol',
      unitIds: ['third_tie_patrol'],
      entryRound: 2,
      entered: false,
      stance: 'attack_high_threat',
    }],
    objectives: [
      {
        id: 'protect_merchant',
        type: 'protect',
        label: '护住商队账房',
        status: 'active',
        unitId: 'merchant',
      },
      {
        id: 'escort_merchant_to_exit',
        type: 'escort',
        label: '护送账房抵达左翼溪岸出口',
        status: 'active',
        unitId: 'merchant',
        cellId: 'c0_3',
        requiredEdge: true,
      },
      {
        id: 'defeat_enemy_leader',
        type: 'defeat_key',
        label: '击破山谷伏击头目',
        status: 'active',
        targetUnitId: 'enemy_leader',
      },
    ],
    cells: [
      { id: 'c2_1', flags: ['dao_field', 'midline'], daoFieldPath: primaryPath },
      { id: 'c3_1', flags: ['array_node', 'midline'], daoFieldPath: primaryPath },
      { id: 'c2_2', flags: ['array_node', 'midline'] },
      { id: 'c3_3', flags: ['array_node', 'midline'] },
    ],
    units: [
      {
        id: 'player',
        name: playerName,
        side: 'player',
        role: 'leader',
        cellId: 'c1_2',
        realmNum,
        path: primaryPath,
        hp: Math.max(1, Math.min(healthCurrent, healthMax)),
        maxHp: healthMax,
        attack: 38 + realmNum * 5,
        defense: 22 + realmNum * 3,
        accuracy: 78,
        evasion: 19,
        daoMarks,
        morale: 64,
        threat: 70,
        revealed: true,
        essence: { current: essenceCurrent, max: essenceMax, type: 'primeval' },
        guNames,
        killerMoveNames,
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['command'],
        intent: '大棋盘群像战主控单位，负责蛊虫、阵位和士气抉择',
      },
      {
        id: 'ally_guard',
        name: '护阵弟子',
        side: 'ally',
        role: 'guard',
        cellId: 'c1_4',
        realmNum: Math.max(1, realmNum - 1),
        path: '木道',
        hp: 124,
        maxHp: 132,
        attack: 25,
        defense: 24,
        accuracy: 68,
        evasion: 14,
        daoMarks: { 木道: 40 },
        morale: 62,
        threat: 38,
        revealed: true,
        essence: { current: 80, max: 90, type: 'primeval' },
        guNames: ['青丝蛊', '种蛊', '治愈蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '守住护送目标并承接 guard 行动',
      },
      {
        id: 'ally_scout',
        name: '巡夜斥候',
        side: 'ally',
        role: 'scout',
        cellId: 'c2_1',
        realmNum: Math.max(1, realmNum - 1),
        path: '信道',
        hp: 86,
        maxHp: 96,
        attack: 20,
        defense: 14,
        accuracy: 72,
        evasion: 24,
        daoMarks: { 信道: 34, 暗道: 18 },
        morale: 60,
        threat: 34,
        revealed: true,
        essence: { current: 72, max: 80, type: 'primeval' },
        guNames: ['侦察蛊', '追踪蛊', '巡夜蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '在 7x5 棋盘中负责观察、揭示伏击和第三方动向',
      },
      {
        id: 'merchant',
        name: '商队账房',
        side: 'ally',
        role: 'objective',
        cellId: 'c1_3',
        realmNum: 1,
        path: '信道',
        hp: 58,
        maxHp: 64,
        attack: 8,
        defense: 8,
        accuracy: 48,
        evasion: 8,
        daoMarks: 0,
        morale: 48,
        threat: 86,
        revealed: true,
        essence: { current: 22, max: 30, type: 'primeval' },
        guNames: [],
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['protect', 'escort'],
        intent: '必须护送到 c0_3 的指定边缘格',
      },
      {
        id: 'enemy_leader',
        name: '山谷伏击头目',
        side: 'enemy',
        role: 'leader',
        cellId: 'c5_2',
        realmNum: Math.max(2, realmNum),
        path: '土道',
        hp: 170,
        maxHp: 170,
        attack: 40,
        defense: 26,
        accuracy: 73,
        evasion: 15,
        daoMarks: { 土道: 68, 雷道: 24 },
        morale: 60,
        threat: 76,
        revealed: true,
        essence: { current: 100, max: 110, type: 'primeval' },
        guNames: DEMO_ENEMY_GU_NAMES.filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        objectiveTags: ['key_enemy'],
        intent: '压住前线并争夺山谷阵位',
      },
      {
        id: 'enemy_array_holder',
        name: '阵位副手',
        side: 'enemy',
        role: 'support',
        cellId: 'c4_3',
        realmNum: Math.max(2, realmNum - 1),
        path: '土道',
        hp: 118,
        maxHp: 128,
        attack: 28,
        defense: 22,
        accuracy: 68,
        evasion: 14,
        daoMarks: { 土道: 42 },
        morale: 58,
        threat: 52,
        revealed: true,
        essence: { current: 82, max: 90, type: 'primeval' },
        guNames: ['岩枪蛊', '石皮蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '争夺多个阵位节点并支援头目',
      },
      {
        id: 'enemy_shadow_1',
        name: '林中暗手',
        side: 'enemy',
        role: 'scout',
        cellId: 'c4_1',
        realmNum: Math.max(2, realmNum - 1),
        path: '暗道',
        hp: 94,
        maxHp: 104,
        attack: 31,
        defense: 14,
        accuracy: 74,
        evasion: 26,
        daoMarks: { 暗道: 48 },
        morale: 60,
        threat: 48,
        revealed: false,
        essence: { current: 78, max: 90, type: 'primeval' },
        guNames: ['幽影随行蛊', '破风蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '未被观察时制造伏击先手',
      },
      {
        id: 'enemy_shadow_2',
        name: '溪岸伏兵',
        side: 'enemy',
        role: 'vanguard',
        cellId: 'c5_3',
        realmNum: Math.max(2, realmNum - 1),
        path: '暗道',
        hp: 102,
        maxHp: 108,
        attack: 32,
        defense: 16,
        accuracy: 72,
        evasion: 22,
        daoMarks: { 暗道: 36, 风道: 18 },
        morale: 60,
        threat: 50,
        revealed: false,
        essence: { current: 78, max: 88, type: 'primeval' },
        guNames: ['破风蛊', '力气蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '从前线林地切断护送路线',
      },
      {
        id: 'third_tie_patrol',
        name: '铁家巡使',
        side: 'neutral',
        role: 'third_party',
        cellId: 'c6_0',
        realmNum: 3,
        path: '金道',
        hp: 128,
        maxHp: 128,
        attack: 34,
        defense: 24,
        accuracy: 70,
        evasion: 16,
        daoMarks: { 金道: 52 },
        morale: 50,
        threat: 58,
        revealed: false,
        essence: { current: 92, max: 92, type: 'primeval' },
        guNames: ['金钟蛊', '金缕衣蛊'].filter(isGuNormalCombatUsable),
        killerMoveNames: [],
        cooldowns: {},
        statusEffects: [],
        intent: '第二回合从入场点介入，按威胁选择目标',
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
    const action: BattlefieldAction = { type: 'observe', actorId: actor.id };
    const validation = listBattlefieldActionTargets(state, action);
    return [{
      id: 'observe:intel',
      tab,
      label: '观察战场',
      action: state.mode === 'group' ? action : null,
      validation: state.mode === 'group' ? validation : null,
      costText: '无消耗',
      cooldownText: '即时',
      counters: state.mode === 'group' ? ['会消耗当前单位行动', '可揭示伏击/遮蔽/第三方动向'] : ['不推进结算'],
      sceneUtilities: ['查看地形', '查看状态', '确认目标', '揭示伏击'],
      visualTint: '#4B6E8B',
      uniqueness: state.mode === 'group'
        ? '观察由本地引擎揭示隐藏单位、危险格和第三方动向，不直接造成伤害'
        : '观察只展示本地状态，不产生战斗结果',
    }];
  }

  if (tab === 'formation' && state.mode === 'group') {
    const groupActions: Array<{ id: string; label: string; action: BattlefieldAction; tint: string; text: string }> = [
      {
        id: 'formation:guard',
        label: '援护',
        action: { type: 'guard', actorId: actor.id },
        tint: '#5C8B7A',
        text: '守护相邻队友或护送目标，下一次受击由本地引擎减伤并输出 guard 轨迹',
      },
      {
        id: 'formation:assist',
        label: '协攻',
        action: { type: 'assist', actorId: actor.id },
        tint: '#C9A96E',
        text: '援助队友下一次蛊虫或杀招行动，提供命中和伤害加成',
      },
      {
        id: 'formation:rally',
        label: '振奋士气',
        action: { type: 'rally', actorId: actor.id },
        tint: '#C9A96E',
        text: '消耗行动恢复己方士气，缓解低士气命中惩罚',
      },
      {
        id: 'formation:node',
        label: '争夺阵位',
        action: { type: 'formation', actorId: actor.id },
        tint: '#8B6F3A',
        text: '在阵位格建立、争夺或破坏阵位控制，输出 formation 轨迹',
      },
    ];
    return groupActions.map(item => {
      const targets = listBattlefieldActionTargets(state, item.action);
      const validation = validateAnyTarget(state, item.action, targets, actor);
      return {
        id: item.id,
        tab,
        label: item.label,
        action: item.action,
        validation: targets,
        disabledReason: validation.ok ? undefined : describeBattlefieldReason(validation.reason),
        path: 'group',
        shape: item.action.type,
        costText: '无消耗',
        cooldownText: '1回合',
        counters: ['占位、士气和目标状态均由本地引擎结算'],
        sceneUtilities: ['阵位', '援护', '士气', '群像战'],
        visualTint: item.tint,
        uniqueness: item.text,
      };
    });
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
