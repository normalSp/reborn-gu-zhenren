// Monkey-patch dns.lookup to force IPv4 only
// Required because Node.js v22 on this Windows machine resolves to IPv6
// which is not routable. npm's HTTP client uses dns.lookup() internally.
const dns = require('dns');
const originalLookup = dns.lookup;

dns.lookup = function(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = { family: 4 };
  } else if (typeof options === 'object') {
    options = { ...options, family: 4 };
  } else {
    options = { family: 4 };
  }
  return originalLookup(hostname, options, callback);
};

// Also patch promises version
const promises = dns.promises;
if (promises) {
  const origPromisesLookup = promises.lookup;
  promises.lookup = function(hostname, options) {
    if (typeof options === 'object') {
      options = { ...options, family: 4 };
    } else {
      options = { family: 4 };
    }
    return origPromisesLookup(hostname, options);
  };
}

console.log('[force-ipv4] DNS lookup patched to IPv4-only');
