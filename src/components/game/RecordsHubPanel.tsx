import { EventLogPanel } from './EventLogPanel';

export function RecordsHubPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col font-panel" data-testid="records-hub-panel">
      <div className="shrink-0 border-b border-rg-ink-300/10 bg-rg-ink-900/30 px-3 py-3">
        <p className="text-xs font-semibold text-rg-paper-100">记录</p>
        <p className="mt-1 text-[10px] leading-relaxed text-rg-paper-200/45" data-testid="records-hub-boundary-note">
          事件日志记录已经发生的系统事实；行动账本仍在行动工作台内作为本地回流依据，不由 DeepSeek 补写。
        </p>
      </div>
      <div className="min-h-0 flex-1" data-testid="records-hub-content-events">
        <EventLogPanel />
      </div>
    </div>
  );
}
