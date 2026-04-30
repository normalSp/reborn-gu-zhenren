export function LoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-rg-ink-800 flex flex-col">
      {/* 顶部状态条骨架 */}
      <div className="bg-rg-ink-700/90 border-b border-rg-ink-300/12 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-5 bg-rg-ink-600/50 rounded animate-pulse" />
            <div className="w-16 h-4 bg-rg-ink-600/30 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32 h-2 bg-rg-ink-600/30 rounded animate-pulse" />
            <div className="w-32 h-2 bg-rg-ink-600/30 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* 叙事区域骨架 */}
      <div className="flex-1 flex flex-col p-8 max-w-3xl mx-auto w-full">
        <div className="space-y-3">
          <div className="w-3/4 h-4 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-full h-4 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-5/6 h-4 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-2/3 h-4 bg-rg-ink-600/20 rounded animate-pulse" />
        </div>
        <div className="space-y-3 mt-8">
          <div className="w-full h-4 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-4/5 h-4 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-3/5 h-4 bg-rg-ink-600/20 rounded animate-pulse" />
        </div>
        <div className="mt-8 space-y-3">
          <div className="w-1/2 h-5 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-1/3 h-5 bg-rg-ink-600/20 rounded animate-pulse" />
          <div className="w-2/5 h-5 bg-rg-ink-600/20 rounded animate-pulse" />
        </div>
      </div>

      {/* 底部工具栏骨架 */}
      <div className="bg-rg-ink-700/90 border-t border-rg-ink-300/12 px-6 py-2 flex items-center justify-center">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="w-14 h-6 bg-rg-ink-600/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
