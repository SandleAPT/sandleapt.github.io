(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function visibilityLabel(v){return v==='resident'?'입주민 공개':v==='private'?'비공개':'전체 공개';}
  function visibilityBadge(v){return `<span class="aw-visibility ${esc(v)}">${esc(v)} · ${visibilityLabel(v)}</span>`;}
  function sampleBadge(item){return item&&item.sample?'<span class="aw-sample">샘플</span>':'';}
  function statusPill(text,kind){return `<span class="aw-status ${kind||''}">${esc(text)}</span>`;}
  function empty(title,note){return `<div class="aw-empty"><b>${esc(title)}</b><p>${esc(note||'')}</p></div>`;}
  function nav(view){window.dispatchEvent(new CustomEvent('sandle-admin:navigate',{detail:view}));}
  function toast(message){
    let el=document.querySelector('.aw-toast');
    if(!el){el=document.createElement('div');el.className='aw-toast';document.body.appendChild(el);}
    el.textContent=message;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2200);
  }
  function openPreview(item){
    const d=document.getElementById('adminPreviewDialog');
    const c=document.getElementById('adminPreviewContent');
    if(!d||!c||!item)return;
    const rel=item.relation?`<div class="aw-preview-row"><span>관계</span><b>${esc(item.relation.type)} → ${esc(item.relation.target)}</b></div>`:'';
    c.innerHTML=`<div class="aw-preview-head">${sampleBadge(item)}${visibilityBadge(item.visibility)}</div><h2>${esc(item.title)}</h2><div class="aw-preview-grid"><div class="aw-preview-row"><span>자료종류</span><b>${esc(item.documentType)}</b></div><div class="aw-preview-row"><span>날짜</span><b>${esc(item.date||'-')}</b></div><div class="aw-preview-row"><span>주제</span><b>${esc(item.suggestions&&item.suggestions.topic||'-')}</b></div><div class="aw-preview-row"><span>조직</span><b>${esc(item.suggestions&&item.suggestions.organization||'-')}</b></div><div class="aw-preview-row"><span>현행상태</span><b>${esc(item.suggestions&&item.suggestions.temporalStatus||'-')}</b></div><div class="aw-preview-row"><span>적용범위</span><b>${esc(item.scope||'-')}</b></div>${rel}</div><p class="aw-preview-note">${esc(item.note||'메모 없음')}</p><div class="aw-preview-source"><b>원본 위치</b><span>${esc(item.source||'미입력')}</span></div>`;
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  }
  window.SandleAdminUI={esc,visibilityLabel,visibilityBadge,sampleBadge,statusPill,empty,nav,toast,openPreview};
})();