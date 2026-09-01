(function(){
const DATA=window.SANDLE_ARCHIVE_SAMPLE||{topics:[],topTopics:[],recentRecords:[]};
const home=document.getElementById('homeView');
const view=document.getElementById('topicView');
const input=document.getElementById('searchInput');
const quick=document.getElementById('quickTopics');
const form=document.getElementById('searchForm');
const topTopics=document.getElementById('topTopics');
const recentRecords=document.getElementById('recentRecords');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function topicById(id){return DATA.topics.find(t=>t.id===id);}
function topicByQuery(q){q=(q||'').trim().toLowerCase();if(!q)return null;return DATA.topics.find(t=>[t.label].concat(t.aliases||[]).some(v=>String(v).toLowerCase().includes(q)||q.includes(String(v).toLowerCase())));} 
function tagClass(tag){return tag==='current'?'current':tag==='rule'?'rule':tag==='contract'?'contract':'history';}
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
function render(t){
  home.classList.add('is-hidden');
  view.classList.remove('is-hidden');
  document.querySelectorAll('.quick button').forEach(b=>b.classList.toggle('active',b.dataset.id===t.id));
  input.value=t.label;
  const countHtml=Object.entries(t.counts||{}).map(([k,v])=>`<span class="count">${esc(k)} ${esc(v)}</span>`).join('');
  const back=`<button type="button" class="home-link">← 첫 화면으로</button>`;
  if(!t.current.length&&!t.timeline.length&&!t.records.length){view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div></div><div class="empty">이 주제는 다음 검증 후보야. 지금은 1.2 첫 화면 구조를 확인하는 단계라 실제 자료를 아직 붙이지 않았어.</div>`;attachHomeButton();return;}
  const current=t.current.map(c=>`<article class="card"><div class="meta"><span class="tag ${tagClass(c.tags&&c.tags[0])}">현재 기준</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></article>`).join('');
  const timeline=t.timeline.map(e=>`<div class="event"><time>${esc(e.date)}</time><b>${esc(e.title)}</b><p>${esc(e.note)}</p></div>`).join('');
  const records=t.records.map(r=>`<div class="record-row"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></div>`).join('');
  view.innerHTML=`${back}<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div><div class="counts">${countHtml}</div></div><div class="grid"><section class="panel"><h3>지금 적용되는 기준 <span>current first</span></h3><div class="current-list">${current}</div></section><section class="panel"><h3>어떻게 여기까지 왔나 <span>timeline</span></h3><div class="timeline">${timeline}</div></section><section class="panel wide"><h3>관련 기록 <span>자료종류가 달라도 한 주제에서 함께</span></h3><div class="records">${records}</div></section></div>`;
  attachHomeButton();
  try{history.replaceState(null,'','#topic-'+encodeURIComponent(t.id));}catch(e){}
  view.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderTopTopics(){
  topTopics.innerHTML='';
  (DATA.topTopics||[]).slice(0,5).forEach(item=>{
    const t=topicById(item.topicId);if(!t)return;
    const b=document.createElement('button');b.type='button';b.className='rank-row';
    b.innerHTML=`<span class="rank-no">${esc(item.rank)}</span><span class="rank-copy"><b>${esc(t.label)}</b><small>${esc(item.note||t.description)}</small></span><span class="rank-arrow">›</span>`;
    b.onclick=()=>render(t);topTopics.appendChild(b);
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
renderTopTopics();renderRecent();renderShortcuts();
const hash=(location.hash||'').replace(/^#topic-/,'');
const initial=hash&&topicById(decodeURIComponent(hash));
if(initial)render(initial);else showHome();
})();