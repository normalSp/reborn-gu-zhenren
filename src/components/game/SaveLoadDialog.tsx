import { useRef, useState } from 'react';
import { useStore } from '../../store';
import type { SaveFileFormat } from '../../store';
import type { SaveMeta } from '../../types';
import { SAVE_FORMAT_VERSION } from '../../store/initialState';
import { saveSlotKey, saveSlotMetaKey } from '../../store/storageKeys';
import { XIcon } from '../../icons/XIcon';
import { audioManager } from '../../utils/audio';

const SLOT_COUNT = 3;

// ─── 槽位读写（localStorage）───────────────
function readMeta(slot: number): SaveMeta | null {
  try {
    const raw = localStorage.getItem(saveSlotMetaKey(slot));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeMeta(slot: number, meta: SaveMeta) {
  localStorage.setItem(saveSlotMetaKey(slot), JSON.stringify(meta));
}

function readSave(slot: number) {
  const raw = localStorage.getItem(saveSlotKey(slot));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function writeSave(slot: number, data: any) {
  localStorage.setItem(saveSlotKey(slot), JSON.stringify(data));
}

function deleteSave(slot: number) {
  localStorage.removeItem(saveSlotKey(slot));
  localStorage.removeItem(saveSlotMetaKey(slot));
}

// ─── 时间格式化 ───
function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── 获取当前存档数据（复刻 persist 的 partialize 规则）───────────────
function getCurrentSaveData(): any {
  const serialized = (useStore.getState() as any).getSerializedState?.();
  if (!serialized) return {};
  try {
    const parsed = JSON.parse(serialized) as SaveFileFormat;
    return parsed.state || {};
  } catch {
    return {};
  }
}

export function SaveLoadDialog() {
  const isSaveDialogOpen = useStore(s => s.isSaveDialogOpen);
  const toggleSaveDialog = useStore(s => s.toggleSaveDialog);
  const profile = useStore(s => s.profile);
  const turn = useStore(s => s.turn);

  // ─── 导入状态 ───
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isSaveDialogOpen) return null;

  // ─── 快速存档（localStorage 槽位） ───
  const handleSave = (slot: number) => {
    const data = getCurrentSaveData();
    const state = useStore.getState() as any;
    const meta: SaveMeta = {
      slot,
      version: `v${SAVE_FORMAT_VERSION}`,
      timestamp: Date.now(),
      playerName: state.profile?.name || '蛊师',
      realm: state.profile?.realm?.label || '一转初阶',
      turn: state.turn || 1,
      mode: state.gameMode || 'canon',
    };
    writeSave(slot, data);
    writeMeta(slot, meta);
    audioManager.playSfx('save');
  };

  // ─── 快速读档（localStorage 槽位） ───
  const handleLoad = (slot: number) => {
    const data = readSave(slot);
    if (!data) return;
    const store = useStore.getState() as any;
    const meta = readMeta(slot);
    const payload: SaveFileFormat = data?.formatVersion && data?.state
      ? data
      : {
          formatVersion: SAVE_FORMAT_VERSION,
          timestamp: new Date(meta?.timestamp || Date.now()).toISOString(),
          meta: {
            playerName: meta?.playerName || data?.profile?.name || '无名蛊师',
            realm: meta?.realm || data?.profile?.realm?.label || '一转初阶',
            turn: meta?.turn || data?.turn || 1,
            gameMode: meta?.mode || data?.gameMode || 'canon',
          },
          state: data,
        };
    const result = store.loadFromFile?.(JSON.stringify(payload));
    if (result?.success) {
      toggleSaveDialog();
    } else {
      setImportStatus({ type: 'error', message: result?.error || '读档失败' });
    }
  };

  // ─── 删除存档 ───
  const handleDelete = (slot: number) => {
    deleteSave(slot);
    toggleSaveDialog();
    setTimeout(() => toggleSaveDialog(), 50);
  };

  // ─── 导出存档文件 ───
  const handleExport = () => {
    (useStore.getState() as any).saveToFile?.();
  };

  // ─── 导入存档文件 ───
  const handleImportClick = () => {
    setImportStatus(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = (useStore.getState() as any).loadFromFile?.(text);
      if (result?.success) {
        setImportStatus({ type: 'success', message: '存档加载成功！' });
        setTimeout(() => toggleSaveDialog(), 800);
      } else {
        setImportStatus({ type: 'error', message: result?.error || '读档失败' });
      }
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: '文件读取失败，请重试。' });
    };
    reader.readAsText(file);

    // 重置 input 以便重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── 读取槽位元数据 ───
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
        className="rg-panel-surface rg-scrollable relative z-10 p-4 max-w-md w-full mx-4 shadow-2xl max-h-[85vh] overflow-y-auto sm:p-6"
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

        {/* ══════════════════════════════════════════
            快速存档槽位（localStorage）
           ══════════════════════════════════════════ */}
        <div className="mb-4">
          <h3 className="text-rg-paper-200/60 text-xs font-panel mb-3 tracking-[0.1em]">
            快速存档
          </h3>
          <div className="space-y-2">
            {metas.map((meta, i) => (
              <div
                key={i}
                className="rg-explain-card p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  {meta ? (
                    <div>
                      <div className="text-rg-paper-200 text-xs font-panel font-semibold truncate">
                        槽位 {i + 1} · {meta.playerName}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-panel">
                        <span className="text-rg-gold">{meta.realm}</span>
                        <span className="text-rg-paper-200/40">第{meta.turn}回</span>
                        <span className="text-rg-paper-200/30">{fmtTime(meta.timestamp)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-rg-paper-200/20 text-xs font-panel">
                      槽位 {i + 1} · 空
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <button
                    onClick={() => handleSave(i)}
                    className="text-[10px] font-button px-2 py-1 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
                  >
                    存
                  </button>
                  {meta && (
                    <>
                      <button
                        onClick={() => handleLoad(i)}
                        className="text-[10px] font-button px-2 py-1 rounded-sm border border-rg-jade-400/30 text-rg-jade-400 hover:bg-rg-jade-400/10 transition-micro"
                      >
                        读
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
                        className="flex items-center justify-center px-1.5 py-1 rounded-sm border border-rg-blood-400/30 text-rg-blood-400/60 hover:bg-rg-blood-400/10 transition-micro"
                        title="删除存档"
                      >
                        <XIcon size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t border-rg-ink-300/10 my-4" />

        {/* ══════════════════════════════════════════
            文件导入/导出（本地备份与跨设备迁移）
           ══════════════════════════════════════════ */}
        <div>
          <h3 className="text-rg-paper-200/60 text-xs font-panel mb-3 tracking-[0.1em]">
            文件管理
          </h3>

          {/* 导入状态提示 */}
          {importStatus && (
            <div className={`mb-3 px-3 py-2 rounded-sm text-xs font-panel ${
              importStatus.type === 'success'
                ? 'bg-rg-jade-400/10 border border-rg-jade-400/20 text-rg-jade-400'
                : 'bg-rg-blood-400/10 border border-rg-blood-400/20 text-rg-blood-400'
            }`}>
              {importStatus.message}
            </div>
          )}

          <div className="flex gap-2">
            {/* 导出按钮 */}
            <button
              onClick={handleExport}
              className="flex-1 text-xs font-button px-4 py-2.5 rounded-sm border border-rg-gold/30 text-rg-gold hover:bg-rg-gold/10 transition-micro"
            >
              导出存档
            </button>

            {/* 导入按钮 */}
            <button
              onClick={handleImportClick}
              className="flex-1 text-xs font-button px-4 py-2.5 rounded-sm border border-rg-jade-400/30 text-rg-jade-400 hover:bg-rg-jade-400/10 transition-micro"
            >
              导入存档
            </button>
          </div>

          {/* 隐藏的文件选择器 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <p className="text-rg-paper-200/25 text-[10px] font-panel text-center mt-3 leading-relaxed">
            导出存档文件可备份至本地或迁移至其他设备
          </p>
        </div>

        {/* 底部提示 */}
        <p className="text-rg-paper-200/20 text-[10px] font-panel text-center mt-3">
          快速存档保存在浏览器中，清除缓存后丢失
        </p>
      </div>
    </div>
  );
}
