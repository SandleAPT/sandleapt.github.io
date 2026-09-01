(function(){
  const U=()=>window.SandleAdminUI;
  window.SandleAdminViews=window.SandleAdminViews||{};
  window.SandleAdminViews.register=function(root,store){
    const data=store.data;
    const typeOptions=data.documentTypes.map(x=>`<option>${U().esc(x)}</option>`).join('');
    const scopeOptions=data.scopes.map(x=>`<option value="${U().esc(x.value)}">${U().esc(x.label)}</option>`).join('');
    root.innerHTML=`
      <section class="aw-page-head"><div><p class="admin-kicker">2.2 · AI 새 자료 등록</p><h1>새 자료를 한 번만 넣기</h1><p>실제 운영에서는 AI가 문서를 읽어 아래 초안을 채우는 걸 목표로 해. 지금은 전체 동작을 보기 위해 간단한 규칙 기반 시뮬레이션으로 같은 흐름을 재현해.</p></div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section>
      <section class="aw-grid-main">
        <form class="aw-panel aw-form" id="adminRegisterForm">
          <div class="aw-panel-head"><div><p class="admin-kicker">INPUT</p><h2>최소 입력</h2></div><span>나머지는 자동 제안</span></div>
          <label class="aw-field wide"><span>자료 제목 *</span><input name="title" required placeholder="예: 체육시설 배상책임보험"></label>
          <div class="aw-field-row"><label class="aw-field"><span>자료 종류 *</span><select name="documentType">${typeOptions}</select></label><label class="aw-field"><span>날짜 *</span><input type="date" name="date" required value="2026-09-01"></label></div>
          <div class="aw-field-row"><label class="aw-field"><span>적용 범위</span><select name="scope">${scopeOptions}</select></label><label class="aw-field"><span>공개 등급</span><select name="visibility"><option value="public">public · 전체 공개</option><option value="resident">resident · 입주민 공개</option><option value="private">private · 비공개</option></select></label></div>
          <label class="aw-field wide"><span>원본 위치</span><input name="source" placeholder="Google Drive 링크/파일 ID 또는 원본 위치"></label>
          <label class="aw-field wide"><span>간단 메모</span><textarea name="note" rows="4" placeholder="AI가 문서를 읽었다면 자동 요약이 들어갈 자리. 지금은 직접 짧게 적어도 돼."></textarea></label>
          <div class="aw-form-actions"><button type="submit" class="aw-primary">AI 초안 만들기 · 시뮬레이션</button><button type="button" class="aw-ghost" data-fill>예시 채우기</button></div>
          <p class="aw-form-help">이 버튼은 실제 AI/API 호출이 아니야. 2단계에서는 ‘초안이 들어오면 어떻게 검토되고 발행되는지’를 먼저 보는 거고, 실제 GPT/Claude 연동 방식은 저장·권한 구조와 함께 붙여.</p>
        </form>
        <aside class="aw-panel aw-side-guide">
          <p class="admin-kicker">AI가 제안할 것</p><h3>관리자가 처음부터 고르지 않아도 되는 항목</h3>
          <ul><li>큰 주제와 세부 주제</li><li>관련 조직</li><li>현행/과거 상태</li><li>문서 내부 Fragment 후보</li><li>기존 기록과의 관계 후보</li></ul>
          <div class="aw-rule-box"><b>바로 공개하지 않음</b><span>새 초안은 먼저 분류 검토로 보내고, 관계가 있으면 관계 검토를 거친 뒤 발행 대기로 넘어가.</span></div>
          <div class="aw-rule-box blue"><b>공개등급도 초안 단계부터</b><span>public / resident / private를 자료 메타데이터에 처음부터 붙여서 나중에 공개 범위를 뒤늦게 추정하지 않게 해.</span></div>
        </aside>
      </section>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>U().nav(b.dataset.go));
    const form=root.querySelector('#adminRegisterForm');
    root.querySelector('[data-fill]').onclick=()=>{
      form.elements.title.value='커뮤니티센터 운영 안내 — 테스트';
      form.elements.documentType.value='공고·안내';
      form.elements.date.value='2026-09-01';
      form.elements.scope.value='all_residents';
      form.elements.visibility.value='public';
      form.elements.source.value='Google Drive / 테스트 원본';
      form.elements.note.value='헬스장·GX 운영과 관련된 안내문을 등록하는 흐름을 시험';
    };
    form.onsubmit=e=>{
      e.preventDefault();
      const fd=new FormData(form);const values=Object.fromEntries(fd.entries());
      if(!String(values.title||'').trim()){U().toast('자료 제목을 입력해줘.');return;}
      const item=store.addDraft(values);
      U().toast(`초안을 만들었어. 추천 주제: ${item.suggestions.topic}`);
      U().nav('classification');
    };
  };
})();