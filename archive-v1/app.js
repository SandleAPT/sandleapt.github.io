(function(){
// 실제 회의록 자료는 비동기로 들어온다(data/live.js). 그래서 const가 아니라 let이고,
// 자료가 준비되면 다시 그린다. 못 읽으면 샘플이 그대로 남는다.
let DATA=window.SANDLE_ARCHIVE_SAMPLE||{topics:[],recentRecords:[]};
const home=document.getElementById('homeView');
const view=document.getElementById('topicView');
const input=document.getElementById('searchInput');
const form=document.getElementById('searchForm');
const allTopics=document.getElementById('allTopics');
const recentRecords=document.getElementById('recentRecords');
const detailDialog=document.getElementById('detailDialog');
const detailContent=document.getElementById('detailContent');
const detailClose=document.getElementById('detailClose');
const PREVIEW={current:3,timeline:4,records:6};
const expanded={};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function topicById(id){return DATA.topics.find(t=>t.id===id);}
function topicByQuery(q){q=(q||'').trim().toLowerCase();if(!q)return null;return DATA.topics.find(t=>[t.label].concat(t.aliases||[]).some(v=>String(v).toLowerCase().includes(q)||q.includes(String(v).toLowerCase())));} 
function tagClass(tag){return tag==='current'?'current':tag==='rule'?'rule':tag==='contract'?'contract':'history';}
function topicSort(a,b){return String(a.label||'').localeCompare(String(b.label||''),'ko',{sensitivity:'base'});}
function stateFor(topicId){return expanded[topicId]||(expanded[topicId]={current:false,timeline:false,records:false});}
function showHome(){
  home.classList.remove('is-hidden');
  view.classList.add('is-hidden');
  view.innerHTML='';
  input.value='';
  try{history.replaceState(null,'',location.pathname);}catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
function attachHomeButton(){const b=view.querySelector('.home-link');if(b)b.onclick=showHome;}
function moreButton(topicId,kind,total,limit){if(total<=limit)return '';const on=stateFor(topicId)[kind];return `<div class="more-row"><button type="button" class="more-btn" data-expand="${kind}">${on?'미리보기로 접기':`전체 ${total}건 보기`}</button></div>`;}
function openDetail(meta,title,note){
  detailContent.innerHTML=`<div class="detail-meta">${meta.map(v=>`<span>${esc(v)}</span>`).join('')}</div><h2>${esc(title)}</h2><p>${esc(note||'세부 설명이 아직 연결되지 않은 샘플 기록이야.')}</p><div class="detail-foot">실제 Archive에서는 여기에서 원문, 관련 회의, 근거 규정, 계약·후속 기록으로 이어지는 링크를 함께 제공할 예정이야.</div>`;
  if(typeof detailDialog.showModal==='function')detailDialog.showModal();else detailDialog.setAttribute('open','');
}
function closeDetail(){if(detailDialog.open&&typeof detailDialog.close==='function')detailDialog.close();else detailDialog.removeAttribute('open');}
function attachTopicInteractions(t){
  attachHomeButton();
  view.querySelectorAll('[data-expand]').forEach(b=>{b.onclick=()=>{const k=b.dataset.expand;const s=stateFor(t.id);s[k]=!s[k];renderTopic(t,false);};});
  view.querySelectorAll('[data-detail-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.detailCurrent];openDetail([DATA.currentLabel||'현재 기준',c.kind],c.title,c.note);};});
  view.querySelectorAll('[data-detail-timeline]').forEach(b=>{b.onclick=()=>{const e=t.timeline[+b.dataset.detailTimeline];openDetail([e.date,'주요 흐름'],e.title,e.note);};});
  view.querySelectorAll('[data-detail-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.detailRecord];openDetail([r[0],r[1],r[3]],r[2],'현재 샘플에서는 목록용 정보만 연결되어 있어. 실제 자료 이관 때 원문 요약과 관련 기록을 함께 연결할 예정이야.');};});
}
function renderTopic(t,doScroll=true){
  home.classList.add('is-hidden');
  view.classList.remove('is-hidden');
  input.value=t.label;
  const countHtml=Object.entries(t.counts||{}).map(([k,v])=>`<span class="count">${esc(k)} ${esc(v)}</span>`).join('');
  const back=`<button type="button" class="home-link">← 첫 화면으로</button>`;
  if(!t.current.length&&!t.timeline.length&&!t.records.length){view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div></div><div class="empty">이 주제는 다음 검증 후보야. 지금은 화면 구조를 확인하는 단계라 실제 자료를 아직 붙이지 않았어.</div>`;attachHomeButton();return;}
  const s=stateFor(t.id);
  const currentItems=(s.current?t.current:t.current.slice(0,PREVIEW.current));
  const timelineItems=(s.timeline?t.timeline:t.timeline.slice(0,PREVIEW.timeline));
  const recordItems=(s.records?t.records:t.records.slice(0,PREVIEW.records));
  const current=currentItems.map((c,i)=>{const realIndex=s.current?i:t.current.indexOf(c);return `<button type="button" class="card detail-item" data-detail-current="${realIndex}"><div class="meta"><span class="tag ${tagClass(c.tags&&c.tags[0])}">${esc(DATA.currentLabel||'현재 기준')}</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></button>`;}).join('');
  const timeline=timelineItems.map((e,i)=>{const realIndex=s.timeline?i:t.timeline.indexOf(e);return `<button type="button" class="event detail-event" data-detail-timeline="${realIndex}"><time>${esc(e.date)}</time><b>${esc(e.title)}</b><p>${esc(e.note)}</p></button>`;}).join('');
  const records=recordItems.map((r,i)=>{const realIndex=s.records?i:t.records.indexOf(r);return `<button type="button" class="record-row" data-detail-record="${realIndex}"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></button>`;}).join('');
  view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div><div class="counts">${countHtml}</div></div><div class="grid"><section class="panel"><h3>${esc(DATA.currentHeading||'지금 적용되는 기준')} <span>미리보기 · 항목 클릭</span></h3><div class="current-list">${current}${moreButton(t.id,'current',t.current.length,PREVIEW.current)}</div></section><section class="panel"><h3>어떻게 여기까지 왔나 <span>최근 흐름 미리보기</span></h3><div class="timeline">${timeline}</div>${moreButton(t.id,'timeline',t.timeline.length,PREVIEW.timeline)}</section><section class="panel wide"><h3>관련 기록 <span>자료종류가 달라도 한 주제에서 함께</span></h3><div class="records">${records}${moreButton(t.id,'records',t.records.length,PREVIEW.records)}</div></section></div>`;
  attachTopicInteractions(t);
  try{history.replaceState(null,'','#topic-'+encodeURIComponent(t.id));}catch(e){}
  if(doScroll)view.scrollIntoView({behavior:'smooth',block:'start'});
}
function attachSearchAInteractions(t){
  attachHomeButton();
  const openTopic=view.querySelector('[data-open-topic]');if(openTopic)openTopic.onclick=()=>renderTopic(t);
  view.querySelectorAll('[data-search-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.searchCurrent];openDetail([DATA.currentLabel||'현재 기준',c.kind],c.title,c.note);};});
  view.querySelectorAll('[data-search-timeline]').forEach(b=>{b.onclick=()=>{const e=t.timeline[+b.dataset.searchTimeline];openDetail([e.date,'주요 흐름'],e.title,e.note);};});
  view.querySelectorAll('[data-search-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.searchRecord];openDetail([r[0],r[1],r[3]],r[2],'검색 결과에서는 요약만 보여줘. 실제 Archive에서는 이 항목에서 원문과 연결 기록을 바로 열 수 있게 할 예정이야.');};});
  view.querySelectorAll('[data-open-topic-inline]').forEach(b=>{b.onclick=()=>renderTopic(t);});
}
function renderSearchA(t,query,doScroll=true){
  home.classList.add('is-hidden');
  view.classList.remove('is-hidden');
  input.value=query||t.label;
  if(!t.current.length&&!t.timeline.length&&!t.records.length){view.innerHTML=`<button type="button" class="home-link">← 첫 화면으로</button><div class="empty"><b>“${esc(query||t.label)}”</b>와 연결되는 주제는 찾았지만 아직 Golden Sample 자료가 없어.<br>이 주제의 실제 자료는 이후 검증 단계에서 붙일 예정이야.</div>`;attachHomeButton();return;}
  const currentItems=t.current.slice(0,PREVIEW.current);
  const timelineItems=t.timeline.slice(0,PREVIEW.timeline);
  const recordItems=t.records.slice(0,PREVIEW.records);
  const current=currentItems.map((c,i)=>`<button type="button" class="search-a-current" data-search-current="${i}"><div class="meta"><span class="tag ${tagClass(c.tags&&c.tags[0])}">${esc(DATA.currentLabel||'현재 기준')}</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></button>`).join('');
  const timeline=timelineItems.map((e,i)=>`<button type="button" class="search-a-event" data-search-timeline="${i}"><time>${esc(e.date)}</time><b>${esc(e.title)}</b><p>${esc(e.note)}</p></button>`).join('');
  const records=recordItems.map((r,i)=>`<button type="button" class="search-a-record" data-search-record="${i}"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></button>`).join('');
  const counts=Object.entries(t.counts||{}).map(([k,v])=>`<span>${esc(k)} ${esc(v)}</span>`).join('');
  view.innerHTML=`<div class="search-a"><button type="button" class="home-link">← 첫 화면으로</button><header class="search-a-head"><div class="search-a-title"><p class="search-a-kicker">SEARCH RESULT A · 1.6</p><h2>“${esc(query||t.label)}” 검색 결과</h2><p><b>${esc(t.label)}</b> 주제로 연결했어. A안은 현재 적용되는 정보부터 과거 흐름, 관련 자료 순으로 읽게 해.</p><div class="search-a-counts">${counts}</div></div><div class="search-a-actions"><button type="button" data-open-topic>주제 전체 보기</button></div></header><div class="search-a-flow-label"><span>1</span> 먼저 지금 기준을 확인</div><section class="search-a-section"><div class="search-a-section-head"><h3>${esc(DATA.currentLabel||'현재 기준')}</h3><small>${esc(DATA.currentNote||'현행 규정·계약·보험 등을 우선')}</small></div><div class="search-a-current-grid">${current}</div>${t.current.length>PREVIEW.current?`<div class="search-a-more">현재 기준 ${t.current.length}건 중 ${PREVIEW.current}건만 표시 · <button type="button" data-open-topic-inline>전체 보기</button></div>`:''}</section><div class="search-a-flow-label"><span>2</span> 왜 이렇게 되었는지 흐름 확인</div><section class="search-a-section"><div class="search-a-section-head"><h3>주요 흐름</h3><small>과거 논의 → 결정 → 변경</small></div><div class="search-a-timeline">${timeline}</div>${t.timeline.length>PREVIEW.timeline?`<div class="search-a-more">주요 흐름 ${t.timeline.length}건 중 ${PREVIEW.timeline}건만 표시 · <button type="button" data-open-topic-inline>전체 보기</button></div>`:''}</section><div class="search-a-flow-label"><span>3</span> 필요하면 원자료까지 확인</div><section class="search-a-section"><div class="search-a-section-head"><h3>관련 기록</h3><small>회의·규정·계약·보험 등 자료종류 통합</small></div><div class="search-a-records">${records}</div>${t.records.length>PREVIEW.records?`<div class="search-a-more">관련 기록 ${t.records.length}건 중 ${PREVIEW.records}건만 표시 · <button type="button" data-open-topic-inline>전체 보기</button></div>`:''}</section></div>`;
  attachSearchAInteractions(t);
  try{history.replaceState(null,'','#search-a-'+encodeURIComponent(t.id));}catch(e){}
  if(doScroll)view.scrollIntoView({behavior:'smooth',block:'start'});
}
/* 전체 주제 목록 (5.5c).
 *
 * 가나다순 + 건수 없음이었다. 그러면 39개가 다 똑같아 보이고, **찾을 이름을 이미 아는 사람**
 * 에게만 쓸모가 있다. 회의록 앱 ③은 건수 순으로 늘어놓아서 목록 자체가 정보다 —
 * 계약·입찰 230 … 제설·동절기 4 를 보면 이 단지가 무엇을 많이 다루는지 한눈에 들어온다.
 *
 * 그래서 **건수 순 + 건수 표시**로 바꾼다. 이름으로 찾는 길은 검색창이 이미 있다.
 * 기록이 없는 주제는 맨 뒤로 보낸다(지우지는 않는다 — "이 주제는 기록이 없다"도 정보다).
 */
function renderAllTopics(){
  allTopics.innerHTML='';
  const 건수=t=>(t.records||[]).length;
  const topics=DATA.topics.filter(t=>t.visibility!=='private')
    .slice().sort((a,b)=>건수(b)-건수(a)||String(a.label).localeCompare(String(b.label),'ko'));
  topics.forEach((t,i)=>{
    const b=document.createElement('button');b.type='button';b.className='topic-text-btn';
    b.title=t.description||t.label;
    b.appendChild(document.createTextNode(t.label));
    if(건수(t)){const n=document.createElement('i');n.className='tcount';n.textContent=건수(t);b.appendChild(n);}
    b.onclick=()=>renderTopic(t);allTopics.appendChild(b);
    if(i<topics.length-1){const sep=document.createElement('span');sep.className='topic-sep';sep.textContent='·';sep.setAttribute('aria-hidden','true');allTopics.appendChild(sep);}
  });
}
function renderRecent(){
  recentRecords.innerHTML='';
  (DATA.recentRecords||[]).forEach(r=>{
    const b=document.createElement('button');b.type='button';b.className='recent-row';
    b.innerHTML=`<span class="recent-date">${esc(r.date)}</span><span class="recent-copy"><b>${esc(r.title)}</b><small>${esc(r.kind)} · ${esc(r.status)}</small></span><span class="recent-arrow">›</span>`;
    const t=topicById(r.topicId);b.onclick=()=>{if(t)renderTopic(t);};recentRecords.appendChild(b);
  });
}
form.addEventListener('submit',e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q){showHome();return;}
  const t=topicByQuery(q);
  if(t)renderSearchA(t,q);
  else{
    home.classList.add('is-hidden');view.classList.remove('is-hidden');
    view.innerHTML=`<button type="button" class="home-link">← 첫 화면으로</button><div class="empty"><b>“${esc(q)}”</b>는 아직 Golden Sample에 없어.<br>실제 Archive v1에서는 제목·별칭·원문·관계 인덱스를 함께 검색하게 될 거야.</div>`;
    attachHomeButton();view.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
detailClose.onclick=closeDetail;
detailDialog.addEventListener('click',e=>{if(e.target===detailDialog)closeDetail();});
renderAllTopics();renderRecent();
// 실제 자료가 준비되면 갈아끼우고 다시 그린다. 첫 화면에 있을 때만 바꿔서
// 사용자가 이미 어떤 주제를 열어 보고 있으면 밑에서 화면이 바뀌지 않게 한다.
if(window.SandleArchiveLive&&window.SandleArchiveLive.준비){
  window.SandleArchiveLive.준비.then(function(자료){
    if(!자료)return;
    DATA=자료;
    const 안내=document.querySelector('.search-help');
    if(안내)안내.textContent='회의 '+자료.통계.회의+'건 · 안건 '+자료.통계.안건+'건을 주제 '+자료.통계.주제+'개로 묶었어. 회의록 앱의 분류를 그대로 쓴다.';
    /* 언제까지의 자료인지 (4.6a). 이 화면은 하루 한 번 만들어지는 사본을 읽으므로
       오늘 저장한 회의록은 아직 없다. 안 적어두면 "저장했는데 왜 안 보이지"가 된다. */
    const 기준=document.getElementById('dataAsOf');
    if(기준&&자료.기준&&자료.기준.text){
      /* "그 뒤에"라고 쓴다. "오늘 저장한 건 내일 보여"라고 하면 기준이 오늘일 때
         "오늘 저장분까지 반영돼 있어. 오늘 저장한 건 내일 보여"가 되어 앞뒤가 어긋난다. */
      기준.textContent=자료.기준.text+(자료.기준.stale?' — 사본이 며칠째 안 만들어졌어':' 반영돼 있어. 그 뒤에 저장한 건 내일 보여.');
      기준.className='data-asof'+(자료.기준.stale?' stale':'');
    }
    const 부제=document.querySelector('.brand small');
    if(부제)부제.textContent='실제 회의록 '+자료.통계.회의+'건';
    if(!home.classList.contains('is-hidden')){renderAllTopics();renderRecent();}
  }).catch(function(){});
}
const rawHash=location.hash||'';
let initial=null;
if(rawHash.indexOf('#search-a-')===0){initial=topicById(decodeURIComponent(rawHash.replace(/^#search-a-/,'')));if(initial)renderSearchA(initial,initial.label,false);else showHome();}
else if(rawHash.indexOf('#topic-')===0){initial=topicById(decodeURIComponent(rawHash.replace(/^#topic-/,'')));if(initial)renderTopic(initial,false);else showHome();}
else showHome();
})();