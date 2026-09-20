(function(root,factory){
  "use strict";
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.ProposalOrder=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  var STEP=1024;
  var META_RE=/^\[회의자료\]\[(의결|보고)\]\[(정기|임시|-)\]\[(-?\d+(?:\.\d+)?)\]\s*/;

  function normalizeDocType(value){
    return value==="report"||value==="보고"||value==="보고사항"?"report":"decision";
  }
  function typeLabel(value){return normalizeDocType(value)==="report"?"보고":"의결";}
  function cleanTitle(value){
    return String(value||"")
      .replace(META_RE,"")
      .replace(/^\[안건제안서\]\s*/,"")
      .replace(/^\[회의자료\]\s*/,"")
      .trim();
  }
  function normalizeOrderKey(value,fallback){
    var n=Number(value);
    if(isFinite(n))return n;
    n=Number(fallback);
    return isFinite(n)?n:STEP;
  }
  function printableOrderKey(value){
    var n=normalizeOrderKey(value,STEP);
    return String(Math.round(n*1000000)/1000000);
  }
  function buildRecordTitle(meta,title){
    var type=typeLabel(meta&&meta.docType);
    var meetingType=meta&&(/^(정기|임시)$/.test(meta.meetingType||""))?meta.meetingType:"-";
    return "[회의자료]["+type+"]["+meetingType+"]["+printableOrderKey(meta&&meta.orderKey)+"] "+cleanTitle(title);
  }
  function parseRecord(row){
    row=row||{};
    var raw=String(row.title||"");
    var match=raw.match(META_RE);
    return {
      id:String(row.id||""),
      title:cleanTitle(raw)||"제목 없는 회의자료",
      date:String(row.date||""),
      updatedAt:String(row.updatedAt||""),
      createdAt:String(row.createdAt||""),
      docType:match&&match[1]==="보고"?"report":"decision",
      meetingType:match&&match[2]!=="-"?match[2]:"",
      orderKey:match?normalizeOrderKey(match[3],STEP):NaN,
      needsHydration:!match,
      raw:row
    };
  }
  function hydrateRecord(doc,payload){
    payload=payload||{};
    var data=payload.data||payload;
    var agendaNo=String(data.agendaNo||"").match(/\d+/);
    var fallback=agendaNo?Number(agendaNo[0])*STEP:STEP;
    doc.docType=normalizeDocType(data.docType||payload.docType||doc.docType);
    doc.meetingType=/^(정기|임시)$/.test(data.meetingType||"")?data.meetingType:doc.meetingType;
    doc.orderKey=normalizeOrderKey(payload.orderKey!==undefined?payload.orderKey:data.orderKey,fallback);
    doc.title=cleanTitle(data.title||doc.title)||"제목 없는 회의자료";
    doc.createdAt=String(payload.createdAt||doc.createdAt||"");
    doc.needsHydration=false;
    return doc;
  }
  function sameGroup(a,b){
    return !!a&&!!b&&String(a.date||"")===String(b.date||"")&&normalizeDocType(a.docType)===normalizeDocType(b.docType);
  }
  function byGroupOrder(a,b){
    var ao=normalizeOrderKey(a&&a.orderKey,STEP),bo=normalizeOrderKey(b&&b.orderKey,STEP);
    if(ao!==bo)return ao-bo;
    var ac=String(a&&a.createdAt||a&&a.updatedAt||""),bc=String(b&&b.createdAt||b&&b.updatedAt||"");
    if(ac!==bc)return ac.localeCompare(bc);
    return String(a&&a.id||"").localeCompare(String(b&&b.id||""));
  }
  function group(rows,date,docType,excludeId){
    var probe={date:String(date||""),docType:normalizeDocType(docType)};
    return (rows||[]).filter(function(row){return row.id!==excludeId&&sameGroup(row,probe);}).sort(byGroupOrder);
  }
  function displayNumber(doc,rows){
    if(!doc||!doc.date)return 0;
    var items=group(rows,doc.date,doc.docType);
    var index=items.findIndex(function(item){return item.id===doc.id;});
    return index<0?0:index+1;
  }
  function nextOrderKey(rows,date,docType,excludeId){
    var items=group(rows,date,docType,excludeId);
    if(!items.length)return STEP;
    return normalizeOrderKey(items[items.length-1].orderKey,items.length*STEP)+STEP;
  }
  function moveOrderKey(doc,rows,direction){
    var items=group(rows,doc.date,doc.docType);
    var index=items.findIndex(function(item){return item.id===doc.id;});
    if(index<0)return null;
    if(direction<0){
      if(index===0)return null;
      var upper=normalizeOrderKey(items[index-1].orderKey,index*STEP);
      var lower=index>1?normalizeOrderKey(items[index-2].orderKey,(index-1)*STEP):upper-STEP*2;
      if(lower>=upper)return upper-STEP/2;
      return (lower+upper)/2;
    }
    if(index>=items.length-1)return null;
    var lowerNext=normalizeOrderKey(items[index+1].orderKey,(index+2)*STEP);
    var upperNext=index+2<items.length?normalizeOrderKey(items[index+2].orderKey,(index+3)*STEP):lowerNext+STEP*2;
    if(upperNext<=lowerNext)return lowerNext+STEP/2;
    return (lowerNext+upperNext)/2;
  }
  function sortedForLibrary(rows){
    return (rows||[]).slice().sort(function(a,b){
      var dateCompare=String(b.date||"").localeCompare(String(a.date||""));
      if(dateCompare)return dateCompare;
      var typeCompare=(normalizeDocType(a.docType)==="decision"?0:1)-(normalizeDocType(b.docType)==="decision"?0:1);
      return typeCompare||byGroupOrder(a,b);
    });
  }

  return {
    STEP:STEP,
    normalizeDocType:normalizeDocType,
    typeLabel:typeLabel,
    cleanTitle:cleanTitle,
    buildRecordTitle:buildRecordTitle,
    parseRecord:parseRecord,
    hydrateRecord:hydrateRecord,
    sameGroup:sameGroup,
    group:group,
    displayNumber:displayNumber,
    nextOrderKey:nextOrderKey,
    moveOrderKey:moveOrderKey,
    sortedForLibrary:sortedForLibrary
  };
});
