/**
 * 测试存档生成器 — 生成可导入的 JSON 存档文件
 * 使用方法：node _generate_test_saves.cjs
 * 输出：test_save_narrative_combat.json 和 test_save_duel_combat.json
 */

const fs = require('fs');
const SAVE_FORMAT_VERSION = 8;

// ═══════════════════════════════════════════
// 公共基础状态
// ═══════════════════════════════════════════
function createBaseState() {
  return {
    profile: {
      name: '测试蛊师',
      realm: { grand: 2, sub: '初阶', label: '二转初阶' },
      background: '南疆 · 散修',
    },
    attributes: { '资质': 7, '体魄': 6, '心智': 5, '气运': 5 },
    vitals: {
      health: { current: 100, max: 100 },
      essence: { current: 100, max: 100 },
    },
    pathBuild: {
      primary: '炎道',
      secondary: ['力道'],
      path_levels: {},
      dao_marks: { '炎道': 120, '力道': 50 },
    },
    daoHeart: { kill: 5, mercy: 2, scheme: 3, ambition: 8 },
    flags: { current_chapter: '青茅山期', current_chapter_id: 'qingmaoshan', _origin: '南疆' },
    currentChapterId: 'qingmaoshan',
    currentDomain: '南疆',
    turn: 8,
    isDead: false,
    deathCause: '',
    deathTurn: 0,
    currency: 350,
    immortalCurrency: 0,
    battleState: null,
    deathRecord: null,
    gameTime: { ap: 3, max_ap: 3, period: 'morning', day: 3, month: 3, year: 1, season: 'spring' },
    inventory: [
      { name: '星火蛊', tier: 1, path: '炎道', currentState: 'normal' },
      { name: '铜皮蛊', tier: 1, path: '金道', currentState: 'normal' },
      { name: '月光蛊', tier: 1, path: '光道', currentState: 'normal' },
    ],
    materialBag: {},
    killMoves: [],
    cooldowns: {},
    primaryPath: '炎道',
    secondaryPaths: ['力道'],
    pathLevels: {},
    daoMarks: { '炎道': 120, '力道': 50 },
    selectedTalents: [],
    activeModifiers: [],
    standings: { guyue_shanzhai: { standing: 40 }, shangjia: { standing: 10 } },
    characterRelations: [],
    aperture: null,
    butterflyEffects: [],
    timelineDeviation: 0,
    eventQueue: [],
    eventHistory: [],
    messages: [
      { role: 'assistant', content: '系统初始化消息' },
      { role: 'user', content: '开始游戏' },
    ],
    keyEvents: [{ turn: 5, summary: '青茅山附近发现蛊狼活动痕迹' }],
    rollingSummary: '',
    knownLocations: [],
    playerPosition: { x: 0, y: 0, region: '南疆 · 青茅山' },
    exploredRegions: ['南疆'],
    fogOfWar: true,
    currencyLog: [],
    yuanStoneDelta: 0,
    unlockedAchievements: [],
    achievementProgress: {},
    tutorialState: 'completed',
    currentStep: 6,
    tutorialSkippable: true,
    chapterHistory: [{ id: 'qingmaoshan', displayName: '青茅山期', domain: '南疆' }],
    activeEvents: {},
    goals: {},
    transitionState: 'idle',
    nextChapterOptions: [],
    proximityEvents: [],
    globalEventStatus: {},
    debt: 0,
    debtInterestRate: 0.05,
    combatState: null,
    dialogueState: {},
    shopState: { visitedShops: [], shopInventory: {} },
    encounterState: { recentEncounters: [], cooldownTimer: 0 },
    audioState: { masterVolume: 0.7, bgmVolume: 0.5, sfxVolume: 0.7, currentBgm: null },
    lifeboundGu: null,
    originUnlocks: [],
    guHungerCounters: {},
    npcRelations: { matrix: {}, lastUpdatedTurn: 0 },
    heavenlyLand: null,
    lifeboundGuInfo: null,
    lifeboundDeathPenalty: null,
    battleHistory: [],
    activeDialogue: null,
    isAchievementToastVisible: false,
    currentAchievementQueue: [],
    gameLog: [],
    duelState: null,
    transientCombatConstraint: null,
    isAchievementPanelOpen: false,
  };
}

