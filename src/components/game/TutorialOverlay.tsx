import { useState, useEffect } from 'react';
import { useStore } from '../../store';
import type { TutorialState } from '../../store/slices/tutorialSlice';

interface TutorialPage {
  title: string;
  content: string;
}

// ═══ P3修复: 五域定制新手引导（按全书覆盖大纲 Sec 4.1 五域开局体验差异化设计） ═══
const DOMAIN_TUTORIALS: Record<string, TutorialPage[]> = {
  '南疆': [
    {
      title: '开窍与资质',
      content: '蛊师的资质决定修行上限。甲等-丁等+十绝体分级中，资质越高真元容量越大。你出生在南疆古月山寨，这里是家族势力盘踞之地——资源有限，旁系与嫡系之争从未停息。',
    },
    {
      title: '山寨秩序',
      content: '南疆的法则简单而残酷：弱肉强食。山寨内等级森严，炼蛊房名额有限，家族里的赤脉与漠脉明争暗斗。你的出身和天赋决定起步地位，但蛊界从不为任何人停留。',
    },
    {
      title: '风险与选择',
      content: '每个选项都有明确风险等级。高风险选项可能带来巨大回报或致命后果。南疆的丛林法则告诉每一个蛊师：机缘必有代价，选择必有后果。没有免费的午餐。',
    },
    {
      title: '蛊虫与修行',
      content: '蛊虫是蛊师战斗与生存的核心。每种蛊虫有特定喂养方式——月光蛊须月下喂养，春秋蝉需时间道痕滋养。底部工具栏可查看蛊虫图鉴、杀招列表、空窍状态。存档和设置按钮在状态栏右侧。',
    },
  ],
  '中洲': [
    {
      title: '宗门入门',
      content: '中洲是蛊界修行体系最完整的地方——十大门派、严密戒律、师承制度。你刚通过宗门入门考核，被分配到一位师父门下。在中洲，师承关系将决定你日后的所有可能性。',
    },
    {
      title: '正道规则',
      content: '中洲的秩序森严。戒律堂执法、宗门贡献值体系、十大古派议事厅——规则保护了弱者，也制造了困境。当"按规定办事"和"按良心办事"冲突时，你站在哪边？',
    },
    {
      title: '天庭阴影',
      content: '天庭是中洲秩序的终极守护者，也是一双无处不在的监视之眼。你在宗门晋升得越顺利，天庭的注意就越多。被天庭注意到是好事还是坏事？这取决于你想成为什么样的人。',
    },
    {
      title: '蛊虫与修行',
      content: '蛊虫是蛊师的核心战力。每种蛊虫有特定喂养需求。十大古派的传功堂有最完整的蛊方传承，但品质越高的蛊方越需要宗门贡献值兑换。底部工具栏可查看蛊虫图鉴和杀招列表。',
    },
  ],
  '北原': [
    {
      title: '血脉觉醒',
      content: '北原的法则刻在血脉里。黄金家族的血统体系决定了你在部落中的地位。你出生在草原游牧部落，血脉中流淌着远古的力量——觉醒的时机和强度将决定你是战士还是奴隶。',
    },
    {
      title: '部落生存',
      content: '草原上没有永远的营地。每一次狩猎、每一场部落间的战斗都是生存之战。战功是唯一的晋升阶梯——猎物是你的勋章，敌人的首级是你的履历。失败者没有第二次机会。',
    },
    {
      title: '王者之道',
      content: '北原盛出力道蛊师。黄金家族的王庭是权力心脏，长生天势力是草原背后永远的守望者。巨阳先祖的血脉在这里最浓——但血脉既是馈赠，也是诅咒。',
    },
    {
      title: '蛊虫与战斗',
      content: '蛊虫在北原不是修行工具，是杀敌兵器。力道蛊师以体魄和力量为核心，蛊虫服务于战斗而非修行。底部工具栏可随时查看蛊虫图鉴、空窍状态。',
    },
  ],
  '东海': [
    {
      title: '散修之路',
      content: '东海没有宗门。你出生在一座小岛上，蛊师修行靠的不是宗门分配资源——是师父传的私藏蛊方，是荒岛上偶然发现的远古遗物。在东海，自由不是权利，是你用命换来的特权。',
    },
    {
      title: '海岛探索',
      content: '东海是群岛的世界。每座岛有自己的规则，航行在各岛之间是你的人生常态。有些岛上藏着远古传承，有些岛上潜伏着致命危险。海上的风浪是第一个师父——它不教你礼貌。',
    },
    {
      title: '自由与代价',
      content: '东海散修的自由是真的——没有人管你今天该练什么蛊。孤独也是真的——风暴来临时没有门派会派人救你。散修联盟尚未成型，你必须在自由与安全之间找到自己的平衡。',
    },
    {
      title: '蛊虫与交易',
      content: '东海的水道蛊虫最多，海商们掌握着五域最广泛的交易网络。蛊虫在东海是你最重要的交易筹码。底部工具栏的蛊虫图鉴记录了每只蛊的喂养需求。',
    },
  ],
  '西漠': [
    {
      title: '绿洲城邦',
      content: '西漠是沙漠与绿洲的世界。每一口水井都有人守护，每片绿洲都是鲜血浇灌的。你出生在绿洲聚落，水资源分配决定了家族的生死——控制水井的家族控制一切。',
    },
    {
      title: '沙漠法则',
      content: '西漠资源最匮乏，沙匪横行，商队穿越沙漠是九死一生。古老的遗迹埋在黄沙之下，人祖的传说从这里诞生。每一粒沙可能掩盖着上古的秘密，也可能只是沙。',
    },
    {
      title: '人祖遗迹',
      content: '西漠是人祖传说的发源地。蓝海秘境隐藏在沙漠深处——传说那里保存着人祖留给后世的遗产。但所有去过蓝海的人都没有回来过，或者回来的不再是原来的人。',
    },
    {
      title: '蛊虫与生存',
      content: '在西漠，一只好的蛊虫可能比一座绿洲更珍贵。沙漠环境极度考验蛊虫的生存能力——不是每只蛊都能在沙漠中存活。底部工具栏可查看蛊虫图鉴、空窍状态。',
    },
  ],
};

