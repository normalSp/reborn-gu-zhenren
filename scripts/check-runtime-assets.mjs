import fs from 'node:fs';
import path from 'node:path';

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

if (zeroByteFiles.length > 0) {
  console.error('[runtime-assets] zero-byte runtime assets found:');
  for (const file of zeroByteFiles) {
    console.error(`- ${path.relative(process.cwd(), file)}`);
  }
  process.exit(1);
}

console.log(`[runtime-assets] checked ${files.length} files; audio=${audioCount}, images=${imageCount}, json=${jsonCount}; zero-byte=0`);
