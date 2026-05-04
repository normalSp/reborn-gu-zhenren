import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { ChoicePanel } from './ChoicePanel';
import { AttributeDetailPanel } from './AttributeDetailPanel';
import { EventLogPanel } from './EventLogPanel';
import { GuInventoryPanel } from './GuInventoryPanel';
import { KillMovePanel } from './KillMovePanel';
import { RefinePanel } from './RefinePanel';
import { AperturePanel } from './AperturePanel';
import { SVGMapPanel } from './SVGMapPanel';
import { CharacterPanel } from './CharacterPanel';
import { DaoMarkPanel } from './DaoMarkPanel';
import { BreakthroughAnimation } from './BreakthroughAnimation';
import { DiceRollAnimation } from './DiceRollAnimation';
import { SaveLoadDialog } from './SaveLoadDialog';
import { SettingsDialog } from './SettingsDialog';
import { BattleOverlay } from './BattleOverlay';
import { CombatOverlay } from './CombatOverlay';
import { NarrativeCombatPanel } from './NarrativeCombatPanel';
import { NPCInteractionPanel } from './NPCInteractionPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { MerchantPanel } from './MerchantPanel';
import { DebugOverlay } from './DebugOverlay';
import { GuEvolutionOverlay } from './GuEvolutionOverlay';
import { KillMoveCreationPanel } from './KillMoveCreationPanel';
import { AuctionPanel } from './AuctionPanel';
import { AchievementPanel } from './AchievementPanel';
import { AchievementToast } from './AchievementToast';
import { ChapterTransition } from './ChapterTransition';
import { useGamePipeline } from '../../hooks/useGamePipeline';
import { useAnimationBridge } from '../../hooks/useAnimationBridge';
import { useDeviceCapability } from '../../hooks/useDeviceCapability';
import { audioManager } from '../../utils/audio';
import { DOMAIN_BGM } from '../../store/slices/soundSlice';

type SidePanel = 'none' | 'attributes' | 'events' | 'gu_inventory' | 'kill_moves' | 'aperture' | 'map' | 'characters' | 'dao_marks' | 'merchant' | 'achievements' | 'refine';

// P3修复：地图标题改为动态，在渲染时根据currentDomain生成
const getPanelTitle = (panel: SidePanel, currentDomain: string): string => {
  if (panel === 'map') return currentDomain ? `${currentDomain}舆图` : '舆图';
  if (panel === 'none') return '';
  const titles: Record<string, string> = {
    attributes: '蛊师详情',
    events: '事件日志',
    gu_inventory: '蛊虫',
    kill_moves: '杀招列表',
    refine: '炼蛊',
    aperture: '空窍状态',
    characters: '人物图鉴',
    dao_marks: '流派道痕',
    merchant: '商会',
    achievements: '成就',
  };
  return titles[panel] || '';
};

const panelContent = (panel: SidePanel) => {
  switch (panel) {
    case 'attributes': return <AttributeDetailPanel />;
    case 'events': return <EventLogPanel />;
    case 'gu_inventory': return <GuInventoryPanel />;
    case 'kill_moves': return <KillMovePanel />;
    case 'refine': return <RefinePanel />;
    case 'aperture': return <AperturePanel />;
    case 'map': return <SVGMapPanel />;
    case 'characters': return <CharacterPanel />;
    case 'dao_marks': return <DaoMarkPanel />;
    case 'merchant': return <MerchantPanel />;
    case 'achievements': return <AchievementPanel />;
    default: return null;
  }
};

interface ToolbarButton { id: SidePanel; label: string; }

// P3修复：工具栏标签支持动态域（地图按钮根据currentDomain动态生成）
const TOOLBAR_BUTTONS_BASE: ToolbarButton[] = [
  { id: 'attributes', label: '蛊师属性' },
  { id: 'gu_inventory', label: '蛊虫' },
  { id: 'kill_moves', label: '杀招列表' },
  { id: 'refine', label: '炼蛊' },
  { id: 'aperture', label: '空窍状态' },
  { id: 'characters', label: '人物图鉴' },
  { id: 'dao_marks', label: '流派道痕' },
  { id: 'merchant', label: '商会' },
  { id: 'achievements', label: '成就' },
  { id: 'events', label: '事件日志' },
];

