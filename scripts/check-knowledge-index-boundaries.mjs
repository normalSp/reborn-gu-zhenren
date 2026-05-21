#!/usr/bin/env node
import path from 'node:path';
import {
  addFinding,
  allowedPromotionStatus,
  allowedVisibility,
  collectKnowledgeEntries,
  exitWithSummary,
  forbiddenTextKeys,
  highRiskUses,
  root,
  summarizeFindings,
  walkObject,
  writeReport,
} from './v160-governance-utils.mjs';

const label = 'knowledge-index-boundaries';
const knowledgeDir = path.join(root, '指导大纲/知识库/蛊真人');
const findings = [];
const requiredFields = [
  'id',
  'kind',
  'summary',
  'sourcePointers',
  'visibility',
  'promotionStatus',
  'allowedUses',
  'forbiddenUses',
  'mirofishRefs',
  'intakeReviewRefs',
  'testSampleRefs',
  'lastReviewedVersion',
  'reviewNotes',
];

const { entries, files, parseFailures } = collectKnowledgeEntries(knowledgeDir);

for (const failure of parseFailures) {
  addFinding(findings, 'P1', 'knowledge_entry_parse_failure', failure.message, failure.file);
}

if (entries.length === 0) {
  addFinding(findings, 'Info', 'knowledge_index_empty', 'No promoted knowledge entries yet; README-only skeleton is valid for v1.6 report-only tooling.', knowledgeDir);
}

for (const entry of entries) {
  const ref = entry.__file;
  for (const field of requiredFields) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
      addFinding(findings, 'P1', 'knowledge_entry_missing_required_field', `${entry.id ?? '<unknown>'} missing ${field}`, ref);
    }
  }

  if (entry.visibility && !allowedVisibility.has(entry.visibility)) {
    addFinding(findings, 'P1', 'knowledge_entry_invalid_visibility', `${entry.id ?? '<unknown>'} has invalid visibility=${entry.visibility}`, ref);
  }

  if (entry.promotionStatus && !allowedPromotionStatus.has(entry.promotionStatus)) {
    addFinding(findings, 'P1', 'knowledge_entry_invalid_promotion_status', `${entry.id ?? '<unknown>'} has invalid promotionStatus=${entry.promotionStatus}`, ref);
  }

  const sourcePointers = Array.isArray(entry.sourcePointers) ? entry.sourcePointers : [];
  const allowedUses = new Set(Array.isArray(entry.allowedUses) ? entry.allowedUses : []);
  const forbiddenUses = new Set(Array.isArray(entry.forbiddenUses) ? entry.forbiddenUses : []);
  const hiddenOrPrivate = ['hidden_ref_only', 'private'].includes(entry.visibility);

  if (sourcePointers.length === 0) {
    addFinding(findings, 'P1', 'knowledge_entry_missing_source_pointer', `${entry.id ?? '<unknown>'} has no sourcePointers`, ref);
  }

  for (const riskyUse of highRiskUses) {
    if (allowedUses.has(riskyUse)) {
      addFinding(findings, 'P0', 'knowledge_entry_high_risk_allowed_use', `${entry.id ?? '<unknown>'} allowedUses includes high-risk use ${riskyUse}`, ref);
    }
  }

  const requiredForbiddenUses = ['deepseek_visible_context', 'player_visible_hidden_body', 'runtime_authority'];
  for (const forbiddenUse of requiredForbiddenUses) {
    if (!forbiddenUses.has(forbiddenUse)) {
      addFinding(findings, hiddenOrPrivate ? 'P1' : 'P2', 'knowledge_entry_missing_core_forbidden_use', `${entry.id ?? '<unknown>'} forbiddenUses should include ${forbiddenUse}`, ref);
    }
  }

  if (hiddenOrPrivate) {
    if (entry.summary && /真相|身份|方源|天庭|尊者|春秋蝉/.test(entry.summary)) {
      addFinding(findings, 'P2', 'hidden_private_summary_needs_manual_review', `${entry.id ?? '<unknown>'} hidden/private summary may need redaction review`, ref);
    }
    if (entry.visibility === 'hidden_ref_only' && entry.summary && entry.summary.length > 120) {
      addFinding(findings, 'P1', 'hidden_ref_only_summary_too_detailed', `${entry.id ?? '<unknown>'} hidden_ref_only summary is too detailed`, ref);
    }
  }

  if (entry.promotionStatus === 'runtime_promoted') {
    addFinding(findings, 'P0', 'runtime_promoted_entry_in_v160', `${entry.id ?? '<unknown>'} is runtime_promoted; v1.6 has no approved runtime canon promotion`, ref);
  }

  walkObject(entry, (key, _value, pathParts) => {
    if (forbiddenTextKeys.has(key)) {
      addFinding(findings, 'P0', 'knowledge_entry_forbidden_text_key', `${entry.id ?? '<unknown>'} contains forbidden text key ${pathParts.join('.')}`, ref);
    }
  });
}

const findingSummary = summarizeFindings(findings);
const report = {
  version: 'v1.6.0',
  mode: 'report_only',
  knowledgeDir: '指导大纲/知识库/蛊真人',
  checkedAt: new Date().toISOString(),
  summary: {
    entries: entries.length,
    files: files.length,
    acceptedForKnowledgeIndexSkeleton: findingSummary.p0 === 0 && findingSummary.p1 === 0,
    acceptedForRuntimeCanon: false,
    acceptedForDeepSeekVisibleContext: false,
    ...findingSummary,
  },
  requiredFields,
  allowedVisibility: [...allowedVisibility],
  allowedPromotionStatus: [...allowedPromotionStatus],
  highRiskUses: [...highRiskUses],
  findings,
};

const reportPath = writeReport(report, 'artifacts/v1.6.0/knowledge-index-boundaries');
exitWithSummary(label, reportPath, findings, `entries=${entries.length}`);
