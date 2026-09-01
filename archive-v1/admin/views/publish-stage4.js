(function(){
  const U=()=>window.SandleAdminUI;
  const G=()=>window.SandlePublishGuard;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.publish=function(root,store){
    const all=store.getState().items;
    const items=all.filter(x=>store.readyForPublish(x));
    const published=all.filter(x=>x.published);
    const card=item=>{
      const result=G()?G().evaluate(item):{canPublish:false,visibility:'private',reason:'공개 정책 모듈을 불러오지 못했어.',excludedSources:0};
      const suggestion=item.suggestions||{};
      return `<article class="aw-publish-card" data-item="${U().esc(item.id)}"><div class="aw-publish-main"><div class="aw-review-top"><div>${U().sampleBadge(item)}${U().statusPill(result.canPublish?'public ready':'public blocked',result.canPublish?'good':'warn')}</div><button class="aw-link-btn" data-preview>미리보기</button></div><h3>${U().esc(item.title)}</h3><p>${U().esc(item.documentType)} · ${U().esc(item.date||'-')} · ${U().esc(suggestion.topic||'-')}</p><div class="aw-publish-meta"><span>분류 승인 ✓</span><span>${item.relation?(item.relation.approved?'관계 승인 ✓':'관계 생략 ✓'):'관계 없음'}</span><span>${result.canPublish?'공개 projection 통과':'공개 번들 제외'}</span></div></div><div class="aw-publish-side"><label class="aw-field"><span>공개 등급</span><select data-visibility><option value="public">public · 전체 공개</option><option value="resident">resident · 입주민 공개</option><option value="private">private · 비공개</option></select></label><div data-visibility-help class="aw-visibility-help ${U().esc(result.visibility)}">${U().esc(result.reason)}${result.excludedSources?` · 비공개 원본 ${result.excludedSources}건 제외`:''}</div><button class="aw-primary" data-publish ${result.canPublish?'':'disabled'}>${result.canPublish?'공개 발행 처리 · 미리보기':'공개 발행 차단'}</button></div></article>`;
    };
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.3 · 2.4 · STAGE 4 GUARD</p><h1>공개 전 마지막 확인</h1><p>분류와 관계 검토가 끝난 자료를 공개 정책으로 한 번 더 검사해. public 자료만 허용 필드로 projection을 만들고 resident/private는 발행 버튼 단계에서도 차단해.</p></div><button class="aw-ghost" data-go="storagePolicy">저장 · 권한 정책</button></section><section class="aw-panel"><div class="aw-panel-head"><div><h2>발행 대기 ${items.length}</h2><p>공개 등급을 바꾸면 실제 Stage 4 정책으로 다시 판정해.</p></div><button class="aw-ghost" data-go="relations">관계 검토 보기</button></div><div class="aw-publish-list">${items.length?items.map(card).join(''):U().empty('발행 대기 자료가 없어.','분류·관계 검토를 끝내면 여기로 들어와.')}</div></section><section class="aw-panel aw-published"><div class="aw-panel-head"><div><h2>이번 미리보기에서 공개 발행 처리 ${published.length}</h2><p>공개 정책을 통과한 자료만 브라우저 메모리에서 상태가 바뀌어.</p></div></div>${published.length?`<div class="aw-published-list">${published.map(x=>`<div><b>${U().esc(x.title)}</b>${U().visibilityBadge(x.visibility)}<span>실제 저장 없음</span></div>`).join('')}</div>`:U().empty('아직 없어.','public 자료 한 건을 처리하면 여기로 이동해.')}</section><section class="aw-prototype-warning"><b>실제 인증</b><span>resident/private는 공개 발행이 차단돼. 입주민·관리자 인증과 별도 파일 제공은 서비스 선택이 필요한 다음 결정이며, 현재 화면이 인증을 제공한다고 표시하지 않아.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-publish-card').forEach(el=>{
      const item=store.find(el.dataset.item);if(!item)return;
      const select=el.querySelector('[data-visibility]');
      const policy=window.SandleVisibilityPolicy;
      select.value=policy?policy.normalizeVisibility(item.visibility):'private';
      select.onchange=()=>{store.setVisibility(item.id,select.value);U().toast(`공개등급을 ${select.value}로 바꿨어.`);};
      el.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
      el.querySelector('[data-publish]').onclick=()=>{
        const result=G()?G().evaluate(item):{canPublish:false,reason:'공개 정책 모듈 없음'};
        if(!result.canPublish){U().toast(result.reason);return;}
        if(store.publish(item.id))U().toast('공개 projection 검사를 통과해 미리보기에서 발행 처리했어.');
      };
    });
  };
})();
