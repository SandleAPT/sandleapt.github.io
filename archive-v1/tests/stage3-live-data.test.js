'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const minutesRoot=process.env.SANDLE_MINUTES_ROOT;
if(!minutesRoot){
  console.log('stage3-live-data: skipped (SANDLE_MINUTES_ROOT 미지정)');
  process.exit(0);
}

const archiveRoot=path.resolve(__dirname,'..');
global.window=global;
vm.runInThisContext(fs.readFileSync(path.join(minutesRoot,'assets','js','app','topic-defs.js'),'utf8'));
window.SandleMeetingSource={bodyLabel:body=>body==='임차'?'임차인대표회의':'입주자대표회의'};
vm.runInThisContext(fs.readFileSync(path.join(archiveRoot,'admin','stage3','meeting-adapter.js'),'utf8'));

let meetings=0;
let fragments=0;
const ids=new Set();
for(const filename of fs.readdirSync(minutesRoot).filter(name=>/^data-\d{4}\.json$/.test(name))){
  const pack=JSON.parse(fs.readFileSync(path.join(minutesRoot,filename),'utf8'));
  for(const record of pack.items||[]){
    const state=typeof record.json==='string'?JSON.parse(record.json):record.json;
    const conversion=window.SandleMeetingAdapter.convert({record,state});
    assert.equal(conversion.fragments.length,(state.agendas||[]).length);
    for(const fragment of conversion.fragments){
      assert.ok(!ids.has(fragment.id),`중복 Fragment ID: ${fragment.id}`);
      ids.add(fragment.id);
      fragments++;
    }
    meetings++;
  }
}

assert.ok(meetings>0,'회의 데이터가 있어야 해');
console.log(`stage3-live-data: ok (${meetings} meetings, ${fragments} fragments)`);
