'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

global.window=global;
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../admin/stage4/source-reference.js'),'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../admin/stage4/visibility-policy.js'),'utf8'));
const api=window.SandleVisibilityPolicy;

const records=[
  {id:'public-1',title:'공개 자료',summary:'공개 요약',visibility:'public',private_notes:'공개되면 안 됨',sources:[{ref_id:'src-public',provider:'repository',visibility:'public',access:'public',locator:{repository:'SandleAPT/minutes',path:'data-2026.json'}}]},
  {id:'resident-1',title:'입주민 자료',summary:'입주민 본문',visibility:'resident',sources:[{ref_id:'src-resident',provider:'google_drive',visibility:'resident',access:'authenticated',locator:{file_id:'secret-id'}}]},
  {id:'private-1',title:'관리자 자료',visibility:'private',admin_notes:'내부 메모'}
];

const bundle=api.buildPublicBundle(records);
assert.equal(bundle.length,1);
assert.equal(bundle[0].id,'public-1');
assert.equal(bundle[0].private_notes,undefined);
assert.equal(bundle[0].sources.length,1);
assert.equal(api.validatePublicBundle(bundle).valid,true);
assert.equal(api.targetFor('resident').publicBundle,false);
assert.equal(api.targetFor('unknown').visibility,'private');

console.log('stage4-visibility: ok');
