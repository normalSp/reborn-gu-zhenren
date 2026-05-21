#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  addFinding,
  collectKnowledgeEntries,
  collectMatrixIds,
  exitWithSummary,
  highRiskUses,
  root,
  summarizeFindings,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'mirofish-intake-promotions';
const knowledgeDir = path.join(root, '指导大纲/知识库/蛊真人');
const matrixFile = path.join(root, '指导大纲/v1.6.0/codex/00-总览/v1.6.0-测试矩阵.md');
const intakeRoot = path.join(root, '指导大纲/vMiroFish/intake-reviews');
const findings = [];
const { entries, files, parseFailures } = collectKnowledgeEntries(knowledgeDir);
const matrixIds = collectMatrixIds(matrixFile);

for (const failure of parseFailures) {
  addFinding(findings, 'P1', 'knowledge_entry_parse_failure', failure.message, failure.file);
}

if (!fs.existsSync(matrixFile)) {
  addFinding(findings, 'P1', 'missing_test_matrix', 'v1.6 test matrix is missing', matrixFile);
}

if (!fs.existsSync(intakeRoot)) {
  addFinding(findings, 'P1', 'missing_intake_root', 'MiroFish intake-review directory is missing', intakeRoot);
}

if (entries.length === 0) {
  addFinding(findings, 'Info', 'no_promoted_knowledge_entries', 'No knowledge entries are present, so no promotion chain can be promoted or broken yet.', knowledgeDir);
}

function resolveProjectPath(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  if (/^base:/.test(normalized)) return path.join(root, '指导大纲/vMiroFish/基础包', normalized.slice('base:'.length).replace(/:/g, '_'));
  return path.isAbsolute(normalized) ? normalized : path.join(root, normalized);
}

for (const entry of entries) {
  const ref = entry.__file;
  const id = entry.id ?? '<unknown>';
  const mirofishRefs = Array.isArray(entry.mirofishRefs) ? entry.mirofishRefs : [];
  const sourcePointers = Array.isArray(entry.sourcePointers) ? entry.sourcePointers : [];
  const intakeReviewRefs = Array.isArray(entry.intakeReviewRefs) ? entry.intakeReviewRefs : [];
  const testSampleRefs = Array.isArray(entry.testSampleRefs) ? entry.testSampleRefs : [];
  const allowedUses = new Set(Array.isArray(entry.allowedUses) ? entry.allowedUses : []);

  if ((mirofishRefs.length > 0 || sourcePointers.some(item => /^ri_lw_ch_/.test(String(item)))) && intakeReviewRefs.length === 0) {
    addFinding(findings, 'P1', 'missing_intake_review_ref', `${id} references MiroFish/source pointers but has no intakeReviewRefs`, ref);
  }

  for (const reviewRef of intakeReviewRefs) {
    const reviewPath = resolveProjectPath(reviewRef);
    if (!reviewPath || !fs.existsSync(reviewPath)) {
      addFinding(findings, 'P1', 'intake_review_ref_not_found', `${id} intakeReviewRef not found: ${reviewRef}`, ref);
    }
  }

  for (const sampleId of testSampleRefs) {
    if (!matrixIds.has(sampleId)) {
      addFinding(findings, 'P1', 'test_sample_ref_not_in_matrix', `${id} testSampleRef not found in v1.6 matrix: ${sampleId}`, ref);
    }
  }

  for (const riskyUse of highRiskUses) {
    if (allowedUses.has(riskyUse)) {
      addFinding(findings, 'P0', 'promotion_chain_high_risk_allowed_use', `${id} allowedUses includes high-risk use ${riskyUse}`, ref);
    }
  }

  if (entry.promotionStatus === 'runtime_promoted') {
    addFinding(findings, 'P0', 'runtime_promotion_without_v160_runtime_gate', `${id} is runtime_promoted; v1.6 has no runtime promotion gate`, ref);
  }
}

const findingSummary = summarizeFindings(findings);
const report = {
  version: 'v1.6.0',
  mode: 'report_only',
  knowledgeDir: '指导大纲/知识库/蛊真人',
  intakeRoot: '指导大纲/vMiroFish/intake-reviews',
  matrixFile: '指导大纲/v1.6.0/codex/00-总览/v1.6.0-测试矩阵.md',
  checkedAt: new Date().toISOString(),
  summary: {
    entries: entries.length,
    knowledgeFiles: files.length,
    matrixIds: matrixIds.size,
    acceptedForPromotionChainAudit: findingSummary.p0 === 0 && findingSummary.p1 === 0,
    acceptedForRuntimeCanon: false,
    acceptedForDeepSeekVisibleContext: false,
    ...findingSummary,
  },
  findings,
};

const reportPath = writeReport(report, 'artifacts/v1.6.0/mirofish-intake-promotions');
exitWithSummary(label, reportPath, findings, `entries=${entries.length} matrixIds=${matrixIds.size}`);
