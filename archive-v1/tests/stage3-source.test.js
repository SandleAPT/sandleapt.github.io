'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const archiveRoot=path.resolve(__dirname,'..');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','stage3-meetings.json'),'utf8'));
const requests=[];

global.window=global;
global.fetch=async url=>{
  requests.push(String(url));
  const data=String(url).includes('data-index.json')?fixture.index:fixture.year;
  return {ok:true,status:200,json:async()=>JSON.parse(JSON.stringify(data))};
};
vm.runInThisContext(fs.readFileSync(path.join(archiveRoot,'admin','stage3','meeting-source.js'),'utf8'));

(async()=>{
  const index=await window.SandleMeetingSource.loadIndex(false);
  assert.equal(index.years[0].year,'2026');
  const pack=await window.SandleMeetingSource.loadYear('2026',false);
  assert.equal(pack.items.length,1);
  const parsed=window.SandleMeetingSource.parseRecord(pack.items[0]);
  assert.equal(window.SandleMeetingSource.bodyOf(parsed),'입대의');
  assert.equal(requests.length,2);
  await window.SandleMeetingSource.loadYear('2026',false);
  assert.equal(requests.length,2,'연도 캐시를 재사용해야 해');
  console.log('stage3-source: ok');
})().catch(error=>{
  console.error(error);
  process.exitCode=1;
});
