(function(){
  const source=window.SANDLE_ADMIN_SAMPLE||{items:[],topics:[],documentTypes:[],scopes:[]};
  const clone=v=>JSON.parse(JSON.stringify(v));
  let state={items:clone(source.items||[])};
  const listeners=[];
  const emit=()=>listeners.forEach(fn=>fn(getState()));
  const getState=()=>({items:state.items,counts:getCounts()});
  const find=id=>state.items.find(x=>x.id===id);
  const readyForPublish=item=>item.classificationApproved && (!item.relation || item.relation.approved || item.relation.skipped) && !item.published;
  function getCounts(){
    return {
      classification:state.items.filter(x=>!x.published&&!x.classificationApproved&&!x.classificationHeld).length,
      held:state.items.filter(x=>!x.published&&x.classificationHeld).length,
      relations:state.items.filter(x=>!x.published&&x.classificationApproved&&x.relation&&!x.relation.approved&&!x.relation.skipped).length,
      publish:state.items.filter(readyForPublish).length,
      published:state.items.filter(x=>x.published).length,
      meetingImports:state.items.filter(x=>x.importedMeeting).length
    };
  }
  function suggest(fields){
    const text=((fields.title||'')+' '+(fields.note||'')+' '+(fields.documentType||'')).toLowerCase();
    let topic='기타', confidence=62;
    if(text.includes('주차')){topic='주차';confidence=91;}
    else if(text.includes('도서관')||text.includes('책')){topic='작은도서관';confidence=90;}
    else if(text.includes('선거')||text.includes('선관위')||text.includes('동대표')){topic='선거 · 선관위';confidence=89;}
    else if(text.includes('하자')||text.includes('판결')){topic='하자판결금';confidence=87;}
    else if(text.includes('헬스')||text.includes('gx')||text.includes('체육')||text.includes('보험')){topic='헬스장 · GX';confidence=84;}
    else if(text.includes('규약')||text.includes('계약')){topic='규약 · 계약';confidence=78;}
    else if(text.includes('관리비')||text.includes('잡수입')||text.includes('회계')){topic='재정 · 회계';confidence=82;}
    let organization='관리주체 확인 필요';
    if(text.includes('관리사무소'))organization='관리사무소';
    if(text.includes('입주자대표'))organization='입주자대표회의';
    const temporalStatus=(fields.documentType==='계약'||fields.documentType==='운영규정'||fields.documentType==='관리규약'||fields.documentType==='보험증권')?'current':'unknown';
    let relation=null;
    if(fields.documentType==='보험증권') relation={target:'관련 운영·계약 기록 확인 필요',type:'contract_for',evidence:'inferred',approved:false,skipped:false};
    else if(fields.documentType==='운영규정'||fields.documentType==='관리규약') relation={target:'이전 버전 또는 근거 기록 확인 필요',type:'supersedes',evidence:'inferred',approved:false,skipped:false};
    else if(fields.documentType==='공고·안내'||fields.documentType==='공문') relation={target:'근거 회의·결정 확인 필요',type:'follow_up_to',evidence:'inferred',approved:false,skipped:false};
    return {topic,organization,temporalStatus,confidence,relation};
  }
  function addDraft(fields){
    const s=suggest(fields);
    const item={
      id:'draft-'+Date.now(),sample:false,
      title:fields.title,documentType:fields.documentType,date:fields.date,scope:fields.scope,
      source:fields.source||'',note:fields.note||'',visibility:fields.visibility||'private',
      suggestions:{topic:s.topic,organization:s.organization,temporalStatus:s.temporalStatus,confidence:s.confidence},
      classificationApproved:false,classificationHeld:false,relation:s.relation,published:false
    };
    state.items.unshift(item);emit();return item;
  }
  function addImportedDrafts(items){
    const incoming=Array.isArray(items)?items:[];
    let added=0,skipped=0;
    incoming.slice().reverse().forEach(raw=>{
      if(!raw||!raw.id) return;
      if(find(raw.id)){skipped++;return;}
      state.items.unshift(clone(raw));added++;
    });
    if(added) emit();
    return {added,skipped,total:incoming.length};
  }
  function updateClassification(id,values){
    const item=find(id);if(!item)return;
    item.suggestions=Object.assign({},item.suggestions,values||{});emit();
  }
  function approveClassification(id){const item=find(id);if(!item)return;item.classificationApproved=true;item.classificationHeld=false;emit();}
  function holdClassification(id){const item=find(id);if(!item)return;item.classificationHeld=true;emit();}
  function resumeClassification(id){const item=find(id);if(!item)return;item.classificationHeld=false;emit();}
  function updateRelation(id,values){const item=find(id);if(!item||!item.relation)return;item.relation=Object.assign({},item.relation,values||{});emit();}
  function approveRelation(id){const item=find(id);if(!item||!item.relation)return;item.relation.approved=true;item.relation.skipped=false;emit();}
  function skipRelation(id){const item=find(id);if(!item||!item.relation)return;item.relation.approved=false;item.relation.skipped=true;emit();}
  function setVisibility(id,value){const item=find(id);if(!item)return;const policy=window.SandleVisibilityPolicy;item.visibility=policy?policy.normalizeVisibility(value):'private';emit();}
  function publish(id){
    const item=find(id);if(!item||!readyForPublish(item))return false;
    const guard=window.SandlePublishGuard;
    if(!guard||!guard.evaluate(item).canPublish)return false;
    item.published=true;item.publishedAt=new Date().toISOString();emit();return true;
  }
  function reset(){state={items:clone(source.items||[])};emit();}
  window.SandleAdminStore={
    data:source,getState,getCounts,find,readyForPublish,addDraft,addImportedDrafts,updateClassification,approveClassification,
    holdClassification,resumeClassification,updateRelation,approveRelation,skipRelation,setVisibility,publish,reset,
    subscribe(fn){listeners.push(fn);return()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  };
})();
