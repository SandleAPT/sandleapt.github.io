(function(){
  'use strict';

  const LEVELS=new Set(['public','resident','private']);
  const PUBLIC_FIELDS=['id','record_class','document_type','fragment_type','parent_document_id','title','summary','sequence','dates','document_date','event_date','effective_from','effective_to','temporal_status','scope','primary_topic','topics','organizations','actions','relations','vote','visibility','provenance'];
  const FORBIDDEN_PUBLIC_FIELDS=['private_notes','admin_notes','raw_content','resident_content','internal_source','reviewer_identity'];

  function clone(value){return JSON.parse(JSON.stringify(value));}
  function normalizeVisibility(value){return LEVELS.has(value)?value:'private';}
  function targetFor(value){
    const visibility=normalizeVisibility(value);
    if(visibility==='public')return {visibility,publicBundle:true,residentBundle:false,internalStore:true,authentication:'none'};
    if(visibility==='resident')return {visibility,publicBundle:false,residentBundle:true,internalStore:true,authentication:'resident_required'};
    return {visibility,publicBundle:false,residentBundle:false,internalStore:true,authentication:'admin_required'};
  }

  function publicProjection(record){
    if(!record||normalizeVisibility(record.visibility)!=='public')return null;
    const out={};
    PUBLIC_FIELDS.forEach(key=>{if(record[key]!==undefined)out[key]=clone(record[key]);});
    out.visibility='public';
    const sourceApi=window.SandleSourceReference;
    const refs=Array.isArray(record.sources)?record.sources:(record.source?[record.source]:[]);
    if(sourceApi){
      const publicRefs=refs.map(ref=>sourceApi.toPublicReference(ref)).filter(Boolean);
      if(publicRefs.length)out.sources=publicRefs;
    }
    return out;
  }

  function buildPublicBundle(records){return (records||[]).map(publicProjection).filter(Boolean);}

  function validatePublicBundle(records){
    const errors=[];
    (records||[]).forEach((record,index)=>{
      if(normalizeVisibility(record&&record.visibility)!=='public')errors.push(`${index}: public이 아닌 자료가 포함됐어.`);
      FORBIDDEN_PUBLIC_FIELDS.forEach(key=>{if(record&&record[key]!==undefined)errors.push(`${index}: ${key}가 공개 번들에 포함됐어.`);});
      const refs=Array.isArray(record&&record.sources)?record.sources:[];
      refs.forEach((ref,refIndex)=>{
        if(ref.visibility!=='public'||ref.access!=='public')errors.push(`${index}.${refIndex}: 공개할 수 없는 원본 참조야.`);
        if(ref.locator&&ref.locator.file_id)errors.push(`${index}.${refIndex}: 공개 번들에 외부 비공개 file_id가 남아 있어.`);
      });
    });
    return {valid:!errors.length,errors,count:(records||[]).length};
  }

  window.SandleVisibilityPolicy={LEVELS:[...LEVELS],PUBLIC_FIELDS,FORBIDDEN_PUBLIC_FIELDS,normalizeVisibility,targetFor,publicProjection,buildPublicBundle,validatePublicBundle};
})();
