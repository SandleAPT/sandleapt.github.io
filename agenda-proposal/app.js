(function(){
  "use strict";
  var DRAFT_KEY="sandle_agenda_proposal_v1";
  var DB_NAME="sandle_agenda_proposals_v1";
  var STORE="documents";
  var ids=["title","proposer","date","background","details","decision","cost","refs"];
  var el={}; ids.forEach(function(id){el[id]=document.getElementById(id);});
  var noRefs=document.getElementById("noRefs");
  var attachmentsInput=document.getElementById("attachments");
  var attachmentList=document.getElementById("attachmentList");
  var refsField=document.getElementById("refsField");
  var refsSection=document.getElementById("refsSection");
  var pAttachments=document.getElementById("pAttachments");
  var paper=document.getElementById("paper");
  var pageState=document.getElementById("pageState");
  var printBtn=document.getElementById("printBtn");
  var saveBtn=document.getElementById("saveBtn");
  var newBtn=document.getElementById("newBtn");
  var libraryList=document.getElementById("libraryList");
  var libraryCount=document.getElementById("libraryCount");
  var saveNote=document.getElementById("saveNote");
  var attachmentFiles=[];
  var currentDocId=null;
  var dbPromise=null;
  var preview={
    title:document.getElementById("pTitle"),proposer:document.getElementById("pProposer"),date:document.getElementById("pDate"),
    background:document.getElementById("pBackground"),details:document.getElementById("pDetails"),decision:document.getElementById("pDecision"),cost:document.getElementById("pCost"),refs:document.getElementById("pRefs")
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
  function formData(){
    var data={}; ids.forEach(function(id){data[id]=el[id].value;});
    data.noRefs=!!noRefs.checked;
    return data;
  }
  function applyData(data){
    data=data||{};
    ids.forEach(function(id){el[id].value=typeof data[id]==="string"?data[id]:"";});
    noRefs.checked=!!data.noRefs;
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
  function updateRefControls(){
    var off=!!noRefs.checked;
    refsField.classList.toggle("omitted",off);
    el.refs.disabled=off;
    attachmentsInput.disabled=off;
    refsSection.hidden=off;
  }
  function update(){
    preview.title.textContent=el.title.value.trim()||"안건 제목을 입력해 주세요.";
    preview.proposer.textContent=el.proposer.value.trim()||"-";
    preview.date.textContent=fmtDate(el.date.value);
    renderText(preview.background,el.background.value);
    renderText(preview.details,el.details.value);
    renderText(preview.decision,el.decision.value);
    renderText(preview.cost,el.cost.value);
    updateRefControls();
    var hasAttachments=attachmentFiles.length>0;
    renderText(preview.refs,el.refs.value,hasAttachments?"":"내용을 입력해 주세요.");
    preview.refs.classList.toggle("empty",!el.refs.value.trim()&&!hasAttachments);
    renderAttachmentPreview();
    saveDraft();
    requestAnimationFrame(fit);
  }
  function fit(){
    var sizes=[13.5,13,12.5,12,11.5,11], lines=[1.52,1.49,1.46,1.43,1.40,1.37], gaps=[11,10,9,8,7,6];
    var fits=false;
    for(var i=0;i<sizes.length;i++){
      paper.style.setProperty("--doc-size",sizes[i]+"px");
      paper.style.setProperty("--doc-line",lines[i]);
      paper.style.setProperty("--section-gap",gaps[i]+"px");
      if(paper.scrollHeight<=paper.clientHeight+1){fits=true;break;}
    }
    pageState.classList.toggle("over",!fits);
    pageState.textContent=fits ? "A4 한 장 안에 들어갑니다." : "A4 한 장을 넘습니다. 내용을 조금 줄여 주세요.";
    printBtn.disabled=!fits;
    return fits;
  }

  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(function(resolve,reject){
      if(!window.indexedDB){reject(new Error("indexedDB unavailable"));return;}
      var req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=function(){
        var db=req.result;
        if(!db.objectStoreNames.contains(STORE)){
          var store=db.createObjectStore(STORE,{keyPath:"id"});
          store.createIndex("updatedAt","updatedAt",{unique:false});
        }
      };
      req.onsuccess=function(){resolve(req.result);};
      req.onerror=function(){reject(req.error||new Error("DB open failed"));};
    });
    return dbPromise;
  }
  function dbGetAll(){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var req=db.transaction(STORE,"readonly").objectStore(STORE).getAll();
      req.onsuccess=function(){resolve((req.result||[]).sort(function(a,b){return String(b.updatedAt||"").localeCompare(String(a.updatedAt||""));}));};
      req.onerror=function(){reject(req.error);};
    });});
  }
  function dbGet(id){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var req=db.transaction(STORE,"readonly").objectStore(STORE).get(id);
      req.onsuccess=function(){resolve(req.result||null);}; req.onerror=function(){reject(req.error);};
    });});
  }
  function dbPut(doc){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var req=db.transaction(STORE,"readwrite").objectStore(STORE).put(doc);
      req.onsuccess=function(){resolve(doc);}; req.onerror=function(){reject(req.error);};
    });});
  }
  function dbDelete(id){
    return openDb().then(function(db){return new Promise(function(resolve,reject){
      var req=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);
      req.onsuccess=function(){resolve();}; req.onerror=function(){reject(req.error);};
    });});
  }
  function newId(){
    if(window.crypto&&typeof crypto.randomUUID==="function")return "proposal_"+crypto.randomUUID();
    return "proposal_"+Date.now()+"_"+Math.random().toString(36).slice(2,9);
  }
  function renderLibrary(){
    dbGetAll().then(function(rows){
      libraryCount.textContent=rows.length+"건";
      libraryList.innerHTML="";
      if(!rows.length){libraryList.innerHTML='<div class="library-empty">저장된 제안서가 없습니다.</div>';return;}
      rows.forEach(function(doc){
        var item=document.createElement("div"); item.className="library-item"+(doc.id===currentDocId?" active":"");
        var main=document.createElement("div"); main.className="library-main";
        var title=document.createElement("div"); title.className="library-title"; title.textContent=doc.title||"제목 없는 안건";
        var meta=document.createElement("div"); meta.className="library-meta";
        var parts=[]; if(doc.date)parts.push(fmtDate(doc.date)); if(doc.proposer)parts.push(doc.proposer); if(doc.attachments&&doc.attachments.length)parts.push("첨부 "+doc.attachments.length+"개"); parts.push("저장 "+fmtSaved(doc.updatedAt));
        meta.textContent=parts.join(" · ");
        main.appendChild(title); main.appendChild(meta);
        var actions=document.createElement("div"); actions.className="library-actions";
        var load=document.createElement("button"); load.type="button"; load.textContent="불러오기";
        load.addEventListener("click",function(){loadDocument(doc.id);});
        var del=document.createElement("button"); del.type="button"; del.className="delete"; del.textContent="삭제";
        del.addEventListener("click",function(){deleteDocument(doc.id,doc.title);});
        actions.appendChild(load); actions.appendChild(del); item.appendChild(main); item.appendChild(actions); libraryList.appendChild(item);
      });
    }).catch(function(){
      libraryCount.textContent="사용 불가";
      libraryList.innerHTML='<div class="library-empty">이 브라우저에서는 문서 보관함을 사용할 수 없습니다.</div>';
      saveBtn.disabled=true;
    });
  }
  function saveDocument(){
    var title=el.title.value.trim();
    if(!title){alert("안건 제목을 먼저 적어주세요.");el.title.focus();return;}
    saveBtn.disabled=true; saveNote.textContent="문서를 저장하고 있습니다…";
    var now=new Date().toISOString();
    var existingPromise=currentDocId?dbGet(currentDocId):Promise.resolve(null);
    existingPromise.then(function(old){
      var data=formData();
      data.id=currentDocId||newId();
      data.createdAt=old&&old.createdAt?old.createdAt:now;
      data.updatedAt=now;
      data.attachments=attachmentFiles.slice();
      return dbPut(data);
    }).then(function(doc){
      currentDocId=doc.id;
      saveNote.textContent="저장했습니다. 목록에서 언제든 다시 불러올 수 있어요.";
      renderLibrary();
    }).catch(function(err){
      console.error(err);
      alert("문서를 저장하지 못했습니다. 첨부파일이 너무 크거나 브라우저 저장공간이 부족할 수 있어요.");
      saveNote.textContent="저장하지 못했습니다.";
    }).finally(function(){saveBtn.disabled=false;});
  }
  function loadDocument(id){
    dbGet(id).then(function(doc){
      if(!doc)return;
      applyData(doc);
      attachmentFiles=Array.isArray(doc.attachments)?doc.attachments.slice():[];
      currentDocId=doc.id;
      renderAttachmentList(); update();
      saveNote.textContent="저장된 제안서를 불러왔습니다. 수정한 뒤 다시 저장하면 이 문서가 갱신됩니다.";
      renderLibrary();
    }).catch(function(){alert("문서를 불러오지 못했습니다.");});
  }
  function deleteDocument(id,title){
    if(!confirm("‘"+(title||"이 제안서")+"’를 저장 목록에서 삭제할까요?"))return;
    dbDelete(id).then(function(){
      if(currentDocId===id){currentDocId=null;saveNote.textContent="저장된 문서는 삭제했습니다. 화면의 작성 내용은 그대로 두었습니다.";}
      renderLibrary();
    }).catch(function(){alert("문서를 삭제하지 못했습니다.");});
  }
  function clearForm(){
    ids.forEach(function(id){el[id].value="";});
    el.date.value=today(); noRefs.checked=false; attachmentFiles=[]; currentDocId=null; attachmentsInput.value="";
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
    currentDocId=null; attachmentFiles=[]; renderAttachmentList();
    applyData({
      title:"커뮤니티센터 누수·곰팡이 보수의 건",
      proposer:"", date:today(),
      background:"커뮤니티센터에 누수와 곰팡이가 생겨 일부 수업 운영에도 문제가 생기고 있습니다.\n\nLH 관리이관 내용에는 누수 보수도 들어가 있지만, 아직 관리이관 시기가 정해지지 않아 실제 공사가 언제 시작될지 알기 어렵습니다. 누수와 곰팡이는 오래 둘수록 상태가 더 나빠질 수 있어 보수 방법을 정하고자 합니다.",
      details:"- LH 관리이관을 통해 바로 보수할 수 있으면 LH 공사로 진행\n- 관리이관이 계속 늦어지면 우리 단지에서 먼저 보수하는 방법 검토\n- 누수 원인을 잡고 젖은 곳을 말린 뒤 곰팡이를 없애고 필요한 부분만 고침\n- 공사 전 현재 상태를 사진으로 남김\n- 벽 설치나 공간 변경은 누수 공사 후 다시 판단",
      decision:"커뮤니티센터 누수와 곰팡이를 더 이상 오래 두지 않고 빠르게 보수한다.\n\nLH를 통한 빠른 보수가 어렵다고 판단되면 관리사무소에서 우리 단지가 먼저 보수할 때 필요한 비용과 일정을 확인해 회의에 보고한다.",
      cost:"관리사무소에서 보수 비용 확인 후 결정",
      refs:"LH 관리이관 자료, 현장 사진, 보수 견적", noRefs:false
    });
    update(); saveNote.textContent="예시를 불러왔습니다. 필요한 부분을 고친 뒤 ‘문서 저장’을 눌러주세요."; renderLibrary();
  }

  ids.forEach(function(id){el[id].addEventListener("input",update);el[id].addEventListener("change",update);});
  noRefs.addEventListener("change",update);
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
  document.getElementById("sampleBtn").addEventListener("click",sample);
  newBtn.addEventListener("click",newDocument);
  saveBtn.addEventListener("click",saveDocument);
  printBtn.addEventListener("click",function(){if(fit())window.print();});
  window.addEventListener("resize",function(){requestAnimationFrame(fit);});

  loadDraft(); update(); renderLibrary();
})();
