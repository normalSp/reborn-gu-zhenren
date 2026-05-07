/**
 * v0.6.0终局修复: Prompt Token预算监控
 * 中文 ~chars/3.5, 设计文档规定6000 token上限
 */

/** 估算文本token数（中文粗略换算） */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // 中文约1.5字符/token, 英文约4字符/token, 取混合估算 ~chars/3.5
  return Math.ceil(text.length / 3.5);
}

/** Token预算阈值 */
export const TOKEN_BUDGET = {
  /** 设计文档规定上限 */
  MAX: 6000,
  /** 警告阈值 */
  WARN: 5000,
} as const;

/** 检查并在超限时裁剪内容（优先裁剪L3层内容：涟漪事件/术语/NPC超过前8条） */
export function enforceTokenBudget(prompt: string, limit: number = TOKEN_BUDGET.MAX): { prompt: string; tokens: number; trimmed: boolean } {
  const tokens = estimateTokenCount(prompt);
  if (tokens <= limit) return { prompt, tokens, trimmed: false };

  // 超预算：逐行裁剪后1/3内容（通常为L3层非关键信息）
  const lines = prompt.split('\n');
  const keepCount = Math.ceil(lines.length * 0.7);
  const trimmed = lines.slice(0, keepCount).join('\n');
  const trimmedTokens = estimateTokenCount(trimmed);

  console.warn(`[TokenBudget] ${tokens} tokens超过上限${limit}, 裁剪至${trimmedTokens}`);
  return { prompt: trimmed, tokens: trimmedTokens, trimmed: true };
}