function writeSave(filename, meta, state) {
  const save = {
    formatVersion: SAVE_FORMAT_VERSION,
    meta: meta,
    state: state,
  };
  fs.writeFileSync(filename, JSON.stringify(save, null, 2), 'utf-8');
  console.log(`✅ 已生成: ${filename}`);
  console.log(`   角色: ${meta.playerName} | 境界: ${meta.realm} | 回合: T${meta.turn}`);
}

// ═══════════════════════════════════════════
// 存档 1: 大规模战斗（狼潮 - narrative combat）
// ═══════════════════════════════════════════
const narrativeState = createBaseState();
narrativeState.turn = 8;
narrativeState.messages = [
  { role: 'assistant', content: '青茅山震动——狼潮来了。数百只蛊狼从森林深处涌出，它们的背上寄生着力量蛊，牙齿被血道蛊虫强化过。山寨围墙上站满了人——老蛊师在分发蛊虫，年轻人握着武器手心全是汗。第一匹狼冲出树林时比人还高。古月博族长站在高处大声发令——全体蛊师登墙防守！你需要在四种策略中选择一种。' },
  { role: 'user', content: 'c1' },
];
narrativeState.rollingSummary = '青茅山狼潮已至——数百只蛊狼围攻山寨。全体族人正在寨墙上防守。';
narrativeState.keyEvents = [
  { turn: 7, summary: '山寨发现大规模蛊狼聚集——确认狼潮即将来临' },
  { turn: 8, summary: '狼潮攻寨——数百蛊狼从山林涌出' },
];

// ⚠️ 关键：设置 transientCombatConstraint 让 NarrativeCombatPanel 自动弹出
narrativeState.transientCombatConstraint = {
  sceneId: 'nanjiang_langchao',
  combatType: 'narrative',
  scale: 'battle',
  mustHappen: [
    '狼群大规模围攻山寨——成百上千只蛊狼',
    '全体族人参与防守',
    '狼潮被击退后山寨满目疮痍',
  ],
  mustNotHappen: [
    '狼潮被写成轻松的大规模狩猎',
    '山寨完好无损',
    '狼潮被归因于单一原因',
  ],
  keyFactions: ['古月山寨', '青茅山'],
  keyNPCs: ['古月博', '古月赤练', '古月漠尘', '古月青书'],
  strategicChoiceCount: 4,
  narrativeStyle: '狼潮不是突然袭来——先是鸟全部飞走了，然后是地面轻微的震动，然后是远方传来的低吼声像打雷一样从地平线上滚过来。这不是一次狩猎——这是青茅山有史以来最严重的兽灾',
  baseChance: 0.4,
  recommendedRealm: 2,
  statBridge: {
    enabled: true,
    realmWeight: 0.12,
    guTagInfluence: [
      { tag: '炎道', bonus: 0.12, note: '狼惧火，炎道范围攻击有效' },
      { tag: '土道', bonus: 0.15, note: '土道蛊虫可加固寨墙防御' },
      { tag: '金道', bonus: 0.10, note: '金道防御力可在混战中保护蛊师' },
    ],
  },
};

writeSave(
  'test_save_narrative_combat.json',
  { playerName: '测试蛊师', realm: '二转初阶', turn: 8, gameMode: 'canon' },
  narrativeState
);

// ═══════════════════════════════════════════
// 存档 2: 1v1决斗（劫匪首领 - duel combat）
// ═══════════════════════════════════════════
const duelState = createBaseState();
duelState.turn = 6;
duelState.flags = { current_chapter: '商路求生', current_chapter_id: 'shanglu_qiusheng', _origin: '南疆' };
duelState.currentChapterId = 'shanglu_qiusheng';
duelState.messages = [
  { role: 'assistant', content: '商队在狭窄的山道上缓缓前行。突然，前方树林中传来呼哨声——五个黑影从两侧山坡上跳下，为首的劫匪首领目光凶狠地扫过商队护卫，最后盯住了你。他冷笑着亮出了蛊虫，一场战斗不可避免。' },
  { role: 'user', content: 'c1' },
];
duelState.rollingSummary = '商队在南疆商路上遭有组织的劫匪伏击。劫匪首领亮出蛊虫，准备战斗。';
duelState.keyEvents = [
  { turn: 5, summary: '商队行至商路险段——右侧是悬崖，左侧是密林' },
  { turn: 6, summary: '劫匪伏击商队——首领率五人团伙拦路' },
];
duelState.chapterHistory = [{ id: 'shanglu_qiusheng', displayName: '商路求生', domain: '南疆' }];
duelState.inventory = [
  { name: '星火蛊', tier: 1, path: '炎道', currentState: 'normal' },
  { name: '铜皮蛊', tier: 1, path: '金道', currentState: 'normal' },
  { name: '月光蛊', tier: 1, path: '光道', currentState: 'normal' },
  { name: '避瘴蛊', tier: 2, path: '毒道', currentState: 'normal' },
];

