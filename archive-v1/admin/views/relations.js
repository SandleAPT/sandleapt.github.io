(function(){
  const U=()=>window.SandleAdminUI;
  const L=()=>window.SandleRelationLabels;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.relations=function(root,store){
    const items=store.getState().items.filter(x=>!x.published&&x.classificationApproved&&x.relation&&!x.relation.approved&&!x.relation.skipped);
    root.innerHTML=`<section class="aw-page-head"><div><p class="admin-kicker">2.4 · 관계 검토</p><h1>앞뒤 기록을 이어 붙이는 곳</h1><p>기록 하나만 따로 보면 “왜 이렇게 됐는지”를 알 수 없다. 여기서 앞의 기록과 이어두면, 나중에 그 자료를 연 사람이 <b>앞으로 거슬러 올라가고 뒤로 따라갈 수</b> 있다.</p></div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section><section class="aw-panel aw-explain"><div class="aw-panel-head"><div><h2>예를 들면 이런 것</h2><p>하자소송 기록 8년치를 이어 붙이면 이렇게 된다. 화살표 하나하나가 여기서 만드는 연결이다.</p></div></div><ol class="aw-chain"><li><b>2017.07</b> 법무법인 로고스 선임<small>시작</small></li><li><b>2018.02</b> 소송 취하 결의<small>앞선 결정의 <em>후속</em></small></li><li><b>2018.04</b> 화해권고 결정으로 소송 유지<small>취하 결의를 <em>대체함</em></small></li><li><b>2022.06</b> 1심 판결<small>그 소송의 <em>결과</em></small></li><li><b>2024.09</b> 확정 10억<small>1심의 <em>후속</em></small></li><li><b>2025</b> 배당 806,861,909원<small>판결을 <em>집행</em></small></li></ol><p class="aw-chain-note">이 연결이 없으면 여섯 건이 그냥 따로 떨어진 회의록 여섯 개다. “취하하기로 해놓고 왜 소송이 계속됐지?” 같은 질문에 답할 수 없다.</p></section><section class="aw-panel"><div class="aw-panel-head"><div><h2>관계 후보 ${items.length}</h2><p>승인 또는 ‘연결 없이 진행’을 하면 발행 대기로 넘어가.</p></div><button class="aw-ghost" data-go="classification">분류 검토 보기</button></div><div class="aw-relation-list">${items.length?items.map(item=>`<article class="aw-relation-card" data-item="${U().esc(item.id)}"><div class="aw-review-top"><div>${U().sampleBadge(item)}${U().statusPill(item.relation.evidence,item.relation.evidence==='explicit'?'good':item.relation.evidence==='verified'?'warn':'low')}</div><button class="aw-link-btn" data-preview>자료 미리보기</button></div><div class="aw-relation-map"><div><small>현재 자료</small><b>${U().esc(item.title)}</b></div><i>→</i><div><small>연결 후보</small><input data-target value="${U().esc(item.relation.target||'')}"></div></div><div class="aw-field-row"><label class="aw-field"><span>이 자료는 연결 후보와 어떤 사이인가</span><select data-type>${L().TYPES.map(t=>`<option value="${t.value}">${U().esc(t.phrase)}</option>`).join('')}</select><small data-type-help class="aw-field-help"></small></label><label class="aw-field"><span>그렇게 볼 근거가 얼마나 확실한가</span><select data-evidence>${L().EVIDENCE.map(e=>`<option value="${e.value}">${U().esc(e.phrase)}</option>`).join('')}</select><small data-evidence-help class="aw-field-help"></small></label></div><p class="aw-relation-sentence" data-sentence></p><div class="aw-review-actions"><button class="aw-primary" data-approve>이 연결 저장</button><button class="aw-ghost" data-skip>연결하지 않고 넘어가기</button></div></article>`).join(''):U().empty('검토할 관계가 없어.','분류 승인이 끝난 자료 중 관계 후보가 있는 것만 여기에 나타나.')}</div></section><section class="aw-prototype-warning"><b>관계 원칙</b><span>inferred 관계는 화면에서 사실처럼 보이면 안 돼. 실제 발행 데이터에는 explicit / verified / inferred 근거 수준을 같이 저장하고, 추정 관계는 검토 없이 확정하지 않는 방향이야.</span></section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    root.querySelectorAll('.aw-relation-card').forEach(el=>{
      const item=store.find(el.dataset.item);if(!item)return;
      const type=el.querySelector('[data-type]'),evidence=el.querySelector('[data-evidence]'),target=el.querySelector('[data-target]');
      type.value=item.relation.type;evidence.value=item.relation.evidence;
      // 고른 값이 무슨 뜻인지 바로 아래에 풀어 쓴다. 목록만 보고는 고르기 어렵다.
      const typeHelp=el.querySelector('[data-type-help]'),evHelp=el.querySelector('[data-evidence-help]');
      const sentence=el.querySelector('[data-sentence]');
      const showHelp=()=>{
        typeHelp.textContent=L().typeHelp(type.value);
        const ev=L().EVIDENCE.find(x=>x.value===evidence.value);
        evHelp.textContent=ev?ev.help:'';
        evHelp.dataset.tone=L().evidenceTone(evidence.value);
        // 저장하면 무슨 뜻이 되는지 한 문장으로 보여준다.
        const 상대=(target.value||'').trim();
        sentence.textContent='저장하면: 「'+item.title+'」 → '+L().typePhrase(type.value)
          +' = 「'+(상대||'(연결 후보를 먼저 적어줘)')+'」 · 근거는 '+L().evidenceShort(evidence.value);
      };
      showHelp();
      const sync=()=>{showHelp();store.updateRelation(item.id,{type:type.value,evidence:evidence.value,target:target.value});};
      type.onchange=sync;evidence.onchange=sync;target.onchange=sync;target.oninput=showHelp;
      el.querySelector('[data-preview]').onclick=()=>U().openPreview(item);
      el.querySelector('[data-approve]').onclick=()=>{sync();store.approveRelation(item.id);U().toast('관계를 승인했어. 발행 대기로 이동해.');};
      el.querySelector('[data-skip]').onclick=()=>{store.skipRelation(item.id);U().toast('관계를 만들지 않고 발행 대기로 보냈어.');};
    });
  };
})();