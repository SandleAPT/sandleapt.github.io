(function(){
  'use strict';
  const BASE='/minutes/';
  let indexCache=null;
  const yearCache=new Map();

  async function getJson(url,cache){
    const r=await fetch(url,{cache:cache||'no-cache'});
    if(!r.ok) throw new Error(`회의록 데이터를 불러오지 못했어 (${r.status})`);
    return r.json();
  }

  async function loadIndex(force){
    if(indexCache&&!force) return indexCache;
    const data=await getJson(BASE+'data-index.json'+(force?'?t='+Date.now():''),'no-cache');
    const years=Array.isArray(data&&data.years)?data.years.slice():[];
    years.sort((a,b)=>Number(b.year)-Number(a.year));
    indexCache={generatedAt:data&&data.generatedAt||'',years};
    return indexCache;
  }

  async function loadYear(year,force){
    year=String(year||'').trim();
    if(!year) throw new Error('연도를 선택해줘.');
    if(yearCache.has(year)&&!force) return yearCache.get(year);
    const idx=await loadIndex(false);
    const meta=idx.years.find(x=>String(x.year)===year);
    const file=(meta&&meta.file)||`data-${year}.json`;
    const version=meta&&meta.updatedAt?`?v=${encodeURIComponent(meta.updatedAt)}`:(force?'?t='+Date.now():'');
    const data=await getJson(BASE+file+version,force?'no-cache':'force-cache');
    const items=Array.isArray(data&&data.items)?data.items.slice():[];
    items.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
    const result={year,generatedAt:data&&data.generatedAt||'',items,meta:meta||null};
    yearCache.set(year,result);
    return result;
  }

  function parseRecord(record){
    if(!record) throw new Error('회의록을 선택해줘.');
    let state={};
    try{ state=typeof record.json==='string'?JSON.parse(record.json):(record.json||{}); }
    catch(e){ throw new Error('회의록 JSON을 읽을 수 없어.'); }
    return {record,state};
  }

  function bodyOf(parsed){
    const m=parsed&&parsed.state&&parsed.state.meeting||{};
    return m.body==='임차'?'임차':'입대의';
  }

  function bodyLabel(body){ return body==='임차'?'임차인대표회의':'입주자대표회의'; }

  async function recent(limit){
    limit=Math.max(1,Number(limit)||8);
    const idx=await loadIndex(false);
    const out=[];
    for(const y of idx.years){
      const pack=await loadYear(y.year,false);
      for(const item of pack.items){
        out.push(item);
        if(out.length>=limit) return out;
      }
    }
    return out;
  }

  window.SandleMeetingSource={BASE,loadIndex,loadYear,parseRecord,bodyOf,bodyLabel,recent};
})();
