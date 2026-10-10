const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let calls=[],legacyCalls=[],answer={ok:true,items:[]},resolve,waiting;
const values={sandle_admin_key:'fixture-writer',sandle_private_url:'private-url'};
const root={localStorage:{getItem:k=>values[k]||''},Event:class{},dispatchEvent(){},ProposalCloud:{json:async(url,opts)=>{calls.push(JSON.parse(opts.body));return waiting?waiting:answer;}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/../workspace.js','utf8'),{window:root});
const W=root.ProposalWorkspace,legacy=async b=>{legacyCalls.push(b);return {ok:true,items:[{id:'proposal_admin'}]};};
(async()=>{
 await assert.rejects(W.request({action:'list'},legacy));W.setRole('writer');
 await W.request({action:'list'},legacy);assert.equal(calls.at(-1).action,'writerProposalList');assert.equal(legacyCalls.length,0);
 await assert.rejects(W.request({action:'save',record:{id:'proposal_admin'}},legacy),/본인이/);
 answer={ok:true,items:[{id:'proposal_writer_test',revision:'r1'}]};await W.request({action:'list'},legacy);
 answer={ok:true,item:{id:'proposal_writer_test',revision:'r1'}};await W.request({action:'get',id:'proposal_writer_test'},legacy);
 answer={ok:true,revision:'r2',id:'proposal_writer_test'};await W.request({action:'save',record:{id:'proposal_writer_test'}},legacy);assert.equal(calls.at(-1).expectedRevision,'r1');
 W.setRole('edit');answer={ok:true,items:[{id:'proposal_writer_test',revision:'r2'}]};const list=await W.request({action:'list'},legacy);assert.equal(list.items.length,2);
 await W.request({action:'get',id:'proposal_admin'},legacy);assert.equal(legacyCalls.at(-1).id,'proposal_admin');
 waiting=new Promise(r=>resolve=r);const pending=W.request({action:'get',id:'proposal_writer_test'},legacy);W.setRole('');resolve({ok:true,item:{id:'proposal_writer_test',revision:'r3'}});await assert.rejects(pending,/권한이 종료/);
 console.log('Proposal workspace: writer isolation, admin combined access, revision guard, role expiry passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
