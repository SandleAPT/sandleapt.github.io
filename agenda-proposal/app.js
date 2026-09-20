(function(){
  "use strict";
  var DRAFT_KEY="sandle_agenda_proposal_v1";
  var CLOUD_URL_KEY="sandle_private_url";
  var ADMIN_KEY="sandle_admin_key";
  var MAX_CLOUD_JSON=8*1024*1024;
  var CURRENT_TERM=6;
  var ids=["agendaNo","decisionDate","meetingType","title","proposer","date","decision","background","details","cost","basis","refs"];
  var el={}; ids.forEach(function(id){el[id]=document.getElementById(id);});
  var attachmentsInput=document.getElementById("attachments");
  var attachmentList=document.getElementById("attachmentList");
  var refsField=document.getElementById("refsField");
  var refsSection=document.getElementById("refsSection");
  var pAttachments=document.getElementById("pAttachments");
  var coverPaper=document.getElementById("coverPaper");
  var bodyPaper=document.getElementById("bodyPaper");
  var pageState=document.getElementById("pageState");
  var printBtn=document.getElementById("printBtn");
  var saveBtn=document.getElementById("saveBtn");
  var newBtn=document.getElementById("newBtn");
  var libraryList=document.getElementById("libraryList");
  var libraryCount=document.getElementById("libraryCount");
  var cloudConnectBtn=document.getElementById("cloudConnectBtn");
  var cloudStatus=document.getElementById("cloudStatus");
  var saveNote=document.getElementById("saveNote");
  var attachmentFiles=[];
  var currentDocId=null;
  var currentCreatedAt="";
  var preview={
    meetingHeaderCover:document.getElementById("pMeetingHeaderCover"),meetingHeaderBody:document.getElementById("pMeetingHeaderBody"),
    agendaNo:document.getElementById("pAgendaNo"),decisionMeta:document.getElementById("pDecisionMeta"),
    title:document.getElementById("pTitle"),proposer:document.getElementById("pProposer"),date:document.getElementById("pDate"),
    decision:document.getElementById("pDecision"),background:document.getElementById("pBackground"),details:document.getElementById("pDetails"),
    cost:document.getElementById("pCost"),basis:document.getElementById("pBasis"),refs:document.getElementById("pRefs")
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
      flush();
      node.innerHTML=html.join("").replace(/<\/ul><ul>/g,"");
    }else node.textContent=text;
  }
  function initAgendaOptions(){
    for(var n=1;n<=50;n++){
      var option=document.createElement("option");
      option.value=String(n);
      option.textContent=n+"호";
      el.agendaNo.appendChild(option);
    }
  }
  function normalizeAgendaNo(value){
    var m=String(value||"").match(/\d+/);
    if(!m)return "";
    var n=Number(m[0]);
    return n>=1&&n<=50?String(n):"";
  }
  function formData(){
    var data={}; ids.forEach(function(id){data[id]=el[id].value;});
    return data;
  }
  function normalizeMeetingType(value,legacyHeader){
    if(value==="정기"||value==="임시")return value;
    var legacy=String(legacyHeader||"");
    if(legacy.indexOf("임시")>=0)return "임시";
    if(legacy.indexOf("정기")>=0)return "정기";
    return "";
  }
  function applyData(data){
    data=data||{};
    ids.forEach(function(id){
      if(id==="agendaNo")el[id].value=normalizeAgendaNo(data[id]);
      else if(id==="meetingType")el[id].value=normalizeMeetingType(data[id],data.meetingHeader);
      else el[id].value=typeof data[id]==="string"?data[id]:"";
    });
    if(!el.date.value)el.date.value=today();
  }
  function saveDraft(){
    try{localStorage.setItem(DRAFT_KEY,JSON.stringify(formData()));}catch(e){}
  }
  function loadDraft(){
    var data=null; try{data=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");}catch(e){}
    if(data)applyData(data); else if(!el.date.value)el.date.value=today();
  }
  function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);}catch(e){}}
  function fileAllowed(file){
    var name=(file&&file.name||"").toLowerCase();
    return /\.(pdf|png|jpe?g)$/.test(name);
  }
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
      row.appendChild(name); row.appendChild(size); row.appendChild(remove); attachmentList.appendChild(row);
    });
  }
  function renderAttachmentPreview(){
    pAttachments.innerHTML="";
    if(!attachmentFiles.length)return;
    var ul=document.createElement("ul");
    attachmentFiles.forEach(function(file){var li=document.createElement("li");li.textContent="첨부: "+(file.name||"첨부파일");ul.appendChild(li);});
    pAttachments.appendChild(ul);
  }
  function decisionMeta(){
    return el.decisionDate.value?fmtDate(el.decisionDate.value):"20  .  .  .";
  }
  function meetingHeaderText(){
    if(!el.decisionDate.value)return "";
    var p=el.decisionDate.value.split("-");
    if(p.length!==3)return "";
    var year=p[0],month=String(Number(p[1])).padStart(2,"0");
    var type=el.meetingType.value;
    return "제"+CURRENT_TERM+"기 "+year+"년"+month+"월"+(type?" "+type:"")+" 입주자대표회의";
  }
  function update(){
    var meetingHeader=meetingHeaderText();
    [preview.meetingHeaderCover,preview.meetingHeaderBody].forEach(function(node){
      node.textContent=meetingHeader;
      node.classList.toggle("empty",!meetingHeader);
    });
    preview.agendaNo.textContent=el.agendaNo.value ? "제 "+el.agendaNo.value+" 호" : "제   호";
    preview.decisionMeta.textContent=decisionMeta();
    preview.title.textContent=el.title.value.trim()||"제목을 입력해 주세요.";
    preview.title.classList.toggle("empty",!el.title.value.trim());
    preview.proposer.textContent=el.proposer.value.trim()||"-";
    preview.date.textContent=fmtDate(el.date.value);
    renderText(preview.decision,el.decision.value);
    renderText(preview.background,el.background.value);
    renderText(preview.details,el.details.value);
    renderText(preview.cost,el.cost.value);
    renderText(preview.basis,el.basis.value,"-");
    renderText(preview.refs,el.refs.value,"-");
    renderAttachmentPreview();
    saveDraft();
    requestAnimationFrame(fit);
  }
  function fit(){
    var pages=[coverPaper,bodyPaper];
    var sizes=[10.5,10.25,10], lines=[1.62,1.58,1.54], gaps=[12,10,8];
    var fits=false, used=sizes[sizes.length-1];
    for(var i=0;i<sizes.length;i++){
      pages.forEach(function(page){
        page.style.setProperty("--doc-size",sizes[i]+"pt");
        page.style.setProperty("--doc-line",lines[i]);
        page.style.setProperty("--section-gap",gaps[i]+"px");
      });
      used=sizes[i];
      if(pages.every(function(page){return page.scrollHeight<=page.clientHeight+1;})){fits=true;break;}
    }
    pageState.classList.toggle("over",!fits);
    pageState.textContent=fits ? "A4 2장 · 표지 + 본문 · 본문 "+used+"pt" : "10pt로도 본문 A4 한 장을 넘습니다. 내용을 조금 줄여 주세요.";
    printBtn.disabled=!fits;
    return fits;
  }

  function getCloudUrl(ask){
    var url="";
    try{url=localStorage.getItem(CLOUD_URL_KEY)||"";}catch(e){}
    if(!url&&ask){
      url=(prompt("클라우드 저장소 주소(Apps Script 웹앱 URL)를 입력하세요.\n한 번 입력하면 이 기기에 기억됩니다.")||"").trim();
      if(url)try{localStorage.setItem(CLOUD_URL_KEY,url);}catch(e){}
    }
    return url;
  }
  function getCloudKey(){
    try{return localStorage.getItem(ADMIN_KEY)||"";}catch(e){return "";}
  }
  function cloudApi(body,askUrl){
    var url=getCloudUrl(askUrl!==false);
    if(!url)return Promise.reject(new Error("클라우드 저장소 연결이 필요합니다."));
    var key=getCloudKey();
    if(!key)return Promise.reject(new Error("수정용 비밀번호가 필요합니다."));
    body.adminKey=key;
    return fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})
      .then(function(r){return r.json();})
      .then(function(res){
        if(res&&res.ok)return res;
        if(res&&res.error==="edit_required")throw new Error("수정용 비밀번호가 필요합니다.");
        if(res&&res.error==="denied")throw new Error("클라우드 저장소 비밀번호가 올바르지 않습니다.");
        throw new Error((res&&res.error)||"클라우드 요청에 실패했습니다.");
      });
  }
  function configureCloud(){
    var current=getCloudUrl(false);
    var next=(prompt(current?"클라우드 저장소 주소를 변경할까요?\n현재 주소를 그대로 쓰려면 취소하세요.":"클라우드 저장소 주소(Apps Script 웹앱 URL)를 입력하세요.\n비공개 자료 저장소와 같은 주소를 사용합니다.",current||"")||"").trim();
    if(!next)return;
    try{localStorage.setItem(CLOUD_URL_KEY,next);}catch(e){}
    renderLibrary();
  }
  function readFileDataUrl(file){
    return new Promise(function(resolve,reject){
      var r=new FileReader();
      r.onload=function(){resolve({name:file.name||"첨부파일",type:file.type||"application/octet-stream",size:file.size||0,lastModified:file.lastModified||0,dataUrl:String(r.result||"")});};
      r.onerror=function(){reject(r.error||new Error("첨부파일을 읽지 못했습니다."));};
      r.readAsDataURL(file);
    });
  }
  function storedAttachmentToFile(item){
    if(!item||!item.dataUrl)return Promise.resolve(null);
    return fetch(item.dataUrl).then(function(r){return r.blob();}).then(function(blob){
      try{return new File([blob],item.name||"첨부파일",{type:item.type||blob.type||"application/octet-stream",lastModified:item.lastModified||Date.now()});}
      catch(e){blob.name=item.name||"첨부파일";blob.lastModified=item.lastModified||Date.now();return blob;}
    });
  }
  function newId(){
    if(window.crypto&&typeof crypto.randomUUID==="function")return "proposal_"+crypto.randomUUID();
    return "proposal_"+Date.now()+"_"+Math.random().toString(36).slice(2,9);
  }
  function renderLibrary(){
    var url=getCloudUrl(false);
    cloudConnectBtn.textContent=url?"클라우드 설정":"클라우드 연결";
    if(!url){
      libraryCount.textContent="-";
      cloudStatus.textContent="이 기기에서 한 번만 저장소 주소를 연결하면 됩니다.";
      libraryList.innerHTML='<div class="library-empty">클라우드 저장소를 연결하면 다른 PC에서도 같은 제안서를 불러올 수 있어요.</div>';
      return;
    }
    cloudStatus.textContent="클라우드 목록을 불러오는 중…";
    libraryList.innerHTML='<div class="library-empty">불러오는 중…</div>';
    cloudApi({action:"list"},false).then(function(res){
      var rows=(res.items||[]).filter(function(x){return x&&String(x.id||"").indexOf("proposal_")===0;});
      libraryCount.textContent=rows.length+"건";
      cloudStatus.textContent="연결됨 · 같은 저장소와 수정용 비밀번호로 다른 PC에서도 불러올 수 있어요.";
      libraryList.innerHTML="";
      if(!rows.length){libraryList.innerHTML='<div class="library-empty">클라우드에 저장된 제안서가 없습니다.</div>';return;}
      rows.forEach(function(doc){
        var item=document.createElement("div"); item.className="library-item"+(doc.id===currentDocId?" active":"");
        var main=document.createElement("div"); main.className="library-main";
        var title=document.createElement("div"); title.className="library-title"; title.textContent=String(doc.title||"제목 없는 안건").replace(/^\[안건제안서\]\s*/,"");
        var meta=document.createElement("div"); meta.className="library-meta";
        var parts=[]; if(doc.date)parts.push(fmtDate(doc.date)); if(doc.updatedAt)parts.push("저장 "+fmtSaved(doc.updatedAt));
        meta.textContent=parts.join(" · ");
        main.appendChild(title); main.appendChild(meta);
        var actions=document.createElement("div"); actions.className="library-actions";
        var load=document.createElement("button"); load.type="button"; load.textContent="불러오기";
        load.addEventListener("click",function(){loadDocument(doc.id);});
        var del=document.createElement("button"); del.type="button"; del.className="delete"; del.textContent="삭제";
        del.addEventListener("click",function(){deleteDocument(doc.id,title.textContent);});
        actions.appendChild(load); actions.appendChild(del); item.appendChild(main); item.appendChild(actions); libraryList.appendChild(item);
      });
    }).catch(function(err){
      console.error(err);
      libraryCount.textContent="!";
      cloudStatus.textContent=err.message;
      libraryList.innerHTML='<div class="library-empty">클라우드 목록을 불러오지 못했습니다.</div>';
    });
  }
  function saveDocument(){
    var title=el.title.value.trim();
    if(!title){alert("안건 제목을 먼저 적어주세요.");el.title.focus();return;}
    saveBtn.disabled=true; saveNote.textContent="제안서와 첨부파일을 클라우드에 저장하고 있습니다…";
    var now=new Date().toISOString();
    Promise.all(attachmentFiles.map(readFileDataUrl)).then(function(files){
      var id=currentDocId||newId();
      var payload={kind:"agenda-proposal",version:1,data:formData(),attachments:files,createdAt:currentCreatedAt||now,updatedAt:now};
      var json=JSON.stringify(payload);
      if(json.length>MAX_CLOUD_JSON)throw new Error("첨부파일을 포함한 저장 크기가 8MB를 넘습니다. 큰 파일은 나누거나 줄여 주세요.");
      return cloudApi({action:"save",record:{id:id,title:"[안건제안서] "+title,date:el.decisionDate.value||el.date.value||"",json:json}},true)
        .then(function(){return {id:id,createdAt:payload.createdAt};});
    }).then(function(saved){
      currentDocId=saved.id; currentCreatedAt=saved.createdAt;
      saveNote.textContent="클라우드에 저장했습니다. 다른 PC에서도 ‘불러오기’로 열 수 있어요.";
      renderLibrary();
    }).catch(function(err){
      console.error(err);
      alert("클라우드 저장 실패: "+err.message);
      saveNote.textContent="클라우드에 저장하지 못했습니다. 작성 중 내용은 이 기기의 임시초안에 남아 있습니다.";
    }).finally(function(){saveBtn.disabled=false;});
  }
  function loadDocument(id){
    saveNote.textContent="클라우드에서 제안서와 첨부파일을 불러오는 중…";
    cloudApi({action:"get",id:id},true).then(function(res){
      if(!res.item)throw new Error("저장된 제안서를 찾지 못했습니다.");
      var obj=JSON.parse(res.item.json||"{}");
      if(obj.kind&&obj.kind!=="agenda-proposal")throw new Error("안건 제안서 형식이 아닙니다.");
      applyData(obj.data||obj);
      return Promise.all((obj.attachments||[]).map(storedAttachmentToFile)).then(function(files){
        attachmentFiles=files.filter(Boolean);
        currentDocId=res.item.id; currentCreatedAt=obj.createdAt||"";
        renderAttachmentList(); update();
        saveNote.textContent="클라우드 제안서를 불러왔습니다. 첨부파일도 이 기기에서 바로 출력할 수 있어요.";
        renderLibrary();
      });
    }).catch(function(err){
      console.error(err); alert("클라우드 불러오기 실패: "+err.message); saveNote.textContent="불러오지 못했습니다.";
    });
  }
  function deleteDocument(id,title){
    if(!confirm("‘"+(title||"이 제안서")+"’를 클라우드에서 삭제할까요?"))return;
    cloudApi({action:"delete",id:id},true).then(function(){
      if(currentDocId===id){currentDocId=null;currentCreatedAt="";saveNote.textContent="클라우드 문서는 삭제했습니다. 화면의 작성 내용은 그대로 두었습니다.";}
      renderLibrary();
    }).catch(function(err){alert("클라우드 삭제 실패: "+err.message);});
  }
  function clearForm(){
    ids.forEach(function(id){el[id].value="";});
    el.date.value=today(); attachmentFiles=[]; currentDocId=null; currentCreatedAt=""; attachmentsInput.value="";
    renderAttachmentList(); clearDraft(); update();
    saveNote.textContent="새 제안서를 작성하고 있습니다.";
    renderLibrary();
  }
  function newDocument(){
    var hasText=ids.some(function(id){return id!=="date"&&el[id].value.trim();})||attachmentFiles.length;
    if(hasText&&!confirm("새 제안서를 작성할까요? 아직 ‘문서 저장’을 누르지 않은 내용은 보관함에 남지 않습니다."))return;
    clearForm();
  }
  function sample(){
    currentDocId=null; currentCreatedAt=""; attachmentFiles=[]; renderAttachmentList();
    applyData({
      agendaNo:"", decisionDate:"", meetingType:"",
      title:"커뮤니티센터 누수·곰팡이 보수의 건",
      proposer:"", date:today(),
      decision:"커뮤니티센터 누수·곰팡이 보수 범위와 예상비용, 비용부담 주체 및 가능한 일정을 관리주체가 확인하여 다음 회의에 보고하는 것으로 의결한다.",
      background:"커뮤니티센터에 누수와 곰팡이가 생겨 일부 수업 운영에도 영향을 주고 있습니다. 현재 누수 보수는 LH 관리이관 내용에 포함되어 있으나, 관리이관 시기가 정해지지 않아 실제 공사가 언제 시작될지는 알기 어려운 상태입니다.\n\n누수와 곰팡이는 오래 둘수록 마감재 손상이나 냄새, 습기 문제가 더 커질 수 있어 보수 방법과 일정을 확인할 필요가 있습니다.",
      details:"- LH 관리이관을 통한 보수 가능 여부와 예상 일정 확인\n- LH 보수가 늦어질 경우 단지 선보수 가능 여부 검토\n- 선보수 시 누수 원인, 보수 범위, 예상비용과 재원 확인\n- 공사 전 현재 누수와 곰팡이 상태를 사진으로 기록\n- 벽 설치나 공간 변경은 이번 보수와 분리하여 추후 판단",
      cost:"관리주체에서 보수 범위와 예상비용, 사용 가능한 재원을 확인하여 보고",
      basis:"산들마을 공동주택관리규약 제26조(안건의 제안)",
      refs:"LH 관리이관 자료, 현재 상태 사진, 보수 견적"
    });
    update(); saveNote.textContent="예시를 불러왔습니다. 필요한 부분을 고친 뒤 ‘문서 저장’을 눌러주세요."; renderLibrary();
  }

  ids.forEach(function(id){el[id].addEventListener("input",update);el[id].addEventListener("change",update);});
  attachmentsInput.addEventListener("change",function(){
    var files=Array.prototype.slice.call(attachmentsInput.files||[]);
    var rejected=files.filter(function(file){return !fileAllowed(file);});
    files.filter(fileAllowed).forEach(function(file){
      var duplicate=attachmentFiles.some(function(old){return old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified;});
      if(!duplicate)attachmentFiles.push(file);
    });
    attachmentsInput.value=""; renderAttachmentList(); update();
    if(rejected.length)alert("PDF, JPG, PNG 파일만 추가할 수 있어요.");
  });
  cloudConnectBtn.addEventListener("click",configureCloud);
  document.getElementById("sampleBtn").addEventListener("click",sample);
  newBtn.addEventListener("click",newDocument);
  saveBtn.addEventListener("click",saveDocument);
  printBtn.addEventListener("click",function(){if(fit())window.print();});
  window.addEventListener("resize",function(){requestAnimationFrame(fit);});

  initAgendaOptions(); loadDraft(); update(); renderLibrary();
})();
