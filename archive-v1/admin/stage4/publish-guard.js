(function(){
  'use strict';

  function clean(value){return String(value==null?'':value).trim();}
  function toArchiveRecord(item){
    const policy=window.SandleVisibilityPolicy;
    const visibility=policy?policy.normalizeVisibility(item&&item.visibility):'private';
    const suggestion=item&&item.suggestions||{};
    const relation=item&&item.relation;
    const record={
      id:clean(item&&item.id),
      record_class:clean(item&&item.record_class)||'document',
      document_type:clean(item&&(item.document_type||item.documentType)),
      title:clean(item&&item.title),
      document_date:clean(item&&(item.document_date||item.date)),
      scope:clean(item&&item.scope),
      primary_topic:clean(item&&item.primary_topic)||clean(suggestion.topic),
      visibility
    };
    if(clean(suggestion.organization))record.organizations=[clean(suggestion.organization)];
    if(relation&&relation.approved&&clean(relation.target)){
      record.relations=[{target:clean(relation.target),type:clean(relation.type)||'related_to',evidence:clean(relation.evidence)||'verified'}];
    }
    if(item&&item.publicSummary)record.summary=clean(item.publicSummary);
    if(item&&item.publicProvenance)record.provenance=item.publicProvenance;
    if(Array.isArray(item&&item.sources))record.sources=item.sources;
    return record;
  }

  function evaluate(item){
    const policy=window.SandleVisibilityPolicy;
    if(!policy)return {canPublish:false,visibility:'private',reason:'공개 정책 모듈을 불러오지 못했어.',projection:null,validation:{valid:false,errors:['policy_missing']},excludedSources:0};
    const record=toArchiveRecord(item||{});
    const target=policy.targetFor(record.visibility);
    if(!target.publicBundle){
      const reason=target.visibility==='resident'?'입주민 인증 영역이 준비되기 전에는 공개 발행할 수 없어.':'관리자 내부 자료는 공개 발행할 수 없어.';
      return {canPublish:false,visibility:target.visibility,reason,projection:null,validation:{valid:false,errors:[reason]},excludedSources:Array.isArray(record.sources)?record.sources.length:0};
    }
    const projection=policy.publicProjection(record);
    const validation=policy.validatePublicBundle(projection?[projection]:[]);
    const required=[];
    if(!record.id)required.push('id가 필요해.');
    if(!record.title)required.push('title이 필요해.');
    const sourceCount=Array.isArray(record.sources)?record.sources.length:0;
    const publicSourceCount=projection&&Array.isArray(projection.sources)?projection.sources.length:0;
    const errors=validation.errors.concat(required);
    return {
      canPublish:!errors.length,
      visibility:'public',
      reason:errors.length?errors.join(' '):'공개 projection과 권한 검사를 통과했어.',
      projection,
      validation:{valid:!errors.length,errors,count:projection?1:0},
      excludedSources:Math.max(0,sourceCount-publicSourceCount)
    };
  }

  function summarize(items){
    const results=(items||[]).map(evaluate);
    return {
      total:results.length,
      publishable:results.filter(x=>x.canPublish).length,
      resident:results.filter(x=>x.visibility==='resident').length,
      private:results.filter(x=>x.visibility==='private').length,
      blocked:results.filter(x=>!x.canPublish).length,
      excludedSources:results.reduce((sum,x)=>sum+x.excludedSources,0)
    };
  }

  window.SandlePublishGuard={toArchiveRecord,evaluate,summarize};
})();
