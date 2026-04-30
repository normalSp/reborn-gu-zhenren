// ─── 天赋品级→点数消耗映射 ───
export const TALENT_COST: Record<string, number> = { white: 0, blue: 1, purple: 2, orange: 3, red: 4, gold: 5 };

import type { Talent } from '../types';

// ─── 初始天赋池（角色创建时可选） ───
// cost: 天赋所需点数，TALENT_COST按tier映射
export const INITIAL_TALENTS: Talent[] = [
  {
    id: 'talent_fire_body',
    name: '炎道之体', tier: 'purple',
    description: '天生对火行蛊虫有亲和力，炼化炎道蛊虫降低半级难度',
    benefits: ['炎道蛊虫炼化难度-0.5级', '炎道杀招威力+15%', '初始炎道亲和+2'],
    costs: ['水道蛊虫炼化难度+1级', '水系环境真元消耗+20%'],
  },
  {
    id: 'talent_iron_bones',
    name: '铁骨', tier: 'purple',
    description: '骨骼异于常人，天生适合力道修行',
    benefits: ['体魄+2', '力道杀招威力+20%', '肉身反噬承受+30%'],
    costs: ['智道亲和-2', '心智上限-1'],
  },
  {
    id: 'talent_hundred_refinements',
    name: '百炼蛊师', tier: 'orange',
    description: '在无数次炼蛊失败中成长的炼蛊天才',
    benefits: ['炼蛊成功率+15%', '初始炼道亲和+3', '蛊虫反噬伤害-20%'],
    costs: ['战斗属性全面-1'],
  },
  {
    id: 'talent_keen_mind',
    name: '天机之心', tier: 'orange',
    description: '心智异于常人，擅长布局和算计',
    benefits: ['心智+2', '计谋类选项成功率+25%', '幻术抗性+30%'],
    costs: ['体魄-1', '初始气运-1'],
  },
  {
    id: 'talent_blood_moon',
    name: '血月之体', tier: 'red',
    description: '稀有体质，以自身精血强化蛊虫，但寿命受损',
    benefits: ['所有蛊虫威力+25%', '血道亲和+4', '濒死时爆发"血怒"状态'],
    costs: ['每突破大境界消耗HP上限10%', '生命真元上限-20%', '正道势力初始冷淡'],
  },
  {
    id: 'talent_lucky_star',
    name: '福星高照', tier: 'gold',
    description: '天生运道极佳，奇遇连连',
    benefits: ['气运+3', '奇遇概率+40%', '灾劫强度降低20%'],
    costs: ['初始资质-1', '遭人嫉妒:部分NPC初始关系降低'],
  },
  {
    id: 'talent_cloud_dao_heart',
    name: '云中客', tier: 'blue',
    description: '心性淡泊，不争不抢，修行增长稳定',
    benefits: ['所有道痕积累速度+10%', '心魔抗性+50%', '突破稳定性+15%'],
    costs: ['战斗杀招威力-10%', '势力影响力积累速度-20%'],
  },
  {
    id: 'talent_ordinary',
    name: '凡人', tier: 'white',
    description: '没有特别的天赋，也没有特别的弱点。平凡即是最大的武器。',
    benefits: ['无任何负面修正', '所有属性检定无惩罚'],
    costs: ['无任何正面加成'],
  },
];

// ─── 天赋稀有度颜色映射 ───
export const TIER_COLORS: Record<Talent['tier'], string> = {
  gold: 'text-rg-gold',
  red: 'text-rg-blood-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  white: 'text-rg-paper-200/50',
};

export const TIER_LABELS: Record<Talent['tier'], string> = {
  gold: '金品',
  red: '红品',
  orange: '橙品',
  purple: '紫品',
  blue: '蓝品',
  white: '白品',
};
