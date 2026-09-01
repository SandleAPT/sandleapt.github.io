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
      // 사람이 보지 않고 자동으로 정해진 것. 언제든 꺼내 볼 수 있어야 한다.
      autoAssigned:state.items.filter(x=>!x.published&&x.autoAssigned).length,
      meetingImports:state.items.filter(x=>x.importedMeeting).length
    };
  }
  // 분류·관계 자동 판정은 shared/auto-assign.js 한 곳에서만 한다.
  // 여기서 규칙을 또 쓰면 두 곳이 갈라진다.
  function suggest(fields){
    const A=window.SandleAutoAssign;
    const text=((fields.title||'')+' '+(fields.note||'')+' '+(fields.documentType||'')).toLowerCase();
    let organization='관리주체 확인 필요';
    if(text.includes('관리사무소'))organization='관리사무소';
    if(text.includes('입주자대표'))organization='입주자대표회의';
    const temporalStatus=(fields.documentType==='계약'||fields.documentType==='운영규정'||fields.documentType==='관리규약'||fields.documentType==='보험증권')?'current':'unknown';
    // 모듈이 없으면 자동 확정하지 않는다(사람이 다 본다). 조용히 통과시키지 않는다.
    if(!A) return {topic:'기타',organization,temporalStatus,confidence:0,autoOk:false,
      reason:'module-missing',why:'자동 판정 모듈을 불러오지 못했다. 직접 정해야 한다.',matched:[],alternatives:[],relation:null};
    const c=A.classify(fields);
    return {topic:c.topic,organization,temporalStatus,confidence:c.confidence,
      autoOk:c.autoOk,reason:c.reason,why:c.why,matched:c.matched,alternatives:c.alternatives,
      relation:A.relate(fields)};
  }
  function addDraft(fields){
    const s=suggest(fields);
    const item={
      id:'draft-'+Date.now(),sample:false,
      title:fields.title,documentType:fields.documentType,date:fields.date,scope:fields.scope,
      source:fields.source||'',note:fields.note||'',visibility:fields.visibility||'private',
      suggestions:{topic:s.topic,organization:s.organization,temporalStatus:s.temporalStatus,
        confidence:s.confidence,reason:s.reason,why:s.why,matched:s.matched,alternatives:s.alternatives},
      // 확신이 서면 자동 확정하고, 애매하면 사람에게 보낸다.
      // 자동으로 정해진 것은 autoAssigned로 표시해 나중에 찾아서 바꿀 수 있게 한다.
      classificationApproved:!!s.autoOk,autoAssigned:!!s.autoOk,
      classificationHeld:false,relation:s.relation,published:false
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
  function approveClassification(id){const item=find(id);if(!item)return;item.classificationApproved=true;item.classificationHeld=false;item.autoAssigned=false;emit();}
  // 자동으로 정해진 분류를 사람이 다시 보겠다고 꺼내는 경우.
  // 자동 판정이 틀렸을 때 되돌릴 길이 없으면 '자동으로 해준다'가 위험해진다.
  function reopenClassification(id){const item=find(id);if(!item)return;item.classificationApproved=false;item.autoAssigned=false;item.classificationHeld=false;emit();}
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
    holdClassification,resumeClassification,reopenClassification,updateRelation,approveRelation,skipRelation,setVisibility,publish,reset,
    subscribe(fn){listeners.push(fn);return()=>{const i=listeners.indexOf(fn);if(i>=0)listeners.splice(i,1);};}
  };
})();