const toolbarBtnClass = (active: boolean) =>
  `text-[11px] font-button px-2 py-1 rounded-sm transition-micro whitespace-nowrap shrink-0 ${
    active
      ? 'bg-rg-gold/15 text-rg-gold border border-rg-gold/25'
      : 'text-rg-paper-200/50 border border-rg-ink-300/20 hover:border-rg-gold/30 hover:text-rg-paper-100'
  }`;

export function GameScreen() {
  const { pipeState, validation, startGame, submitChoice, retry } = useGamePipeline();
  const screenState = useStore(s => s.screenState);
  const gameLoadVersion = useStore(s => s.gameLoadVersion);
  const startedRef = useRef(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');

  // M7 Phase 4: 设备能力检测（驱动 Motion Spring 分级降级）
  const deviceCap = useDeviceCapability();

  // ─── P4修复: BGM 自动切换 — 域变化 → crossFade ───
  const currentDomain = useStore(s => s.currentDomain);
  const prevDomainRef = useRef<typeof currentDomain>(currentDomain);
  useEffect(() => {
    if (currentDomain !== prevDomainRef.current) {
      const bgmUrl = DOMAIN_BGM[currentDomain];
      if (bgmUrl) {
        audioManager.crossFade(`/audio/${bgmUrl}`, 1.5);
        console.log(`[BGM] 域切换: ${prevDomainRef.current} → ${currentDomain} (${bgmUrl})`);
      }
      prevDomainRef.current = currentDomain;
    }
    // 首次进入游戏：播放当前域 BGM
    if (!prevDomainRef.current && currentDomain && !startedRef.current) {
      const bgmUrl = DOMAIN_BGM[currentDomain];
      if (bgmUrl) {
        audioManager.playBgm(`/audio/${bgmUrl}`);
        console.log(`[BGM] 开局播放: ${currentDomain} (${bgmUrl})`);
      }
    }
  }, [currentDomain]);

  // M7: GSAP 动画桥接（监听章节过渡/杀招/名场面）
  useAnimationBridge();

  // ─── P2修复: 成就面板开关（store 驱动） ───
  const isAchievementPanelOpen = useStore(s => s.isAchievementPanelOpen);
  useEffect(() => {
    if (isAchievementPanelOpen) {
      setSidePanel('achievements');
    } else if (sidePanel === 'achievements') {
      setSidePanel('none');
    }
  }, [isAchievementPanelOpen]);

  useEffect(() => {
    // ═══ BugFix: 读档触发 — gameLoadVersion>0 表示存档已被加载，需要重新拉取 AI 叙事 ═══
    if (screenState === 'game_play' && gameLoadVersion > 0 && startedRef.current) {
      startedRef.current = false;
    }

    if (screenState === 'game_play' && !startedRef.current) {
      startedRef.current = true;
      // ─── M4: 续档检测 — turn>1 表示有存档数据，走续档流程（标准提示词+不推进回合） ───
      const turn = useStore.getState().turn;
      const isResume = turn > 1;
      startGame(isResume);
    }
    // ═══ BugFix: 离开游戏界面时重置启动标记，确保重入轮回后能重新触发开局 ═══
    if (screenState !== 'game_play') {
      startedRef.current = false;
    }
  }, [screenState, startGame, gameLoadVersion]);

  const closePanel = () => {
    // 如果是成就面板关闭，同步 store 标志
    if (sidePanel === 'achievements') {
      useStore.getState().toggleAchievementPanel();
    }
    setSidePanel('none');
  };
  const togglePanel = (id: SidePanel) => {
    // 如果是成就面板切换，同步 store 标志
    if (id === 'achievements') {
      useStore.getState().toggleAchievementPanel();
    } else if (sidePanel === 'achievements') {
      useStore.getState().toggleAchievementPanel();
    }
    setSidePanel(sidePanel === id ? 'none' : id);
  };

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col relative gu-noise-overlay gu-bg-paper" data-device-tier={deviceCap.tier}>
      {/* ─── 宣纸纹理底层（P4材质激活）─── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* ─── 深渊渐变暗角（P4空间深度）─── */}
      <div className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(13,13,18,0.55) 85%, rgba(13,13,18,0.82) 100%)',
        }}
      />
      {/* ─── 顶部状态条 ─── */}
      <StatusBar />

      {/* ─── 主体区域 (叙事 + 侧栏) ─── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* 叙事主区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          <NarrativePanel validation={validation} />
          <ChoicePanel onSelect={submitChoice} onRetry={retry} pipelineState={pipeState} />
        </div>

        {/* 桌面端：右侧栏 */}
        {sidePanel !== 'none' && (
          <div className="hidden md:flex w-80 lg:w-96 border-l border-rg-ink-300/12 bg-rg-ink-800 flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-2 bg-rg-ink-700/90 border-b border-rg-ink-300/12">
              <span className="text-rg-paper-200/80 text-xs font-panel font-semibold">
                {getPanelTitle(sidePanel, currentDomain)}
              </span>
              <button
                onClick={closePanel}
                className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
              >
                关闭
              </button>
            </div>
            {panelContent(sidePanel)}
          </div>
        )}

        {/* 移动端：底部抽屉 */}
        {sidePanel !== 'none' && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-rg-ink-800/60 backdrop-blur-sm" onClick={closePanel} />
            {/* 抽屉 */}
            <div className="relative bg-rg-ink-700/95 border-t border-rg-ink-300/15 rounded-t-xl max-h-[65vh] flex flex-col shadow-2xl animate-slide-up">
              {/* 关闭手柄 */}
              <div className="flex items-center justify-center py-2">
                <div className="w-10 h-1 bg-rg-ink-300/30 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-rg-paper-200/80 text-xs font-panel font-semibold">
                  {getPanelTitle(sidePanel, currentDomain)}
                </span>
                <button
                  onClick={closePanel}
                  className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
                >
                  关闭
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {panelContent(sidePanel)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 覆盖层 ─── */}
      <AuctionPanel />
      <KillMoveCreationPanel />
      <BattleOverlay />
      <CombatOverlay />
      <NarrativeCombatPanel onSelectStrategem={(strategy) => submitChoice(strategy)} />
      <NPCInteractionPanel />
      <BreakthroughAnimation />
      <DiceRollAnimation />
      <SaveLoadDialog />
      <SettingsDialog />
      <TutorialOverlay />
      <DebugOverlay />
      <GuEvolutionOverlay />
      <AchievementToast />
      <ChapterTransition />

      {/* ─── M7: 名场面涟漪叠加层（GSAP Timeline 目标） ─── */}
      <div
        className="event-vignette"
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 60,
          transition: 'none',
        }}
      />
      <div
        className="event-name"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) scale(0.3)',
          opacity: 0,
          fontSize: '48px',
          fontWeight: 'bold',
          fontFamily: '"Serif", serif',
          letterSpacing: '0.1em',
          pointerEvents: 'none',
          zIndex: 62,
          textAlign: 'center',
          color: 'var(--gu-trace-gold)',
        }}
      />
      {/* 涟漪三环 */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`ripple-ring-${i}`}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: `${120 + i * 80}px`,
            height: `${120 + i * 80}px`,
            marginLeft: `-${(120 + i * 80) / 2}px`,
            marginTop: `-${(120 + i * 80) / 2}px`,
            borderRadius: '50%',
            border: '2px solid var(--gu-trace-gold-dim)',
            opacity: 0,
            transform: 'scale(0.5)',
            pointerEvents: 'none',
            zIndex: 61,
          }}
        />
      ))}

      {/* ─── 底部工具栏 ─── */}
      <div className="bg-rg-ink-700/90 px-3 sm:px-6 py-2 border-t border-rg-ink-300/12 flex items-center justify-between backdrop-blur-md gap-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-1 min-w-0">
          {/* P3修复：地图按钮标签根据currentDomain动态生成 */}
          <button
            onClick={() => togglePanel('map' as SidePanel)}
            className={toolbarBtnClass(sidePanel === 'map')}
          >
            {currentDomain ? `${currentDomain}舆图` : '舆图'}
          </button>
          {TOOLBAR_BUTTONS_BASE.map(btn => (
            <button
              key={btn.id}
              onClick={() => togglePanel(btn.id)}
              className={toolbarBtnClass(sidePanel === btn.id)}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <p className="text-rg-ink-400 text-[9px] sm:text-[10px] font-panel shrink-0 hidden sm:block">
          蛊真人世界 · v0.5.0
        </p>
      </div>

      {/* 底部抽屉动画关键帧 */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
