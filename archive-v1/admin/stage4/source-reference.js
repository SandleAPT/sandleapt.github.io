(function(){
  'use strict';

  const PROVIDERS=new Set(['repository','google_drive','external_url','minutes','library','local_archive']);
  const VISIBILITIES=new Set(['public','resident','private']);
  const ACCESS=new Set(['public','authenticated','restricted']);

  function clean(value){return String(value==null?'':value).trim();}
  function clone(value){return JSON.parse(JSON.stringify(value==null?{}:value));}
  function safeUrl(value){
    const url=clean(value);
    return url.startsWith('/')||/^https:\/\//i.test(url)?url:'';
  }

  function normalize(input){
    const raw=clone(input);
    const visibility=VISIBILITIES.has(raw.visibility)?raw.visibility:'private';
    const access=ACCESS.has(raw.access)?raw.access:(visibility==='public'?'public':visibility==='resident'?'authenticated':'restricted');
    const locator=raw.locator&&typeof raw.locator==='object'?raw.locator:{};
    return {
      ref_id:clean(raw.ref_id),
      provider:PROVIDERS.has(raw.provider)?raw.provider:'local_archive',
      label:clean(raw.label),
      original_type:clean(raw.original_type),
      visibility,
      access,
      locator:{
        repository:clean(locator.repository),
        path:clean(locator.path),
        commit_sha:clean(locator.commit_sha),
        file_id:clean(locator.file_id),
        record_id:clean(locator.record_id),
        url:safeUrl(locator.url)
      },
      checksum:clean(raw.checksum)
    };
  }

  function validate(input){
    const ref=normalize(input);
    const errors=[];
    if(!ref.ref_id)errors.push('ref_id가 필요해.');
    if(!PROVIDERS.has(input&&input.provider))errors.push('지원하지 않는 provider야.');
    if(!VISIBILITIES.has(input&&input.visibility))errors.push('visibility는 public/resident/private 중 하나여야 해.');
    if(!ACCESS.has(input&&input.access))errors.push('access는 public/authenticated/restricted 중 하나여야 해.');
    const l=ref.locator;
    if(!l.repository&&!l.path&&!l.file_id&&!l.record_id&&!l.url)errors.push('원본을 찾을 locator가 하나 이상 필요해.');
    if(ref.visibility==='public'&&ref.access!=='public')errors.push('public 메타데이터의 원본 링크는 access도 public이어야 해.');
    if(ref.visibility!=='public'&&ref.access==='public')errors.push('resident/private 원본을 public access로 둘 수 없어.');
    return {valid:!errors.length,errors,reference:ref};
  }

  function isPubliclyLinkable(input){
    const result=validate(input);
    if(!result.valid)return false;
    const ref=result.reference;
    return ref.visibility==='public'&&ref.access==='public'&&!!(ref.locator.url||ref.locator.repository||ref.locator.record_id);
  }

  function toPublicReference(input){
    if(!isPubliclyLinkable(input))return null;
    const ref=normalize(input);
    const locator={};
    if(ref.locator.url)locator.url=ref.locator.url;
    if(ref.locator.repository)locator.repository=ref.locator.repository;
    if(ref.locator.path)locator.path=ref.locator.path;
    if(ref.locator.commit_sha)locator.commit_sha=ref.locator.commit_sha;
    if(ref.locator.record_id)locator.record_id=ref.locator.record_id;
    return {ref_id:ref.ref_id,provider:ref.provider,label:ref.label,original_type:ref.original_type,visibility:'public',access:'public',locator};
  }

  window.SandleSourceReference={PROVIDERS:[...PROVIDERS],normalize,validate,isPubliclyLinkable,toPublicReference};
})();
