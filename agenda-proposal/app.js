(function(){
  "use strict";
  var KEY="sandle_agenda_proposal_v1";
  var ids=["title","proposer","date","background","details","decision","cost","refs"];
  var el={}; ids.forEach(function(id){el[id]=document.getElementById(id);});
  var noRefs=document.getElementById("noRefs");
  var attachmentsInput=document.getElementById("attachments");
  var attachmentList=document.getElementById("attachmentList");
  var refsField=document.getElementById("refsField");
  var refsSection=document.getElementById("refsSection");
  var pAttachments=document.getElementById("pAttachments");
  var attachmentFiles=[];
  var paper=document.getElementById("paper");
  var pageState=document.getElementById("pageState");
  var printBtn=document.getElementById("printBtn");
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
  function save(){
    var data={}; ids.forEach(function(id){data[id]=el[id].value;});
    data.noRefs=!!noRefs.checked;
    try{localStorage.setItem(KEY,JSON.stringify(data));}catch(e){}
  }
  function load(){
    var data=null; try{data=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){}
    if(data){
      ids.forEach(function(id){if(typeof data[id]==="string")el[id].value=data[id];});
      noRefs.checked=!!data.noRefs;
    }
    if(!el.date.value)el.date.value=today();
  }
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
      var name=document.createElement("span"); name.className="file-name"; name.textContent=file.name;
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
    attachmentFiles.forEach(function(file){var li=document.createElement("li");li.textContent="첨부: "+file.name;ul.appendChild(li);});
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
    save();
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
  function sample(){
    var data={
      title:"커뮤니티센터 누수·곰팡이 보수의 건",
      proposer:"",
      date:today(),
      background:"커뮤니티센터에 누수와 곰팡이가 생겨 일부 수업 운영에도 문제가 생기고 있습니다.\n\nLH 관리이관 내용에는 누수 보수도 들어가 있지만, 아직 관리이관 시기가 정해지지 않아 실제 공사가 언제 시작될지 알기 어렵습니다. 누수와 곰팡이는 오래 둘수록 상태가 더 나빠질 수 있어 보수 방법을 정하고자 합니다.",
      details:"- LH 관리이관을 통해 바로 보수할 수 있으면 LH 공사로 진행\n- 관리이관이 계속 늦어지면 우리 단지에서 먼저 보수하는 방법 검토\n- 누수 원인을 잡고 젖은 곳을 말린 뒤 곰팡이를 없애고 필요한 부분만 고침\n- 공사 전 현재 상태를 사진으로 남김\n- 벽 설치나 공간 변경은 누수 공사 후 다시 판단",
      decision:"커뮤니티센터 누수와 곰팡이를 더 이상 오래 두지 않고 빠르게 보수한다.\n\nLH를 통한 빠른 보수가 어렵다고 판단되면 관리사무소에서 우리 단지가 먼저 보수할 때 필요한 비용과 일정을 확인해 회의에 보고한다.",
      cost:"관리사무소에서 보수 비용 확인 후 결정",
      refs:"LH 관리이관 자료, 현장 사진, 보수 견적"
    };
    ids.forEach(function(id){el[id].value=data[id]||"";}); noRefs.checked=false; update();
  }
  function reset(){
    if(!confirm("작성한 내용을 모두 지울까요?"))return;
    ids.forEach(function(id){el[id].value="";}); el.date.value=today(); noRefs.checked=false; attachmentFiles=[]; attachmentsInput.value=""; renderAttachmentList();
    try{localStorage.removeItem(KEY);}catch(e){} update();
  }
  ids.forEach(function(id){el[id].addEventListener("input",update);el[id].addEventListener("change",update);});
  noRefs.addEventListener("change",update);
  attachmentsInput.addEventListener("change",function(){
    var files=Array.prototype.slice.call(attachmentsInput.files||[]);
    var rejected=files.filter(function(file){return !fileAllowed(file);});
    var accepted=files.filter(fileAllowed);
    accepted.forEach(function(file){
      var duplicate=attachmentFiles.some(function(old){return old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified;});
      if(!duplicate)attachmentFiles.push(file);
    });
    attachmentsInput.value="";
    renderAttachmentList(); update();
    if(rejected.length)alert("PDF, JPG, PNG 파일만 추가할 수 있어요.");
  });
  document.getElementById("sampleBtn").addEventListener("click",sample);
  document.getElementById("resetBtn").addEventListener("click",reset);
  printBtn.addEventListener("click",function(){if(fit())window.print();});
  window.addEventListener("resize",function(){requestAnimationFrame(fit);});
  load(); update();
})();
