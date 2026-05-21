#!/usr/bin/env node
import path from 'node:path';
import {
  addFinding,
  collectMatrixIds,
  exitWithSummary,
  root,
  summarizeFindings,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'v160-long-test-replay';
const args = new Set(process.argv.slice(2));
const matrixFile = path.join(root, '指导大纲/v1.6.0/codex/00-总览/v1.6.0-测试矩阵.md');
const matrixIds = collectMatrixIds(matrixFile);
const findings = [];
const expectedCurrentIds = ['V16-B4-DRIFT-001', 'V16-B4-LIVE-001'];

if (!args.has('--dry-run')) {
  addFinding(findings, 'P1', 'missing_dry_run_flag', 'v1.6 replay factory skeleton must be run with --dry-run');
}

for (const id of expectedCurrentIds) {
  if (!matrixIds.has(id)) {
    addFinding(findings, 'P1', 'long_test_sample_not_in_matrix', `${id} is missing from v1.6 test matrix`, matrixFile);
  }
}

const replayPlan = [
  {
    id: 'V16-B4-DRIFT-001',
    mode: 'deterministic_replay',
    roundCount: 0,
    liveModel: null,
    status: matrixIds.has('V16-B4-DRIFT-001') ? 'registered' : 'missing',
  },
  {
    id: 'V16-B4-LIVE-001',
    mode: 'live_probe_requires_user_approval',
    roundCount: 0,
    liveModel: null,
    status: matrixIds.has('V16-B4-LIVE-001') ? 'registered_not_executed' : 'missing',
  },
];

const findingSummary = summarizeFindings(findings);
const report = {
  version: 'v1.6.0',
  mode: 'dry_run_replay_factory_skeleton',
  matrixFile: '指导大纲/v1.6.0/codex/00-总览/v1.6.0-测试矩阵.md',
  checkedAt: new Date().toISOString(),
  summary: {
    acceptedForDeterministicFactorySkeleton: findingSummary.p0 === 0 && findingSummary.p1 === 0,
    liveProbeExecuted: false,
    requiresUserApprovalForLive: true,
    acceptedForLongLiveNarrativeQuality: false,
    ...findingSummary,
  },
  replayPlan,
  findings,
};

const reportPath = writeReport(report, 'artifacts/v1.6.0/long-test-replay');
exitWithSummary(label, reportPath, findings, `matrixIds=${matrixIds.size} dryRun=${args.has('--dry-run')}`);
