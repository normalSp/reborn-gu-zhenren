const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, '测试存档', 'v0.7.0');
fs.mkdirSync(outDir, { recursive: true });

const now = '2026-05-08T21:30:00+08:00';

function baseState(name, overrides = {}) {
  return {
    profile: {
      name,
      realm: { grand: 4, sub: '高阶', label: '四转高阶' },
      background: '南疆·商队',
    },
    currentDomain: '南疆',
    currentChapterId: 'v070c_test',
    turn: 80,
    currency: 5200,
    immortalEssenceStones: 0,
    gameTime: { ap: 3, max_ap: 3, period: 'afternoon', day: 28, month: 6, year: 1, season: 'summer' },
    pathBuild: {
      primary: '力道',
      secondary: ['金道'],
      path_levels: { '力道': '精通', '金道': '熟练' },
      dao_marks: { '力道': 180, '金道': 80 },
    },
    vitals: {
      health: { current: 220, max: 240 },
      essence: { current: 84, max: 100 },
      essenceType: 'mortal',
    },
    soundState: {
      masterVolume: 0.7,
      bgmVolume: 0.5,
      sfxVolume: 0.7,
      voiceVolume: 0.8,
      uiVolume: 0.7,
      muted: false,
      currentBgm: null,
      voiceActive: false,
    },
    playerFaction: {
      id: 'faction_v070c_test',
      name: '七玄试炼小队',
      type: '散修联盟',
      domain: '南疆',
      level: 3,
      reputation: 120,
      resources: { yuanStone: 3000, immortalStone: 0 },
      maxMembers: 8,
      members: [
        { id: 'm_guard_qin', name: '秦铁', path: '金道', realm: 3, loyalty: 64, personality: 'loyal', alive: true, hp: 150, maxHp: 150, atk: 34, def: 22, adventureTrust: 76, interestDrive: 40, status: 'idle' },
        { id: 'm_scout_ye', name: '叶听风', path: '智道', realm: 3, loyalty: 52, personality: 'cautious', alive: true, hp: 118, maxHp: 118, atk: 26, def: 14, adventureTrust: 68, interestDrive: 60, status: 'idle' },
      ],
    },
    partyState: {
      members: [
        { id: 'm_guard_qin', name: '秦铁', path: '金道', realm: 3, loyalty: 64, personality: 'loyal', alive: true, hp: 150, maxHp: 150, atk: 34, def: 22, adventureTrust: 76, interestDrive: 40 },
      ],
      maxSize: 4,
      formation: '牵制',
      morale: 58,
      coordination: 55,
      lastUpdatedTurn: 80,
      memberCooldowns: {},
      memberRolePausedUntil: {},
    },
    materials: { '鲜兽肉': 4, '金粉': 2, '精品蛊材': 3 },
    immortalMaterials: {},
    flags: {},
    ...overrides,
  };
}

const cases = [
  ['v070c_audio_fang_yuan_theme', '方源角色曲触发', { currentChapterId: 'fang_yuan_remote_event', flags: { characterBgmTest: 'fang_yuan_nianlun', actor: '方源' } }],
  ['v070c_audio_duke_long_theme', '龙公角色曲触发', { currentDomain: '中洲', flags: { characterBgmTest: 'duke_long_chunni', actor: '龙公' } }],
  ['v070c_flash_killer_move', '杀招闪图', { flags: { battleFlashTest: 'killer_move_generic', moveName: '金月斩' } }],
  ['v070c_flash_immortal_gu', '仙蛊闪图', { flags: { battleFlashTest: 'spring_autumn_cicada_flash', guName: '春秋蝉' } }],
  ['v070c_tyh_all_pools', '宝黄天全品类', { profile: { name: '宝黄天试客', realm: { grand: 6, sub: '初阶', label: '六转蛊仙' }, background: '散修蛊仙' }, immortalEssenceStones: 7200, currentChapterId: 'treasure_yellow_heaven_full_pool' }],
  ['v070c_terrain_forest_battle', '密林地形战', { flags: { terrainId: 'dense_forest', formationId: 'concealment_array' } }],
  ['v070c_terrain_formation_battle', '残阵地形战', { flags: { terrainId: 'formation_ruins', formationId: 'simple_kill_array' } }],
  ['v070c_dispatch_scout', '外派侦察', { flags: { dispatchTask: 'scout' } }],
  ['v070c_dispatch_trade', '外派交易', { flags: { dispatchTask: 'trade' } }],
  ['v070c_dispatch_recruit', '外派拉拢NPC', { flags: { dispatchTask: 'recruit_npc' } }],
  ['v070c_extreme_calamity', '十绝体灾劫', { mortalAperture: { type: 'mortal', rank: 4, subRank: '高阶', primevalSea: { color: '#8fd7ff', colorName: '黄金', fillPercent: 100 }, apertureWall: { state: '壁薄如纸', opacity: 0.35, description: '十绝体高压' }, capacity: 3, carriedGu: 3, extremePhysiqueType: '北冥冰魄体', capacityLocked: true } }],
  ['v070c_aperture_visual_pressure', '空窍压力可视化', { flags: { apertureVisualTest: true } }],
  ['v070c_voice_ducking', '配音ducking', { soundState: { masterVolume: 0.7, bgmVolume: 0.5, sfxVolume: 0.7, voiceVolume: 0.8, uiVolume: 0.7, muted: false, currentBgm: 'bgm/domain/nanjiang.mp3', voiceActive: true } }],
  ['v070c_achievement_sfx', '成就音效', { flags: { achievementSfxTest: true }, achievementsUnlocked: ['first_squad_victory'] }],
  ['v070c_diagnostics_missing_audio', '缺音频诊断', { flags: { diagnosticsTest: 'missing_audio' } }],
  ['v070c_full_regression_squad', '全量回归小队战', { currentChapterId: 'squad_battle_regression', partyState: { members: [
    { id: 'm_guard_qin', name: '秦铁', path: '金道', realm: 3, loyalty: 64, personality: 'loyal', alive: true, hp: 150, maxHp: 150, atk: 34, def: 22, adventureTrust: 76, interestDrive: 40 },
    { id: 'm_scout_ye', name: '叶听风', path: '智道', realm: 3, loyalty: 52, personality: 'cautious', alive: true, hp: 118, maxHp: 118, atk: 26, def: 14, adventureTrust: 68, interestDrive: 60 },
  ], maxSize: 4, formation: '合击', morale: 64, coordination: 62, lastUpdatedTurn: 80, memberCooldowns: {}, memberRolePausedUntil: {} } }],
];

for (const [id, description, overrides] of cases) {
  const file = {
    formatVersion: 13,
    timestamp: now,
    meta: {
      playerName: `v0.7.0-c·${description}`,
      realm: overrides?.profile?.realm?.label || '四转高阶',
      turn: overrides?.turn || 80,
      gameMode: 'canon',
      description: `v0.7.0-c 专项手测：${description}`,
    },
    state: baseState(`v0.7.0-c·${description}`, overrides),
  };
  fs.writeFileSync(path.join(outDir, `${id}.json`), `${JSON.stringify(file, null, 2)}\n`, 'utf8');
}

console.log(`generated ${cases.length} v0.7.0-c saves in ${outDir}`);
