import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { StatusBar } from './StatusBar';
import { NarrativePanel } from './NarrativePanel';
import { ChoicePanel } from './ChoicePanel';
import { AttributeDetailPanel } from './AttributeDetailPanel';
import { EventLogPanel } from './EventLogPanel';
import { GuInventoryPanel } from './GuInventoryPanel';
import { KillMovePanel } from './KillMovePanel';
import { AperturePanel } from './AperturePanel';
import { SVGMapPanel } from './SVGMapPanel';
import { CharacterPanel } from './CharacterPanel';
import { DaoMarkPanel } from './DaoMarkPanel';
import { BreakthroughAnimation } from './BreakthroughAnimation';
import { DiceRollAnimation } from './DiceRollAnimation';
import { SaveLoadDialog } from './SaveLoadDialog';
import { SettingsDialog } from './SettingsDialog';
import { BattleOverlay } from './BattleOverlay';
import { TutorialOverlay } from './TutorialOverlay';
import { MerchantPanel } from './MerchantPanel';
import { DebugOverlay } from './DebugOverlay';
import { useGamePipeline } from '../../hooks/useGamePipeline';

type SidePanel = 'none' | 'attributes' | 'events' | 'gu_inventory' | 'kill_moves' | 'aperture' | 'map' | 'characters' | 'dao_marks' | 'merchant';

const PANEL_TITLES: Record<SidePanel, string> = {
  none: '',
  attributes: '蛊师详情',
  events: '事件日志',
  gu_inventory: '蛊虫图鉴',
  kill_moves: '杀招列表',
  aperture: '空窍状态',
  map: '南疆舆图',
  characters: '人物图鉴',
  dao_marks: '流派道痕',
  merchant: '商会',
};

const panelContent = (panel: SidePanel) => {
  switch (panel) {
    case 'attributes': return <AttributeDetailPanel />;
    case 'events': return <EventLogPanel />;
    case 'gu_inventory': return <GuInventoryPanel />;
    case 'kill_moves': return <KillMovePanel />;
    case 'aperture': return <AperturePanel />;
    case 'map': return <SVGMapPanel />;
    case 'characters': return <CharacterPanel />;
    case 'dao_marks': return <DaoMarkPanel />;
    case 'merchant': return <MerchantPanel />;
    default: return null;
  }
};

interface ToolbarButton { id: SidePanel; label: string; }

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { id: 'attributes', label: '蛊师属性' },
  { id: 'gu_inventory', label: '蛊虫图鉴' },
  { id: 'kill_moves', label: '杀招列表' },
  { id: 'aperture', label: '空窍状态' },
  { id: 'map', label: '南疆舆图' },
  { id: 'characters', label: '人物图鉴' },
  { id: 'dao_marks', label: '流派道痕' },
  { id: 'merchant', label: '商会' },
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
  const startedRef = useRef(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>('none');

  useEffect(() => {
    if (screenState === 'game_play' && !startedRef.current) {
      startedRef.current = true;
      startGame();
    }
  }, [screenState, startGame]);

  const closePanel = () => setSidePanel('none');
  const togglePanel = (id: SidePanel) => setSidePanel(sidePanel === id ? 'none' : id);

  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col">
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
                {PANEL_TITLES[sidePanel]}
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
                  {PANEL_TITLES[sidePanel]}
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
      <BattleOverlay />
      <BreakthroughAnimation />
      <DiceRollAnimation />
      <SaveLoadDialog />
      <SettingsDialog />
      <TutorialOverlay />
      <DebugOverlay />

      {/* ─── 底部工具栏 ─── */}
      <div className="bg-rg-ink-700/90 px-3 sm:px-6 py-2 border-t border-rg-ink-300/12 flex items-center justify-between backdrop-blur-md gap-2">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto flex-1 min-w-0">
          {TOOLBAR_BUTTONS.map(btn => (
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
