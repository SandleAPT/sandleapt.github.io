(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.dashboard=function(root,store){
    const c=store.getCounts();
    root.innerHTML=`
      <section class="aw-page-head"><div><p class="admin-kicker">2.5 · 전체 검토</p><h1>2.2 · 2.3 · 2.4를 여기서 각각 테스트</h1><p>앞 화면은 작업대 자리만 보여서 실제로 뭘 눌러봐야 하는지 분명하지 않았어. 이번 화면에서는 각 소단계가 독립적으로 열리고, 마지막에는 하나의 자료가 등록→검토→발행까지 이어지는지 볼 수 있어.</p></div><button class="aw-ghost" data-reset>샘플 초기화</button></section>
      <section class="aw-grid-2">
        <article class="aw-panel compact"><p class="admin-kicker">2.2 · TEST</p><h3>AI 새 자료 등록</h3><p>예시 자료를 자동으로 채우고 ‘AI 초안 만들기’를 누르면 새 자료가 실제 검토함으로 이동해.</p><button class="aw-primary" data-go="register">2.2 직접 테스트</button></article>
        <article class="aw-panel compact"><p class="admin-kicker">2.3 · TEST</p><h3>public / resident / private</h3><p>샘플 자료의 공개등급을 직접 바꾸면 공개 빌드 포함/제외 결과가 즉시 달라져.</p><button class="aw-primary" data-go="visibility">2.3 직접 테스트</button></article>
        <article class="aw-panel compact"><p class="admin-kicker">2.4 · TEST A</p><h3>분류 검토</h3><p>AI 추천 주제·조직·현행상태를 수정하고 승인 또는 보류해볼 수 있어.</p><button class="aw-primary" data-go="classification">분류 검토 테스트</button></article>
        <article class="aw-panel compact"><p class="admin-kicker">2.4 · TEST B</p><h3>관계 검토</h3><p>기록끼리 관계 종류와 근거 수준을 바꾸고 승인하거나 연결 없이 진행해볼 수 있어.</p><button class="aw-primary" data-go="relations">관계 검토 테스트</button></article>
      </section>
      <section class="aw-stat-grid">
        <button class="aw-stat" data-go="classification"><span>분류 검토 남음</span><b>${c.classification}</b><small>주제·조직·현행상태 확인</small></button>
        <button class="aw-stat" data-go="relations"><span>관계 검토 남음</span><b>${c.relations}</b><small>기록 간 연결 근거 확인</small></button>
        <button class="aw-stat" data-go="publish"><span>발행 대기</span><b>${c.publish}</b><small>공개등급·최종 미리보기</small></button>
        <article class="aw-stat muted"><span>테스트 발행</span><b>${c.published}</b><small>실제 저장소에는 쓰지 않음</small></article>
      </section>
      <section class="aw-panel">
        <div class="aw-panel-head"><div><p class="admin-kicker">END-TO-END TEST</p><h2>한 자료를 끝까지 보내보기</h2></div><span>2.2 → 2.4 → 발행 대기</span></div>
        <div class="aw-flow">
          <button data-go="register"><b>2.2</b><span>새 자료 등록</span><small>예시 채우기 → 초안</small></button><i>→</i>
          <button data-go="classification"><b>2.4</b><span>분류 승인</span><small>주제·조직·상태</small></button><i>→</i>
          <button data-go="relations"><b>2.4</b><span>관계 승인/생략</span><small>근거 수준 확인</small></button><i>→</i>
          <button data-go="publish"><b>✓</b><span>발행 대기</span><small>등급·미리보기</small></button>
        </div>
        <div class="aw-split-note"><strong>2.3은 어느 시점에도 바꿀 수 있어.</strong><span>공개등급은 등록 때 기본값을 넣되, 전용 2.3 화면이나 발행 직전에도 수정 가능하게 시험하고 있어.</span><button data-go="visibility">2.3 열기</button></div>
      </section>
      <section class="aw-prototype-warning"><b>테스트 범위</b><span>이번에는 실제로 버튼·수정·승인·보류·등급변경·발행대기 이동을 시험할 수 있어. 다만 실제 AI 호출, 인증, GitHub/Drive 저장은 아직 일어나지 않아.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelector('[data-reset]').onclick=()=>{store.reset();U().toast('샘플 상태를 초기화했어.');};
  };
})();