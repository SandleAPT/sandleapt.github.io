(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.classification=function(root,store){
    const items=store.getState().items.filter(x=>!x.published&&!x.classificationApproved);
    const active=items.filter(x=>!x.classificationHeld);
    const held=items.filter(x=>x.classificationHeld);
    const topicSet=new Set(store.data.topics||[]);
    if(window.TopicTaxonomy&&Array.isArray(window.TopicTaxonomy.defs)) window.TopicTaxonomy.defs.forEach(d=>topicSet.add(d.key));
    items.forEach(x=>{if(x.suggestions&&x.suggestions.topic)topicSet.add(x.suggestions.topic);});
    const topicOptions=[...topicSet].filter(Boolean).sort((a,b)=>String(a).localeCompare(String(b),'ko')).map(x=>`<option>${U().esc(x)}</option>`).join('');
    const card=item=>`<article class="aw-review-card" data-item="${U().esc(item.id)}"><div class="aw-review-top"><div>${U().sampleBadge(item)}${item.importedMeeting?'<span class="aw-sample">회의록 변환</span>':''}${U().statusPill(`신뢰도 ${item.suggestions.confidence}%`,item.suggestions.confidence>=85?'good':item.suggestions.confidence>=70?'warn':'low')}</div><button class="aw-link-btn" data-preview>미리보기</button></div><h3>${U().esc(item.title)}</h3><p>${U().esc(item.documentType)} · ${U().esc(item.date||'-')}${item.archive&&item.archive.document?` · ${U().esc(item.archive.document.title)}`:''}</p><div class="aw-review-fields"><label><span>주제</span><select data-field="topic">${topicOptions}</select></label><label><span>관련 조직</span><input data-field="organization" value="${U().esc(item.suggestions.organization||'')}"></label><label><span>현행상태</span><select data-field="temporalStatus"><option value="current">current · 현행</option><option value="historical">historical · 과거</option><option value="expired">expired · 종료</option><option value="draft">draft · 초안</option><option value="unknown">unknown · 확인 필요</option></select></label></div><div class="aw-review-actions"><button class="aw-primary" data-approve>이 분류 승인</button><button class="aw-ghost" data-hold>보류</button>${item.importedMeeting?'<button class="aw-ghost" data-go-meeting>회의 변환으로 돌아가기</button>':''}</div></article>`;
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.4 · 3단계 공통 검토</p><h1>애매한 분류만 확인</h1><p>일반 자료와 회의 안건이 같은 검토함을 사용해. 회의록에서 이미 저장된 태그는 높은 신뢰도로 가져오고, 태그가 없어서 자동으로 찾은 주제는 후보로 보고 확인해.</p></div><button class="aw-ghost" data-go="dashboard">현재 작업 홈</button></section><section class="aw-panel"><div class="aw-panel-head"><div><h2>검토 필요 ${active.length}</h2><p>승인하면 관계 후보가 있는 자료는 관계 검토로, 없으면 발행 대기로 넘어가.</p></div><div class="aw-review-actions"><button class="aw-ghost" data-go="meetingImport">3단계 회의록 변환</button><button class="aw-primary small" data-go="register">+ 새 자료</button></div></div><div class="aw-review-list">${active.length?active.map(card).join(''):U().empty('검토할 분류가 없어.','새 자료를 만들거나 3단계에서 실제 회의록 안건을 보내볼 수 있어.')}</div></section>${held.length?`<section class="aw-panel aw-held"><div class="aw-panel-head"><div><h2>보류 ${held.length}</h2><p>지금 결정하기 애매한 항목을 작업 흐름에서 잠시 빼둔 상태야.</p></div></div><div class="aw-held-list">${held.map(x=>`<button data-resume="${U().esc(x.id)}"><b>${U().esc(x.title)}</b><span>다시 검토하기</span></button>`).join('')}</div></section>`:''}`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-review-card').forEach(cardEl=>{
      const id=cardEl.dataset.item,item=store.find(id);if(!item)return;
      const topic=cardEl.querySelector('[data-field="topic"]'),org=cardEl.querySelector('[data-field="organization"]'),status=cardEl.querySelector('[data-field="temporalStatus"]');
      topic.value=item.suggestions.topic;status.value=item.suggestions.temporalStatus||'unknown';
      const sync=()=>store.updateClassification(id,{topic:topic.value,organization:org.value,temporalStatus:status.value});
      topic.onchange=sync;org.onchange=sync;status.onchange=sync;
      cardEl.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
      cardEl.querySelector('[data-approve]').onclick=()=>{sync();store.approveClassification(id);U().toast('분류를 승인했어.');};
      cardEl.querySelector('[data-hold]').onclick=()=>{store.holdClassification(id);U().toast('보류함으로 옮겼어.');};
      const back=cardEl.querySelector('[data-go-meeting]');if(back)back.onclick=()=>U().nav('meetingImport');
    });
    root.querySelectorAll('[data-resume]').forEach(b=>b.onclick=()=>{store.resumeClassification(b.dataset.resume);U().toast('다시 검토 목록으로 옮겼어.');});
  };
})();