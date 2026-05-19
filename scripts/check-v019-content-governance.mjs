#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rulesPath = path.join(root, 'src/canon/v019-content-governance-rules.json');
const heroManifestPath = path.join(root, 'doc/art/v1-hero-selection-manifest.json');
const miroFishDir = path.join(root, '指导大纲/vMiroFish/intake-reviews/v0.19.0');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function fail(message) {
  console.error(`[v019-content-governance] ${message}`);
  process.exit(1);
}

function walkObject(value, visitor, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkObject(item, visitor, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    visitor(key, child, [...pathParts, key]);
    walkObject(child, visitor, [...pathParts, key]);
  }
}

if (!fs.existsSync(rulesPath)) fail(`missing rules file: ${rulesPath}`);
const rules = readJson(rulesPath);

const requiredTemplateIds = new Set([
  'fact_card',
  'route_rule',
  'pressure_rule',
  'combat_candidate',
  'economy_rule',
  'asset_manifest',
]);
const actualTemplateIds = new Set((rules.contentTemplates || []).map(item => item.id));
for (const id of requiredTemplateIds) {
  if (!actualTemplateIds.has(id)) fail(`missing content template: ${id}`);
}

if ((rules.publicCanonBoundaries || []).length !== 8) fail('public canon boundaries must contain 8 items');
if ((rules.playthroughAnchors || []).length !== 8) fail('playthrough anchors must contain 8 items');
if ((rules.releaseArtCaptionBoundaries || []).length !== 8) fail('release art caption boundaries must contain 8 items');
if (!String(rules._meta?.saveFormatDecision || '').includes('22')) fail('v0.19 must keep SAVE_FORMAT_VERSION 22');

const requiredMiroFishPackages = [
  'v019_public_canon_boundary_pack_export_ready.json',
  'v019_representative_playthrough_anchor_pack_export_ready.json',
  'v019_release_art_caption_boundary_pack_export_ready.json',
];
const forbiddenMiroFishKeys = new Set([
  'quote',
  'originalText',
  'excerpt',
  'verbatim',
  'sourceBody',
  'source_body',
  'source_body_fields',
]);
for (const fileName of requiredMiroFishPackages) {
  const file = path.join(miroFishDir, fileName);
  if (!fs.existsSync(file)) fail(`missing MiroFish package: ${fileName}`);
  const data = readJson(file);
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length !== 8) fail(`${fileName} must contain 8 items`);
  if (data.redactionPolicy?.sourceBodyIncluded !== false) fail(`${fileName} must omit source bodies`);
  if (data.redactionPolicy?.originalWordingIncluded !== false) fail(`${fileName} must omit original wording`);
  const forbiddenHits = [];
  walkObject(data, (key, _child, pathParts) => {
    if (forbiddenMiroFishKeys.has(key)) forbiddenHits.push(pathParts.join('.'));
  });
  if (forbiddenHits.length) fail(`${fileName} contains forbidden source/body fields: ${forbiddenHits.join(', ')}`);
}

if (!fs.existsSync(heroManifestPath)) fail(`missing hero manifest: ${heroManifestPath}`);
const heroManifest = readJson(heroManifestPath);
if (heroManifest._meta?.runtimeBinding !== 'not_bound_yet') fail('v1 hero manifest must remain not_bound_yet');
const requiredHeroIds = new Set(['v1-title-screen-hero', 'v1-edgeone-landing-hero', 'v1-og-share-image']);
for (const entry of heroManifest.entries || []) {
  if (requiredHeroIds.has(entry.id)) requiredHeroIds.delete(entry.id);
  if (entry.status !== 'selected_candidate') fail(`hero entry must be selected_candidate: ${entry.id}`);
  if (entry.currentBinding !== 'not_bound') fail(`hero entry must not be runtime-bound yet: ${entry.id}`);
  if (!entry.boundary) fail(`hero entry missing boundary: ${entry.id}`);
  const publicPath = String(entry.publicPath || '').replace(/^\//, '');
  const publicFile = path.join(root, 'public', publicPath);
  if (!fs.existsSync(publicFile)) fail(`hero public file missing: ${entry.id} -> ${publicFile}`);
  if (fs.statSync(publicFile).size <= 0) fail(`hero public file is empty: ${entry.id}`);
  const sourceFile = path.join(root, entry.source || '');
  if (!fs.existsSync(sourceFile)) fail(`hero source file missing: ${entry.id} -> ${sourceFile}`);
}
if (requiredHeroIds.size > 0) fail(`hero manifest missing ids: ${[...requiredHeroIds].join(', ')}`);

console.log('[v019-content-governance] ok templates=6 publicBoundaries=8 playthroughAnchors=8 artBoundaries=8 heroEntries=3 mirofishPackages=3');