export function TutorialOverlay() {
  const screenState = useStore(s => s.screenState);
  const currentDomain = useStore(s => s.currentDomain);
  // ═══ P3修复: 接入tutorialSlice FSM，替代独立localStorage ═══
  const tutorialState = useStore(s => s.tutorialState) as TutorialState;
  const currentStep = useStore(s => s.currentStep);
  const startTutorial = useStore(s => s.startTutorial);
  const advanceStep = useStore(s => s.advanceStep);
  const skipTutorial = useStore(s => s.skipTutorial);
  const completeTutorial = useStore(s => s.completeTutorial);

  // P3: 根据当前域选择教程页，未知域回退到南疆默认
  const PAGES = DOMAIN_TUTORIALS[currentDomain] || DOMAIN_TUTORIALS['南疆'];

  useEffect(() => {
    // 进入game_play时首次触发教程FSM（tutorialSlice内部会检查已完成/跳过标记）
    if (screenState === 'game_play' && tutorialState === 'inactive') {
      startTutorial();
    }
  }, [screenState, tutorialState, startTutorial]);

  // 教程不在active状态时不显示
  if (tutorialState !== 'active') return null;
  const show = true;

  const p = PAGES[currentStep];
  if (!p) return null; // 防御：步骤索引越界

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={skipTutorial}>
      <div className="absolute inset-0 bg-rg-ink-800/80 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-xl p-6 max-w-sm w-full mx-4 backdrop-blur-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-rg-gold font-narrative text-lg mb-1">{p.title}</h2>
        <div className="flex items-center gap-1 mb-4">
          {PAGES.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === currentStep ? 'bg-rg-gold' : 'bg-rg-ink-300/30'}`} />
          ))}
        </div>
        <p className="text-rg-paper-200/80 text-sm font-panel leading-relaxed mb-5">{p.content}</p>
        <div className="flex justify-between">
          <button
            onClick={() => currentStep > 0 && useStore.setState({ currentStep: currentStep - 1 })}
            disabled={currentStep === 0}
            className="text-xs font-button px-3 py-1 rounded-sm border border-rg-ink-300/20 text-rg-paper-200/50 disabled:opacity-20 transition-micro"
          >
            上页
          </button>
          {currentStep < PAGES.length - 1 ? (
            <button
              onClick={advanceStep}
              className="text-xs font-button px-3 py-1 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
            >
              下页
            </button>
          ) : (
            <button
              onClick={completeTutorial}
              className="text-xs font-button px-3 py-1 rounded-sm bg-rg-gold/15 border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
            >
              踏入蛊界
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
