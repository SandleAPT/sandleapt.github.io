const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const order=require('../meeting-order.js');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const fn=source.slice(source.indexOf('  function loadDocument('),source.indexOf('  function deleteDocument('));
async function check(failAttachment){
  const doc={id:'proposal_test',title:'저장된 보고',date:'2026-09-29',docType:'report',orderKey:1024};
  let applied=null,focused=false;
  const context={documentLoading:false,saveBtn:{},newBtn:{},saveNote:{},cloudStatus:{},
    libraryList:{classList:{add(){},remove(){}}},libraryDocs:[doc],order,
    cloudApi:async()=>({item:{json:JSON.stringify({kind:'agenda-proposal',data:{title:doc.title,decision:'보고요지',docType:'report',decisionDate:doc.date},attachments:[{name:'자료.pdf'}]})}}),
    parsePayload:item=>JSON.parse(item.json),storedAttachmentToFile:async item=>{if(failAttachment)throw new Error('첨부 실패');return item;},
    normalizeAgendaNo:String,applyData:data=>{applied=data;},renderAttachmentList(){},update(){},renderLibraryRows(){},
    el:{title:{scrollIntoView(){},focus(){focused=true;}}},console:{error(){}},upsertLocalDoc(){}};
  vm.createContext(context);vm.runInContext(fn,context);
  const button={};const pending=context.loadDocument(doc.id,button);
  assert.equal(button.textContent,'불러오는 중…');assert(context.saveBtn.disabled);
  await pending;
  assert.equal(button.disabled,false);assert.equal(context.documentLoading,false);
  if(failAttachment){assert.equal(applied,null,'failed attachment must preserve current form');assert(context.cloudStatus.textContent.includes('첨부 실패'));}
  else{assert.equal(applied.title,doc.title);assert.equal(applied.agendaNo,'1');assert.equal(context.currentDocId,doc.id);assert(focused);}
}
(async()=>{await check(false);await check(true);console.log('document load tests passed: fields, number, focus, failure preservation, button recovery');})().catch(e=>{console.error(e);process.exitCode=1;});
