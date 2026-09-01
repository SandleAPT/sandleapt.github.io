/*
 * 주제 훑어보기 — 실제 회의록 안건 전체의 자동 분류를 한 화면에서 확인하고 고친다.
 *
 * 승인 게이트가 아니다. 분류는 기록당 한 번만 하면 되는 일이라, 한 건씩 막고 승인받는
 * 대신 전부 펼쳐 놓고 이상한 것만 고치는 편이 빠르다(사용자 결정 2026-09-01).
 *
 * 자료는 회의록 앱의 정적 사본(/minutes/data-YYYY.json)을 읽는다. 같은 origin이다.
 * 고친 값은 이 브라우저에만 저장한다 — 회의록 원본에 쓰는 것은 별도 결정이 필요하다.
 */
(function () {
  const U = () => window.SandleAdminUI;
  const M = () => window.SandleTopicReview;
  const A = () => window.SandleAutoAssign;
  const 저장키 = 'sandle_topic_fixes';

  let 안건 = null, 줄 = [], 조건 = { 상태: '전체', 주제: '전체', 검색: '' }, 보여줄수 = 200;

  function 고친것() {
    let m;
    try { m = JSON.parse(localStorage.getItem(저장키) || '{}'); } catch (e) { return {}; }
    // 처음 만들 때는 주제를 하나만 저장했다. 남아 있으면 배열로 올린다.
    Object.keys(m).forEach(k => { if (typeof m[k] === 'string') m[k] = [m[k]]; });
    return m;
  }
  function 고침저장(id, 주제들) {
    const m = 고친것();
    const v = (주제들 || []).filter(Boolean);
    if (v.length) m[id] = v; else delete m[id];
    try { localStorage.setItem(저장키, JSON.stringify(m)); } catch (e) {}
  }

  async function 안건불러오기() {
    const out = [];
    for (let y = 2016; y <= 2026; y++) {
      let j;
      try { j = await fetch('/minutes/data-' + y + '.json?cb=' + Date.now()).then(r => r.ok ? r.json() : null); }
      catch (e) { continue; }
      if (!j || !j.items) continue;
      j.items.forEach(it => {
        let o; try { o = JSON.parse(it.json); } catch (e) { return; }
        const 회의명 = (o.meeting && o.meeting.name) || it.name || it.id;
        const 날짜 = (o.meeting && o.meeting.date) || it.date || '';
        (o.agendas || []).forEach((a, i) => out.push({
          id: it.id + '#' + (a.id || i),
          회의id: it.id, 회의명, 날짜,
          title: a.title || '',
          note: [a.summary, a.decision, a.result].filter(Boolean).join(' '),
          // 회의록에서 이미 사람이 붙여둔 태그. 자동 판정보다 우선한다.
          tags: Array.isArray(a.tags) ? a.tags.filter(Boolean) : []
        }));
      });
    }
    return out;
  }

  function 다시계산() {
    줄 = M().sortRows(M().buildRows(안건, f => A().classify(f), 고친것()));
  }

  function 그리기(root) {
    const 전체수 = M().countByStatus(줄);
    const 걸러진 = M().filterRows(줄, 조건);
    const 주제목록 = M().countByTopic(줄);
    const S = M().STATUS;
    // 화면 칩 순서 = 확인이 급한 순서. manual(이미 정해둠)을 빼면 그 줄들이
    // 어느 칩에도 안 잡혀 사라진 것처럼 보인다.
    const 순서 = ['no-match', 'body-only', 'title-multi', 'title', 'manual', 'fixed'];
    const 칩 = ['전체'].concat(순서).map(k => {
      const 수 = k === '전체' ? 전체수.전체 : (전체수[k] || 0);
      const 이름 = k === '전체' ? '전체' : S[k].label;
      return `<button class="tr-chip${조건.상태 === k ? ' on' : ''}" data-status="${k}">${이름} <b>${수}</b></button>`;
    }).join('');

    const 보일것 = 걸러진.slice(0, 보여줄수);
    const 주제옵션 = 주제목록.map(t => `<option value="${U().esc(t.주제)}">${U().esc(t.주제)} (${t.수})</option>`).join('');

    root.innerHTML = `
<section class="aw-page-head"><div>
  <p class="admin-kicker">2.4 · 주제 훑어보기</p>
  <h1>붙은 주제를 죽 훑어보고 이상한 것만 고친다</h1>
  <p>승인 버튼을 누르며 넘어가는 화면이 아니다. 분류는 <b>기록당 한 번만</b> 하면 되는 일이라, 전부 펼쳐 놓고 눈에 걸리는 것만 바꾸면 된다. 확인이 급한 것부터 위에 온다.</p>
</div><button class="aw-ghost" data-go="dashboard">전체 흐름</button></section>

<section class="aw-panel">
  <div class="tr-bar">
    <div class="tr-chips">${칩}</div>
    <div class="tr-tools">
      <select data-topic><option value="전체">주제 전체</option>${주제옵션}</select>
      <input data-q placeholder="안건명·본문 검색" value="${U().esc(조건.검색)}">
      <button class="aw-ghost small" data-reset>고친 것 모두 되돌리기</button>
    </div>
  </div>
  <p class="tr-note">${걸러진.length}건 중 ${보일것.length}건 표시${
      조건.상태 !== '전체' ? ` · <b>${S[조건.상태] ? S[조건.상태].hint : ''}</b>` : ''}</p>
  <div class="tr-rows">
    ${보일것.length ? 보일것.map(r => `
      <div class="tr-row" data-id="${U().esc(r.id)}">
        <span class="tr-badge ${r.상태색}">${r.상태이름}</span>
        <div class="tr-main">
          <b>${U().esc(r.title) || '<i>안건명 없음</i>'}</b>
          <small>${U().esc(r.날짜)} · ${U().esc(r.회의명)}</small>
          ${r.note ? `<p class="tr-note-text">${U().esc(r.note.slice(0, 180))}${r.note.length > 180 ? '…' : ''}</p>` : ''}
          <p class="tr-why">${U().esc(r.why)}</p>
        </div>
        <div class="tr-pick">
          <div class="tr-tags">
            ${r.주제들.map(t => `<span class="tr-tag">${U().esc(t)}<button data-del="${U().esc(r.id)}|${U().esc(t)}" aria-label="${U().esc(t)} 빼기">×</button></span>`).join('')}
          </div>
          <select data-add="${U().esc(r.id)}"><option value="">＋ 주제 더하기</option>${더할주제(r.주제들)}</select>
          ${r.고쳐짐 ? `<button class="aw-ghost small" data-undo="${U().esc(r.id)}">되돌리기</button>`
        : (r.후보.length ? `<span class="tr-alt">또는 ${r.후보.map(t => U().esc(t)).join(' · ')}</span>` : '')}
        </div>
      </div>`).join('')
      : U().empty('해당하는 안건이 없어.', '위 조건을 바꿔봐.')}
  </div>
  ${걸러진.length > 보일것.length ? `<div class="tr-more"><button class="aw-ghost" data-more>${걸러진.length - 보일것.length}건 더 보기</button></div>` : ''}
</section>`;

    root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => U().nav(b.dataset.go));
    root.querySelectorAll('[data-status]').forEach(b => b.onclick = () => { 조건.상태 = b.dataset.status; 보여줄수 = 200; 그리기(root); });
    const sel = root.querySelector('[data-topic]'); if (sel) { sel.value = 조건.주제; sel.onchange = () => { 조건.주제 = sel.value; 보여줄수 = 200; 그리기(root); }; }
    const q = root.querySelector('[data-q]');
    if (q) {
      let t = null;
      q.oninput = () => { clearTimeout(t); t = setTimeout(() => { 조건.검색 = q.value; 보여줄수 = 200; 그리기(root); const n = root.querySelector('[data-q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
    }
    const more = root.querySelector('[data-more]'); if (more) more.onclick = () => { 보여줄수 += 300; 그리기(root); };
    root.querySelectorAll('[data-add]').forEach(s => s.onchange = () => {
      if (!s.value) return;
      const 줄하나 = 줄.find(x => x.id === s.dataset.add);
      고침저장(s.dataset.add, (줄하나 ? 줄하나.주제들 : []).concat([s.value]));
      다시계산(); 그리기(root); U().toast('주제를 더했어. 아직 이 브라우저에만 저장돼.');
    });
    root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const [id, 주제] = b.dataset.del.split('|');
      const 줄하나 = 줄.find(x => x.id === id);
      const 남은 = (줄하나 ? 줄하나.주제들 : []).filter(t => t !== 주제);
      if (!남은.length) { U().toast('주제를 모두 없앨 수는 없어. 다른 주제를 먼저 더해줘.'); return; }
      고침저장(id, 남은); 다시계산(); 그리기(root); U().toast('주제를 뺐어. 아직 이 브라우저에만 저장돼.');
    });
    root.querySelectorAll('[data-undo]').forEach(b => b.onclick = () => {
      고침저장(b.dataset.undo, null); 다시계산(); 그리기(root); U().toast('자동 판정으로 되돌렸어.');
    });
    const reset = root.querySelector('[data-reset]');
    if (reset) reset.onclick = () => {
      if (!confirm('직접 고친 주제를 모두 자동 판정으로 되돌릴까?')) return;
      try { localStorage.removeItem(저장키); } catch (e) {}
      다시계산(); 그리기(root); U().toast('모두 되돌렸어.');
    };
  }

  // 이미 붙어 있는 것은 빼고 보여준다.
  function 더할주제(붙은것) {
    const keys = (window.TopicTaxonomy && window.TopicTaxonomy.defs || []).map(d => d.key).concat(['기타']);
    return keys.filter(k => 붙은것.indexOf(k) < 0)
      .map(k => `<option>${U().esc(k)}</option>`).join('');
  }

  window.SandleAdminViews = window.SandleAdminViews || {};
  window.SandleAdminViews.topicReview = async function (root) {
    if (!M() || !A()) { root.innerHTML = '<section class="aw-panel"><p>자동 판정 모듈을 불러오지 못했다.</p></section>'; return; }
    if (!안건) {
      root.innerHTML = '<section class="aw-panel"><p>회의록 안건을 불러오는 중…</p></section>';
      안건 = await 안건불러오기();
      다시계산();
    }
    그리기(root);
  };
})();
