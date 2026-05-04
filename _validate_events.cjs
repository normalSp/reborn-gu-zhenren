const fs = require('fs');
const c = JSON.parse(fs.readFileSync('src/canon/chapters.json', 'utf8'));
console.log('JSON OK');
console.log('Events:');
c.global.forEach(e => {
  const rd = e.rippleDomains;
  const l0domain = e.affectedDomains[0];
  const hasL0 = Boolean(rd[l0domain] && rd[l0domain].sceneConstraint);
  const l3Count = (e.l3GlobalFlags || []).length;
  console.log('  ' + e.eventId + ': domains=' + Object.keys(rd).length + ' L0=' + hasL0 + ' L3=' + l3Count + ' strength=' + e.rippleStrength + ' vol=' + e.volume);
});
console.log('Total events: ' + c.global.length);
console.log('Chapters total: ' + Object.values(c.domains).reduce((s, chs) => s + chs.length, 0));
