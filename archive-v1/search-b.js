(function(){
// 실제 회의록 자료는 나중에 들어온다(data/live.js). 로드 시점의 값을 붙잡아 두면
// 검색만 옛 샘플로 돌아 "자료가 없어"라고 답한다. 쓸 때마다 전역을 다시 읽는다.
function 자료(){ return window.SANDLE_ARCHIVE_SAMPLE||{topics:[]}; }
const LAYOUTS=window.SANDLE_SEARCH_LAYOUTS||{};
const form=document.getElementById('searchForm');
const input=document.getElementById('searchInput');
const home=document.getElementById('homeView');
const view=document.getElementById('topicView');
const detailDialog=document.getElementById('detailDialog');
const detailContent=document.getElementById('detailContent');
let mode=(LAYOUTS.defaultMode||'B').toUpperCase();
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function topicByQuery(q){q=(q||'').trim().toLowerCase();if(!q)return null;return (자료().topics||[]).find(t=>[t.label].concat(t.aliases||[]).some(v=>String(v).toLowerCase().includes(q)||q.includes(String(v).toLowerCase())));}
function tagClass(tag){return tag==='rule'?'rule':tag==='contract'?'contract':tag==='current'?'current':'history';}
function showHome(){home.classList.remove('is-hidden');view.classList.add('is-hidden');view.innerHTML='';input.value='';try{history.replaceState(null,'',location.pathname);}catch(e){}window.scrollTo({top:0,behavior:'smooth'});}
function openTopic(t){const buttons=[...document.querySelectorAll('#allTopics .topic-text-btn')];const b=buttons.find(x=>x.textContent.trim()===String(t.label).trim());if(b){b.click();return;}location.hash='#topic-'+encodeURIComponent(t.id);location.reload();}
/* 원문 링크(2026-09-02): Archive는 회의록을 복제하지 않고 찾아가게 하는 것이 목적이라,
 * 안건을 누르면 회의록 앱의 그 회의를 연다. 링크가 없으면 예전 안내를 그대로 둔다. */
function openDetail(meta,title,note,원문,회의){
  const 발 = 원문
    ? `<div class="detail-foot"><a class="detail-open" href="${esc(원문)}">회의록 원문 열기 →</a>${회의?`<small>${esc(회의)}</small>`:''}</div>`
    : `<div class="detail-foot">이 항목은 아직 원문으로 이어지지 않아.</div>`;
  detailContent.innerHTML=`<div class="detail-meta">${meta.map(v=>`<span>${esc(v)}</span>`).join('')}</div><h2>${esc(title)}</h2><p>${esc(note||'세부 설명이 아직 연결되지 않았어.')}</p>${발}`;
  if(typeof detailDialog.showModal==='function')detailDialog.showModal();else detailDialog.setAttribute('open','');
}
/* 핵심 요약.
 * 2026-09-02(5.2)에 두 군데를 고쳤다. 손으로 쓴 샘플에서는 맞았는데 실제 회의록을 붙이니 틀렸다.
 *  ① 「가장 최근 흐름」이 **가장 오래된 것**을 보여줬다. 타임라인의 마지막 칸을 집었는데,
 *     실제 자료의 타임라인은 최신이 먼저라 마지막이 제일 오래된 것이다(하자·소송에서 2016.06이 '최근'으로 나옴).
 *     순서에 기대지 않고 **날짜가 가장 큰 것**을 고른다. 나중에 정렬이 또 바뀌어도 안 틀린다.
 *  ② 「현재 확인 가능한 기준」 — 규약·계약을 아직 안 붙여서 여기 있는 것은 그냥 최근 안건이다.
 *     '기준'이라 부르면 지나간 안건을 지금 유효한 규정처럼 읽게 된다. 자료가 주는 이름을 그대로 쓴다.
 */
function summaryItems(t){const out=[];if(t.description)out.push(t.description);
if((t.current||[]).length){const 이름=t.currentHeading||자료().currentHeading||'최근 기록';out.push(`${이름} ${t.current.length}건: ${t.current.slice(0,2).map(x=>x.title).join(' · ')}`);}
if((t.timeline||[]).length){const e=t.timeline.reduce((a,b)=>String(b.date||'')>String(a.date||'')?b:a);out.push(`가장 최근 흐름: ${e.date} · ${e.title}`);}
if((t.records||[]).length){out.push(`연결된 관련 기록 ${t.records.length}건을 회의·규정·보험 등 자료종류와 함께 확인할 수 있어.`);}return out.slice(0,4);}
function attachBInteractions(t,t0){
  const homeBtn=view.querySelector('[data-b-home]');if(homeBtn)homeBtn.onclick=showHome;
  /* 갈래로 좁히기 (5.4). 다시 그릴 때는 좁히지 않은 원본(t0)을 넘긴다 —
     좁혀진 것을 또 좁히면 갈래 칩이 사라져 되돌릴 방법이 없어진다. */
  view.querySelectorAll('[data-narrow]').forEach(b=>b.onclick=()=>{
    const v=b.dataset.narrow||'';
    좁힘=(v&&v!==좁힘)?v:null;
    renderB(t0||t,input.value||(t0||t).label);
  });
  view.querySelectorAll('[data-b-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.bMode;form.requestSubmit();});
  // 주제 전환 — 첫 화면으로 돌아가지 않고 바로 옆 주제로 간다.
  view.querySelectorAll('[data-tswitch]').forEach(b=>b.onclick=()=>{
    const n=(자료().topics||[]).find(x=>x.id===b.dataset.tswitch);
    if(!n)return;
    좁힘=null;          // 다른 주제로 가면 좁힘은 푼다 — 그 주제엔 없는 갈래일 수 있다
    input.value=n.label;
    renderB(n,n.label);
    // 누른 주제가 화면 밖에 있으면 그 자리로 스크롤해 둔다.
    const cur=view.querySelector('.tswitch.on');
    if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'nearest',inline:'center'});
  });
  view.querySelectorAll('[data-b-topic]').forEach(b=>b.onclick=()=>openTopic(t));
  view.querySelectorAll('[data-b-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.bCurrent];openDetail([자료().currentLabel||'현재 기준',c.kind],c.title,c.note,c.원문,c.회의);};});
  view.querySelectorAll('[data-b-timeline]').forEach(b=>{b.onclick=()=>{const e=t.timeline[+b.dataset.bTimeline];openDetail([e.date,'타임라인'],e.title,e.note,e.원문,e.회의);};});
  view.querySelectorAll('[data-b-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.bRecord];openDetail([r[0],r[1],r[3]],r[2],r[5]?('회의: '+r[5]):'',r[4],r[5]);};});
}
/* 주제 전환 줄 (사용자 요청 2026-09-02)
 *   "선택해서 들어갔을 때 다시 뒤로 가서 고르기 귀찮으니
 *    제목 옆에 다른 카테고리를 주르르륵 붙이거나, 선택된 것만 큰 글씨로 해달라."
 * 둘 다 한다 — 전부 늘어놓되 지금 보는 것만 크게. 뒤로 가지 않고 옆으로 옮겨 다닌다.
 * 기록이 없는 주제는 눌러도 빈 화면이라 넣지 않는다.
 */
function 주제줄(현재){
  var 목록=(자료().topics||[]).filter(function(x){return (x.records||[]).length;});
  if(목록.length<2) return '';
  목록=목록.slice().sort(function(a,b){return String(a.label).localeCompare(String(b.label),'ko');});
  var 칩=목록.map(function(x){
    var on = x.id===현재.id;
    return '<button type="button" class="tswitch'+(on?' on':'')+'" data-tswitch="'+esc(x.id)+'"'+(on?' aria-current="true"':'')+'>'
      + esc(x.label) + '<i>' + (x.records||[]).length + '</i></button>';
  }).join('');
  return '<nav class="tswitch-bar" aria-label="다른 주제로 바로 가기">'+칩+'</nav>';
}

/* 갈래로 좁히기 (5.4).
 * 「계약·입찰」 230건은 서로 무관한 계약 예닐곱 건이 날짜순으로 섞인 목록이다.
 * 새 어휘를 만들지 않고, 이 안건들이 **이미 걸려 있는 다른 주제**로 좁힌다(98%가 걸려 있다).
 * 고른 갈래는 화면 상태로만 들고 있는다 — 주소에 넣으면 뒤로가기 동작이 꼬인다. */
let 좁힘=null;
function 갈래줄(t){
  const 목록=(t.갈래||[]).filter(g=>g.count>=2);          // 1건짜리는 좁히는 의미가 없다
  if(목록.length<2) return '';                            // 나눌 것이 없으면 줄 자체를 안 만든다
  const 칩=목록.slice(0,14).map(g=>`<button type="button" class="narrow${좁힘===g.label?' on':''}" data-narrow="${esc(g.label)}">${esc(g.label)}<i>${g.count}</i></button>`).join('');
  return `<div class="search-b-narrow"><span class="nlabel">무엇에 대한 것인지로 좁히기</span>${칩}${좁힘?`<button type="button" class="narrow clear" data-narrow="">전체 보기</button>`:''}</div>`;
}
function 좁힌것(t){
  if(!좁힘) return t;
  const recs=(t.records||[]).filter(r=>(r[6]||[]).indexOf(좁힘)>=0);
  const 열쇠=new Set(recs.map(r=>r[5]+'|'+r[2]));
  return Object.assign({},t,{
    records:recs,
    current:(t.current||[]).filter(c=>열쇠.has(c.회의+'|'+c.title)),
    timeline:(t.timeline||[]).filter(e=>열쇠.has(e.회의+'|'+e.title)),
    counts:{'안건':recs.length},
    description:recs.length?`${t.label} 중 ‘${좁힘}’ ${recs.length}건`:''
  });
}
function renderB(t0,query){
  const t=좁힌것(t0);
  const layout=LAYOUTS.B||{preview:{current:3,timeline:6,records:12}};
  const p=layout.preview||{};
  const currentItems=(t.current||[]).slice(0,p.current||3);
  const timelineItems=(t.timeline||[]).slice(0,p.timeline||6);
  const recordItems=(t.records||[]).slice(0,p.records||12);
  const current=currentItems.map((c,i)=>`<button type="button" class="search-b-current" data-b-current="${i}"><div class="meta"><span class="tag current">${esc(자료().currentLabel||'현재 기준')}</span><span class="tag ${tagClass(c.tags&&c.tags[1])}">${esc(c.kind)}</span></div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></button>`).join('');
  const summary=summaryItems(t).map(x=>`<li>${esc(x)}</li>`).join('');
  const timeline=timelineItems.map((e,i)=>`<button type="button" class="search-b-event" data-b-timeline="${i}"><time>${esc(e.date)}</time><div><b>${esc(e.title)}</b><p>${esc(e.note)}</p></div></button>`).join('');
  const records=recordItems.map((r,i)=>`<button type="button" class="search-b-record" data-b-record="${i}"><span class="date">${esc(r[0])}</span><span class="kind">${esc(r[1])}</span><span class="title">${esc(r[2])}</span><span class="status">${esc(r[3])}</span></button>`).join('');
  const counts=Object.entries(t.counts||{}).map(([k,v])=>`<span>${esc(k)} ${esc(v)}</span>`).join('');
  const extraRecords=(t.records||[]).length>recordItems.length?`<div class="search-b-more">전체 ${(t.records||[]).length}건 중 ${recordItems.length}건 표시 · <button type="button" data-b-topic>주제 전체 보기</button></div>`:'';
  home.classList.add('is-hidden');view.classList.remove('is-hidden');input.value=query||t.label;
  view.innerHTML=`<div class="search-b"><button type="button" class="home-link" data-b-home>← 첫 화면으로</button><header class="search-b-head"><div><p class="search-b-kicker">주제로 모아 보기</p><h2>“${esc(query||t.label)}” 검색 결과</h2><p><b>${esc(t.label)}</b>에 얽힌 안건을 모았어. ${esc(자료().currentLabel||'현재 기준')}을 먼저 보고, 핵심 요약과 타임라인, 자료 전체 순으로 내려가.</p><div class="search-b-counts">${counts}</div></div><div class="search-compare"><button type="button" data-b-mode="A">A안</button><button type="button" class="active" data-b-mode="B">B안</button></div></header>${주제줄(t0)}${갈래줄(t0)}<section class="search-b-section"><div class="search-b-section-head"><span>1</span><div><h3>${esc(자료().currentLabel||'현재 기준')}</h3><small>${esc(자료().currentNote||'지금 적용되는 규정·계약·보험부터')}</small></div></div><div class="search-b-current-grid">${current||'<p class="search-b-empty">현재 기준 샘플이 아직 없어.</p>'}</div></section><section class="search-b-summary"><div class="search-b-section-head"><span>2</span><div><h3>핵심 요약</h3><small>검색 결과 전체를 짧게 훑기</small></div></div><ul>${summary||'<li>요약할 샘플 데이터가 아직 없어.</li>'}</ul></section><section class="search-b-section"><div class="search-b-section-head"><span>3</span><div><h3>타임라인</h3><small>과거 논의에서 최근 흐름까지</small></div></div><div class="search-b-timeline">${timeline||'<p class="search-b-empty">타임라인 샘플이 아직 없어.</p>'}</div></section><section class="search-b-section"><div class="search-b-section-head"><span>4</span><div><h3>자료 전체</h3><small>회의·규정·계약·보험 등 원자료 목록</small></div></div><div class="search-b-records">${records||'<p class="search-b-empty">관련 기록 샘플이 아직 없어.</p>'}</div>${extraRecords}</section><div class="search-b-footer"><button type="button" data-b-topic>이 주제 전체 화면 보기</button></div></div>`;
  attachBInteractions(t,t0);try{history.replaceState(null,'','#search-b-'+encodeURIComponent(t.id));}catch(e){}view.scrollIntoView({behavior:'smooth',block:'start'});
}
form.addEventListener('submit',function(e){
  if(mode!=='B')return;
  const q=input.value.trim();if(!q)return;
  const t=topicByQuery(q);if(!t)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!(t.current||[]).length&&!(t.timeline||[]).length&&!(t.records||[]).length){home.classList.add('is-hidden');view.classList.remove('is-hidden');view.innerHTML=`<button type="button" class="home-link" data-b-home>← 첫 화면으로</button><div class="empty"><b>“${esc(q)}”</b>와 연결되는 주제는 찾았지만 아직 Golden Sample 자료가 없어.</div>`;const hb=view.querySelector('[data-b-home]');if(hb)hb.onclick=showHome;return;}
  renderB(t,q);
},true);
/* 첫 화면에서 주제 이름을 눌러도 검색 결과와 **같은 화면**을 보여준다.
 * 사용자가 두 화면을 다 본 뒤 "검색해서 들어가서 보이는 화면이 더 마음에 든다"고
 * 정했다(2026-09-02). 같은 자료를 두 가지 모양으로 보여줄 이유가 없다.
 * app.js의 주제 화면은 남겨 둔다 — 이 파일이 빠져도 화면이 비지 않게.
 */
document.addEventListener('click',function(e){
  if(mode!=='B')return;
  var btn=e.target.closest&&e.target.closest('#allTopics .topic-text-btn');
  if(!btn)return;
  var t=(자료().topics||[]).find(function(x){return String(x.label).trim()===btn.textContent.trim();});
  if(!t)return;
  if(!(t.current||[]).length&&!(t.timeline||[]).length&&!(t.records||[]).length)return; // 빈 주제는 원래 안내로
  e.preventDefault();e.stopImmediatePropagation();
  input.value=t.label;
  renderB(t,t.label);
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
