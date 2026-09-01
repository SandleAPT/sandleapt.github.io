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

const base={id:'record-1',title:'공개 자료',documentType:'공고·안내',date:'2026-09-01',scope:'all_residents',suggestions:{topic:'주차',organization:'관리사무소'}};
const publicResult=window.SandlePublishGuard.evaluate({...base,visibility:'public',private_notes:'숨김'});
assert.equal(publicResult.canPublish,true);
assert.equal(publicResult.projection.title,'공개 자료');
assert.equal(publicResult.projection.private_notes,undefined);

const residentResult=window.SandlePublishGuard.evaluate({...base,visibility:'resident',sources:[{ref_id:'secret',provider:'google_drive',visibility:'resident',access:'authenticated',locator:{file_id:'secret-id'}}]});
assert.equal(residentResult.canPublish,false);
assert.equal(residentResult.projection,null);
assert.equal(residentResult.excludedSources,1);

const missingVisibility=window.SandlePublishGuard.evaluate({...base,visibility:undefined});
assert.equal(missingVisibility.visibility,'private');
assert.equal(missingVisibility.canPublish,false);

console.log('stage4-publish-guard: ok');
