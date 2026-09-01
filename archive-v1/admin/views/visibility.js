(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.visibility=function(root,store){
    const items=store.getState().items.filter(x=>!x.published);
    const counts={public:0,resident:0,private:0};
    items.forEach(x=>{counts[x.visibility||'public']=(counts[x.visibility||'public']||0)+1;});
    const card=item=>`<article class="aw-review-card" data-item="${U().esc(item.id)}"><div class="aw-review-top"><div>${U().sampleBadge(item)}${U().visibilityBadge(item.visibility||'public')}</div><button class="aw-link-btn" data-preview>미리보기</button></div><h3>${U().esc(item.title)}</h3><p>${U().esc(item.documentType)} · ${U().esc(item.date||'-')}</p><div class="aw-field-row" style="margin-top:10px"><label class="aw-field"><span>공개 등급 직접 바꿔보기</span><select data-visibility><option value="public">public · 인터넷 전체 공개</option><option value="resident">resident · 입주민 인증 후 공개</option><option value="private">private · 관리자 내부</option></select></label><div class="aw-rule-box" data-result style="margin-top:0"></div></div></article>`;
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.3 · 공개등급 테스트</p><h1>public / resident / private를 직접 바꿔보기</h1><p>설명만 보여주는 화면이 아니라, 샘플 자료의 공개등급을 실제로 바꾸면서 공개 빌드에 들어갈지 여부를 확인하는 테스트 화면이야.</p></div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section>
      <section class="aw-stat-grid"><article class="aw-stat muted"><span>public</span><b>${counts.public||0}</b><small>공개 Archive 포함 가능</small></article><article class="aw-stat muted"><span>resident</span><b>${counts.resident||0}</b><small>입주민 인증 전 공개 빌드 제외</small></article><article class="aw-stat muted"><span>private</span><b>${counts.private||0}</b><small>공개 빌드·검색 모두 제외</small></article><article class="aw-stat muted"><span>공개 검색 후보</span><b>${counts.public||0}</b><small>현재 등급 기준 시뮬레이션</small></article></section>
      <section class="aw-panel"><div class="aw-panel-head"><div><h2>샘플 자료 ${items.length}</h2><p>드롭다운을 바꾸면 즉시 결과가 달라져. 실제 인증 기능을 흉내 내는 게 아니라, 어떤 데이터가 어느 빌드에 들어가야 하는지 확인하는 단계야.</p></div><button class="aw-primary small" data-go="publish">발행 대기에서 보기</button></div><div class="aw-review-list">${items.map(card).join('')}</div></section>
      <section class="aw-visibility-policy"><h3>등급별 처리 원칙</h3><div class="aw-visibility-policy-grid"><article>${U().visibilityBadge('public')}<p>공개 Archive·공개 검색 인덱스에 포함 가능. 원본도 공개 가능한 경우에만 연결.</p></article><article>${U().visibilityBadge('resident')}<p>입주민 인증이 붙기 전에는 공개 GitHub Pages 빌드에 원문·검색본문을 싣지 않음.</p></article><article>${U().visibilityBadge('private')}<p>관리자 내부용. 공개·입주민 검색 인덱스에서 모두 제외.</p></article></div></section>
      <section class="aw-prototype-warning"><b>중요</b><span>이 화면에서 resident/private를 선택했다고 보안이 생기는 건 아니야. 지금은 메타데이터와 포함/제외 규칙만 시험하고, 실제 인증·파일 전달은 4단계에서 별도로 구현해.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-review-card').forEach(el=>{
      const item=store.find(el.dataset.item);if(!item)return;
      const select=el.querySelector('[data-visibility]');
      const result=el.querySelector('[data-result]');
      select.value=item.visibility||'public';
      const paint=()=>{
        const v=select.value;
        result.innerHTML=v==='public'?'<b>공개 빌드 포함</b><span>공개 Archive와 공개 검색에 포함 가능한 상태</span>':v==='resident'?'<b>공개 빌드 제외</b><span>입주민 인증 영역이 준비될 때까지 공개 검색·본문에서 제외</span>':'<b>모든 공개 빌드 제외</b><span>관리자 내부 자료로만 유지</span>';
      };
      paint();
      select.onchange=()=>{store.setVisibility(item.id,select.value);U().toast(`공개등급을 ${select.value}로 바꿨어.`);};
      el.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
    });
  };
})();