// ⚠️ 关键：设置 duelState 让 CombatOverlay 自动弹出
duelState.duelState = {
  duelId: 'test-duel-001',
  phase: 'player_turn',
  round: 0,
  player: {
    name: '测试蛊师',
    realm: '二转蛊师',
    realmNum: 2,
    path: '炎道',
    daoMarks: 120,
    hp: 100,
    maxHp: 100,
    attack: 22,
    defense: 8,
    accuracy: 70,
    evasion: 35,
    gu: [
      { name: '星火蛊', path: '炎道', tier: 1 },
      { name: '铜皮蛊', path: '金道', tier: 1 },
      { name: '月光蛊', path: '光道', tier: 1 },
    ],
    moves: [],
  },
  enemy: {
    name: '劫匪首领',
    realm: '二转蛊师',
    realmNum: 2,
    hp: 80,
    maxHp: 80,
    attack: 25,
    defense: 8,
    accuracy: 70,
    evasion: 30,
    path: '力道',
    daoMarks: 80,
    gu: [],
    moves: [{ name: '蛮力重击', damageMultiplier: 1.5, pathBonus: 5, description: '劫匪首领灌注全力的一击' }],
  },
  result: null,
  log: [],
  startedAt: Date.now(),
};

writeSave(
  'test_save_duel_combat.json',
  { playerName: '测试蛊师', realm: '二转初阶', turn: 6, gameMode: 'canon' },
  duelState
);

console.log('\n📋 使用说明:');
console.log('  1. 启动游戏 npm run dev');
console.log('  2. 进入游戏后点击"存档/读档"');
console.log('  3. 点击"导入存档"选择 test_save_narrative_combat.json 或 test_save_duel_combat.json');
console.log('  4. 加载后会在"游戏进行中"画面触发对应的战斗面板');

// ═══════════════════════════════════════════════════════════
// v0.7.0: 4个代表性演示存档 → 输出至 测试存档/v0.6.0/
// ═══════════════════════════════════════════════════════════

function writeDemoSave(filename, meta, state) {
  const dir = '测试存档/v0.6.0';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const fullPath = `${dir}/${filename}`;
  const save = { formatVersion: SAVE_FORMAT_VERSION, meta, state };
  fs.writeFileSync(fullPath, JSON.stringify(save, null, 2), 'utf-8');
  console.log(`✅ 演示存档: ${fullPath}`);
  console.log(`   角色: ${meta.playerName} | 境界: ${meta.realm} | T${meta.turn} | ${meta.description}`);
}

// ─── 计算战斗属性（同步 combat-stats.ts v0.7.0 断崖公式） ───
function deriveStats(physique, aptitude, mind, realmGrand, talentMods = []) {
  const r = realmGrand;
  const isImmortal = r >= 6;
  const immortalScale = isImmortal ? r - 5 : 0;
  const mortalBaseHp = 80 + physique * 20 + Math.min(4, r - 1) * 25;
  const mortalBaseAtk = aptitude * 4 + physique * 2 + Math.min(4, r - 1) * 8;
  const mortalBaseDef = physique * 3 + Math.min(4, r - 1) * 4;

  let maxHp, attack, defense, accuracy, evasion;
  if (isImmortal) {
    const hpMult = 3.0 + immortalScale * 3.0;
    const atkMult = 2.0 + immortalScale * 1.5;
    const defMult = 1.5 + immortalScale * 1.2;
    maxHp = Math.round(mortalBaseHp * hpMult);
    attack = Math.round(mortalBaseAtk * atkMult);
    defense = Math.round(mortalBaseDef * defMult);
    accuracy = 75 + mind * 2 + immortalScale * 4;
    evasion = 35 + physique * 2 + immortalScale * 2;
  } else {
    maxHp = 80 + physique * 20 + (r - 1) * 25;
    attack = Math.round(aptitude * 4 + physique * 2 + (r - 1) * 8);
    defense = Math.round(physique * 3 + (r - 1) * 4);
    accuracy = 70 + mind * 1 + (r - 1) * 2;
    evasion = 30 + physique * 1;
  }
  return {
    hp: maxHp, maxHp, attack, defense,
    accuracy: Math.max(30, Math.min(95, accuracy)),
    evasion: Math.max(10, Math.min(70, evasion)),
  };
}

