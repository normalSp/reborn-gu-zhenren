#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  addFinding,
  exitWithSummary,
  root,
  summarizeFindings,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'stale-entrypoints';
const findings = [];
const entrypoints = [
  'AGENTS.md',
  '.codex/skills/reborn-expert-council/references/PROJECT-STATE.md',
  '指导大纲/项目仪表盘.md',
  '指导大纲/v1.6.0/codex/00-总览/README.md',
  '指导大纲/v1.6.0/codex/00-总览/v1.6.0-总体开发大纲.md',
  '指导大纲/v1.6.0/codex/00-总览/v1.6.0-小版本执行路线图.md',
  '指导大纲/v1.6.0/codex/00-总览/v1.6.0-需求决策池.md',
  '指导大纲/v1.6.0/codex/00-总览/v1.6.0-真相源索引.md',
  '指导大纲/v1.6.0/codex/00-总览/v1.6.0-Git提交与推送计划.md',
];

const stalePatterns = [
  {
    code: 'v160_active_draft_stale',
    severity: 'P1',
    pattern: /状态：.*active draft|v1\.6\.0-a[012].*current active draft|v1\.6\.0.*当前 active draft/i,
    message: 'v1.6 entrypoint still claims active draft status',
  },
  {
    code: 'v160_pending_d162_stale',
    severity: 'P1',
    pattern: /D-162\s*(待用户批准|pending|待批准)/i,
    message: 'D-162 still appears pending after user approval',
  },
  {
    code: 'v160_pending_d160_d161_stale',
    severity: 'P2',
    pattern: /D-160\/D-161 已批准；D-162 待用户批准|请用户决定是否批准 D-162/i,
    message: 'v1.6 decision pool still has pre-approval wording',
  },
  {
    code: 'v160_old_branch_current_stale',
    severity: 'P2',
    pattern: /codex\/v160-(a1-content-schema-gate|a2-mirofish-inventory-gate).*(current|当前|活跃)/i,
    message: 'old v1.6 phase branch is still described as current',
  },
];

for (const relativePath of entrypoints) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    addFinding(findings, 'P1', 'missing_entrypoint', `entrypoint missing: ${relativePath}`, file);
    continue;
  }

  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  for (const stale of stalePatterns) {
    for (const [index, line] of lines.entries()) {
      if (stale.pattern.test(line)) {
        addFinding(findings, stale.severity, stale.code, `${stale.message} at ${relativePath}:${index + 1}: ${line.trim()}`, file);
        break;
      }
    }
  }
}

const findingSummary = summarizeFindings(findings);
const report = {
  version: 'v1.6.0',
  mode: 'report_only',
  checkedAt: new Date().toISOString(),
  summary: {
    entrypoints: entrypoints.length,
    acceptedForCurrentEntrypointClarity: findingSummary.p0 === 0 && findingSummary.p1 === 0,
    ...findingSummary,
  },
  entrypoints,
  findings,
};

const reportPath = writeReport(report, 'artifacts/v1.6.0/stale-entrypoints');
exitWithSummary(label, reportPath, findings, `entrypoints=${entrypoints.length}`);
