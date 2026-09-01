(function(){
const DATA=window.SANDLE_ARCHIVE_SAMPLE||{topics:[]};
const LAYOUTS=window.SANDLE_SEARCH_LAYOUTS||{};
const form=document.getElementById('searchForm');
const input=document.getElementById('searchInput');
const home=document.getElementById('homeView');
const view=document.getElementById('topicView');
const detailDialog=document.getElementById('detailDialog');
const detailContent=document.getElementById('detailContent');
let mode=(LAYOUTS.defaultMode||'B').toUpperCase();
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function topicByQuery(q){q=(q||'').trim().toLowerCase();if(!q)return null;return DATA.topics.find(t=>[t.label].concat(t.aliases||[]).some(v=>String(v).toLowerCase().includes(q)||q.includes(String(v).toLowerCase())));}
function tagClass(tag){return tag==='rule'?'rule':tag==='contract'?'contract':tag==='current'?'current':'history';}
function showHome(){home.classList.remove('is-hidden');view.classList.add('is-hidden');view.innerHTML='';input.value='';try{history.replaceState(null,'',location.pathname);}catch(e){}window.scrollTo({top:0,behavior:'smooth'});}
function openTopic(t){const buttons=[...document.querySelectorAll('#allTopics .topic-text-btn')];const b=buttons.find(x=>x.textContent.trim()===String(t.label).trim());if(b){b.click();return;}location.hash='#topic-'+encodeURIComponent(t.id);location.reload();}
function openDetail(meta,title,note){detailContent.innerHTML=`<div class="detail-meta">${meta.map(v=>`<span>${esc(v)}</span>`).join('')}</div><h2>${esc(title)}</h2><p>${esc(note||'세부 설명이 아직 연결되지 않은 샘플 기록이야.')}</p><div class="detail-foot">실제 Archive에서는 원문, 관련 회의, 근거 규정, 계약·후속 기록으로 이어지는 링크를 함께 제공할 예정이야.</div>`;if(typeof detailDialog.showModal==='function')detailDialog.showModal();else detailDialog.setAttribute('open','');}
function summaryItems(t){const out=[];if(t.description)out.push(t.description);if((t.current||[]).length){out.push(`현재 확인 가능한 기준 ${t.current.length}건: ${t.current.slice(0,2).map(x=>x.title).join(' · ')}`);}if((t.timeline||[]).length){const e=t.timeline[t.timeline.length-1];out.push(`가장 최근 흐름: ${e.date} · ${e.title}`);}if((t.records||[]).length){out.push(`연결된 관련 기록 ${t.records.length}건을 회의·규정·보험 등 자료종류와 함께 확인할 수 있어.`);}return out.slice(0,4);}
function attachBInteractions(t){
  const homeBtn=view.querySelector('[data-b-home]');if(homeBtn)homeBtn.onclick=showHome;
  view.querySelectorAll('[data-b-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.bMode;form.requestSubmit();});
  view.querySelectorAll('[data-b-topic]').forEach(b=>b.onclick=()=>openTopic(t));
  view.querySelectorAll('[data-b-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.bCurrent];openDetail(['현재 기준',c.kind],c.title,c.note);};});
  view.querySelectorAll('[data-b-timeline]').forEach(b=>{b.onclick=()=>{const e=t.timeline[+b.dataset.bTimeline];openDetail([e.date,'타임라인'],e.title,e.note);};});
  view.querySelectorAll('[data-b-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.bRecord];openDetail([r[0],r[1],r[3]],r[2],'검색 결과에서는 목록용 요약만 보여줘. 실제 Archive에서는 원문과 관련 기록을 바로 연결할 예정이야.');};});
}
function renderB(t,query){
  const layout=LAYOUTS.B||{preview:{current:3,timeline:6,records:12}};
  const p=layout.preview||{};
  const currentItems=(t.current||[]).slice(0,p.current||3);
  const timelineItems=(t.timeline||[]).slice(0,p.timeline||6);
  const recordItems=(t.records||[]).slice(0,p.records||12);
  const current=currentItems.map((c,i)=>`<button type="button" class="search-b-current" data-b-current="${i}"><div class="meta"><span class="tag current">현재 기준</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></button>`).join('');
  const summary=summaryItems(t).map(x=>`<li>${esc(x)}</li>`).join('');
  const timeline=timelineItems.map((e,i)=>`<button type="button" class="search-b-event" data-b-timeline="${i}"><time>${esc(e.date)}</time><div><b>${esc(e.title)}</b><p>${esc(e.note)}</p></div></button>`).join('');
  const records=recordItems.map((r,i)=>`<button type="button" class="search-b-record" data-b-record="${i}"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></button>`).join('');
  const counts=Object.entries(t.counts||{}).map(([k,v])=>`<span>${esc(k)} ${esc(v)}</span>`).join('');
  const extraRecords=(t.records||[]).length>recordItems.length?`<div class="search-b-more">전체 ${(t.records||[]).length}건 중 ${recordItems.length}건 표시 · <button type="button" data-b-topic>주제 전체 보기</button></div>`:'';
  home.classList.add('is-hidden');view.classList.remove('is-hidden');input.value=query||t.label;
  view.innerHTML=`<div class="search-b"><button type="button" class="home-link" data-b-home>← 첫 화면으로</button><header class="search-b-head"><div><p class="search-b-kicker">SEARCH RESULT B · 1.7</p><h2>“${esc(query||t.label)}” 검색 결과</h2><p><b>${esc(t.label)}</b> 주제로 연결했어. B안은 현재 기준을 본 뒤 핵심만 요약하고, 타임라인과 자료 전체로 내려가.</p><div class="search-b-counts">${counts}</div></div><div class="search-compare"><button type="button" data-b-mode="A">A안</button><button type="button" class="active" data-b-mode="B">B안</button></div></header><section class="search-b-section"><div class="search-b-section-head"><span>1</span><div><h3>현재 기준</h3><small>지금 적용되는 규정·계약·보험부터</small></div></div><div class="search-b-current-grid">${current||'<p class="search-b-empty">현재 기준 샘플이 아직 없어.</p>'}</div></section><section class="search-b-summary"><div class="search-b-section-head"><span>2</span><div><h3>핵심 요약</h3><small>검색 결과 전체를 짧게 훑기</small></div></div><ul>${summary||'<li>요약할 샘플 데이터가 아직 없어.</li>'}</ul></section><section class="search-b-section"><div class="search-b-section-head"><span>3</span><div><h3>타임라인</h3><small>과거 논의에서 최근 흐름까지</small></div></div><div class="search-b-timeline">${timeline||'<p class="search-b-empty">타임라인 샘플이 아직 없어.</p>'}</div></section><section class="search-b-section"><div class="search-b-section-head"><span>4</span><div><h3>자료 전체</h3><small>회의·규정·계약·보험 등 원자료 목록</small></div></div><div class="search-b-records">${records||'<p class="search-b-empty">관련 기록 샘플이 아직 없어.</p>'}</div>${extraRecords}</section><div class="search-b-footer"><button type="button" data-b-topic>이 주제 전체 화면 보기</button></div></div>`;
  attachBInteractions(t);try{history.replaceState(null,'','#search-b-'+encodeURIComponent(t.id));}catch(e){}view.scrollIntoView({behavior:'smooth',block:'start'});
}
form.addEventListener('submit',function(e){
  if(mode!=='B')return;
  const q=input.value.trim();if(!q)return;
  const t=topicByQuery(q);if(!t)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!(t.current||[]).length&&!(t.timeline||[]).length&&!(t.records||[]).length){home.classList.add('is-hidden');view.classList.remove('is-hidden');view.innerHTML=`<button type="button" class="home-link" data-b-home>← 첫 화면으로</button><div class="empty"><b>“${esc(q)}”</b>와 연결되는 주제는 찾았지만 아직 Golden Sample 자료가 없어.</div>`;const hb=view.querySelector('[data-b-home]');if(hb)hb.onclick=showHome;return;}
  renderB(t,q);
},true);
const observer=new MutationObserver(()=>{
  const a=view.querySelector('.search-a');if(!a)return;
  const actions=a.querySelector('.search-a-actions');if(!actions||actions.querySelector('[data-switch-b]'))return;
  const active=document.createElement('button');active.type='button';active.textContent='A안';active.disabled=true;active.className='search-mode-active';
  const b=document.createElement('button');b.type='button';b.textContent='B안 보기';b.dataset.switchB='1';b.onclick=()=>{mode='B';form.requestSubmit();};
  actions.prepend(active);actions.appendChild(b);
});
observer.observe(view,{childList:true,subtree:true});
})();
