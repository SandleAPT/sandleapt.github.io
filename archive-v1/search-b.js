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
// 단추를 찾을 때도 글자가 아니라 id로 (위 2026-09-02 사고와 같은 이유).
function openTopic(t){const buttons=[...document.querySelectorAll('#allTopics .topic-text-btn')];const b=buttons.find(x=>x.dataset.topicId===t.id)||buttons.find(x=>x.textContent.trim()===String(t.label).trim());if(b){b.click();return;}location.hash='#topic-'+encodeURIComponent(t.id);location.reload();}
/* 원문 링크(2026-09-02): Archive는 회의록을 복제하지 않고 찾아가게 하는 것이 목적이라,
 * 안건을 누르면 회의록 앱의 그 회의를 연다. 링크가 없으면 예전 안내를 그대로 둔다. */
/* 안건 상세 팝업.
 * 사용자 지적(2026-09-02): 내용이 잘리고 줄바꿈이 안 먹는다.
 * 팝업을 열었다는 건 **읽으려고 연 것**이라 자를 이유가 없다. 전문을 그대로 보여준다.
 * 줄바꿈은 CSS(white-space: pre-wrap)로 살린다 — 회의록 본문은 항목이 줄로 나뉜 글이라
 * 줄을 뭉개면 한 덩어리가 되어 읽기가 나빠진다.
 * 논의·의결·후속조치는 뜻이 다른 칸이라 나눠서 보여준다. */
