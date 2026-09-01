'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

global.window=global;
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname,'../admin/stage4/source-reference.js'),'utf8'));
const api=window.SandleSourceReference;

const publicRef={ref_id:'src-1',provider:'repository',label:'공개 회의록',original_type:'json',visibility:'public',access:'public',locator:{repository:'SandleAPT/minutes',path:'data-2026.json',url:'/minutes/#archiveView'}};
assert.equal(api.validate(publicRef).valid,true);
assert.equal(api.isPubliclyLinkable(publicRef),true);
assert.equal(api.toPublicReference(publicRef).locator.path,'data-2026.json');

const residentRef={ref_id:'src-2',provider:'google_drive',label:'입주민 자료',original_type:'pdf',visibility:'resident',access:'authenticated',locator:{file_id:'resident-file-id'}};
assert.equal(api.validate(residentRef).valid,true);
assert.equal(api.isPubliclyLinkable(residentRef),false);
assert.equal(api.toPublicReference(residentRef),null);

const unsafe={...residentRef,access:'public'};
assert.equal(api.validate(unsafe).valid,false);

console.log('stage4-source-reference: ok');
