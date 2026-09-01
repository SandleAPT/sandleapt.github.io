'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

global.window=global;
const load=file=>vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,file),'utf8'));
load('../admin/stage4/source-reference.js');
load('../admin/stage4/visibility-policy.js');
load('../admin/stage4/publish-guard.js');
load('../admin/data/sample.js');
load('../admin/store.js');

const store=window.SandleAdminStore;
const item=store.find('sample-publish');
assert.ok(item);
store.setVisibility(item.id,'resident');
assert.equal(store.publish(item.id),false);
assert.equal(item.published,false);
store.setVisibility(item.id,'private');
assert.equal(store.publish(item.id),false);
store.setVisibility(item.id,'public');
assert.equal(store.publish(item.id),true);
assert.equal(item.published,true);

const savedGuard=window.SandlePublishGuard;
store.reset();
window.SandlePublishGuard=null;
assert.equal(store.publish('sample-publish'),false);
window.SandlePublishGuard=savedGuard;

const html=fs.readFileSync(path.resolve(__dirname,'../admin/index.html'),'utf8');
assert.match(html,/data-view="storagePolicy"/);
assert.match(html,/admin-stage4\.css/);
const policyAt=html.indexOf('./stage4/visibility-policy.js');
const guardAt=html.indexOf('./stage4/publish-guard.js');
const storeAt=html.indexOf('./store.js');
assert.ok(policyAt>=0&&guardAt>policyAt&&storeAt>guardAt);
assert.match(html,/views\/storage-policy\.js/);
assert.match(html,/views\/publish-stage4\.js/);

console.log('stage4-admin-integration: ok');
