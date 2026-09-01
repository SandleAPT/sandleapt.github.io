(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.dashboard=function(root,store){
    const c=store.getCounts();
    root.innerHTML=`
      <section class="aw-page-head"><div><p class="admin-kicker">STAGE 2 · 전체 흐름</p><h1>관리 작업대</h1><p>자료를 직접 데이터베이스처럼 관리하기보다, 들어온 초안을 확인하고 애매한 것만 처리하는 흐름을 한 번에 보는 화면이야.</p></div><button class="aw-ghost" data-reset>샘플 초기화</button></section>
      <section class="aw-stat-grid">
        <button class="aw-stat" data-go="classification"><span>분류 검토</span><b>${c.classification}</b><small>주제·조직·현행상태 확인</small></button>
        <button class="aw-stat" data-go="relations"><span>관계 검토</span><b>${c.relations}</b><small>기록 간 연결 근거 확인</small></button>
        <button class="aw-stat" data-go="publish"><span>발행 대기</span><b>${c.publish}</b><small>공개등급·최종 미리보기</small></button>
        <article class="aw-stat muted"><span>미리보기 발행</span><b>${c.published}</b><small>실제 저장소에는 쓰지 않음</small></article>
      </section>
      <section class="aw-panel">
        <div class="aw-panel-head"><div><p class="admin-kicker">WORKFLOW</p><h2>2단계에서 확인할 전체 흐름</h2></div><span>입력은 한 번 · 애매한 것만 검토</span></div>
        <div class="aw-flow">
          <button data-go="register"><b>1</b><span>새 자료</span><small>AI 초안 시뮬레이션</small></button><i>→</i>
          <button data-go="classification"><b>2</b><span>분류 검토</span><small>주제·조직·상태</small></button><i>→</i>
          <button data-go="relations"><b>3</b><span>관계 검토</span><small>근거 있는 연결만</small></button><i>→</i>
          <button data-go="publish"><b>4</b><span>발행 대기</span><small>공개범위 확인</small></button>
        </div>
        <div class="aw-split-note"><strong>회의는 별도 입력하지 않아.</strong><span>회의 작성은 기존 회의록 화면을 계속 쓰고, 3단계에서 저장된 회의 데이터를 Archive 초안으로 변환하는 연결을 붙일 예정이야.</span><button data-go="meeting">회의 작성 연결 보기</button></div>
      </section>
      <section class="aw-grid-2">
        <article class="aw-panel compact"><p class="admin-kicker">2.2</p><h3>AI로 자료 추가</h3><p>실제 운영에서는 GPT/Claude가 자료를 읽고 초안을 넣는 흐름을 목표로 해. 여기서는 입력→분석 결과→검토함 이동을 화면에서 시뮬레이션해볼 수 있어.</p><button class="aw-primary" data-go="register">새 자료 흐름 보기</button></article>
        <article class="aw-panel compact"><p class="admin-kicker">2.3</p><h3>공개범위는 자료마다</h3><div class="aw-visibility-row">${U().visibilityBadge('public')}${U().visibilityBadge('resident')}${U().visibilityBadge('private')}</div><p>resident/private는 지금 메타데이터와 화면 흐름만 시험해. 실제 자료는 인증 구조가 생기기 전 공개 GitHub Pages에 싣지 않는 원칙이야.</p></article>
      </section>
      <section class="aw-prototype-warning"><b>2단계 프로토타입</b><span>이 화면에서 누르는 승인·발행은 브라우저 메모리 안에서만 움직이고 새로고침하면 샘플 상태로 돌아와. 실제 GitHub/Drive 쓰기와 관리자 인증은 아직 연결하지 않았어.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelector('[data-reset]').onclick=()=>{store.reset();U().toast('샘플 상태를 초기화했어.');};
  };
})();