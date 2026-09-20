const assert=require('assert');require('../cloud-settings.js');
const s=globalThis.ProposalCloudSettings,url='https://script.google.com/macros/s/example_123/exec';
assert.equal(s.decode(JSON.stringify({kind:'sandle-cloud-connection',version:1,url})),url);
for(const bad of ['https://evil.test/macros/s/a/exec','javascript:alert(1)','https://script.google.com/macros/s/a/exec?password=x'])assert.throws(()=>s.validUrl(bad));
assert.throws(()=>s.decode('{"kind":"other"}'));
console.log('Settings roundtrip and invalid address checks passed');