// ─── 存档3: 三王山遗迹 — 五转巅峰蛊师探索传承大殿 ───
const sanwangState = createBaseState();
sanwangState.profile = { name: '古月方想', realm: { grand: 5, sub: '巅峰', label: '五转巅峰' }, background: '南疆·蛊师' };
sanwangState.attributes = { '资质': 8, '体魄': 7, '心智': 6, '气运': 6 };
sanwangState.vitals = { health: { current: 260, max: 260 }, essence: { current: 200, max: 200 }, essenceType: 'mortal' };
sanwangState.pathBuild = {
  primary: '魂道', secondary: ['力道'],
  path_levels: { '魂道': '宗师', '力道': '大师' },
  dao_marks: { '魂道': 550, '力道': 200, '炼道': 100 },
};
sanwangState.daoHeart = { kill: 15, mercy: 5, scheme: 20, ambition: 30 };
sanwangState.flags = { current_chapter: '三王山', current_chapter_id: 'sanwangshan', _origin: '南疆' };
sanwangState.currentChapterId = 'sanwangshan';
sanwangState.currentDomain = '南疆';
sanwangState.turn = 42;
sanwangState.currency = 5000;
sanwangState.gameTime = { ap: 3, max_ap: 3, period: 'night', day: 15, month: 6, year: 3, season: 'summer' };
sanwangState.inventory = [
  { name: '魂压蛊', tier: 5, path: '魂道', currentState: 'optimal' },
  { name: '暗影蛊', tier: 5, path: '暗道', currentState: 'optimal' },
  { name: '力量蛊', tier: 4, path: '力道', currentState: 'optimal' },
  { name: '铁骨蛊', tier: 4, path: '金道', currentState: 'optimal' },
  { name: '探查蛊', tier: 3, path: '智道', currentState: 'optimal' },
];
sanwangState.messages = [
  { role: 'assistant', content: '三王山传承大殿的石门在你面前缓缓打开。千年尘封的空气中弥漫着古老的道痕气息——墙壁上刻满了三王时代的杀招传承。正中央的玉台上，一只守护兽从长眠中苏醒，它的眼中闪烁着古老的智慧与杀意。作为五转巅峰蛊师，你知道这是通往升仙的最后一道考验。' },
  { role: 'user', content: 'c1' },
];
sanwangState.rollingSummary = '南疆三王山——传承大殿。五转巅峰蛊师面对守护兽的试炼，1v1决斗即将展开。';
sanwangState.keyEvents = [
  { turn: 40, summary: '抵达三王山脚下——传说三王在此飞升' },
  { turn: 41, summary: '破解第一道机关——识破幻阵，进入传承大殿外层' },
  { turn: 42, summary: '传承大殿开启——守护兽从千年长眠中苏醒' },
];
sanwangState.chapterHistory = [
  { id: 'qingmaoshan', displayName: '青茅山期', domain: '南疆' },
  { id: 'shanglu_qiusheng', displayName: '商路求生', domain: '南疆' },
  { id: 'sanwangshan', displayName: '三王山', domain: '南疆' },
];
sanwangState.selectedTalents = [
  { id: 'talent_killmove_creator', name: '杀招天才', benefits: ['命中+5%'] },
  { id: 'talent_soul_affinity', name: '魂道亲和', benefits: ['攻击力+10%'] },
];
sanwangState.aperture = {
  type: 'mortal', rank: 5, subRank: '巅峰',
  primevalSea: { color: '#b886e0', colorName: '紫晶', fillPercent: 85 },
  apertureWall: { state: '壁薄如纸', opacity: 0.15, description: '窍壁已薄如蝉翼，距离升仙只差一线' },
  capacity: 15, carriedGu: 5, capacityLocked: false,
};
sanwangState.primaryPath = '魂道'; sanwangState.secondaryPaths = ['力道'];
sanwangState.pathLevels = { '魂道': '宗师', '力道': '大师' };
sanwangState.daoMarks = { '魂道': 550, '力道': 200, '炼道': 100 };
sanwangState.killMoves = [
  {
    id: 'soul_crush', name: '魂压', path: '魂道', level: 5,
    baseCost: 25, multiplier: 3.0, cooldown: 2,
    description: '魂道杀招——以魂压蛊为核心，释放灵魂威压',
    proficiency: 2, usageCount: 15, source: 'created', isImmortal: false,
  },
  {
    id: 'shadow_strike', name: '暗影突袭', path: '暗道', level: 4,
    baseCost: 20, multiplier: 2.5, cooldown: 3,
    description: '暗道杀招——隐匿于阴影中发动致命一击',
    proficiency: 1, usageCount: 8, source: 'discovered', isImmortal: false,
  },
];
// 1v1守护兽决斗数据（五转巅峰级）
const playerStats3 = deriveStats(7, 8, 6, 5);
sanwangState.duelState = {
  duelId: 'demo-sanwangshan-001',
  phase: 'player_turn', round: 0,
  mode: 'lethal',
  player: {
    name: '古月方想', realm: '五转巅峰', realmNum: 5, path: '魂道',
    daoMarks: 550, hp: playerStats3.hp, maxHp: playerStats3.maxHp,
    attack: playerStats3.attack, defense: playerStats3.defense,
    accuracy: playerStats3.accuracy, evasion: playerStats3.evasion,
    essence: { current: 200, max: 200 },
    gu: [
      { name: '魂压蛊', path: '魂道', tier: 5 },
      { name: '暗影蛊', path: '暗道', tier: 5 },
      { name: '力量蛊', path: '力道', tier: 4 },
    ],
    moves: [
      { name: '魂压', damageMultiplier: 3.0 * 1.1 * 1.1 * (1 + 4 * 0.15), pathBonus: 550 * 0.002, description: '魂道杀招·五转巅峰', killerMoveId: 'soul_crush', requiredCoreGu: ['魂压蛊'] },
      { name: '暗影突袭', damageMultiplier: 2.5 * 1.0 * 1.05 * (1 + 3 * 0.15), pathBonus: 550 * 0.002, description: '暗道杀招', killerMoveId: 'shadow_strike', requiredCoreGu: ['暗影蛊'] },
    ],
    statuses: [],
  },
  enemy: {
    name: '传承守护兽·魂狼', realm: '五转巅峰', realmNum: 5,
    hp: 350, maxHp: 350, attack: 85, defense: 35,
    accuracy: 80, evasion: 40, path: '魂道', daoMarks: 500,
    gu: [{ name: '魂狼之牙', path: '魂道', tier: 5 }],
    moves: [
      { name: '灵魂撕咬', damageMultiplier: 3.5, pathBonus: 500 * 0.002, description: '守护兽的灵魂攻击' },
      { name: '远古咆哮', damageMultiplier: 2.0, pathBonus: 500 * 0.002, description: '范围灵魂波动' },
    ],
    statuses: [], aiMode: 'aggressive',
  },
  result: null, log: [], startedAt: Date.now(),
};

