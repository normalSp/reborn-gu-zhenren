const dns = require('dns');

// Test if resolve4 can get IPv4 addresses
dns.resolve4('registry.npmjs.org', (err, addrs) => {
  if (err) console.error('resolve4 FAIL:', err.message);
  else console.log('resolve4 OK:', addrs);
});

// Also test lookup with explicit IPv4
dns.lookup('registry.npmjs.org', { family: 4 }, (err, addr) => {
  if (err) console.error('lookup(ipv4) FAIL:', err.message);
  else console.log('lookup(ipv4) OK:', addr);
});