function openDetail(meta,title,note,원문,회의,본문){
  const 발 = 원문
    ? `<div class="detail-foot"><a class="detail-open" href="${esc(원문)}">회의록 원문 열기 →</a>${회의?`<small>${esc(회의)}</small>`:''}</div>`
    : `<div class="detail-foot">이 항목은 아직 원문과 연결되지 않았습니다.</div>`;
  const 몸통 = (본문&&본문.length)
    ? `<div class="detail-body">${본문.map(c=>`<section><h3>${esc(c.이름)}</h3><p>${esc(c.글)}</p></section>`).join('')}</div>`
    : `<p>${esc(note||'세부 설명이 아직 연결되지 않았습니다.')}</p>`;
  const 회의줄 = (본문&&본문.length&&회의) ? `<p class="detail-where">${esc(회의)}</p>` : '';
  detailContent.innerHTML=`<div class="detail-meta">${meta.map(v=>`<span>${esc(v)}</span>`).join('')}</div><h2>${esc(title)}</h2>${회의줄}${몸통}${발}`;
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
/* 기계가 셀 수 있는 것만 (5.5f).
 * 요약 자리의 본체는 **사람이 쓴 주제 흐름 요약**이고, 이것은 그 아래 붙는 작은 줄이다.
 * 예전에는 이게 「핵심 요약」 행세를 했다. 건수와 기간은 사실이지만 요약은 아니다.
 * 「최근 기록 2건」·「연결된 관련 기록 N건」 줄은 뺐다 — 그 두 칸(최근·자료 전체)이 화면에서 사라졌다. */
function summaryItems(t){const out=[];if(t.description)out.push(t.description);
if((t.timeline||[]).length){const e=t.timeline.reduce((a,b)=>String(b.date||'')>String(a.date||'')?b:a);out.push(`가장 최근: ${e.date} · ${e.title}`);}
return out.slice(0,2);}
function attachBInteractions(t,t0){
  const homeBtn=view.querySelector('[data-b-home]');if(homeBtn)homeBtn.onclick=showHome;
  /* 갈래로 좁히기 (5.4). 다시 그릴 때는 좁히지 않은 원본(t0)을 넘긴다 —
     좁혀진 것을 또 좁히면 갈래 칩이 사라져 되돌릴 방법이 없어진다. */
  view.querySelectorAll('[data-narrow]').forEach(b=>b.onclick=()=>{
    const v=b.dataset.narrow||'';
    좁힘=(v&&v!==좁힘)?v:null;
    접은연도.clear();   // 좁히면 남는 해가 달라진다 — 전부 다시 편다
    제자리로(b,()=>renderB(t0||t,input.value||(t0||t).label,true));
  });
  view.querySelectorAll('[data-b-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.bMode;form.requestSubmit();});
  // 주제 전환 — 첫 화면으로 돌아가지 않고 바로 옆 주제로 간다.
  view.querySelectorAll('[data-tswitch]').forEach(b=>b.onclick=()=>{
    const n=(자료().topics||[]).find(x=>x.id===b.dataset.tswitch);
    if(!n)return;
    좁힘=null;          // 다른 주제로 가면 좁힘은 푼다 — 그 주제엔 없는 갈래일 수 있다
    접은연도.clear();   // 접어둔 해도 초기화 — 그 주제엔 없는 해일 수 있다
    input.value=n.label;
    renderB(n,n.label);
    // 누른 주제가 화면 밖에 있으면 그 자리로 스크롤해 둔다.
    const cur=view.querySelector('.tswitch.on');
    if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'nearest',inline:'center'});
  });
  view.querySelectorAll('[data-b-topic]').forEach(b=>b.onclick=()=>openTopic(t));
  view.querySelectorAll('[data-b-current]').forEach(b=>{b.onclick=()=>{const c=t.current[+b.dataset.bCurrent];openDetail([자료().currentLabel||'현재 기준',c.kind],c.title,c.note,c.원문,c.회의,c.본문);};});
  // 펼친 해의 항목만 번호를 받는다 — 화면에 그린 순서와 같은 배열을 써야 엉뚱한 안건이 안 열린다.
  const 보이는타임라인=펼친항목(t.timeline);
  view.querySelectorAll('[data-b-timeline]').forEach(b=>{b.onclick=()=>{const e=보이는타임라인[+b.dataset.bTimeline];if(!e)return;openDetail([e.date,'타임라인'],e.title,e.note,e.원문,e.회의,e.본문);};});
  // 연도 머리를 누르면 그 해를 펼친다(한 번에 한 해).
  view.querySelectorAll('[data-year]').forEach(b=>b.onclick=()=>{
    if(접은연도.has(b.dataset.year))접은연도.delete(b.dataset.year);else 접은연도.add(b.dataset.year);
    제자리로(b,()=>renderB(t0||t,input.value||(t0||t).label,true));
  });
  view.querySelectorAll('[data-b-record]').forEach(b=>{b.onclick=()=>{const r=t.records[+b.dataset.bRecord];openDetail([r[0],r[1],r[3]],r[2],r[5]?('회의: '+r[5]):'',r[4],r[5],r[7]);};});
}
/* 주제 전환 줄 (사용자 요청 2026-09-02)
 *   "선택해서 들어갔을 때 다시 뒤로 가서 고르기 귀찮으니
 *    제목 옆에 다른 카테고리를 주르르륵 붙이거나, 선택된 것만 큰 글씨로 해달라."
 * 둘 다 한다 — 전부 늘어놓되 지금 보는 것만 크게. 뒤로 가지 않고 옆으로 옮겨 다닌다.
 * 기록이 없는 주제는 눌러도 빈 화면이라 넣지 않는다.
 */
