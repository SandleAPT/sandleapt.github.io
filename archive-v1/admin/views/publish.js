(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.publish=function(root,store){
    const all=store.getState().items;
    const items=all.filter(x=>store.readyForPublish(x));
    const published=all.filter(x=>x.published);
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.3 · 2.4 · 발행 대기</p><h1>공개 전 마지막 확인</h1><p>분류와 관계 검토가 끝난 자료만 모아 공개범위와 주요 정보를 확인해. 실제 운영에서는 이 단계에서만 공개 검색 인덱스에 들어가게 할 계획이야.</p></div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section><section class="aw-panel"><div class="aw-panel-head"><div><h2>발행 대기 ${items.length}</h2><p>public / resident / private를 마지막으로 확인하고 미리보기를 본 뒤 발행해.</p></div><button class="aw-ghost" data-go="relations">관계 검토 보기</button></div><div class="aw-publish-list">${items.length?items.map(item=>`<article class="aw-publish-card" data-item="${U().esc(item.id)}"><div class="aw-publish-main"><div class="aw-review-top"><div>${U().sampleBadge(item)}${U().statusPill('ready','good')}</div><button class="aw-link-btn" data-preview>미리보기</button></div><h3>${U().esc(item.title)}</h3><p>${U().esc(item.documentType)} · ${U().esc(item.date||'-')} · ${U().esc(item.suggestions.topic||'-')}</p><div class="aw-publish-meta"><span>분류 승인 ✓</span><span>${item.relation?(item.relation.approved?'관계 승인 ✓':'관계 생략 ✓'):'관계 없음'}</span></div></div><div class="aw-publish-side"><label class="aw-field"><span>공개 등급</span><select data-visibility><option value="public">public · 전체 공개</option><option value="resident">resident · 입주민 공개</option><option value="private">private · 비공개</option></select></label><div data-visibility-help class="aw-visibility-help"></div><button class="aw-primary" data-publish>발행 처리 · 미리보기</button></div></article>`).join(''):U().empty('발행 대기 자료가 없어.','분류·관계 검토를 끝내면 여기로 들어와.')}</div></section><section class="aw-panel aw-published"><div class="aw-panel-head"><div><h2>이번 미리보기에서 발행 처리 ${published.length}</h2><p>브라우저 메모리에서만 상태가 바뀐 기록이야.</p></div></div>${published.length?`<div class="aw-published-list">${published.map(x=>`<div><b>${U().esc(x.title)}</b>${U().visibilityBadge(x.visibility)}<span>실제 저장 없음</span></div>`).join('')}</div>`:U().empty('아직 없어.','위 발행 대기에서 한 건을 처리해보면 여기로 이동해.')}</section><section class="aw-visibility-policy"><h3>공개등급의 실제 의미</h3><div class="aw-visibility-policy-grid"><article>${U().visibilityBadge('public')}<p>인터넷 방문자에게 공개할 수 있는 자료. 공개 빌드와 검색 인덱스에 포함 가능.</p></article><article>${U().visibilityBadge('resident')}<p>입주민 인증 후에만 보여야 하는 자료. 인증이 생기기 전에는 공개 Pages 빌드에 원본·검색본문을 넣지 않음.</p></article><article>${U().visibilityBadge('private')}<p>관리자 내부 자료. 공개 빌드와 공개 검색 인덱스에서 제외.</p></article></div></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-publish-card').forEach(el=>{
      const item=store.find(el.dataset.item);if(!item)return;
      const select=el.querySelector('[data-visibility]'),help=el.querySelector('[data-visibility-help]');
      select.value=item.visibility;
      const renderHelp=()=>{const v=select.value;help.textContent=v==='public'?'누구나 볼 수 있는 공개 자료':v==='resident'?'입주민 인증 필요 · 공개 빌드 제외':'관리자 전용 · 공개 빌드 제외';help.className='aw-visibility-help '+v;};
      renderHelp();select.onchange=()=>{store.setVisibility(item.id,select.value);renderHelp();};
      el.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
      el.querySelector('[data-publish]').onclick=()=>{store.setVisibility(item.id,select.value);if(store.publish(item.id))U().toast('미리보기에서만 발행 처리했어.');};
    });
  };
})();