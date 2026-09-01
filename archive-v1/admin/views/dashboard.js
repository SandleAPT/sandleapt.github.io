(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.dashboard=function(root,store){
    const c=store.getCounts();
    root.innerHTML=`
      <section class="aw-page-head"><div><p class="admin-kicker">STAGE 4.3 · PUBLIC BUNDLE POLICY</p><h1>지금 있는 자료를 더 보기 좋고 안전하게</h1><p>실제 회의 213건과 안건 1,125건의 변환 검증 뒤, 공개 포털·회의 원본·외부 파일 저장소의 역할을 분리했어. 이제 public만 허용 필드로 공개 번들을 만들고 resident/private는 빌드에서 제외해.</p></div><button class="aw-ghost" data-reset>2단계 샘플 초기화</button></section>
      <section class="aw-panel">
        <div class="aw-panel-head"><div><p class="admin-kicker">STAGE 3 · VERIFIED</p><h2>회의록 → Archive 정리</h2><p>`/minutes/`에 이미 저장된 회의록을 읽고, 회의 전체는 Document로 두고 안건은 Fragment로 나눠 검색·주제별 화면에서 다시 쓰는 흐름이야.</p></div><span>검증 완료 · 원본 수정 없음</span></div>
        <div class="aw-flow">
          <button data-go="meeting"><b>1</b><span>기존 작성</span><small>지금 쓰는 회의록 유지</small></button><i>→</i>
          <button data-go="meetingImport"><b>2</b><span>자동 읽기</span><small>실제 저장 회의 선택</small></button><i>→</i>
          <button data-go="meetingImport"><b>3</b><span>Document/Fragment</span><small>안건별 보기 좋은 구조</small></button><i>→</i>
          <button data-go="classification"><b>4</b><span>애매한 것만 검토</span><small>주제 후보 확인</small></button>
        </div>
        <div class="aw-split-note"><strong>핵심</strong><span>회의록 원문·PDF를 Archive 때문에 줄이거나 다시 작성하지 않아. 기존 회의록은 그대로 두고 그 내용을 찾기 쉬운 인덱스와 연결 구조만 덧붙여.</span><button data-go="meetingImport">3단계 직접 보기</button></div>
      </section>
      <section class="aw-stat-grid">
        <button class="aw-stat" data-go="meetingImport"><span>3단계</span><b>PASS</b><small>213회의 · 1,125안건 검증</small></button>
        <button class="aw-stat" data-go="storagePolicy"><span>4단계 정책</span><b>ON</b><small>공개 projection · 비공개 제외</small></button>
        <button class="aw-stat" data-go="classification"><span>분류 검토</span><b>${c.classification}</b><small>회의 안건·일반 자료 함께 확인</small></button>
        <button class="aw-stat" data-go="publish"><span>발행 대기</span><b>${c.publish}</b><small>현재는 메모리 프로토타입</small></button>
      </section>
      <section class="aw-grid-2">
        <article class="aw-panel compact"><p class="admin-kicker">2단계 · 계속 테스트</p><h3>새 자료 / 공개등급 / 검토함</h3><p>2.2~2.4는 확정해 잠그지 않았어. 실제로 써보다 불편한 부분이 보이면 계속 수정할 수 있게 유지해.</p><div class="aw-review-actions"><button class="aw-ghost" data-go="register">2.2 자료 등록</button><button class="aw-ghost" data-go="visibility">2.3 공개등급</button></div></article>
        <article class="aw-panel compact"><p class="admin-kicker">4단계 · 저장 원칙</p><h3>비공개 자료는 공개 파일에 넣지 않음</h3><p>화면에서 숨기는 방식이 아니라 public 자료만 별도 projection으로 만들고 resident/private는 공개 산출물에서 제외해.</p><button class="aw-primary" data-go="storagePolicy">저장 · 권한 검사 보기</button></article>
      </section>
      <section class="aw-prototype-warning"><b>현재 상태</b><span>3단계 변환 화면은 공개 `/minutes/` 정적 데이터를 읽기만 해. Archive 분류함으로 보내는 동작 역시 아직 브라우저 메모리 안의 검토 프로토타입이며 실제 회의록 원본을 수정하지 않아.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelector('[data-reset]').onclick=()=>{store.reset();U().toast('2단계 샘플 상태를 초기화했어.');};
  };
})();
