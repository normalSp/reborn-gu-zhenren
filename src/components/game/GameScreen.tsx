import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { useStore } from '../../store';
import type { DialogueTopic, KeyEvent } from '../../types';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { ChoicePanel } from './ChoicePanel';
import { BreakthroughAnimation } from './BreakthroughAnimation';
import { DiceRollAnimation } from './DiceRollAnimation';
import { useGamePipeline } from '../../hooks/useGamePipeline';
import { useAnimationBridge } from '../../hooks/useAnimationBridge';
import { useDeviceCapability } from '../../hooks/useDeviceCapability';
import { audioManager } from '../../utils/audio';
import { DOMAIN_BGM } from '../../store/slices/soundSlice';
import type { OriginDefinition } from '../../store/slices/originUnlockSlice';
import originsData from '../../canon/origins.json';

type SidePanel = 'none' | 'attributes' | 'events' | 'gu_inventory' | 'kill_moves' | 'aperture' | 'aperture_management' | 'map' | 'characters' | 'dao_marks' | 'merchant' | 'achievements' | 'refine' | 'material_bag' | 'training_ground' | 'squad' | 'actions' | 'story_anchor' | 'ending' | 'inheritance';

const lazyNamed = <T extends ComponentType<any>>(
  loader: () => Promise<Record<string, any>>,
  exportName: string,
) => lazy(async () => ({ default: (await loader())[exportName] as T }));

const AttributeDetailPanel = lazyNamed(() => import('./AttributeDetailPanel'), 'AttributeDetailPanel');
const EventLogPanel = lazyNamed(() => import('./EventLogPanel'), 'EventLogPanel');
const GuInventoryPanel = lazyNamed(() => import('./GuInventoryPanel'), 'GuInventoryPanel');
const KillMovePanel = lazyNamed(() => import('./KillMovePanel'), 'KillMovePanel');
const RefinePanel = lazyNamed(() => import('./RefinePanel'), 'RefinePanel');
const AperturePanel = lazyNamed(() => import('./AperturePanel'), 'AperturePanel');
const SVGMapPanel = lazyNamed(() => import('./SVGMapPanel'), 'SVGMapPanel');
const CharacterPanel = lazyNamed(() => import('./CharacterPanel'), 'CharacterPanel');
const DaoMarkPanel = lazyNamed(() => import('./DaoMarkPanel'), 'DaoMarkPanel');
const MerchantPanel = lazyNamed(() => import('./MerchantPanel'), 'MerchantPanel');
const AchievementPanel = lazyNamed(() => import('./AchievementPanel'), 'AchievementPanel');
const MaterialBagPanel = lazyNamed(() => import('./MaterialBagPanel'), 'MaterialBagPanel');
const ApertureManagementPanel = lazyNamed(() => import('./ApertureManagementPanel'), 'ApertureManagementPanel');
const TrainingGroundPanel = lazyNamed(() => import('./TrainingGroundPanel'), 'TrainingGroundPanel');
const SquadFormationPanel = lazyNamed(() => import('./SquadFormationPanel'), 'SquadFormationPanel');
const ActionPanel = lazyNamed(() => import('./ActionPanel'), 'ActionPanel');
const StoryAnchorPanel = lazyNamed(() => import('./StoryAnchorPanel'), 'StoryAnchorPanel');
const EndingResolverPanel = lazyNamed(() => import('./EndingResolverPanel'), 'EndingResolverPanel');
const InheritanceLandPanel = lazyNamed(() => import('./InheritanceLandPanel'), 'InheritanceLandPanel');

const SaveLoadDialog = lazyNamed(() => import('./SaveLoadDialog'), 'SaveLoadDialog');
const SettingsDialog = lazyNamed(() => import('./SettingsDialog'), 'SettingsDialog');
const BattleOverlay = lazyNamed(() => import('./BattleOverlay'), 'BattleOverlay');
const CombatOverlay = lazyNamed(() => import('./CombatOverlay'), 'CombatOverlay');
const SquadCombatOverlay = lazyNamed(() => import('./SquadCombatOverlay'), 'SquadCombatOverlay');
const BattlefieldCombatOverlay = lazyNamed(() => import('./BattlefieldCombatOverlay'), 'BattlefieldCombatOverlay');
const BattleFlashOverlay = lazyNamed(() => import('./BattleFlashOverlay'), 'BattleFlashOverlay');
const NarrativeCombatPanel = lazyNamed(() => import('./NarrativeCombatPanel'), 'NarrativeCombatPanel');
const NPCInteractionPanel = lazyNamed(() => import('./NPCInteractionPanel'), 'NPCInteractionPanel');
const TutorialOverlay = lazyNamed(() => import('./TutorialOverlay'), 'TutorialOverlay');
const DebugOverlay = lazyNamed(() => import('./DebugOverlay'), 'DebugOverlay');
const GuEvolutionOverlay = lazyNamed(() => import('./GuEvolutionOverlay'), 'GuEvolutionOverlay');
const KillMoveCreationPanel = lazyNamed(() => import('./KillMoveCreationPanel'), 'KillMoveCreationPanel');
const AuctionPanel = lazyNamed(() => import('./AuctionPanel'), 'AuctionPanel');
const AchievementToast = lazyNamed(() => import('./AchievementToast'), 'AchievementToast');
const ChapterTransition = lazyNamed(() => import('./ChapterTransition'), 'ChapterTransition');

