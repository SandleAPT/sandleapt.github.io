'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const archiveRoot=path.resolve(__dirname,'..');
const fixture=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','stage3-meetings.json'),'utf8'));

global.window=global;
window.TopicTaxonomy={
  defs:[
    {key:'주차',kw:['주차','차단기']},
    {key:'청소·미화',kw:['청소','미화원']},
    {key:'급수·배수·난방',kw:['저수조']}
  ],
  resolveStored(agenda,autoTags){
    const raw=Array.isArray(agenda.tags)&&agenda.tags.length?agenda.tags:(agenda.category?[agenda.category]:[]);
    let needsAuto=false;
    const out=[];
    raw.forEach(value=>{
      let topic=String(value||'').trim();
      if(topic==='기타'||topic==='저수조·청소'){needsAuto=true;return;}
      if(topic==='미화')topic='청소·미화';
      if(topic==='소송')topic='하자·소송';
      if(topic&&!out.includes(topic))out.push(topic);
    });
    if(needsAuto) autoTags(agenda).filter(topic=>topic!=='기타').forEach(topic=>{if(!out.includes(topic))out.push(topic);});
    return out.length?out:['기타'];
  }
};
window.SandleMeetingSource={bodyLabel:body=>body==='임차'?'임차인대표회의':'입주자대표회의'};
vm.runInThisContext(fs.readFileSync(path.join(archiveRoot,'admin','stage3','meeting-adapter.js'),'utf8'));

const record=fixture.year.items[0];
const state=JSON.parse(record.json);
const conversion=window.SandleMeetingAdapter.convert({record,state});

assert.equal(conversion.document.id,'meeting:fixture-meeting-1');
assert.equal(conversion.document.fragment_count,3);
assert.equal(conversion.document.meeting.attendee_count,1);
assert.equal(conversion.fragments.length,3);
assert.deepEqual(conversion.fragments[0].topics,['주차']);
assert.equal(conversion.fragments[0].topic_source,'inferred');
assert.deepEqual(conversion.fragments[0].vote,{for:1,against:1,abstain:0,other:0,total:2});
assert.deepEqual(conversion.fragments[1].topics,['청소·미화']);
assert.equal(conversion.fragments[1].topic_source,'stored');
assert.ok(!conversion.fragments[2].topics.includes('저수조·청소'));
assert.equal(conversion.fragments[2].topic_source,'inferred');

const drafts=window.SandleMeetingAdapter.toAdminDrafts(conversion);
assert.equal(drafts.length,3);
assert.equal(new Set(drafts.map(item=>item.id)).size,3);
assert.ok(drafts.every(item=>item.importedMeeting));

console.log('stage3-adapter: ok');
