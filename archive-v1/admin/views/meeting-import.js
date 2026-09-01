(function(){
  'use strict';
  const U=()=>window.SandleAdminUI;
  const Source=()=>window.SandleMeetingSource;
  const Adapter=()=>window.SandleMeetingAdapter;
  window.SandleAdminViews=window.SandleAdminViews||{};

  const vm={index:null,year:'',pack:null,filter:'all',query:'',selected:null,conversion:null,error:'',loading:false};

  function esc(s){return U().esc(s);}
  function short(s,n){s=String(s||'').replace(/\s+/g,' ').trim();return s.length>(n||120)?s.slice(0,n||120)+'…':s;}
  function bodyOf(record){try{return Source().bodyOf(Source().parseRecord(record));}catch(e){return '입대의';}}
  function bodyText(b){return b==='임차'?'임차인대표회의':'입주자대표회의';}

  async function bootstrap(root,store){
    if(vm.index){render(root,store);return;}
    vm.loading=true;render(root,store);
    try{
      vm.index=await Source().loadIndex(false);
      vm.year=vm.index.years[0]&&String(vm.index.years[0].year)||String(new Date().getFullYear());
      vm.pack=await Source().loadYear(vm.year,false);
      const first=(vm.pack.items||[]).find(x=>bodyOf(x)==='입대의')||(vm.pack.items||[])[0];
      if(first) selectRecord(first);
      vm.error='';
    }catch(e){vm.error=e.message||String(e);}
    vm.loading=false;render(root,store);
  }

  function selectRecord(record){
    vm.selected=record||null;vm.conversion=null;
    if(!record)return;
    try{vm.conversion=Adapter().convert(Source().parseRecord(record));vm.error='';}
    catch(e){vm.error=e.message||String(e);}
  }

  async function changeYear(root,store,year){
    vm.year=String(year);vm.loading=true;vm.selected=null;vm.conversion=null;render(root,store);
    try{
      vm.pack=await Source().loadYear(vm.year,false);
      const first=(vm.pack.items||[]).find(x=>vm.filter==='all'||bodyOf(x)===vm.filter)||(vm.pack.items||[])[0];
      if(first)selectRecord(first);vm.error='';
    }catch(e){vm.error=e.message||String(e);}
    vm.loading=false;render(root,store);
  }

  function filteredItems(){
    const q=vm.query.trim().toLowerCase();
    return ((vm.pack&&vm.pack.items)||[]).filter(x=>{
      if(vm.filter!=='all'&&bodyOf(x)!==vm.filter)return false;
      if(q&&!`${x.name||''} ${x.date||''}`.toLowerCase().includes(q))return false;
      return true;
    });
  }

  function listHtml(){
    const items=filteredItems();
    if(!items.length)return '<div class="s3-empty">조건에 맞는 회의록이 없어.</div>';
    return items.map(x=>{
      const active=vm.selected&&vm.selected.id===x.id?' active':'';
      const body=bodyOf(x);
      let count='';try{count=(Source().parseRecord(x).state.agendas||[]).length+'개 안건';}catch(e){}
      return `<button type="button" class="s3-meeting-row${active}" data-meeting="${esc(x.id)}"><span class="s3-body ${body==='임차'?'tenant':'owner'}">${body==='임차'?'임차':'입대의'}</span><span class="s3-meeting-main"><b>${esc(x.name||'회의록')}</b><small>${esc(x.date||'-')} · ${esc(count)}</small></span><span class="s3-arrow">›</span></button>`;
    }).join('');
  }

  function documentHtml(conv){
    const d=conv.document;
    return `<article class="s3-document-card"><div class="s3-card-kicker">DOCUMENT · 회의 1건</div><h3>${esc(d.title)}</h3><div class="s3-meta-grid"><div><span>날짜</span><b>${esc(d.document_date||'-')}</b></div><div><span>회의체</span><b>${esc(d.organizations[0])}</b></div><div><span>범위</span><b>${esc(d.scope)}</b></div><div><span>안건</span><b>${d.fragment_count}개 Fragment</b></div><div><span>참석</span><b>${d.meeting.attendee_count}명</b></div><div><span>원본</span><b>minutes · ${esc(d.source.id)}</b></div></div></article>`;
  }

  function fragmentsHtml(conv){
    if(!conv.fragments.length)return '<div class="s3-empty">변환할 안건이 없어.</div>';
    return conv.fragments.map(f=>{
      const inferred=f.topic_source==='inferred';
      const v=f.vote||{};
      return `<details class="s3-fragment"><summary><span class="s3-seq">${f.sequence}</span><span class="s3-frag-title"><b>${esc(f.title)}</b><small>${f.topics.map(t=>esc(t)).join(' · ')}</small></span><span class="s3-topic-source ${inferred?'inferred':'stored'}">${inferred?'주제 후보':'저장 태그'}</span></summary><div class="s3-frag-body"><div class="s3-block"><span>논의 내용</span><p>${esc(f.summary||'기록 없음')}</p></div><div class="s3-block decision"><span>의결사항</span><p>${esc(f.decision||'기록 없음')}</p></div>${f.followup?`<div class="s3-block"><span>후속조치</span><p>${esc(f.followup)}</p></div>`:''}<div class="s3-frag-foot"><span>표결: 찬성 ${v.for||0} · 반대 ${v.against||0} · 기권 ${v.abstain||0}</span><span>관계: part_of → 회의 Document · explicit</span></div></div></details>`;
    }).join('');
  }

  function selectedHtml(){
    if(!vm.selected||!vm.conversion)return '<div class="s3-empty large">왼쪽에서 회의록을 선택하면 원본 구조와 Archive 변환 결과를 함께 보여줄게.</div>';
    const conv=vm.conversion, d=conv.document;
    const sourceAgendas=(conv.sourceState.agendas||[]);
    const warnings=conv.warnings.length?`<div class="s3-warning"><b>확인할 것</b>${conv.warnings.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:'';
    return `<section class="s3-selected-head"><div><p class="admin-kicker">SELECTED MEETING</p><h2>${esc(d.title)}</h2><p>${esc(d.document_date)} · ${esc(d.organizations[0])} · 기존 회의록 ${sourceAgendas.length}개 안건을 읽었어.</p></div><div class="s3-selected-actions"><a class="aw-ghost s3-link" href="/minutes/#archiveView" target="_blank" rel="noopener">원본 회의록 앱 ↗</a><a class="aw-ghost s3-link" href="/minutes/#previewView" target="_blank" rel="noopener">기존 출력 화면 ↗</a></div></section>${warnings}<div class="s3-compare"><section class="aw-panel s3-source"><div class="aw-panel-head"><div><p class="admin-kicker">SOURCE</p><h2>지금 있는 회의록</h2><p>원본 데이터는 수정하지 않고 읽기만 해.</p></div><span>${sourceAgendas.length}개 안건</span></div><div class="s3-source-list">${sourceAgendas.map((a,i)=>`<div><b>${i+1}. ${esc(a.title||'제목 없음')}</b><span>${esc(short(a.summary,90)||'내용 없음')}</span></div>`).join('')}</div></section><section class="aw-panel s3-result"><div class="aw-panel-head"><div><p class="admin-kicker">ARCHIVE DRAFT</p><h2>보기 좋게 다시 조립</h2><p>회의 전체는 Document, 안건은 각각 Fragment로 나눠 검색·주제별 보기에서 재사용해.</p></div></div>${documentHtml(conv)}</section></div><section class="aw-panel"><div class="aw-panel-head"><div><p class="admin-kicker">FRAGMENTS</p><h2>안건별로 정리된 결과</h2><p>논의·의결·후속조치를 원문에서 그대로 가져오고, 주제는 기존 저장 태그를 우선해. 태그가 없을 때만 후보라고 표시해.</p></div><button type="button" class="aw-primary" data-send-review>안건 ${conv.fragments.length}개를 분류 검토로 보내기</button></div><div class="s3-fragments">${fragmentsHtml(conv)}</div></section><section class="s3-output-rule"><div><b>1페이지 회의록은 그대로 둬.</b><span>Archive가 회의록 출력물을 새로 만들거나 원문을 줄이지 않아. 기존 minutes의 미리보기·PDF가 공식 출력 역할을 계속하고, Archive는 그 내용을 찾기 좋게 재배치하는 층만 추가해.</span></div><div><b>중복 입력도 없어.</b><span>회의록을 Archive용으로 다시 작성하지 않고 이미 저장된 회의 데이터를 adapter가 읽어 Document/Fragment 초안을 만든다.</span></div></section>`;
  }

  function render(root,store){
    if(!vm.index&&!vm.loading&&!vm.error){bootstrap(root,store);return;}
    const years=(vm.index&&vm.index.years)||[];
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">STAGE 3 · 회의록 → ARCHIVE</p><h1>이미 만든 회의록을 다시 쓰지 않고 정리</h1><p>현재 `/minutes/`의 실제 정적 회의록 데이터를 읽어서 회의 전체와 안건을 Archive 구조로 나눠 보여주는 단계야. 기존 작성·저장·PDF는 건드리지 않아.</p></div><button class="aw-ghost" data-go="dashboard">관리 홈</button></section><section class="s3-stepbar"><span class="done"><b>3.1</b>현행 구조 확인</span><i>→</i><span class="done"><b>3.2</b>필드 매핑</span><i>→</i><span class="active"><b>3.3~3.5</b>실제 회의 변환</span><i>→</i><span><b>3.6</b>전체 검토</span></section>${vm.error?`<div class="s3-error">${esc(vm.error)}</div>`:''}<div class="s3-workspace"><aside class="aw-panel s3-picker"><div class="s3-picker-controls"><label><span>연도</span><select data-year>${years.map(y=>`<option value="${esc(y.year)}" ${String(y.year)===vm.year?'selected':''}>${esc(y.year)}년 · ${esc(y.count)}건</option>`).join('')}</select></label><label><span>회의체</span><select data-filter><option value="all">전체</option><option value="입대의" ${vm.filter==='입대의'?'selected':''}>입주자대표회의</option><option value="임차" ${vm.filter==='임차'?'selected':''}>임차인대표회의</option></select></label></div><label class="s3-search"><span>⌕</span><input data-query placeholder="회의명 검색" value="${esc(vm.query)}"></label><div class="s3-list">${vm.loading?'<div class="s3-loading">회의록 불러오는 중…</div>':listHtml()}</div></aside><main class="s3-detail">${selectedHtml()}</main></div>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    const year=root.querySelector('[data-year]');if(year)year.onchange=()=>changeYear(root,store,year.value);
    const filter=root.querySelector('[data-filter]');if(filter)filter.onchange=()=>{vm.filter=filter.value;const first=filteredItems()[0];selectRecord(first||null);render(root,store);};
    const query=root.querySelector('[data-query]');if(query)query.oninput=()=>{vm.query=query.value;const list=root.querySelector('.s3-list');if(list)list.innerHTML=listHtml();attachList(root,store);};
    attachList(root,store);
    const send=root.querySelector('[data-send-review]');if(send&&vm.conversion)send.onclick=()=>{
      const drafts=Adapter().toAdminDrafts(vm.conversion);
      const res=store.addImportedDrafts(drafts);
      U().toast(res.added?`${res.added}개 안건을 분류 검토로 보냈어.`:'이미 이 회의 안건이 검토함에 있어.');
      U().nav('classification');
    };
  }

  function attachList(root,store){
    root.querySelectorAll('[data-meeting]').forEach(b=>b.onclick=()=>{
      const item=((vm.pack&&vm.pack.items)||[]).find(x=>x.id===b.dataset.meeting);selectRecord(item||null);render(root,store);
    });
  }

  window.SandleAdminViews.meetingImport=function(root,store){bootstrap(root,store);};
})();