function PanelFallback() {
  return <div className="p-4 text-xs text-rg-paper-200/45 font-panel">载入中...</div>;
}

// P3修复：地图标题改为动态，在渲染时根据currentDomain生成
const getPanelTitle = (panel: SidePanel, currentDomain: string, isImmortal: boolean): string => {
  if (panel === 'map') return currentDomain ? `${currentDomain}舆图` : '舆图';
  if (panel === 'none') return '';
  const titles: Record<string, string> = {
    attributes: '蛊师详情',
    events: '事件日志',
    gu_inventory: '蛊虫',
    kill_moves: '杀招列表',
    refine: '炼蛊',
    material_bag: '蛊材',
    aperture: isImmortal ? '仙窍' : '空窍状态',
    characters: '人物图鉴',
    dao_marks: '流派道痕',
    merchant: '商会',
    achievements: '成就',
    training_ground: '道场修炼',
    squad: '小队编成',
    actions: '行动',
    story_anchor: '宿命',
    ending: '终局',
    inheritance: '传承',
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
    case 'material_bag': return <MaterialBagPanel />;
    case 'aperture': return <AperturePanel />;
    case 'aperture_management': return <ApertureManagementPanel />;
    case 'map': return <SVGMapPanel />;
    case 'characters': return <CharacterPanel />;
    case 'dao_marks': return <DaoMarkPanel />;
    case 'merchant': return <MerchantPanel />;
    case 'achievements': return <AchievementPanel />;
    case 'training_ground': return <TrainingGroundPanel />;
    case 'squad': return <SquadFormationPanel />;
    case 'actions': return <ActionPanel />;
    case 'story_anchor': return <StoryAnchorPanel />;
    case 'ending': return <EndingResolverPanel />;
    case 'inheritance': return <InheritanceLandPanel />;
    default: return null;
  }
};

interface ToolbarButton { id: SidePanel; label: string; }

// P3修复：工具栏标签支持动态域（地图按钮根据currentDomain动态生成）
const TOOLBAR_BUTTONS_BASE: ToolbarButton[] = [
  { id: 'actions', label: '行动' },
  { id: 'inheritance', label: '传承' },
  { id: 'story_anchor', label: '宿命' },
  { id: 'ending', label: '终局' },
  { id: 'attributes', label: '蛊师属性' },
  { id: 'gu_inventory', label: '蛊虫' },
  { id: 'kill_moves', label: '杀招列表' },
  { id: 'refine', label: '炼蛊' },
  { id: 'material_bag', label: '蛊材' },
  { id: 'aperture', label: '空窍状态' },
  { id: 'characters', label: '人物图鉴' },
  { id: 'squad', label: '小队' },
  { id: 'dao_marks', label: '流派道痕' },
  { id: 'merchant', label: '商会' },
  { id: 'achievements', label: '成就' },
  { id: 'training_ground', label: '道场' },
  { id: 'events', label: '事件日志' },
];

const toolbarBtnClass = (active: boolean) =>
  `rg-toolbar-btn rg-focus-ring shrink-0 ${active ? 'is-active' : ''}`;

