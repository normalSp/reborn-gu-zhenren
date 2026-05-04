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