writeDemoSave('demo_save_sanwangshan.json',
  { playerName: '古月方想', realm: '五转巅峰', turn: 42, gameMode: 'canon', description: '三王山传承大殿·1v1守护兽决斗' },
  sanwangState
);

// ─── 存档4: 6转魂道 vs 6转血道 — 同级蛊仙对战（魂克血 pathMatrix 1.3/0.7） ───
const soulVsBloodState = createBaseState();
soulVsBloodState.profile = { name: '魂道蛊仙·冥', realm: { grand: 6, sub: '中阶', label: '六转中阶' }, background: '北原·散修蛊仙' };
soulVsBloodState.attributes = { '资质': 9, '体魄': 8, '心智': 9, '气运': 7 };
soulVsBloodState.vitals = { health: { current: 800, max: 800 }, essence: { current: 500, max: 500 }, essenceType: 'immortal' };
soulVsBloodState.pathBuild = {
  primary: '魂道', secondary: ['智道'],
  path_levels: { '魂道': '大宗师', '智道': '宗师' },
  dao_marks: { '魂道': 2000, '智道': 800, '炼道': 500, '暗道': 400 },
};
soulVsBloodState.daoHeart = { kill: 30, mercy: 10, scheme: 35, ambition: 50 };
soulVsBloodState.flags = { current_chapter: '北原游历', current_chapter_id: 'beiyuan_wandering', _origin: '北原' };
soulVsBloodState.currentChapterId = 'beiyuan_wandering'; soulVsBloodState.currentDomain = '北原';
soulVsBloodState.turn = 85; soulVsBloodState.currency = 0; soulVsBloodState.immortalCurrency = 150;
soulVsBloodState.gameTime = { ap: 3, max_ap: 3, period: 'noon', day: 20, month: 8, year: 5, season: 'autumn' };
soulVsBloodState.inventory = [
  { name: '魂压蛊', tier: 5, path: '魂道', currentState: 'optimal' },
  { name: '摄魂蛊', tier: 6, path: '魂道', currentState: 'optimal' },
  { name: '智光蛊', tier: 5, path: '智道', currentState: 'optimal' },
];
soulVsBloodState.messages = [
  { role: 'assistant', content: '北原寒风凛冽，你在冰原上追踪到一位血道蛊仙的气息——他刚刚屠戮了一个小部族，正在用族人的精血祭炼血道杀招。他察觉到你的气息，转身露出一双血红的眼睛："魂道蛊仙？有趣……让我看看你的灵魂有多美味。"' },
  { role: 'user', content: 'c1' },
];
soulVsBloodState.rollingSummary = '北原冰原——6转魂道蛊仙遭遇6转血道魔修。魂克血（pathMatrix 1.3/0.7），测试转数武器倍率+道痕联动。';
const pStats4 = deriveStats(8, 9, 9, 6);
soulVsBloodState.duelState = {
  duelId: 'demo-soul-vs-blood', phase: 'player_turn', round: 0, mode: 'lethal',
  player: {
    name: '魂道蛊仙·冥', realm: '六转中阶', realmNum: 6, path: '魂道',
    daoMarks: 2000, hp: pStats4.hp, maxHp: pStats4.maxHp,
    attack: pStats4.attack, defense: pStats4.defense,
    accuracy: pStats4.accuracy, evasion: pStats4.evasion,
    essence: { current: 500, max: 500 },
    gu: [
      { name: '魂压蛊', path: '魂道', tier: 5 },
      { name: '摄魂蛊', path: '魂道', tier: 6 },
      { name: '智光蛊', path: '智道', tier: 5 },
    ],
    moves: [
      { name: '魂压·仙', damageMultiplier: 4.0 * 1.2 * 1.15 * 2.0, pathBonus: 2000 * 0.002, description: '仙级魂压杀招——6转魂道绝技', requiredCoreGu: ['魂压蛊'] },
    ],
    statuses: [],
  },
  enemy: {
    name: '血道魔修·戮', realm: '六转初阶', realmNum: 6,
    hp: 600, maxHp: 600, attack: 75, defense: 30,
    accuracy: 75, evasion: 35, path: '血道', daoMarks: 1200,
    gu: [{ name: '血刃蛊', path: '血道', tier: 6 }],
    moves: [
      { name: '血刃斩', damageMultiplier: 3.5, pathBonus: 1200 * 0.002, description: '血道杀招——以精血为刃' },
    ],
    statuses: [], aiMode: 'aggressive',
  },
  result: null, log: [], startedAt: Date.now(),
};
writeDemoSave('demo_save_soul_vs_blood.json',
  { playerName: '魂道蛊仙·冥', realm: '六转中阶', turn: 85, gameMode: 'canon', description: '6转魂道vs血道·同级蛊仙·魂克血' },
  soulVsBloodState
);

