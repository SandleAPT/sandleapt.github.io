(function(){
const DATA=window.SANDLE_ARCHIVE_SAMPLE||{topics:[],recentRecords:[]};
const home=document.getElementById('homeView');
const view=document.getElementById('topicView');
const input=document.getElementById('searchInput');
const quick=document.getElementById('quickTopics');
const form=document.getElementById('searchForm');
const randomTopics=document.getElementById('randomTopics');
const shuffleTopics=document.getElementById('shuffleTopics');
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
function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function showHome(){
  home.classList.remove('is-hidden');
  view.classList.add('is-hidden');
  view.innerHTML='';
  input.value='';
  document.querySelectorAll('.quick button').forEach(b=>b.classList.remove('active'));
  try{history.replaceState(null,'',location.pathname);}catch(e){}
  window.scrollTo({top:0,behavior:'smooth'});
}
function attachHomeButton(){const b=view.querySelector('.home-link');if(b)b.onclick=showHome;}
function moreButton(kind,total,limit){if(total<=limit)return '';return `<div class="more-row"><button type="button" class="more-btn" data-expand="${kind}">${expanded[kind]?'미리보기로 접기':`전체 ${total}건 보기`}</button></div>`;}
function openDetail(meta,title,note){
  detailContent.innerHTML=`<div class="detail-meta">${meta.map(v=>`<span>${esc(v)}</span>`).join('')}</div><h2>${esc(title)}</h2><p>${esc(note||'세부 설명이 아직 연결되지 않은 샘플 기록이야.')}</p><div class="detail-foot">실제 Archive에서는 여기에서 원문, 관련 회의, 근거 규정, 계약·후속 기록으로 이어지는 링크를 함께 제공할 예정이야.</div>`;
  if(typeof detailDialog.showModal==='function')detailDialog.showModal();else detailDialog.setAttribute('open','');
}
function closeDetail(){if(detailDialog.open&&typeof detailDialog.close==='function')detailDialog.close();else detailDialog.removeAttribute('open');}
function attachTopicInteractions(t){
  attachHomeButton();
  view.querySelectorAll('[data-expand]').forEach(b=>{b.onclick=()=>{const k=b.dataset.expand;expanded[k]=!expanded[k];render(t,false);};});
  view.querySelectorAll('[data-detail-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.detailCurrent];openDetail(['현재 기준',c.kind],c.title,c.note);};});
  view.querySelectorAll('[data-detail-timeline]').forEach(b=>{b.onclick=()=>{const e=t.timeline[+b.dataset.detailTimeline];openDetail([e.date,'주요 흐름'],e.title,e.note);};});
  view.querySelectorAll('[data-detail-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.detailRecord];openDetail([r[0],r[1],r[3]],r[2],'현재 샘플에서는 목록용 정보만 연결되어 있어. 실제 자료 이관 때 원문 요약과 관련 기록을 함께 연결할 예정이야.');};});
}
function render(t,doScroll=true){
  home.classList.add('is-hidden');
  view.classList.remove('is-hidden');
  document.querySelectorAll('.quick button').forEach(b=>b.classList.toggle('active',b.dataset.id===t.id));
  input.value=t.label;
  const countHtml=Object.entries(t.counts||{}).map(([k,v])=>`<span class="count">${esc(k)} ${esc(v)}</span>`).join('');
  const back=`<button type="button" class="home-link">← 첫 화면으로</button>`;
  if(!t.current.length&&!t.timeline.length&&!t.records.length){view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div></div><div class="empty">이 주제는 다음 검증 후보야. 지금은 화면 구조를 확인하는 단계라 실제 자료를 아직 붙이지 않았어.</div>`;attachHomeButton();return;}
  const currentItems=(expanded.current?t.current:t.current.slice(0,PREVIEW.current));
  const timelineItems=(expanded.timeline?t.timeline:t.timeline.slice(0,PREVIEW.timeline));
  const recordItems=(expanded.records?t.records:t.records.slice(0,PREVIEW.records));
  const current=currentItems.map((c,i)=>{const realIndex=expanded.current?i:t.current.indexOf(c);return `<button type="button" class="card detail-item" data-detail-current="${realIndex}"><div class="meta"><span class="tag ${tagClass(c.tags&&c.tags[0])}">현재 기준</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></button>`;}).join('');
  const timeline=timelineItems.map((e,i)=>{const realIndex=expanded.timeline?i:t.timeline.indexOf(e);return `<button type="button" class="event detail-event" data-detail-timeline="${realIndex}"><time>${esc(e.date)}</time><b>${esc(e.title)}</b><p>${esc(e.note)}</p></button>`;}).join('');
  const records=recordItems.map((r,i)=>{const realIndex=expanded.records?i:t.records.indexOf(r);return `<button type="button" class="record-row" data-detail-record="${realIndex}"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></button>`;}).join('');
  view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div><div class="counts">${countHtml}</div></div><div class="grid"><section class="panel"><h3>지금 적용되는 기준 <span>미리보기 · 항목 클릭</span></h3><div class="current-list">${current}${moreButton('current',t.current.length,PREVIEW.current)}</div></section><section class="panel"><h3>어떻게 여기까지 왔나 <span>최근 흐름 미리보기</span></h3><div class="timeline">${timeline}</div>${moreButton('timeline',t.timeline.length,PREVIEW.timeline)}</section><section class="panel wide"><h3>관련 기록 <span>자료종류가 달라도 한 주제에서 함께</span></h3><div class="records">${records}${moreButton('records',t.records.length,PREVIEW.records)}</div></section></div>`;
  attachTopicInteractions(t);
  try{history.replaceState(null,'','#topic-'+encodeURIComponent(t.id));}catch(e){}
  if(doScroll)view.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderRandomTopics(){
  randomTopics.innerHTML='';
  const candidates=DATA.topics.filter(t=>t.visibility!=='private');
  shuffle(candidates).slice(0,5).forEach(t=>{
    const b=document.createElement('button');b.type='button';b.className='discover-row';
    b.innerHTML=`<span class="discover-dot"></span><span class="discover-copy"><b>${esc(t.label)}</b><small>${esc(t.description)}</small></span><span class="discover-arrow">›</span>`;
    b.onclick=()=>render(t);randomTopics.appendChild(b);
  });
}
function renderRecent(){
  recentRecords.innerHTML='';
  (DATA.recentRecords||[]).forEach(r=>{
    const b=document.createElement('button');b.type='button';b.className='recent-row';
    b.innerHTML=`<span class="recent-date">${esc(r.date)}</span><span class="recent-copy"><b>${esc(r.title)}</b><small>${esc(r.kind)} · ${esc(r.status)}</small></span><span class="recent-arrow">›</span>`;
    const t=topicById(r.topicId);b.onclick=()=>{if(t)render(t);};recentRecords.appendChild(b);
  });
}
function renderShortcuts(){
  DATA.topics.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t.label;b.dataset.id=t.id;b.onclick=()=>render(t);quick.appendChild(b);});
}
form.addEventListener('submit',e=>{
  e.preventDefault();
  const q=input.value.trim();
  if(!q){showHome();return;}
  const t=topicByQuery(q);
  if(t)render(t);
  else{
    home.classList.add('is-hidden');view.classList.remove('is-hidden');
    view.innerHTML=`<button type="button" class="home-link">← 첫 화면으로</button><div class="empty"><b>“${esc(q)}”</b>는 아직 Golden Sample에 없어.<br>실제 Archive v1에서는 제목·별칭·원문·관계 인덱스를 함께 검색하게 될 거야.</div>`;
    attachHomeButton();view.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
shuffleTopics.onclick=renderRandomTopics;
detailClose.onclick=closeDetail;
detailDialog.addEventListener('click',e=>{if(e.target===detailDialog)closeDetail();});
renderRandomTopics();renderRecent();renderShortcuts();
const hash=(location.hash||'').replace(/^#topic-/,'');
const initial=hash&&topicById(decodeURIComponent(hash));
if(initial)render(initial);else showHome();
})();