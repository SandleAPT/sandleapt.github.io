(function(){
const DATA=window.SANDLE_ARCHIVE_SAMPLE||{topics:[]};
const view=document.getElementById('topicView');
const input=document.getElementById('searchInput');
const quick=document.getElementById('quickTopics');
const form=document.getElementById('searchForm');
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function topicByQuery(q){q=(q||'').trim().toLowerCase();if(!q)return DATA.topics[0];return DATA.topics.find(t=>[t.label].concat(t.aliases||[]).some(v=>String(v).toLowerCase().includes(q)||q.includes(String(v).toLowerCase())));} 
function tagClass(tag){return tag==='current'?'current':tag==='rule'?'rule':tag==='contract'?'contract':'history';}
function render(t){
  document.querySelectorAll('.quick button').forEach(b=>b.classList.toggle('active',b.dataset.id===t.id));
  input.value=t.label;
  const countHtml=Object.entries(t.counts||{}).map(([k,v])=>`<span class="count">${esc(k)} ${esc(v)}</span>`).join('');
  if(!t.current.length&&!t.timeline.length&&!t.records.length){view.innerHTML=`<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div></div><div class="empty">이 주제는 다음 검증 후보야. 먼저 헬스장·GX와 작은도서관 구조를 보고 방향을 정한 뒤 실제 샘플을 붙일 예정이야.</div>`;return;}
  const current=t.current.map(c=>`<article class="card"><div class="meta"><span class="tag ${tagClass(c.tags&&c.tags[0])}">현재 기준</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></article>`).join('');
  const timeline=t.timeline.map(e=>`<div class="event"><time>${esc(e.date)}</time><b>${esc(e.title)}</b><p>${esc(e.note)}</p></div>`).join('');
  const records=t.records.map(r=>`<div class="record-row"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></div>`).join('');
  view.innerHTML=`<div class="topic-head"><div><h2>${esc(t.label)}</h2><p>${esc(t.description)}</p></div><div class="counts">${countHtml}</div></div><div class="grid"><section class="panel"><h3>지금 적용되는 기준 <span>current first</span></h3><div class="current-list">${current}</div></section><section class="panel"><h3>어떻게 여기까지 왔나 <span>timeline</span></h3><div class="timeline">${timeline}</div></section><section class="panel wide"><h3>관련 기록 <span>자료종류가 달라도 한 주제에서 함께</span></h3><div class="records">${records}</div></section></div>`;
}
DATA.topics.forEach(t=>{const b=document.createElement('button');b.type='button';b.textContent=t.label;b.dataset.id=t.id;b.onclick=()=>render(t);quick.appendChild(b);});
form.addEventListener('submit',e=>{e.preventDefault();const t=topicByQuery(input.value);if(t)render(t);else view.innerHTML=`<div class="empty"><b>“${esc(input.value)}”</b>는 아직 샘플 데이터에 없어.<br>실제 Archive v1에서는 제목·별칭·원문·관계 인덱스를 함께 검색하게 될 거야.</div>`;});
render(DATA.topics[0]);
})();