import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(process.cwd(), 'public');
const runtimeExtensions = new Set([
  '.json',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.mp3',
  '.wav',
  '.ogg',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && runtimeExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

if (!fs.existsSync(root)) {
  console.error(`[runtime-assets] missing public directory: ${root}`);
  process.exit(1);
}

const files = walk(root).sort((a, b) => a.localeCompare(b));
const zeroByteFiles = files.filter(file => fs.statSync(file).size === 0);
const audioCount = files.filter(file => /\.(mp3|wav|ogg)$/i.test(file)).length;
const imageCount = files.filter(file => /\.(svg|png|jpe?g|webp)$/i.test(file)).length;
const jsonCount = files.filter(file => /\.json$/i.test(file)).length;
const imageMapPath = path.resolve(process.cwd(), 'src', 'data', 'image-maps.ts');
const audioSourceManifestPath = path.resolve(process.cwd(), 'src', 'canon', 'audio-source-manifest.json');
const characterBgmManifestPath = path.resolve(process.cwd(), 'src', 'canon', 'character-bgm-manifest.json');

function collectImageMapRefs() {
  const sourceText = fs.readFileSync(imageMapPath, 'utf8');
  const sourceFile = ts.createSourceFile(imageMapPath, sourceText, ts.ScriptTarget.Latest, true);
  const refs = [];
  const mapDirs = new Map([
    ['GU_IMAGE_MAP', path.join(root, 'rebrng', 'gu', 's0-qingmao')],
    ['CHAR_IMAGE_MAP', path.join(root, 'rebrng', 'characters', 'canon')],
  ]);

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      mapDirs.has(node.name.text) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      const baseDir = mapDirs.get(node.name.text);
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteralLike(property.initializer)) continue;
        refs.push({
          mapName: node.name.text,
          value: property.initializer.text,
          fullPath: path.join(baseDir, property.initializer.text),
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return refs;
}

const imageMapRefs = collectImageMapRefs();
const missingImageMapRefs = imageMapRefs.filter(ref => !fs.existsSync(ref.fullPath));
const zeroByteImageMapRefs = imageMapRefs.filter(ref => fs.existsSync(ref.fullPath) && fs.statSync(ref.fullPath).size === 0);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function publicAssetRef(filePath, owner) {
  const normalized = typeof filePath === 'string' ? filePath.trim() : '';
  return {
    owner,
    value: normalized,
    fullPath: normalized.startsWith('/')
      ? path.join(root, normalized.slice(1))
      : path.join(root, normalized),
  };
}

function collectAudioManifestRefs() {
  const refs = [];
  if (fs.existsSync(audioSourceManifestPath)) {
    const manifest = readJson(audioSourceManifestPath);
    for (const track of manifest.tracks || []) {
      if (track?.runtimeEnabled) refs.push(publicAssetRef(track.filePath, `audio-source:${track.id}`));
    }
    for (const sfx of manifest.sfx || []) {
      if (sfx?.runtimeEnabled) refs.push(publicAssetRef(sfx.filePath, `audio-sfx:${sfx.id}`));
    }
  }
  if (fs.existsSync(characterBgmManifestPath)) {
    const manifest = readJson(characterBgmManifestPath);
    for (const entry of manifest.entries || []) {
      if (entry?.runtimeEnabled) refs.push(publicAssetRef(entry.filePath, `character-bgm:${entry.id}`));
    }
  }
  return refs;
}

const audioManifestRefs = collectAudioManifestRefs();
const missingAudioManifestRefs = audioManifestRefs.filter(ref => !fs.existsSync(ref.fullPath));
const zeroByteAudioManifestRefs = audioManifestRefs.filter(ref => fs.existsSync(ref.fullPath) && fs.statSync(ref.fullPath).size === 0);

if (zeroByteFiles.length > 0) {
  console.error('[runtime-assets] zero-byte runtime assets found:');
  for (const file of zeroByteFiles) {
    console.error(`- ${path.relative(process.cwd(), file)}`);
  }
  process.exit(1);
}

if (missingImageMapRefs.length > 0) {
  console.error('[runtime-assets] image-map references missing files:');
  for (const ref of missingImageMapRefs) {
    console.error(`- ${ref.mapName}: ${ref.value}`);
  }
  process.exit(1);
}

if (zeroByteImageMapRefs.length > 0) {
  console.error('[runtime-assets] image-map references zero-byte files:');
  for (const ref of zeroByteImageMapRefs) {
    console.error(`- ${ref.mapName}: ${ref.value}`);
  }
  process.exit(1);
}

if (missingAudioManifestRefs.length > 0) {
  console.error('[runtime-assets] audio manifest references missing files:');
  for (const ref of missingAudioManifestRefs) {
    console.error(`- ${ref.owner}: ${ref.value}`);
  }
  process.exit(1);
}

if (zeroByteAudioManifestRefs.length > 0) {
  console.error('[runtime-assets] audio manifest references zero-byte files:');
  for (const ref of zeroByteAudioManifestRefs) {
    console.error(`- ${ref.owner}: ${ref.value}`);
  }
  process.exit(1);
}

console.log(`[runtime-assets] checked ${files.length} files; audio=${audioCount}, images=${imageCount}, json=${jsonCount}, imageMapRefs=${imageMapRefs.length}, audioManifestRefs=${audioManifestRefs.length}; zero-byte=0`);
