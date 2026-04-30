import { useStore } from '../../store';
import type { SaveMeta } from '../../types';

const SLOT_COUNT = 3;
const SAVE_PREFIX = 'gu-zhenren-slot-';
const META_PREFIX = 'gu-zhenren-meta-';

// ─── 槽位读写 ───
function readMeta(slot: number): SaveMeta | null {
  try {
    const raw = localStorage.getItem(META_PREFIX + slot);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeMeta(slot: number, meta: SaveMeta) {
  localStorage.setItem(META_PREFIX + slot, JSON.stringify(meta));
}

function readSave(slot: number) {
  const raw = localStorage.getItem(SAVE_PREFIX + slot);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function writeSave(slot: number, data: any) {
  localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(data));
}

function deleteSave(slot: number) {
  localStorage.removeItem(SAVE_PREFIX + slot);
  localStorage.removeItem(META_PREFIX + slot);
}

// ─── 时间格式化 ───
function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SaveLoadDialog() {
  const isSaveDialogOpen = useStore(s => s.isSaveDialogOpen);
  const toggleSaveDialog = useStore(s => s.toggleSaveDialog);
  const profile = useStore(s => s.profile);
  const turn = useStore(s => s.turn);

  if (!isSaveDialogOpen) return null;

  // ─── 存档 ───
  const handleSave = (slot: number) => {
    const state = useStore.getState();
    // 手动 partialize（与 store/index.ts 中的 persist partialize 对齐）
    const data: any = {};
    const excludeKeys = new Set([
      'activeTab', 'isSettingsOpen', 'isSaveDialogOpen', 'isEventLogExpanded',
      'typewriterSpeed', 'screenState', 'pipelinePhase', 'pipelineError', 'l3Warnings',
      'setActiveTab', 'toggleSettings', 'toggleSaveDialog', 'toggleEventLog',
      'setTypewriterSpeed', 'setScreenState', 'setPipelinePhase', 'setPipelineError', 'setL3Warnings',
      'triggeredEvents', 'isLoading', 'error', 'currentNarrative',
    ]);
    for (const [key, value] of Object.entries(state)) {
      if (!excludeKeys.has(key) && typeof value !== 'function') {
        data[key] = value;
      }
    }

    const meta: SaveMeta = {
      slot,
      version: '0.4.0',
      timestamp: Date.now(),
      playerName: profile.name || '蛊师',
      realm: profile.realm.label,
      turn,
      mode: 'canon',
    };

    writeSave(slot, data);
    writeMeta(slot, meta);
  };

  // ─── 读档 ───
  const handleLoad = (slot: number) => {
    const data = readSave(slot);
    if (!data) return;
    const store = useStore.getState() as any;
    // 保留 UI 状态函数，只替换数据
    const uiFns: Record<string, any> = {};
    for (const key of Object.keys(store)) {
      if (typeof store[key] === 'function') uiFns[key] = store[key];
    }
    // 合并数据（保存的数据覆盖当前状态）+ 保留 UI 函数
    const merged = { ...store, ...data, ...uiFns };
    useStore.setState(merged);
    toggleSaveDialog();
  };

  const handleDelete = (slot: number) => {
    deleteSave(slot);
    // 强制刷新——简单 hack：切换状态
    toggleSaveDialog();
    setTimeout(() => toggleSaveDialog(), 50);
  };

  // 强制重新渲染 meta 数据
  const metas: (SaveMeta | null)[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    metas.push(readMeta(i));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={toggleSaveDialog}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-rg-ink-800/70 backdrop-blur-sm" />

      {/* 对话框 */}
      <div
        className="relative z-10 bg-rg-ink-700/95 border border-rg-ink-300/15 rounded-xl p-6 max-w-md w-full mx-4 backdrop-blur-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-rg-gold font-narrative text-lg">存档管理</h2>
          <button
            onClick={toggleSaveDialog}
            className="text-rg-ink-300 hover:text-rg-paper-100 text-xs font-button transition-micro"
          >
            关闭
          </button>
        </div>

        {/* 三个槽位 */}
        <div className="space-y-3">
          {metas.map((meta, i) => (
            <div
              key={i}
              className="bg-rg-ink-800/50 border border-rg-ink-300/10 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="min-w-0 flex-1">
                {meta ? (
                  <div>
                    <div className="text-rg-paper-200 text-sm font-panel font-semibold truncate">
                      槽位 {i + 1} · {meta.playerName}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs font-panel">
                      <span className="text-rg-gold">{meta.realm}</span>
                      <span className="text-rg-paper-200/40">第{meta.turn}回</span>
                      <span className="text-rg-paper-200/30">{fmtTime(meta.timestamp)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-rg-paper-200/20 text-sm font-panel">
                    槽位 {i + 1} · —— 空 ——
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-3 shrink-0">
                <button
                  onClick={() => handleSave(i)}
                  className="text-xs font-button px-3 py-1 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
                >
                  存档
                </button>
                {meta && (
                  <>
                    <button
                      onClick={() => handleLoad(i)}
                      className="text-xs font-button px-3 py-1 rounded-sm border border-rg-jade-400/30 text-rg-jade-400 hover:bg-rg-jade-400/10 transition-micro"
                    >
                      读档
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-xs font-button px-2 py-1 rounded-sm border border-rg-blood-400/30 text-rg-blood-400/60 hover:bg-rg-blood-400/10 transition-micro"
                    >
                      删
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-rg-paper-200/20 text-[10px] font-panel text-center mt-4">
          存档保存在浏览器本地，清除数据后丢失
        </p>
      </div>
    </div>
  );
}
