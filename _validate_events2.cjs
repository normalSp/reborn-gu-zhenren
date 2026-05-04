const fs = require('fs');
const c = JSON.parse(fs.readFileSync('src/canon/chapters.json', 'utf8'));
console.log('JSON OK, version:', c._meta.version);
const de = c.domain_events || [];
console.log('Domain events:', de.length);
const byDomain = {};
de.forEach(e => {
  byDomain[e.sourceDomain] = (byDomain[e.sourceDomain] || 0) + 1;
  const mentions = Object.keys(e.crossDomainMentions || {});
  const hasL0 = e.sceneConstraint && e.sceneConstraint.mustHappen;
  const ok = mentions.length >= 4 && hasL0 && e.triggerChapter;
  if (!ok) console.log('  BAD:', e.eventId, 'mentions=', mentions.length, 'L0=', hasL0);
});
Object.entries(byDomain).forEach(([d, n]) => console.log('  ' + d + ': ' + n));
console.log('All valid: ' + (de.length === 32 ? 'YES' : 'NO (' + de.length + ' events)'));
console.log('Chapters: ' + Object.values(c.domains).reduce((s, c) => s + c.length, 0));
console.log('Global events: ' + c.global.length);
