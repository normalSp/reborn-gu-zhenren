import { useState, useEffect } from 'react';
import { useStore } from '../../store';

const TUTORIAL_KEY = 'gu-tutorial-done';

const PAGES = [
  {
    title: '蛊师四维',
    content: '蛊师的先天资质由四维属性决定：资质决定修行效率与真元容量（甲等-丁等+十绝体），体魄决定肉身强度与承受力，心智决定思虑深远，气运影响机缘多寡。属性可通过后天机缘改变，但大幅提升必有代价。',
  },
  {
    title: '道心四极',
    content: '每次选择都会影响道心倾向：杀性（果断）、仁心（怜悯）、谋略（智慧）、野心（进取）。道心倾向不直接显示善恶，而是影响后续机缘和NPC对你的态度。',
  },
  {
    title: '风险与选择',
    content: '每个选项都有明确风险等级。高风险选项可能带来巨大回报或致命后果，低风险选项更为稳妥但收获有限。蛊界没有免费的午餐——每个选择都要付出代价。',
  },
  {
    title: '蛊虫与修行',
    content: '蛊虫是蛊师战斗与生存的核心。每种蛊虫有特定喂养方式，不喂会饥饿虚弱甚至死亡。底部工具栏可随时查看蛊虫图鉴、杀招列表、空窍状态等详细信息。存档和设置按钮在状态栏右侧。',
  },
];

export function TutorialOverlay() {
  const screenState = useStore(s => s.screenState);
  const [show, setShow] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    // 仅在首次进入游戏时自动显示
    if (screenState === 'game_play' && !localStorage.getItem(TUTORIAL_KEY)) {
      setShow(true);
      setPage(0);
    }
  }, [screenState]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(TUTORIAL_KEY, '1');
  };

  if (!show) return null;

  const p = PAGES[page];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={dismiss}>
      <div className="absolute inset-0 bg-rg-ink-800/80 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-xl p-6 max-w-sm w-full mx-4 backdrop-blur-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-rg-gold font-narrative text-lg mb-1">{p.title}</h2>
        <div className="flex items-center gap-1 mb-4">
          {PAGES.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === page ? 'bg-rg-gold' : 'bg-rg-ink-300/30'}`} />
          ))}
        </div>
        <p className="text-rg-paper-200/80 text-sm font-panel leading-relaxed mb-5">{p.content}</p>
        <div className="flex justify-between">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-xs font-button px-3 py-1 rounded-sm border border-rg-ink-300/20 text-rg-paper-200/50 disabled:opacity-20 transition-micro"
          >
            上页
          </button>
          {page < PAGES.length - 1 ? (
            <button
              onClick={() => setPage(page + 1)}
              className="text-xs font-button px-3 py-1 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
            >
              下页
            </button>
          ) : (
            <button
              onClick={dismiss}
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