// ─── 存档5: 6转 vs 5转群匪 — 仙凡碾压演示 ───
const immortalVsMortalsState = createBaseState();
immortalVsMortalsState.profile = { name: '剑道蛊仙·锋', realm: { grand: 6, sub: '初阶', label: '六转初阶' }, background: '东海·剑修蛊仙' };
immortalVsMortalsState.attributes = { '资质': 8, '体魄': 8, '心智': 7, '气运': 6 };
immortalVsMortalsState.vitals = { health: { current: 750, max: 750 }, essence: { current: 400, max: 400 }, essenceType: 'immortal' };
immortalVsMortalsState.pathBuild = {
  primary: '金道', secondary: ['力道'],
  path_levels: { '金道': '宗师', '力道': '大师' },
  dao_marks: { '金道': 1500, '力道': 500, '炼道': 300 },
};
immortalVsMortalsState.daoHeart = { kill: 40, mercy: 3, scheme: 15, ambition: 45 };
immortalVsMortalsState.flags = { current_chapter: '东海游历', current_chapter_id: 'donghai_wandering', _origin: '东海' };
immortalVsMortalsState.currentChapterId = 'donghai_wandering'; immortalVsMortalsState.currentDomain = '东海';
immortalVsMortalsState.turn = 70; immortalVsMortalsState.currency = 0; immortalVsMortalsState.immortalCurrency = 80;
immortalVsMortalsState.gameTime = { ap: 3, max_ap: 3, period: 'morning', day: 5, month: 4, year: 4, season: 'spring' };
immortalVsMortalsState.inventory = [
  { name: '金剑蛊', tier: 6, path: '金道', currentState: 'optimal' },
  { name: '金刚蛊', tier: 5, path: '金道', currentState: 'optimal' },
];
immortalVsMortalsState.messages = [
  { role: 'assistant', content: '东海商路上，一伙五转巅峰蛊师拦住了你的去路——"此路是我开！留下仙元石，饶你不死！"为首的独眼蛊师亮出了五转血道蛊虫，身后七个同伙也都祭出了各自的蛊虫。他们显然没有认出你是一位蛊仙。（仙凡碾压演示——验证综合战力差40-100x）' },
  { role: 'user', content: 'c1' },
];
immortalVsMortalsState.rollingSummary = '东海商路——6转剑道蛊仙遭遇8名五转群匪。仙凡碾压演示（8x倍率配合6xHP断崖，预期秒杀级战力差）。';
const pStats5 = deriveStats(8, 8, 7, 6);
immortalVsMortalsState.duelState = {
  duelId: 'demo-immortal-vs-mortals', phase: 'player_turn', round: 0, mode: 'lethal',
  player: {
    name: '剑道蛊仙·锋', realm: '六转初阶', realmNum: 6, path: '金道',
    daoMarks: 1500, hp: pStats5.hp, maxHp: pStats5.maxHp,
    attack: pStats5.attack, defense: pStats5.defense,
    accuracy: pStats5.accuracy, evasion: pStats5.evasion,
    essence: { current: 400, max: 400 },
    gu: [
      { name: '金剑蛊', path: '金道', tier: 6 },
      { name: '金刚蛊', path: '金道', tier: 5 },
    ],
    moves: [
      { name: '金剑斩', damageMultiplier: 6.0 * 2.0, pathBonus: 1500 * 0.002, description: '仙级金道杀招·6转剑修' },
    ],
    statuses: [],
  },
  enemy: {
    name: '独眼匪首·血刀', realm: '五转巅峰', realmNum: 5,
    hp: 250, maxHp: 250, attack: 50, defense: 20,
    accuracy: 75, evasion: 35, path: '血道', daoMarks: 300,
    gu: [{ name: '血刀蛊', path: '血道', tier: 5 }],
    moves: [
      { name: '血刀斩', damageMultiplier: 2.5, pathBonus: 300 * 0.002, description: '五转血道杀招' },
    ],
    statuses: [], aiMode: 'aggressive',
  },
  result: null, log: [], startedAt: Date.now(),
};
writeDemoSave('demo_save_immortal_vs_mortals.json',
  { playerName: '剑道蛊仙·锋', realm: '六转初阶', turn: 70, gameMode: 'canon', description: '6转vs5转群匪·仙凡碾压40-100x' },
  immortalVsMortalsState
);