export function GameScreen() {
  const { pipeState, validation, startGame, submitChoice, retry } = useGamePipeline();
  const screenState = useStore(s => s.screenState);
  const gameLoadVersion = useStore(s => s.gameLoadVersion);
  const initBattlefieldDemo = useStore((s: any) => s.initBattlefieldDemo);
  const initBattlefieldGroupDemo = useStore((s: any) => s.initBattlefieldGroupDemo);
  const initBattlefieldLargeGroupDemo = useStore((s: any) => s.initBattlefieldLargeGroupDemo);
  const startedRef = useRef(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');

  // M7 Phase 4: 设备能力检测（驱动 Motion Spring 分级降级）
  const deviceCap = useDeviceCapability();

  // ─── P4修复: BGM 自动切换 — 域变化 → crossFade ───
  const currentDomain = useStore(s => s.currentDomain);
  const isImmortal = useStore(s => (s.profile?.realm?.grand || 1) >= 6);
  const prevDomainRef = useRef<typeof currentDomain | null>(null);
  useEffect(() => {
    if (!currentDomain) return;
    const bgmUrl = DOMAIN_BGM[currentDomain];
    if (!bgmUrl) return;
    if (!startedRef.current) {
      audioManager.playBgm(`/audio/${bgmUrl}`);
      startedRef.current = true;
      prevDomainRef.current = currentDomain;
      console.log(`[BGM] 开局播放: ${currentDomain} (${bgmUrl})`);
      return;
    }
    if (currentDomain !== prevDomainRef.current) {
      audioManager.crossFade(`/audio/${bgmUrl}`, 1.5);
      console.log(`[BGM] 域切换: ${prevDomainRef.current} → ${currentDomain} (${bgmUrl})`);
      prevDomainRef.current = currentDomain;
    }
  }, [currentDomain]);

  // M7: GSAP 动画桥接（监听章节过渡/杀招/名场面）
  useAnimationBridge();

  // ═══ Fix#3: narrativeSlice 集成 — 监听叙事变化，记录关键事件与滚动摘要 ═══
  const narrative = useStore(s => s.currentNarrative);
  const messages = useStore(s => s.messages);
  const prevNarrativeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!narrative?.narrative?.text) return;
    const text = narrative.narrative.text;

    // updateSummary: 基于最近消息生成滚动摘要
    if (messages.length > 0) {
      const recentMessages = messages.slice(-5);
      const summary = recentMessages
        .map(m => m.role === 'user' ? `[选择]${m.content.slice(0, 30)}` : m.content.slice(0, 60))
        .join(' | ');
      useStore.getState().updateSummary(summary);
    }

    // addKeyEvent: 检测关键叙事事件
    if (text !== prevNarrativeRef.current) {
      prevNarrativeRef.current = text;
      const keyEventPatterns: Array<{ pattern: RegExp; type: string }> = [
        { pattern: /突破|晋升|升仙|雷劫|灾劫|天劫/, type: 'breakthrough' },
        { pattern: /战斗|决斗|搏杀|厮杀|酣战/, type: 'combat' },
        { pattern: /白凝冰|古月方源|商心慈|商拓海|太白云生/, type: 'key_npc' },
        { pattern: /宝黄天|拍卖|竞价/, type: 'auction' },
        { pattern: /人祖|传说|十子/, type: 'lore' },
        { pattern: /死|亡|陨落|绝境|垂死/, type: 'danger' },
        { pattern: /蛊方|炼蛊|配方|融合/, type: 'refine' },
      ];
      for (const { pattern, type } of keyEventPatterns) {
        if (pattern.test(text)) {
          const importance: 1 | 2 | 3 = type === 'breakthrough' || type === 'danger' ? 3 : 2;
          useStore.getState().addKeyEvent({
            id: `ke_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: type as KeyEvent['type'],
            turn: useStore.getState().turn,
            summary: text.slice(0, 80),
            importance,
            timestamp: Date.now(),
            relatedNPCs: [],
          });
          break; // 每条叙事仅记录一个关键事件
        }
      }
    }
  }, [narrative, messages]);

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

      // ═══ Fix#1: 加载起源定义（修复 originUnlockSlice 静默失效） ═══
      try {
        const origins = ((originsData as any).origins || []) as OriginDefinition[];
        if (origins.length > 0) {
          useStore.getState().loadOriginDefinitions(origins);
          console.log(`[OriginUnlock] 加载起源定义: ${origins.length}条`);
        }
      } catch (err) {
        console.warn('[OriginUnlock] 起源定义加载失败，系统静默降级', err);
      }

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
    <div className="rg-game-shell min-h-[100dvh] bg-rg-ink-800 flex flex-col relative gu-noise-overlay gu-bg-paper" data-device-tier={deviceCap.tier} data-testid="game-screen-shell">
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
          <div className="rg-side-panel hidden md:flex w-80 lg:w-96 bg-rg-ink-800 flex-col shrink-0" data-testid="desktop-side-panel">
            <div className="rg-side-panel-header flex items-center justify-between px-4 py-2">
              <span className="text-rg-paper-200/80 text-xs font-panel font-semibold">
                {getPanelTitle(sidePanel, currentDomain, isImmortal)}
              </span>
              <button
                onClick={closePanel}
                className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
              >
                关闭
              </button>
            </div>
            <Suspense fallback={<PanelFallback />}>
              {panelContent(sidePanel)}
            </Suspense>
          </div>
        )}

        {/* 移动端：底部抽屉 */}
        {sidePanel !== 'none' && (
          <div
            className="md:hidden fixed inset-x-0 top-0 z-40 flex flex-col justify-end"
            style={{ bottom: '56px' }}
          >
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-rg-ink-800/60 backdrop-blur-sm" onClick={closePanel} />
            {/* 抽屉 */}
            <div className="rg-mobile-sheet relative rounded-t-xl max-h-[70vh] flex flex-col animate-slide-up" data-testid="mobile-side-sheet">
              {/* 关闭手柄 */}
              <div className="flex items-center justify-center py-2">
                <div className="w-10 h-1 bg-rg-ink-300/30 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="text-rg-paper-200/80 text-xs font-panel font-semibold">
                  {getPanelTitle(sidePanel, currentDomain, isImmortal)}
                </span>
                <button
                  onClick={closePanel}
                  className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
                >
                  关闭
                </button>
              </div>
              <div className="rg-scrollable flex-1 overflow-y-auto">
                <Suspense fallback={<PanelFallback />}>
                  {panelContent(sidePanel)}
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 覆盖层 ─── */}
      <Suspense fallback={null}>
        <AuctionPanel />
        <KillMoveCreationPanel />
        <BattleOverlay />
        <CombatOverlay />
        <SquadCombatOverlay />
        <BattlefieldCombatOverlay />
        <BattleFlashOverlay />
        <NarrativeCombatPanel onSelectStrategem={(strategy) => submitChoice(strategy)} />
        <NPCInteractionPanel
          onSubmitDialogueTopic={(topic: DialogueTopic) => submitChoice(`dialogue:${topic}`)}
          onSubmitDialogueActionCard={(cardId: string) => submitChoice(`dialogue_choice:${cardId}`)}
        />
      </Suspense>
      <BreakthroughAnimation />
      <DiceRollAnimation />
      <Suspense fallback={null}>
        <SaveLoadDialog />
        <SettingsDialog />
        <TutorialOverlay />
        <DebugOverlay />
        <GuEvolutionOverlay />
        <AchievementToast />
        <ChapterTransition />
      </Suspense>

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
      <div className="rg-bottom-nav px-3 sm:px-6 py-2 flex items-center justify-between backdrop-blur-md gap-2" data-testid="bottom-nav">
        <div className="rg-scrollable flex items-center gap-1 sm:gap-2 overflow-x-auto flex-1 min-w-0 pb-1">
          {/* P3修复：地图按钮标签根据currentDomain动态生成 */}
          <button
            onClick={() => togglePanel('map' as SidePanel)}
            className={toolbarBtnClass(sidePanel === 'map')}
            data-testid="side-panel-map"
          >
            {currentDomain ? `${currentDomain}舆图` : '舆图'}
          </button>
          <button
            onClick={() => initBattlefieldDemo?.()}
            className={toolbarBtnClass(false)}
            data-testid="open-battlefield-demo"
            title="Debug/演武入口：正式战斗由剧情候选进入"
          >
            演武-凡战
          </button>
          <button
            onClick={() => initBattlefieldGroupDemo?.()}
            className={toolbarBtnClass(false)}
            data-testid="open-battlefield-group-demo"
            title="Debug/演武入口：正式群像战由剧情候选进入"
          >
            演武-群像
          </button>
          <button
            onClick={() => initBattlefieldLargeGroupDemo?.()}
            className={toolbarBtnClass(false)}
            data-testid="open-battlefield-large-group-demo"
            title="Debug/演武入口：正式大阵战由剧情候选进入"
          >
            演武-大阵
          </button>
          {TOOLBAR_BUTTONS_BASE.map(btn => (
            <button
              key={btn.id}
              onClick={() => togglePanel(btn.id)}
              className={toolbarBtnClass(sidePanel === btn.id)}
              data-testid={`side-panel-${btn.id}`}
            >
              {btn.id === 'aperture' && isImmortal ? '仙窍' : btn.label}
            </button>
          ))}
        </div>
        <p className="text-rg-ink-400 text-[9px] sm:text-[10px] font-panel shrink-0 hidden sm:block">
          蛊真人世界 · v0.8.0-c2.5
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
