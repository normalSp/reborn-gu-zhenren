import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const targets = [
  'src/canon',
  'src/components',
  'src/engine',
];

const ignoredSuffixes = [
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
];

const banned = [
  { name: '待 v0.x', pattern: /待\s*v\d+(?:\.\d+)*/i },
  { name: '待v0.x', pattern: /待v\d+(?:\.\d+)*/i },
  { name: '留到 v0.x', pattern: /留到\s*v\d+(?:\.\d+)*/i },
  { name: '留给 v0.x', pattern: /留给\s*v\d+(?:\.\d+)*/i },
  { name: '以后版本补充', pattern: /以后版本补充/ },
  { name: '后续版本补充', pattern: /后续版本补充/ },
];

const allowedExtensions = new Set(['.ts', '.tsx', '.json']);

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(full));
      continue;
    }
    if (!allowedExtensions.has(path.extname(entry.name))) continue;
    if (ignoredSuffixes.some(suffix => entry.name.endsWith(suffix))) continue;
    files.push(full);
  }
  return files;
}

const files = [];
for (const target of targets) {
  const abs = path.join(root, target);
  try {
    files.push(...await collectFiles(abs));
  } catch {
    // Ignore missing target dirs so the check stays portable.
  }
}

const findings = [];
for (const file of files) {
  const text = await fs.readFile(file, 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of banned) {
      if (rule.pattern.test(line)) {
        findings.push({
          file: path.relative(root, file).replaceAll(path.sep, '/'),
          line: index + 1,
          rule: rule.name,
          text: line.trim(),
        });
      }
    }
  });
}

if (findings.length) {
  console.error('Player-visible old-version copy check failed:');
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line} [${finding.rule}] ${finding.text}`);
  }
  process.exit(1);
}

console.log(`Player-visible old-version copy check passed (${files.length} files scanned).`);
