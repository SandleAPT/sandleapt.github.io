(function(){
  const U=()=>window.SandleAdminUI;
  const G=()=>window.SandlePublishGuard;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.storagePolicy=function(root,store){
    const items=store.getState().items.filter(x=>!x.published);
    const summary=G()?G().summarize(items):{total:items.length,publishable:0,resident:0,private:items.length,blocked:items.length,excludedSources:0};
    const rows=items.map(item=>{
      const result=G()?G().evaluate(item):{canPublish:false,visibility:'private',reason:'정책 모듈 없음',excludedSources:0};
      return `<tr><td><b>${U().esc(item.title)}</b><small>${U().esc(item.documentType||'-')}</small></td><td>${U().visibilityBadge(result.visibility)}</td><td><span class="s4-result ${result.canPublish?'pass':'block'}">${result.canPublish?'공개 가능':'공개 제외'}</span></td><td>${U().esc(result.reason)}${result.excludedSources?`<small>원본 참조 ${result.excludedSources}건 제외</small>`:''}</td></tr>`;
    }).join('');
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">STAGE 4 · 저장·권한</p><h1>공개 파일에 넣기 전에 먼저 분리</h1><p>화면에서 감추는 방식이 아니라 공개 번들 자체를 허용 필드로 새로 만들고, resident/private 자료는 GitHub Pages 파일에서 제외해.</p></div><button class="aw-ghost" data-go="dashboard">현재 작업 홈</button></section>
      <section class="s4-store-grid"><article><span>공개 포털</span><h2>GitHub Pages</h2><p>화면 코드, 공개 메타데이터, 검색 인덱스, taxonomy와 공개 원본 참조만 둬.</p></article><article><span>회의 원본</span><h2>minutes</h2><p>기존 회의 작성·저장·PDF 흐름을 유지하고 Archive는 공개 데이터를 읽기만 해.</p></article><article><span>파일 원본</span><h2>외부 저장소</h2><p>PDF·HWP·사진·영상과 resident/private 원본을 보관해. 공개 포털에는 내부 file_id를 싣지 않아.</p></article></section>
      <section class="aw-stat-grid"><article class="aw-stat muted"><span>검사 자료</span><b>${summary.total}</b><small>현재 브라우저 검토함</small></article><article class="aw-stat muted"><span>공개 projection</span><b>${summary.publishable}</b><small>공개 발행 검사 통과</small></article><article class="aw-stat muted"><span>resident/private</span><b>${summary.resident+summary.private}</b><small>공개 번들에서 제외</small></article><article class="aw-stat muted"><span>제외 원본 참조</span><b>${summary.excludedSources}</b><small>비공개 locator 보호</small></article></section>
      <section class="aw-panel"><div class="aw-panel-head"><div><h2>현재 자료 발행 판정</h2><p>공개 등급 화면에서 값을 바꾸면 이 표의 판정도 같은 정책 함수로 다시 계산돼.</p></div><button class="aw-primary small" data-go="visibility">공개 등급 바꾸기</button></div><div class="s4-table-wrap"><table class="s4-table"><thead><tr><th>자료</th><th>등급</th><th>공개 번들</th><th>판정 근거</th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="s4-policy-grid"><article><b>public</b><span>허용 필드만 새 객체로 투영하고 공개 가능한 원본 참조만 포함</span></article><article><b>resident</b><span>실제 인증 서버가 정해질 때까지 공개 빌드·검색·본문에서 제외</span></article><article><b>private</b><span>관리자 내부 저장소에만 유지하고 모든 공개 산출물에서 제외</span></article></section>
      <section class="aw-prototype-warning"><b>현재 경계</b><span>공개 번들 제외 정책은 동작하지만 실제 입주민·관리자 로그인은 아직 없어. 인증 서비스와 resident 파일 제공 위치는 4.3의 별도 결정 항목으로 남겨뒀어.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
  };
})();
