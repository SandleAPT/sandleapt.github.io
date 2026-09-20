(function(){
  "use strict";

  var order=window.ProposalOrder;
  if(!order)throw new Error("회의자료 순서 모듈을 불러오지 못했습니다.");

  var DRAFT_KEY="sandle_agenda_proposal_v1";
  var CLOUD_URL_KEY="sandle_private_url";
  var ADMIN_KEY="sandle_admin_key";
  var MAX_CLOUD_JSON=8*1024*1024;
  var CURRENT_TERM=6;
  var ids=["agendaNo","decisionDate","meetingType","title","proposer","date","decision","background","details","cost","followup","basis","refs"];
  var editableIds=ids.filter(function(id){return id!=="agendaNo";});
  var el={}; ids.forEach(function(id){el[id]=document.getElementById(id);});
  var typeInputs=Array.prototype.slice.call(document.querySelectorAll('input[name="docType"]'));
  var attachmentsInput=document.getElementById("attachments");
  var attachmentList=document.getElementById("attachmentList");
  var pAttachments=document.getElementById("pAttachments");
  var coverPaper=document.getElementById("coverPaper");
  var bodyPaper=document.getElementById("bodyPaper");
  var pageState=document.getElementById("pageState");
  var printBtn=document.getElementById("printBtn");
  var saveBtn=document.getElementById("saveBtn");
  var deleteBtn=document.getElementById("deleteBtn");
  var newBtn=document.getElementById("newBtn");
  var libraryList=document.getElementById("libraryList");
  var libraryCount=document.getElementById("libraryCount");
  var cloudConnectBtn=document.getElementById("cloudConnectBtn");
  var cloudStatus=document.getElementById("cloudStatus");
  var saveNote=document.getElementById("saveNote");
  var typeWarning=document.getElementById("typeWarning");
  var agendaNoDisplay=document.getElementById("agendaNoDisplay");
  var hideBasis=document.getElementById("hideBasis"),hideRefs=document.getElementById("hideRefs");
  var showBasisTitle=document.getElementById("showBasisTitle"),showRefsTitle=document.getElementById("showRefsTitle");
  var attachmentFiles=[];
  var currentDocId=null;
  var attachmentsNeedRestore=false;
  var currentCreatedAt="";
  var libraryDocs=[];
  var libraryLoaded=false;
  var libraryPromise=null;
  var libraryLoadToken=0;
  var documentLoading=false;
  var documentSaving=false;

  var preview={
    meetingHeaderCover:document.getElementById("pMeetingHeaderCover"),meetingHeaderBody:document.getElementById("pMeetingHeaderBody"),
    agendaNo:document.getElementById("pAgendaNo"),decisionMeta:document.getElementById("pDecisionMeta"),
    title:document.getElementById("pTitle"),proposer:document.getElementById("pProposer"),date:document.getElementById("pDate"),
    decision:document.getElementById("pDecision"),background:document.getElementById("pBackground"),details:document.getElementById("pDetails"),
    cost:document.getElementById("pCost"),basis:document.getElementById("pBasis"),refs:document.getElementById("pRefs")
  };

  var ui={
    introTitle:document.getElementById("typeIntroTitle"),introText:document.getElementById("typeIntroText"),typeNotice:document.getElementById("typeNotice"),
    numberLabel:document.getElementById("numberLabel"),numberHelp:document.getElementById("numberHelp"),meetingDateLabel:document.getElementById("meetingDateLabel"),
    proposerLabel:document.getElementById("proposerLabel"),submissionDateLabel:document.getElementById("submissionDateLabel"),
    decisionHeading:document.getElementById("decisionHeading"),decisionHelp:document.getElementById("decisionHelp"),
    backgroundHeading:document.getElementById("backgroundHeading"),backgroundHelp:document.getElementById("backgroundHelp"),
    costHeading:document.getElementById("costHeading"),costHelp:document.getElementById("costHelp"),
    refsHeading:document.getElementById("refsHeading"),basisLabel:document.getElementById("basisLabel"),refsLabel:document.getElementById("refsLabel"),
    pNumberLabel:document.getElementById("pNumberLabel"),pTypeLabel:document.getElementById("pTypeLabel"),pMeetingDateLabel:document.getElementById("pMeetingDateLabel"),
    pProposerLabel:document.getElementById("pProposerLabel"),pSubmissionDateLabel:document.getElementById("pSubmissionDateLabel"),
    pDecisionHeading:document.getElementById("pDecisionHeading"),pBackgroundHeading:document.getElementById("pBackgroundHeading"),
    pCostHeading:document.getElementById("pCostHeading"),pRefsHeading:document.getElementById("pRefsHeading"),
    pBasisLabel:document.getElementById("pBasisLabel"),pRefsLabel:document.getElementById("pRefsLabel")
  };

  var typeConfig={
    decision:{
      introTitle:"의결안건 작성 기준",
      introText:"의결주문 → 제안이유 → 주요내용 → 비용추계 → 참고사항 순서로 작성합니다. 산들마을 관리규약 별지 제7호 서식 기준입니다.",
      notice:"의결주문에는 찬성했을 때 무엇이 결정되는지 한 문장으로 적어주세요.",
      numberLabel:"의안번호",numberHelp:"같은 회의일의 의결안건끼리 저장 순서대로 자동 배정됩니다.",meetingDateLabel:"의결년월일",
      proposerLabel:"제출자",submissionDateLabel:"제출년월일",typeLabel:"의결사항",
      decisionHeading:"1. 의결주문",decisionHelp:"회의에서 찬성했을 때 정확히 무엇이 결정되는지 적어주세요.",
      backgroundHeading:"2. 제안이유",backgroundHelp:"왜 이 안건을 제안하는지 현재 상황과 필요성을 적어주세요.",
      costHeading:"4. 비용추계서",costHelp:"예상금액과 재원을 적습니다. 아직 확인 전이면 확인이 필요한 내용을 적어도 됩니다.",
      refsHeading:"5. 참고사항",basisLabel:"가. 근거규정",refsLabel:"나. 기타",
      decisionPlaceholder:"예: 커뮤니티센터 누수·곰팡이 보수 범위와 예상비용을 관리주체가 확인하여 다음 회의에 보고하는 것으로 의결한다.",
      backgroundPlaceholder:"예: 커뮤니티센터에 누수와 곰팡이가 생겨 일부 수업 운영에도 문제가 생기고 있습니다.",
      costPlaceholder:"예: 관리주체에서 보수 범위와 예상비용, 사용 가능한 재원을 확인 후 보고"
    },
    report:{
      introTitle:"보고사항 작성 기준",
      introText:"보고요지 → 보고배경 → 주요내용 → 비용·관리비 영향 → 참고사항 순서로 작성합니다. 보고사항은 별도로 표결하지 않습니다.",
      notice:"이미 정해진 의무, 진행현황, 변동요인처럼 구성원이 알아야 할 내용을 적어주세요. 결정이 필요하면 의결안건으로 분리합니다.",
      numberLabel:"보고번호",numberHelp:"같은 회의일의 보고사항끼리 저장 순서대로 자동 배정됩니다.",meetingDateLabel:"보고일자",
      proposerLabel:"보고자",submissionDateLabel:"작성일",typeLabel:"보고사항",
      decisionHeading:"1. 보고요지",decisionHelp:"이번 자료에서 무엇을 알리려는지 한두 문장으로 적어주세요.",
      backgroundHeading:"2. 보고배경",backgroundHelp:"왜 지금 이 내용을 공유하는지 배경을 적어주세요.",
      costHeading:"4. 비용·관리비 영향",costHelp:"비용 영향이 있으면 금액이나 변동 가능성을 적고, 없으면 ‘해당 없음’으로 적어도 됩니다.",
      refsHeading:"5. 참고사항",basisLabel:"가. 관련 규정·근거",refsLabel:"나. 기타·첨부자료",
      decisionPlaceholder:"예: 2026년 하반기 관리비 등에 영향을 미치는 주요 변동요인을 공유하고자 함.",
      backgroundPlaceholder:"예: 장기수선충당금 적립률 조정 등 예정된 변동요인을 사전에 공유할 필요가 있음.",
      costPlaceholder:"예: 항목별 금액 확정 후 세대별 예상 영향을 산정하여 안내 예정"
    }
  };

  function today(){
    var d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return y+"-"+m+"-"+day;
  }
  function fmtDate(v){
    if(!v)return "-";
    var p=v.split("-"); return p.length===3 ? p[0]+". "+Number(p[1])+". "+Number(p[2])+"." : v;
  }
  function fmtSaved(v){
    if(!v)return "";
    var d=new Date(v); if(isNaN(d))return "";
    return d.toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
  }
  function escapeHtml(s){return String(s||"").replace(/[&<>\"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function renderText(node,value,emptyText){
    var text=(value||"").trim();
    node.classList.toggle("empty",!text);
    if(!text){node.textContent=emptyText===undefined?"내용을 입력해 주세요.":emptyText;return;}
    var lines=text.split(/\r?\n/), hasBullets=lines.some(function(x){return /^\s*[-•]\s+/.test(x);});
    if(hasBullets){
      var html=[],buffer=[];
      function flush(){if(buffer.length){html.push('<div>'+buffer.map(escapeHtml).join('<br>')+'</div>');buffer=[];}}
      lines.forEach(function(line){var m=line.match(/^\s*[-•]\s+(.*)$/);if(m){flush();html.push('<ul><li>'+escapeHtml(m[1])+'</li></ul>');}else if(line.trim()){buffer.push(line);}else{buffer.push("");}});
      flush(); node.innerHTML=html.join("").replace(/<\/ul><ul>/g,"");
    }else node.textContent=text;
  }
  function normalizeAgendaNo(value){
    var m=String(value||"").match(/\d+/); return m?String(Number(m[0])):"";
  }
  function getDocType(){
    var selected=typeInputs.find(function(input){return input.checked;});
    return order.normalizeDocType(selected&&selected.value);
  }
  function setDocType(value){
    value=order.normalizeDocType(value);
    typeInputs.forEach(function(input){input.checked=input.value===value;});
  }
  function formData(){
    var data={docType:getDocType(),showBasis:!hideBasis.checked,showRefs:!hideRefs.checked,showBasisTitle:showBasisTitle.checked,showRefsTitle:showRefsTitle.checked}; ids.forEach(function(id){data[id]=el[id].value;}); return data;
  }
  function normalizeMeetingType(value,legacyHeader){
    if(value==="정기"||value==="임시")return value;
    var legacy=String(legacyHeader||"");
    if(legacy.indexOf("임시")>=0)return "임시";
    if(legacy.indexOf("정기")>=0)return "정기";
    return "";
  }
  function applyData(data){
    data=data||{};hideBasis.checked=data.showBasis===false;hideRefs.checked=data.showRefs===false;showBasisTitle.checked=data.showBasisTitle!==false;showRefsTitle.checked=data.showRefsTitle!==false; setDocType(data.docType||"decision");
    ids.forEach(function(id){
      if(id==="agendaNo")el[id].value=normalizeAgendaNo(data[id]);
      else if(id==="meetingType")el[id].value=normalizeMeetingType(data[id],data.meetingHeader);
      else el[id].value=typeof data[id]==="string"?data[id]:"";
    });
    if(!el.date.value)el.date.value=today(); applyTypeUi();
  }
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(Object.assign({},formData(),{savedDocument:{id:currentDocId,createdAt:currentCreatedAt,url:getCloudUrl(false)}})));}catch(e){}}
  function loadDraft(){
    var data=null; try{data=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");}catch(e){}
    if(data){
      applyData(data);
      var saved=data.savedDocument;
      if(saved&&typeof saved.id==="string"&&saved.id.indexOf("proposal_")===0&&saved.url===getCloudUrl(false)){
        currentDocId=saved.id;currentCreatedAt=saved.createdAt||"";attachmentsNeedRestore=true;
        saveNote.textContent="저장된 문서를 이어서 수정합니다. ‘수정’은 기존 자료를 갱신하며, 기존 첨부도 유지합니다. 첨부를 삭제하려면 목록에서 다시 불러와 주세요.";
      }
    } else{setDocType("decision");if(!el.date.value)el.date.value=today();applyTypeUi();}
  }
  function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);}catch(e){}}

  function applyTypeUi(){
    var type=getDocType(),cfg=typeConfig[type],isReport=type==="report";
    ui.introTitle.textContent=cfg.introTitle; ui.introText.textContent=cfg.introText; ui.typeNotice.textContent=cfg.notice;
    ui.numberLabel.textContent=cfg.numberLabel; ui.numberHelp.textContent=cfg.numberHelp; ui.meetingDateLabel.textContent=cfg.meetingDateLabel;
    ui.proposerLabel.textContent=cfg.proposerLabel; ui.submissionDateLabel.textContent=cfg.submissionDateLabel;
    ui.decisionHeading.textContent=cfg.decisionHeading; ui.decisionHelp.textContent=cfg.decisionHelp;
    ui.backgroundHeading.textContent=cfg.backgroundHeading; ui.backgroundHelp.textContent=cfg.backgroundHelp;
    ui.costHeading.textContent=cfg.costHeading; ui.costHelp.textContent=cfg.costHelp;
    ui.refsHeading.textContent=cfg.refsHeading; ui.basisLabel.textContent=cfg.basisLabel; ui.refsLabel.textContent=cfg.refsLabel;
    ui.pNumberLabel.textContent=cfg.numberLabel; ui.pTypeLabel.textContent=cfg.typeLabel; ui.pMeetingDateLabel.textContent=cfg.meetingDateLabel;
    ui.pProposerLabel.textContent=isReport?"보 고 자":"제 출 자"; ui.pSubmissionDateLabel.textContent=cfg.submissionDateLabel;
    ui.pDecisionHeading.textContent=cfg.decisionHeading; ui.pBackgroundHeading.textContent=cfg.backgroundHeading;
    ui.pCostHeading.textContent=cfg.costHeading; ui.pRefsHeading.textContent=cfg.refsHeading;
    ui.pBasisLabel.textContent=cfg.basisLabel; ui.pRefsLabel.textContent=cfg.refsLabel;
    el.decision.placeholder=cfg.decisionPlaceholder; el.background.placeholder=cfg.backgroundPlaceholder; el.cost.placeholder=cfg.costPlaceholder;
    document.body.setAttribute("data-doc-type",type);
    document.dispatchEvent(new CustomEvent("proposal-type-change",{detail:{docType:type}}));
  }
  function validateTypeWarning(){
    var type=getDocType(),hasOther=!!(el.title.value.trim()||el.background.value.trim()||el.details.value.trim()||el.cost.value.trim());
    var message="";
    if(type==="decision"&&hasOther&&!el.decision.value.trim())message="무엇을 표결할지 의결주문을 먼저 적어주세요.";
    if(type==="report"){
      var text=[el.decision.value,el.background.value,el.details.value,el.cost.value].join(" ");
      if(/의결한다|승인한다|선정한다|확정한다|변경한다|집행한다/.test(text))message="실제 결정이 포함된 표현이 보여요. 입주자대표회의의 결정이 필요하다면 그 부분은 의결안건으로 분리해 주세요.";
    }
    typeWarning.hidden=!message; typeWarning.textContent=message;
  }

  function fileAllowed(file){var name=(file&&file.name||"").toLowerCase();return /\.(pdf|png|jpe?g|hwp)$/.test(name);}
  function fileSize(size){
    if(size<1024)return size+" B";
    if(size<1024*1024)return Math.round(size/1024)+" KB";
    return (size/(1024*1024)).toFixed(1)+" MB";
  }
  function renderAttachmentList(){
    attachmentList.innerHTML="";
    attachmentFiles.forEach(function(file,index){
      var row=document.createElement("div"); row.className="attachment-item";
      var name=document.createElement("span"); name.className="file-name"; name.textContent=file.name||"첨부파일";
      var size=document.createElement("span"); size.className="file-size"; size.textContent=fileSize(file.size||0);
      var remove=document.createElement("button"); remove.type="button"; remove.textContent="제거";
      remove.addEventListener("click",function(){attachmentFiles.splice(index,1);renderAttachmentList();update();});
      row.appendChild(name);row.appendChild(size);row.appendChild(remove);attachmentList.appendChild(row);
    });
  }
  function renderAttachmentPreview(){
    pAttachments.innerHTML=""; if(!attachmentFiles.length)return;
    var ul=document.createElement("ul");
    attachmentFiles.forEach(function(file,index){var li=document.createElement("li");li.textContent="※ 첨부"+(index+1)+": "+(file.name||"첨부파일");ul.appendChild(li);});
    pAttachments.appendChild(ul);
  }
  function decisionMeta(){return el.decisionDate.value?fmtDate(el.decisionDate.value):"20  .  .  .";}
  function meetingHeaderText(){
    if(!el.decisionDate.value)return "";
    var p=el.decisionDate.value.split("-"); if(p.length!==3)return "";
    var year=p[0],month=String(Number(p[1])).padStart(2,"0"),type=el.meetingType.value;
    return "제"+CURRENT_TERM+"기 "+year+"년"+month+"월"+(type?" "+type:"")+" 입주자대표회의";
  }
  function formDocForNumber(){
    var type=getDocType(),date=el.decisionDate.value;
    var existing=libraryDocs.find(function(doc){return doc.id===currentDocId;});
    var same=existing&&existing.date===date&&existing.docType===type;
    return {id:currentDocId||"__draft__",date:date,docType:type,orderKey:same?existing.orderKey:order.nextOrderKey(libraryDocs,date,type,currentDocId),createdAt:currentCreatedAt||new Date().toISOString()};
  }
  function updateAutoNumber(){
    if(!el.decisionDate.value){el.agendaNo.value="";agendaNoDisplay.textContent="회의일을 선택하면 자동 배정";return 0;}
    var doc=formDocForNumber(),rows=libraryDocs.filter(function(row){return row.id!==currentDocId;}); rows.push(doc);
    var number=libraryLoaded?order.displayNumber(doc,rows):Number(el.agendaNo.value||1);
    if(!number)number=1;
    el.agendaNo.value=String(number);
    agendaNoDisplay.textContent=(getDocType()==="report"?"보고 ":"의결 ")+"제 "+number+"호"+(libraryLoaded?"":" · 저장 시 확인");
    return number;
  }
  function update(){
    saveBtn.textContent=currentDocId?"수정":"새로 등록";deleteBtn.hidden=!currentDocId;
    var meetingHeader=meetingHeaderText(),number=updateAutoNumber();
    [preview.meetingHeaderCover,preview.meetingHeaderBody].forEach(function(node){node.textContent=meetingHeader;node.classList.toggle("empty",!meetingHeader);});
    preview.agendaNo.textContent=number?"제 "+number+" 호":"제   호"; preview.decisionMeta.textContent=decisionMeta();
    preview.title.textContent=el.title.value.trim()||"제목을 입력해 주세요.";preview.title.classList.toggle("empty",!el.title.value.trim());
    preview.proposer.textContent=el.proposer.value.trim()||"-";preview.date.textContent=fmtDate(el.date.value);
    renderText(preview.decision,el.decision.value);renderText(preview.background,el.background.value);renderText(preview.details,el.details.value);
    renderText(preview.cost,el.cost.value);renderText(preview.basis,el.basis.value,"-");renderText(preview.refs,el.refs.value,"-");
    renderAttachmentPreview();window.ProposalReferences.apply(bodyPaper,formData(),attachmentFiles);validateTypeWarning();saveDraft();requestAnimationFrame(fit);
  }
  function fit(){
    pageState.classList.remove("over");
    pageState.textContent="A4 표지 + 본문 · 긴 본문은 다음 장으로 이어서 인쇄됩니다.";
    return true;
  }

  function getCloudUrl(ask){
    var url="";try{url=localStorage.getItem(CLOUD_URL_KEY)||"";}catch(e){}

    return url;
  }
  function getCloudKey(){try{return localStorage.getItem(ADMIN_KEY)||"";}catch(e){return "";}}
  function cloudApi(body,askUrl,onProgress){
    var url=getCloudUrl(askUrl!==false); if(!url)return Promise.reject(new Error("클라우드 저장소 연결이 필요합니다."));
    var key=getCloudKey(); if(!key)return Promise.reject(new Error("수정용 비밀번호가 필요합니다.")); body.adminKey=key;
    return window.ProposalCloud.json(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)},onProgress)
      .then(function(res){
        if(res&&res.ok)return res;
        if(res&&res.error==="edit_required")throw new Error("수정용 비밀번호가 필요합니다.");
        if(res&&res.error==="denied")throw new Error("클라우드 저장소 비밀번호가 올바르지 않습니다.");
        throw new Error((res&&res.error)||"클라우드 요청에 실패했습니다.");
      });
  }
  window.addEventListener('sandle-cloud-connected',function(){libraryLoaded=false;refreshLibrary();});
  window.addEventListener('storage',function(e){if(e.key===CLOUD_URL_KEY){libraryLoaded=false;refreshLibrary();}});
  function readFileDataUrl(file){
    return new Promise(function(resolve,reject){
      var r=new FileReader();
      r.onload=function(){resolve({name:file.name||"첨부파일",type:file.type||"application/octet-stream",size:file.size||0,lastModified:file.lastModified||0,dataUrl:String(r.result||"")});};
      r.onerror=function(){reject(r.error||new Error("첨부파일을 읽지 못했습니다."));};r.readAsDataURL(file);
    });
  }
  function storedAttachmentToFile(item){
    if(!item||!item.dataUrl)return Promise.resolve(null);
    return Promise.resolve().then(function(){
      var match=String(item.dataUrl).match(/^data:([^,]*),([\s\S]*)$/);
      if(!match)throw new Error((item.name||"첨부파일")+": 저장된 첨부 형식이 올바르지 않습니다.");
      var bytes;
      if(/;base64(?:;|$)/i.test(match[1])){
        var binary=atob(match[2]);bytes=new Uint8Array(binary.length);
        for(var i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
      }else{
        bytes=new TextEncoder().encode(decodeURIComponent(match[2]));
      }
      var type=item.type||match[1].split(";")[0]||"application/octet-stream";
      var blob=new Blob([bytes],{type:type});
      try{return new File([blob],item.name||"첨부파일",{type:type,lastModified:item.lastModified||Date.now()});}
      catch(e){blob.name=item.name||"첨부파일";blob.lastModified=item.lastModified||Date.now();return blob;}
    });
  }
  function newId(){
    if(window.crypto&&typeof crypto.randomUUID==="function")return "proposal_"+crypto.randomUUID();
    return "proposal_"+Date.now()+"_"+Math.random().toString(36).slice(2,9);
  }
  function parsePayload(item){
    var obj=JSON.parse(item&&item.json||"{}");if(obj.kind&&obj.kind!=="agenda-proposal")throw new Error("회의자료 형식이 아닙니다.");return obj;
  }
  function normalizedPayload(item,doc){
    var obj=parsePayload(item),data=obj.data||obj;
    if(!obj.data)obj={kind:"agenda-proposal",version:2,data:data,attachments:obj.attachments||[],createdAt:obj.createdAt||"",updatedAt:obj.updatedAt||""};
    obj.kind="agenda-proposal";obj.version=2;obj.data=data;data.docType=doc.docType;data.meetingType=data.meetingType||doc.meetingType;data.title=data.title||doc.title;return obj;
  }
  function hydrateLegacyDocs(docs){
    var legacy=docs.filter(function(doc){return doc.needsHydration;});
    return Promise.all(legacy.map(function(doc){
      return cloudApi({action:"get",id:doc.id},false).then(function(res){if(res.item)order.hydrateRecord(doc,parsePayload(res.item));})
        .catch(function(err){console.warn("기존 회의자료 메타데이터를 읽지 못했습니다.",doc.id,err);doc.orderKey=order.STEP;doc.needsHydration=false;});
    })).then(function(){return docs;});
  }
  function loadLibraryData(askUrl,force){
    if(libraryLoaded&&!force)return Promise.resolve(libraryDocs);if(libraryPromise&&!force)return libraryPromise;
    var token=++libraryLoadToken;
    libraryPromise=cloudApi({action:"list"},askUrl!==false).then(function(res){
      var docs=(res.items||[]).filter(function(x){return x&&String(x.id||"").indexOf("proposal_")===0;}).map(order.parseRecord);
      return hydrateLegacyDocs(docs);
    }).then(function(docs){if(token===libraryLoadToken){libraryDocs=docs;libraryLoaded=true;}return libraryDocs;})
      .finally(function(){if(token===libraryLoadToken)libraryPromise=null;});
    return libraryPromise;
  }
  function libraryBadge(doc,number){
    var span=document.createElement("span");span.className="library-badge "+doc.docType;span.textContent=(doc.docType==="report"?"보고 ":"의결 ")+number+"호";return span;
  }
  function renderLibraryRows(){
    libraryCount.textContent=libraryDocs.length+"건";libraryList.innerHTML="";
    if(!libraryDocs.length){libraryList.innerHTML='<div class="library-empty">클라우드에 저장된 회의자료가 없습니다.</div>';update();return;}
    var sorted=order.sortedForLibrary(libraryDocs),lastGroup="";
    sorted.forEach(function(doc){
      var number=order.displayNumber(doc,libraryDocs),groupKey=doc.date+"|"+doc.docType;
      if(groupKey!==lastGroup){
        var heading=document.createElement("div");heading.className="library-group";
        var count=order.group(libraryDocs,doc.date,doc.docType).length;
        heading.textContent=(doc.date?fmtDate(doc.date):"회의일 미정")+" · "+(doc.docType==="report"?"보고사항":"의결안건")+" "+count+"건";
        libraryList.appendChild(heading);lastGroup=groupKey;
      }
      var item=document.createElement("div");item.className="library-item"+(doc.id===currentDocId?" active":"");
      var main=document.createElement("div");main.className="library-main";
      var title=document.createElement("div");title.className="library-title";title.appendChild(libraryBadge(doc,number));
      var titleText=document.createElement("span");titleText.textContent=doc.title;title.appendChild(titleText);
      var meta=document.createElement("div");meta.className="library-meta";
      var parts=[];if(doc.meetingType)parts.push(doc.meetingType+"회의");if(doc.updatedAt)parts.push("저장 "+fmtSaved(doc.updatedAt));meta.textContent=parts.join(" · ");
      main.appendChild(title);main.appendChild(meta);
      var actions=document.createElement("div");actions.className="library-actions";
      var group=order.group(libraryDocs,doc.date,doc.docType),index=group.findIndex(function(row){return row.id===doc.id;});
      var up=document.createElement("button");up.type="button";up.className="order-button";up.textContent="↑";up.title="앞 번호로 이동";up.setAttribute("aria-label",doc.title+" 앞 번호로 이동");up.disabled=index<=0;up.addEventListener("click",function(){moveDocument(doc.id,-1);});
      var down=document.createElement("button");down.type="button";down.className="order-button";down.textContent="↓";down.title="뒤 번호로 이동";down.setAttribute("aria-label",doc.title+" 뒤 번호로 이동");down.disabled=index<0||index>=group.length-1;down.addEventListener("click",function(){moveDocument(doc.id,1);});
      var load=document.createElement("button");load.type="button";load.textContent="불러오기";load.addEventListener("click",function(){loadDocument(doc.id,load);});
      var del=document.createElement("button");del.type="button";del.className="delete";del.textContent="삭제";del.addEventListener("click",function(){deleteDocument(doc.id,doc.title);});
      actions.appendChild(up);actions.appendChild(down);actions.appendChild(load);actions.appendChild(del);item.appendChild(main);item.appendChild(actions);libraryList.appendChild(item);
    });
    update();
  }
  function refreshLibrary(){
    var url=getCloudUrl(false);cloudConnectBtn.textContent="목록 새로고침";
    if(!url){
      libraryLoaded=false;libraryDocs=[];libraryCount.textContent="-";cloudStatus.textContent="수정용 권한 확인 후 저장소에 자동 연결됩니다. 연결되지 않으면 관리자모드에서 다시 로그인해 주세요.";
      libraryList.innerHTML='<div class="library-empty">기존에 연결된 기기에서 한 번 로그인하면 다른 기기도 같은 저장소를 자동으로 사용합니다.</div>';update();return Promise.resolve([]);
    }
    cloudStatus.textContent="클라우드 목록을 불러오는 중…";libraryList.innerHTML='<div class="library-empty">불러오는 중…</div>';
    return loadLibraryData(false,true).then(function(){cloudStatus.textContent="연결됨 · 같은 저장소와 수정용 비밀번호로 다른 PC에서도 불러올 수 있어요.";renderLibraryRows();return libraryDocs;})
      .catch(function(err){console.error(err);libraryLoaded=false;libraryCount.textContent="!";cloudStatus.textContent=err.message;libraryList.innerHTML='<div class="library-empty">클라우드 목록을 불러오지 못했습니다.</div>';update();return [];});
  }
  function ensureLibraryReady(){
    if(libraryLoaded)return Promise.resolve(libraryDocs);if(libraryPromise)return libraryPromise;
    return loadLibraryData(true,false).then(function(){renderLibraryRows();return libraryDocs;});
  }
  function upsertLocalDoc(doc){
    var index=libraryDocs.findIndex(function(row){return row.id===doc.id;});if(index>=0)libraryDocs[index]=doc;else libraryDocs.push(doc);
  }
  function validateBeforeSave(){
    if(!el.title.value.trim()){alert("회의자료 제목을 먼저 적어주세요.");el.title.focus();return false;}
    if(!el.decisionDate.value){alert((getDocType()==="report"?"보고일자":"의결년월일")+"를 먼저 선택해 주세요. 같은 회의일의 자동 번호를 정하는 데 필요합니다.");el.decisionDate.focus();return false;}
    if(!el.meetingType.value){alert("회의 구분에서 정기 또는 임시를 선택해 주세요.");el.meetingType.focus();return false;}
    if(!el.decision.value.trim()){alert((getDocType()==="report"?"보고요지":"의결주문")+"를 먼저 적어주세요.");el.decision.focus();return false;}return true;
  }
  function saveDocument(){
    if(documentSaving||documentLoading)return;
    if(!validateBeforeSave())return;
    documentSaving=true;newBtn.disabled=true;deleteBtn.disabled=true;
    saveBtn.disabled=true;saveNote.textContent="회의자료와 첨부파일을 클라우드에 저장하고 있습니다…";
    var now=new Date().toISOString(),id=currentDocId||newId(),type=getDocType(),date=el.decisionDate.value;
    return ensureLibraryReady().then(function(){
      if(!attachmentsNeedRestore||!currentDocId)return;
      return cloudApi({action:"get",id:id},true).then(function(res){
        if(!res.item)throw new Error("기존 문서를 찾지 못했습니다. 목록을 확인해 주세요.");
        return Promise.all((parsePayload(res.item).attachments||[]).map(storedAttachmentToFile));
      }).then(function(files){
        files.filter(Boolean).forEach(function(file){
          if(!attachmentFiles.some(function(other){return other.name===file.name&&other.size===file.size&&other.lastModified===file.lastModified;}))attachmentFiles.push(file);
        });
        attachmentsNeedRestore=false;renderAttachmentList();
      });
    }).then(function(){
      var existing=libraryDocs.find(function(doc){return doc.id===id;});
      var sameGroup=existing&&existing.date===date&&existing.docType===type;
      var orderKey=sameGroup?existing.orderKey:order.nextOrderKey(libraryDocs,date,type,id);
      var draftDoc={id:id,title:el.title.value.trim(),date:date,updatedAt:now,createdAt:currentCreatedAt||now,docType:type,meetingType:el.meetingType.value,orderKey:orderKey,needsHydration:false};
      var provisional=libraryDocs.filter(function(doc){return doc.id!==id;});provisional.push(draftDoc);el.agendaNo.value=String(order.displayNumber(draftDoc,provisional)||1);
      return Promise.all(attachmentFiles.map(readFileDataUrl)).then(function(files){
        var payload={kind:"agenda-proposal",version:2,data:formData(),attachments:files,orderKey:orderKey,createdAt:currentCreatedAt||now,updatedAt:now};
        var json=JSON.stringify(payload);if(json.length>MAX_CLOUD_JSON)throw new Error("첨부파일을 포함한 저장 크기가 8MB를 넘습니다. 큰 파일은 나누거나 줄여 주세요.");
        var record={id:id,title:order.buildRecordTitle(draftDoc,draftDoc.title),date:date,json:json};
        return cloudApi({action:"save",record:record},true).then(function(){return {doc:draftDoc,payload:payload};});
      });
    }).then(function(saved){
      currentDocId=saved.doc.id;currentCreatedAt=saved.payload.createdAt;upsertLocalDoc(saved.doc);libraryLoaded=true;saveDraft();
      saveNote.textContent="저장했습니다. ‘수정’은 이 자료에 반영됩니다. 별도 자료는 ‘새 문서’로 작성해 주세요.";update();renderLibraryRows();refreshLibrary();
    }).catch(function(err){console.error(err);alert("클라우드 저장 실패: "+err.message);saveNote.textContent="클라우드에 저장하지 못했습니다. 작성 중 내용은 이 기기의 임시초안에 남아 있습니다.";})
      .finally(function(){documentSaving=false;saveBtn.disabled=false;newBtn.disabled=false;deleteBtn.disabled=false;});
  }
  function loadDocument(id,button){
    if(documentLoading||documentSaving)return;
    documentLoading=true;button.disabled=true;button.textContent="불러오는 중…";
    saveBtn.disabled=true;newBtn.disabled=true;libraryList.classList.add("busy");
    return cloudApi({action:"get",id:id},true,function(attempt,total){
      cloudStatus.textContent=saveNote.textContent="저장소 응답을 기다리는 중… ("+attempt+"/"+total+"회 · 회당 최대 15초)";
    }).then(function(res){
      if(!res.item)throw new Error("저장된 회의자료를 찾지 못했습니다.");
      var obj=parsePayload(res.item),doc=libraryDocs.find(function(row){return row.id===id;});
      if(!doc){doc=order.parseRecord(res.item);order.hydrateRecord(doc,obj);upsertLocalDoc(doc);}
      var data=Object.assign({},obj.data||obj);data.docType=doc.docType;data.meetingType=data.meetingType||doc.meetingType;data.agendaNo=String(order.displayNumber(doc,libraryDocs)||normalizeAgendaNo(data.agendaNo)||1);
      cloudStatus.textContent=saveNote.textContent="본문 수신 완료 · 첨부파일 "+(obj.attachments||[]).length+"개를 복원하는 중…";
      return Promise.all((obj.attachments||[]).map(storedAttachmentToFile)).then(function(files){
        applyData(data);
        attachmentFiles=files.filter(Boolean);attachmentsNeedRestore=false;currentDocId=id;currentCreatedAt=obj.createdAt||doc.createdAt||"";
        renderAttachmentList();update();cloudStatus.textContent=saveNote.textContent="‘"+doc.title+"’ 자료를 불러왔습니다.";renderLibraryRows();
        el.title.scrollIntoView({behavior:"smooth",block:"center"});el.title.focus({preventScroll:true});
      });
    }).catch(function(err){console.error(err);cloudStatus.textContent=saveNote.textContent="불러오기 실패: "+err.message;})
      .finally(function(){documentLoading=false;button.disabled=false;button.textContent="불러오기";saveBtn.disabled=false;newBtn.disabled=false;libraryList.classList.remove("busy");});
  }
  function deleteDocument(id,title){
    if(documentLoading||documentSaving)return;
    if(!confirm("‘"+(title||"이 회의자료")+"’를 클라우드에서 삭제할까요?\n뒤 자료의 번호는 자동으로 한 칸씩 당겨집니다."))return;
    cloudApi({action:"delete",id:id},true).then(function(){
      libraryDocs=libraryDocs.filter(function(doc){return doc.id!==id;});libraryLoaded=true;
      if(currentDocId===id){currentDocId=null;currentCreatedAt="";attachmentsNeedRestore=false;saveNote.textContent="클라우드 문서는 삭제했습니다. 화면의 작성 내용은 그대로 두었습니다.";}
      saveDraft();renderLibraryRows();refreshLibrary();
    }).catch(function(err){alert("클라우드 삭제 실패: "+err.message);});
  }
  function moveDocument(id,direction){
    var doc=libraryDocs.find(function(row){return row.id===id;});if(!doc)return;
    var nextKey=order.moveOrderKey(doc,libraryDocs,direction);if(nextKey===null)return;
    libraryList.classList.add("busy");saveNote.textContent="같은 회의일 안에서 자료 순서를 바꾸고 있습니다…";
    cloudApi({action:"get",id:id},true).then(function(res){
      if(!res.item)throw new Error("순서를 바꿀 회의자료를 찾지 못했습니다.");
      var payload=normalizedPayload(res.item,doc),moved=Object.assign({},doc,{orderKey:nextKey,updatedAt:new Date().toISOString()});
      var provisional=libraryDocs.map(function(row){return row.id===id?moved:row;});
      payload.orderKey=nextKey;payload.data.agendaNo=String(order.displayNumber(moved,provisional)||1);payload.updatedAt=moved.updatedAt;
      var json=JSON.stringify(payload);
      return cloudApi({action:"save",record:{id:id,title:order.buildRecordTitle(moved,moved.title),date:moved.date,json:json}},true).then(function(){return moved;});
    }).then(function(moved){
      upsertLocalDoc(moved);libraryLoaded=true;
      saveNote.textContent="순서를 바꿨습니다. 번호도 자동으로 다시 정리되었습니다.";renderLibraryRows();
    }).catch(function(err){console.error(err);alert("순서 변경 실패: "+err.message);saveNote.textContent="순서를 바꾸지 못했습니다.";})
      .finally(function(){libraryList.classList.remove("busy");});
  }
  function clearForm(){
    hideBasis.checked=hideRefs.checked=false;showBasisTitle.checked=showRefsTitle.checked=true;
    ids.forEach(function(id){el[id].value="";});setDocType("decision");applyTypeUi();el.date.value=today();attachmentFiles=[];currentDocId=null;currentCreatedAt="";attachmentsNeedRestore=false;attachmentsInput.value="";
    renderAttachmentList();clearDraft();update();saveNote.textContent="새 회의자료를 작성하고 있습니다.";renderLibraryRows();
  }
  function newDocument(){
    if(documentLoading||documentSaving)return;
    var hasText=editableIds.some(function(id){return id!=="date"&&el[id].value.trim();})||attachmentFiles.length;
    if(hasText&&!confirm("새 회의자료를 작성할까요? 아직 저장하지 않은 내용은 클라우드에 남지 않습니다."))return;clearForm();
  }
  function sample(){
    if(documentLoading||documentSaving)return;
    currentDocId=null;currentCreatedAt="";attachmentsNeedRestore=false;attachmentFiles=[];renderAttachmentList();
    applyData({docType:"decision",agendaNo:"",decisionDate:"",meetingType:"",title:"커뮤니티센터 누수·곰팡이 보수의 건",proposer:"",date:today(),
      decision:"커뮤니티센터 누수·곰팡이 보수 범위와 예상비용, 비용부담 주체 및 가능한 일정을 관리주체가 확인하여 다음 회의에 보고하는 것으로 의결한다.",
      background:"커뮤니티센터에 누수와 곰팡이가 생겨 일부 수업 운영에도 영향을 주고 있습니다. 현재 누수 보수는 LH 관리이관 내용에 포함되어 있으나, 관리이관 시기가 정해지지 않아 실제 공사가 언제 시작될지는 알기 어려운 상태입니다.\n\n누수와 곰팡이는 오래 둘수록 마감재 손상이나 냄새, 습기 문제가 더 커질 수 있어 보수 방법과 일정을 확인할 필요가 있습니다.",
      details:"- LH 관리이관을 통한 보수 가능 여부와 예상 일정 확인\n- LH 보수가 늦어질 경우 단지 선보수 가능 여부 검토\n- 선보수 시 누수 원인, 보수 범위, 예상비용과 재원 확인\n- 공사 전 현재 누수와 곰팡이 상태를 사진으로 기록\n- 벽 설치나 공간 변경은 이번 보수와 분리하여 추후 판단",
      cost:"관리주체에서 보수 범위와 예상비용, 사용 가능한 재원을 확인하여 보고",followup:"",basis:"산들마을 공동주택관리규약 제26조(안건의 제안)",refs:"LH 관리이관 자료, 현재 상태 사진, 보수 견적"});
    update();saveNote.textContent="의결안건 예시를 불러왔습니다. 필요한 부분을 고친 뒤 ‘새로 등록’을 눌러주세요.";renderLibraryRows();
  }

  [hideBasis,hideRefs,showBasisTitle,showRefsTitle].forEach(function(input){input.addEventListener("change",update);});
  editableIds.forEach(function(id){el[id].addEventListener("input",update);el[id].addEventListener("change",update);});
  typeInputs.forEach(function(input){input.addEventListener("change",function(){applyTypeUi();update();});});
  attachmentsInput.addEventListener("change",function(){
    var files=Array.prototype.slice.call(attachmentsInput.files||[]),rejected=files.filter(function(file){return !fileAllowed(file);});
    files.filter(fileAllowed).forEach(function(file){var duplicate=attachmentFiles.some(function(old){return old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified;});if(!duplicate)attachmentFiles.push(file);});
    attachmentsInput.value="";renderAttachmentList();update();if(rejected.length)alert("PDF, JPG, PNG, HWP 파일만 추가할 수 있어요.");
  });
  cloudConnectBtn.addEventListener("click",refreshLibrary);
  deleteBtn.addEventListener("click",function(){if(currentDocId)deleteDocument(currentDocId,el.title.value.trim());});
  document.getElementById("sampleBtn").addEventListener("click",sample);
  newBtn.addEventListener("click",newDocument);saveBtn.addEventListener("click",saveDocument);var printer=window.ProposalPrint.create({
    fit:fit,currentPages:function(){return [coverPaper,bodyPaper];},config:typeConfig,term:CURRENT_TERM,date:fmtDate,renderText:renderText,
    sort:order.sortedForLibrary,number:function(doc){return order.displayNumber(doc,libraryDocs);},
    list:function(){return ensureLibraryReady();},
    load:function(doc){return cloudApi({action:"get",id:doc.id},false).then(function(res){if(!res.item)throw new Error("저장된 자료를 찾지 못했습니다.");return parsePayload(res.item);});}
  });
  printBtn.addEventListener("click",function(){if(!documentLoading&&!documentSaving)printer.open();});
  window.addEventListener("resize",function(){requestAnimationFrame(fit);});

  loadDraft();update();refreshLibrary();
})();
