(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.relations=function(root,store){
    const items=store.getState().items.filter(x=>!x.published&&x.classificationApproved&&x.relation&&!x.relation.approved&&!x.relation.skipped);
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.4 · 관계 검토</p><h1>기록끼리 연결할 때는 근거까지</h1><p>비슷해 보인다는 이유만으로 연결하지 않고, 관계 종류와 근거 수준을 같이 확인해. 애매하면 연결 없이 발행해도 돼.</p></div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section><section class="aw-panel"><div class="aw-panel-head"><div><h2>관계 후보 ${items.length}</h2><p>승인 또는 ‘연결 없이 진행’을 하면 발행 대기로 넘어가.</p></div><button class="aw-ghost" data-go="classification">분류 검토 보기</button></div><div class="aw-relation-list">${items.length?items.map(item=>`<article class="aw-relation-card" data-item="${U().esc(item.id)}"><div class="aw-review-top"><div>${U().sampleBadge(item)}${U().statusPill(item.relation.evidence,item.relation.evidence==='explicit'?'good':item.relation.evidence==='verified'?'warn':'low')}</div><button class="aw-link-btn" data-preview>자료 미리보기</button></div><div class="aw-relation-map"><div><small>현재 자료</small><b>${U().esc(item.title)}</b></div><i>→</i><div><small>연결 후보</small><input data-target value="${U().esc(item.relation.target||'')}"></div></div><div class="aw-field-row"><label class="aw-field"><span>관계 종류</span><select data-type><option value="based_on">based_on · 근거</option><option value="follow_up_to">follow_up_to · 후속</option><option value="implements">implements · 집행</option><option value="contract_for">contract_for · 계약/운영</option><option value="supersedes">supersedes · 대체</option><option value="amends">amends · 개정</option><option value="related_to">related_to · 관련</option></select></label><label class="aw-field"><span>근거 수준</span><select data-evidence><option value="explicit">explicit · 문서에 명시</option><option value="verified">verified · 확인됨</option><option value="inferred">inferred · 추정</option></select></label></div><div class="aw-review-actions"><button class="aw-primary" data-approve>관계 승인</button><button class="aw-ghost" data-skip>연결 없이 진행</button></div></article>`).join(''):U().empty('검토할 관계가 없어.','분류 승인이 끝난 자료 중 관계 후보가 있는 것만 여기에 나타나.')}</div></section><section class="aw-prototype-warning"><b>관계 원칙</b><span>inferred 관계는 화면에서 사실처럼 보이면 안 돼. 실제 발행 데이터에는 explicit / verified / inferred 근거 수준을 같이 저장하고, 추정 관계는 검토 없이 확정하지 않는 방향이야.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-relation-card').forEach(el=>{
      const item=store.find(el.dataset.item);if(!item)return;
      const type=el.querySelector('[data-type]'),evidence=el.querySelector('[data-evidence]'),target=el.querySelector('[data-target]');
      type.value=item.relation.type;evidence.value=item.relation.evidence;
      const sync=()=>store.updateRelation(item.id,{type:type.value,evidence:evidence.value,target:target.value});
      type.onchange=sync;evidence.onchange=sync;target.onchange=sync;
      el.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
      el.querySelector('[data-approve]').onclick=()=>{sync();store.approveRelation(item.id);U().toast('관계를 승인했어. 발행 대기로 이동해.');};
      el.querySelector('[data-skip]').onclick=()=>{store.skipRelation(item.id);U().toast('관계를 만들지 않고 발행 대기로 보냈어.');};
    });
  };
})();