// ─── 存档6: 凡级1v1 — 二转炎道 vs 二转力道（基础战斗展示） ───
const mortalDuelState = createBaseState();
mortalDuelState.profile = { name: '炎道学徒·焰', realm: { grand: 2, sub: '中阶', label: '二转中阶' }, background: '南疆·散修' };
mortalDuelState.attributes = { '资质': 6, '体魄': 6, '心智': 5, '气运': 5 };
mortalDuelState.vitals = { health: { current: 125, max: 125 }, essence: { current: 80, max: 80 }, essenceType: 'mortal' };
mortalDuelState.pathBuild = {
  primary: '炎道', secondary: [],
  path_levels: { '炎道': '普通' },
  dao_marks: { '炎道': 80, '力道': 20 },
};
mortalDuelState.daoHeart = { kill: 3, mercy: 2, scheme: 5, ambition: 6 };
mortalDuelState.flags = { current_chapter: '青茅山期', current_chapter_id: 'qingmaoshan', _origin: '南疆' };
mortalDuelState.currentChapterId = 'qingmaoshan'; mortalDuelState.currentDomain = '南疆';
mortalDuelState.turn = 15; mortalDuelState.currency = 200;
mortalDuelState.inventory = [
  { name: '星火蛊', tier: 2, path: '炎道', currentState: 'optimal' },
  { name: '铜皮蛊', tier: 1, path: '金道', currentState: 'optimal' },
];
mortalDuelState.messages = [
  { role: 'assistant', content: '青茅山脚下的比武台——部落的季度比武大会正在进行。你的对手是力道修行的古力，他将力量蛊催动到极致，双拳裹挟着碎石朝你轰来。"来啊！让我看看你的炎道能奈我何！"' },
  { role: 'user', content: 'c1' },
];
mortalDuelState.rollingSummary = '青茅山季度比武——二转炎道 vs 二转力道。基础战斗演示，测试凡级战斗公式。';
const pStats6 = deriveStats(6, 6, 5, 2);
mortalDuelState.duelState = {
  duelId: 'demo-mortal-duel', phase: 'player_turn', round: 0, mode: 'lethal',
  player: {
    name: '炎道学徒·焰', realm: '二转中阶', realmNum: 2, path: '炎道',
    daoMarks: 80, hp: pStats6.hp, maxHp: pStats6.maxHp,
    attack: pStats6.attack, defense: pStats6.defense,
    accuracy: pStats6.accuracy, evasion: pStats6.evasion,
    essence: { current: 80, max: 80 },
    gu: [
      { name: '星火蛊', path: '炎道', tier: 2 },
      { name: '铜皮蛊', path: '金道', tier: 1 },
    ],
    moves: [
      { name: '星火燎原', damageMultiplier: 2.0 * (1 + 1 * 0.15), pathBonus: 80 * 0.002, description: '凡级炎道杀招·二转' },
    ],
    statuses: [],
  },
  enemy: {
    name: '力道武修·古力', realm: '二转中阶', realmNum: 2,
    hp: 140, maxHp: 140, attack: 28, defense: 12,
    accuracy: 72, evasion: 36, path: '力道', daoMarks: 60,
    gu: [{ name: '力量蛊', path: '力道', tier: 2 }],
    moves: [
      { name: '碎石拳', damageMultiplier: 2.2, pathBonus: 60 * 0.002, description: '力道杀招——以力破巧' },
    ],
    statuses: [], aiMode: 'balanced',
  },
  result: null, log: [], startedAt: Date.now(),
};
writeDemoSave('demo_save_mortal_duel.json',
  { playerName: '炎道学徒·焰', realm: '二转中阶', turn: 15, gameMode: 'canon', description: '凡级1v1·炎道vs力道·基础战斗' },
  mortalDuelState
);

console.log('\n══════════════════════════════════');
console.log('📋 演示存档使用说明:');
console.log('  存档输出目录: 测试存档/v0.6.0/');
console.log('  1. demo_save_sanwangshan.json — 三王山遗迹·五转巅峰vs守护兽');
console.log('  2. demo_save_soul_vs_blood.json — 6转魂道vs6转血道·魂克血');
console.log('  3. demo_save_immortal_vs_mortals.json — 6转vs5转群匪·仙凡碾压');
console.log('  4. demo_save_mortal_duel.json — 凡级1v1·炎道vs力道');
console.log('══════════════════════════════════');