function 주제줄(현재){
  // 회의체를 고르면 그 회의체 건수로 세고, 없는 주제는 뺀다(첫 화면과 같은 규칙).
  var 셈=function(x){ var B=window.SandleBody; return B&&B.건수?B.건수(x):(x.records||[]).length; };
  var 목록=(자료().topics||[]).filter(function(x){return 셈(x)>0;});
  if(목록.length<2) return '';
  /* 첫 화면과 **같은 순서**로 (사용자 지적 2026-09-02: 메인은 안건 수 순인데 들어오면 갑자기 가나다순).
     같은 목록이 화면마다 다른 순서로 나오면 눈이 기억한 자리를 잃는다. 둘 다 안건 수 순으로 맞춘다. */
  /* 첫 화면과 **같은 순서**: 마지막으로 다뤄진 때가 최근인 주제부터 (사용자 제안 2026-09-02).
     건수 순으로 두면 위쪽이 몇 해 전에 끝난 주제로 채워져 "지금 무슨 일이 있나"가 안 보인다. */
  var 최신=function(x){ var B=window.SandleBody; return B&&B.최신?B.최신(x):((x.records||[])[0]||[])[0]||''; };
  목록=목록.slice().sort(function(a,b){
    return String(최신(b)).localeCompare(String(최신(a))) || 셈(b)-셈(a);
  });
  var 칩=목록.map(function(x){
    var on = x.id===현재.id;
    return '<button type="button" class="tswitch'+(on?' on':'')+'" data-tswitch="'+esc(x.id)+'"'+(on?' aria-current="true"':'')+'>'
      + esc(x.label) + '<i>' + 셈(x) + '</i></button>';
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
  /* 숫자가 헷갈린다는 지적(2026-09-02): 「관리규약」을 열고 갈래에서 LH·관리이관 3을 보고
   * "LH·관리이관이 3건뿐"으로 읽었다. 실은 **두 주제에 함께 걸린 수**다(LH·관리이관 자체는 36건).
   * 바로 위 주제 전환 줄에 같은 이름이 36으로 적혀 있으니 오해할 수밖에 없다.
   * 그래서 ① 줄 이름에 지금 주제를 넣고 ② 숫자가 무엇인지 한 줄로 밝힌다. */
  const 칩=목록.slice(0,14).map(g=>`<button type="button" class="narrow${좁힘===g.label?' on':''}" data-narrow="${esc(g.label)}" title="${esc(t.label)}이면서 ${esc(g.label)}이기도 한 안건 ${g.count}건">${esc(g.label)}<i>${g.count}</i></button>`).join('');
  return `<div class="search-b-narrow"><p class="nlabel"><b>「${esc(t.label)}」 안에서 다시 좁히기</b><span>숫자는 두 주제에 함께 걸린 안건 수입니다. 그 주제 전체 건수와는 다릅니다.</span></p><div class="nchips">${칩}${좁힘?`<button type="button" class="narrow clear" data-narrow="">좁히기 해제</button>`:''}</div></div>`;
}
/* 회의체 고르기와 갈래 좁히기를 **함께** 건다 (사용자 요청 2026-09-02).
 * 한쪽만 걸면 첫 화면 목록에는 12건이라 적혀 있는데 들어가면 다른 수가 나온다. */
function 회의체거름(t){
  const B=window.SandleBody;
  if(!B||!B.값) return t;
  const recs=(t.records||[]).filter(r=>B.맞나(r[1]));
  const 열쇠=new Set(recs.map(r=>r[5]+'|'+r[2]));
  return Object.assign({},t,{
    records:recs,
    current:(t.current||[]).filter(c=>열쇠.has(c.회의+'|'+c.title)),
    timeline:(t.timeline||[]).filter(e=>열쇠.has(e.회의+'|'+e.title)),
    counts:{'안건':recs.length}
  });
}
function 좁힌것(t0){
  const t=회의체거름(t0);
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
/* 사람이 쓴 주제 흐름 요약 (5.5a).
 * 회의록 앱이 이미 갖고 있던 것을 그대로 보여준다. 기계가 만든 「N건 · 기간」보다 이것이 먼저다.
 * 아직 안 받았으면 자리만 비워 두고, 도착하면 그 자리에 끼워 넣는다(화면 전체를 다시 그리지 않는다). */
let 요약표=null;
function 요약HTML(label, 기계요약){
  const S=window.SandleTopicSummary;
  const r=(S&&요약표)?S.파싱((요약표[label]||{}).text):null;
  /* 사람이 쓴 요약이 **핵심 요약 자리의 본체**다 (5.5f, 사용자 지적 2026-09-02:
   * *"핵심요약 여기가 정말 중요한데 회의록 주제별 보기의 주제 흐름 요약만큼 딥하게"*).
   * 예전에는 기계가 만든 「29건 · 2016.06 ~ 2026.08」이 요약 자리를 차지하고
   * 사람이 쓴 것은 그 위에 따로 떠 있었다. 자리를 바꾼다.
   * 요점은 **자르지 않는다** — 깊이를 원한다고 했다. 기계 문구는 아래 작은 줄로 내린다. */
  if(!r){
    return 기계요약?`<ul class="tb-fallback">${기계요약}</ul>`:'<p class="search-b-empty">이 주제는 아직 요약이 없습니다.</p>';
  }
  /* 「지금」을 뱃지로 글 앞에 붙였더니 그 줄만 오른쪽으로 밀려 아래 목록과 어긋났다
   * (2026-09-02 사용자 지적: "왼쪽으로 쏠리고 정렬도 안되어 있잖아").
   * 이름표를 윗줄로 올려 **모든 줄이 같은 선에서 시작**하게 한다. */
  const 요점=r.요점.map(x=>`<li>${esc(x)}</li>`).join('');
  /* 「시간 흐름」을 안 보여줘서 요약이 최근 이야기만 남았다 — 주차는 83건이 2016~2026인데
   * 요점 3줄이 25~26년뿐이었다("제대로 요약된 것도 아니고"). 회의록 앱 요약에는
   * 2016년부터 41줄이 들어 있었다. **자르지 않고 전부** 보여준다. */
  const 흐름=r.흐름.map(x=>`<li>${esc(x)}</li>`).join('');
  return (r.현재상태?`<p class="tb-label">지금</p><p class="tb-now">${esc(r.현재상태)}</p>`:'')
    +(요점?`<p class="tb-label">요점</p><ul class="tb-points">${요점}</ul>`:'')
    +(흐름?`<p class="tb-label">지나온 흐름 <i>${r.흐름.length}</i></p><ul class="tb-flow">${흐름}</ul>`:'')
    +(기계요약?`<ul class="tb-meta">${기계요약}</ul>`:'')
    +`<p class="tb-src">회의록 앱의 주제 흐름 요약에서 가져왔습니다</p>`;
}
function 요약채우기(label){
  const S=window.SandleTopicSummary;
  if(!S||요약표) return;
  S.불러오기(window.fetch.bind(window)).then(function(m){
    if(!m) return;
    요약표=m;
    const 자리=view.querySelector('[data-brief]');
    if(자리) 자리.innerHTML=요약HTML(label, 자리.dataset.machine||'');
  }).catch(function(){});
}
/* 타임라인을 연도별로 접는다 (5.5d).
 *
 * 사용자 지적에서 나왔다 — 회의록 앱 ③은 최근 연도만 펼치고 옛 연도는
 * `09 정기 · 07 정기 · 06 정기` 한 줄로 접어서 **11년치가 한 화면에 들어온다.**
 * Archive는 최신 6건만 자르고 나머지를 숨겨서 전체 모양이 안 보였다(게다가 자료 자체가 40건에서 잘렸다).
 *
 * 규칙: 가장 최근 연도는 펼치고 나머지는 접는다. 접힌 해도 **몇 건인지와 몇 월인지**는 보여준다 —
 * 접는 것과 숨기는 것은 다르다. 눌러서 펼칠 수 있다.
 */
/* 2026-09-02 사용자 재지적: *"클릭하지 않아도 다 열린채로 보이는 게 좋을거 같구"*.
 * 그래서 **기본은 전부 펼침**으로 바꿨다. 연도 머리는 구분선과 건수 역할로 남기고,
 * 길다고 느끼면 눌러서 접을 수 있게 한다(접힌 해도 몇 월인지는 남는다).
 * 처음에 한 해만 펼친 것은 내 판단이었고, 사용자는 한눈에 다 보는 쪽을 원했다. */
let 접은연도=new Set();
function 연도(ym){ return String(ym||'').slice(0,4); }
function 타임라인HTML(items){
  if(!items||!items.length) return '';
  const 해별=[];
  items.forEach(e=>{
    const y=연도(e.date); if(!y) return;
    let g=해별.find(x=>x.해===y); if(!g){g={해:y,항목:[]};해별.push(g);}
    g.항목.push(e);
  });
  해별.sort((a,b)=>b.해.localeCompare(a.해));
  let n=0;
  return 해별.map(g=>{
    const 펼침=!접은연도.has(g.해);
    const 머리=`<button type="button" class="tl-year${펼침?' open':''}" data-year="${esc(g.해)}"><b>${esc(g.해)}년</b><i>${g.항목.length}건</i><span class="tl-caret">${펼침?'▾':'▸'}</span></button>`;
    if(!펼침){
      // 접힌 해 — 몇 월에 무엇이 있었는지는 남긴다. 숨기는 게 아니라 접는 것이다.
      const 달=g.항목.map(e=>esc(String(e.date).slice(5))).join(' · ');
      return `<div class="tl-group">${머리}<div class="tl-months">${달}</div></div>`;
    }
    const 줄=g.항목.map(e=>{
      const i=n++;
      /* 회의체를 붙인다 (5.4 ②). 입대의와 임차가 같은 사안을 각각 다루면 목록에 같은 제목이
         두 번 뜨는데, 어느 쪽 회의인지 안 보이면 그냥 중복으로 읽힌다. 합치지는 않는다 —
         서로 다른 회의에서 따로 정한 것이라 합치면 사실이 달라진다. */
      const 몸=e.회의체?`<span class="tl-body ${e.회의체==='임차'?'t':'i'}">${esc(e.회의체)}</span>`:'';
      /* 굵직한 것 짚기 (5.5e). 「중요」라고 뭉뚱그리지 않고 **왜 짚었는지**를 적는다 —
         무엇이 중요한지는 사람마다 다르지만 「의견 갈림」·「재심의」는 사실이다. */
      const 짚=(e.짚음||[]).map(k=>`<em class="tl-flag">${esc(k)}</em>`).join('');
      return `<button type="button" class="search-b-event${짚?' big':''}" data-b-timeline="${i}"><time>${esc(e.date)}${몸}</time><div><b>${짚}${esc(e.title)}</b><p>${esc(e.note)}</p></div></button>`;
    }).join('');
    return `<div class="tl-group">${머리}<div class="tl-items">${줄}</div></div>`;
  }).join('');
}
/* 펼친 해의 항목만 data-b-timeline 번호를 받으므로, 클릭 처리도 같은 순서로 맞춰야 한다.
   화면과 다른 배열을 쓰면 엉뚱한 안건이 열린다. */
function 펼친항목(items){
  return (items||[]).filter(e=>{const y=연도(e.date);return y&&!접은연도.has(y);});
}
/* 제자리에서 다시 그리기 (2026-09-02 사용자 지적).
 * 연도나 갈래를 누르면 화면이 **맨 위로 튀어 올랐다** — 다시 그릴 때마다 view.scrollIntoView 를
 * 부르기 때문이다. 주제를 처음 열 때는 맞지만, 같은 화면 안에서 접었다 폈다 할 때는 아니다.
 *
 * 단순히 스크롤 위치를 되돌리는 것으로는 부족하다. 옛 해가 접히면 위쪽 내용이 줄어들어
 * 누른 자리가 위로 밀린다. 그래서 **누른 단추가 화면에서 있던 높이에 그대로 있도록** 맞춘다.
 */
function 제자리로(누른것, 다시그리기){
  var 전 = 누른것 ? 누른것.getBoundingClientRect().top : 0;
  var 열쇠 = 누른것 ? (누른것.dataset.year!==undefined?'[data-year="'+누른것.dataset.year+'"]':'[data-narrow="'+(누른것.dataset.narrow||'')+'"]') : '';
  다시그리기();
  if(!열쇠) return;
  var 새것 = view.querySelector(열쇠);
  if(새것) window.scrollBy(0, 새것.getBoundingClientRect().top - 전);
}
function renderB(t0,query,제자리){
  지금주제=t0;                      // 회의체를 바꿀 때 이 주제를 다시 그리려고 기억해 둔다
  const t=좁힌것(t0);
  const layout=LAYOUTS.B||{preview:{current:3,timeline:6,records:12}};
  const p=layout.preview||{};
  /* 「최근」 칸은 뺐다 (사용자 지적 2026-09-02: *"1최근은 3타임라인 맨 앞에 등장하니 최근은 사라져도 될거 같아"*).
     맞다. 타임라인 첫 줄이 곧 가장 최근 안건이라 같은 것을 두 번 보여주고 있었다.
     t.current 자료 자체는 남긴다 — 갈래로 좁힐 때 함께 걸러야 한다. */
  const timelineItems=t.timeline||[];   // 연도별로 접으므로 여기서 자르지 않는다 (5.5d)
  const summary=summaryItems(t).map(x=>`<li>${esc(x)}</li>`).join('');
  const timeline=타임라인HTML(timelineItems);
  /* 「자료 전체」 칸은 뺐다 (사용자 지적 2026-09-02: *"타임라인이나 자료 전체나 표기만 다를 뿐
   * 똑같아 보여서 자료 전체는 지워도 될듯?"*). 맞다. 타임라인이 40건에서 잘리던 동안에는
   * 「자료 전체」가 나머지를 맡았지만, 5.5d에서 타임라인이 **전량을 연도별로** 보여주게 되면서
   * 같은 것을 두 번 늘어놓게 됐다.
   * records 자료 자체는 남긴다 — 갈래로 좁히기와 건수 세기가 그것을 쓴다.
   * 규약·계약·보험처럼 **회의록이 아닌 자료**가 들어오면 그때 다시 만든다(6단계). 그 전엔 중복일 뿐이다. */
  const counts=Object.entries(t.counts||{}).map(([k,v])=>`<span>${esc(k)} ${esc(v)}</span>`).join('');
  home.classList.add('is-hidden');view.classList.remove('is-hidden');input.value=query||t.label;
  view.innerHTML=`<div class="search-b"><button type="button" class="home-link" data-b-home>← 첫 화면으로</button><header class="search-b-head"><div><p class="search-b-kicker">주제로 모아 보기</p><h2>${esc(query||t.label)}</h2><p><b>${esc(t.label)}</b>에 관한 안건을 모았습니다. ${esc(자료().currentLabel||'현재 기준')}을 먼저 보고, 핵심 요약과 타임라인 순으로 이어집니다.</p><div class="search-b-counts">${counts}</div></div><div class="search-compare"><button type="button" data-b-mode="A">A안</button><button type="button" class="active" data-b-mode="B">B안</button></div></header>${주제줄(t0)}${갈래줄(t0)}<section class="search-b-summary"><div class="search-b-section-head"><span>1</span><div><h3>핵심 요약</h3><small>지금 어떤 상태이고, 어떻게 여기까지 왔나</small></div></div><div data-brief data-machine="${esc(summary)}">${요약HTML(t0.label, summary)}</div></section><section class="search-b-section"><div class="search-b-section-head"><span>2</span><div><h3>타임라인</h3><small>연도별 · 최근 해부터</small></div></div><div class="search-b-timeline">${timeline||'<p class="search-b-empty">아직 기록이 없습니다.</p>'}</div></section><div class="search-b-footer"><button type="button" data-b-topic>이 주제 전체 화면 보기</button></div></div>`;
  요약채우기(t0.label);
  attachBInteractions(t,t0);try{history.replaceState(null,'','#search-b-'+encodeURIComponent(t.id));}catch(e){}
  // 주제를 처음 열 때만 위로 올린다. 같은 화면에서 접었다 폈다 할 때는 그 자리에 둔다.
  if(!제자리)view.scrollIntoView({behavior:'smooth',block:'start'});
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
/* 회의체를 바꾸면 열려 있는 주제 화면도 같이 다시 그린다.
   안 그러면 위에서는 임차를 골랐는데 아래 목록은 전체인 채로 남는다. */
let 지금주제=null;
document.addEventListener('sandle:body',function(){
  if(!지금주제||view.classList.contains('is-hidden'))return;
  좁힘=null; 접은연도.clear();
  var 갱신=(자료().topics||[]).find(function(x){return x.id===지금주제.id;})||지금주제;
  renderB(갱신,갱신.label,true);
});
document.addEventListener('click',function(e){
  if(mode!=='B')return;
  var btn=e.target.closest&&e.target.closest('#allTopics .topic-text-btn');
  if(!btn)return;
  /* id로 찾는다. 예전에는 단추 글자로 찾았는데, 이름 옆에 건수를 붙이자
     "승강기" ≠ "승강기61"이 되어 이 연결이 조용히 끊겼다(2026-09-02).
     글자는 화면 사정으로 언제든 바뀐다 — 잇는 것은 id여야 한다. */
  var t=(자료().topics||[]).find(function(x){return x.id===btn.dataset.topicId;})
     || (자료().topics||[]).find(function(x){return String(x.label).trim()===btn.textContent.trim();});
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
