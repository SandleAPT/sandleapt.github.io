(function(root){
  'use strict';
  var role='',generation=0,revisions=Object.create(null);
  var url='https://script.google.com/macros/s/AKfycbyhpE-DB5WAAEx7uqTCPwU-e0sPKuupkYN3YoQWALiFWe0IHFNh1y91e1VNtDmMxxoxLA/exec';
  function own(id){return /^proposal_writer_[A-Za-z0-9_-]{1,100}$/.test(id||'');}
  function setRole(next){if(next===role)return;role=next;generation++;revisions=Object.create(null);root.dispatchEvent(new root.Event('sandle-proposal-role'));}
  async function request(body,legacy,onProgress){
    if(role!=='edit'&&role!=='writer')throw new Error('회의자료 작성 권한을 다시 확인해 주세요.');
    var ticket=generation,key=root.localStorage.getItem('sandle_admin_key'),id=(body.record&&body.record.id)||body.id;
    if(role==='writer'&&body.action!=='list'&&!own(id))throw new Error('본인이 작성한 자료만 수정할 수 있습니다.');
    async function main(original){
      var action={list:'List',get:'Get',save:'Save',delete:'Delete'}[original.action];
      if(!action)throw new Error('지원하지 않는 요청입니다.');
      var data=Object.assign({},original,{action:'writerProposal'+action,adminKey:key,token:'ITDXaUBDTmrz6DbQ3tv9R'});
      if(original.action==='save'||original.action==='delete')data.expectedRevision=revisions[id]||'';
      var result=await root.ProposalCloud.json(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)},onProgress);
      if(!result||!result.ok)throw new Error(result&&result.error==='conflict'?'다른 기기에서 수정했습니다. 자료를 다시 열어 주세요.':result&&result.error==='backup_failed'?'저장을 확인하지 못했습니다. 내용을 보관하고 다시 시도해 주세요.':'회의자료를 저장하거나 불러오지 못했습니다.');
      if(ticket!==generation||key!==root.localStorage.getItem('sandle_admin_key'))throw new Error('작성 권한이 종료되었습니다.');
      (result.items||[]).forEach(function(item){if(!revisions[item.id])revisions[item.id]=item.revision;});
      // Listing never advances the revision of an already open document.
      if(result.item)revisions[result.item.id]=result.item.revision;
      if(result.revision)revisions[result.id]=result.revision;
      return result;
    }
    var result;
    if(body.action==='list'&&role==='edit'){
      var all=await Promise.all([root.localStorage.getItem('sandle_private_url')?legacy(body):Promise.resolve({ok:true,items:[]}),main(body)]);
      result={ok:true,items:(all[0].items||[]).concat(all[1].items||[])};
    }else result=role==='writer'||own(id)?await main(body):await legacy(body);
    if(ticket!==generation||key!==root.localStorage.getItem('sandle_admin_key'))throw new Error('작성 권한이 종료되었습니다.');
    return result;
  }
  root.ProposalWorkspace={setRole:setRole,role:function(){return role;},url:url,own:own,request:request};
})(window);
