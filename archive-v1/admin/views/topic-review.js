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
  const W = () => window.SandleTagWriter;
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

  // 회의록 앱의 resolveStored를 그대로 쓴다. 없으면 최소한의 옛 이름 변환만 한다.
  function 수동태그읽기(a) {
    const T = window.TopicTaxonomy;
    const 자동 = () => {
      const r = A().classify({ title: a.title, note: [a.summary, a.decision, a.result].filter(Boolean).join(' ') });
      return [r.topic];
    };
    if (T && typeof T.resolveStored === 'function') {
      const v = T.resolveStored(a, 자동);
      return Array.isArray(v) ? v.filter(Boolean) : [];
    }
    return (Array.isArray(a.tags) ? a.tags : []).filter(Boolean)
      .map(t => (t === '미화' ? '청소·미화' : t === '소송' ? '하자·소송' : t));
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
          // 저장된 값을 그대로 쓰지 않고 회의록 앱과 같은 방식으로 푼다(resolveStored):
          //  - 옛 이름을 현재 이름으로 바꾼다(미화 → 청소·미화, 소송 → 하자·소송)
          //  - '기타'·'저수조·청소' 같은 포괄 태그는 자동 분류로 보강한다
          // 이걸 건너뛰면 화면에 옛 이름이 뜨고, 나중에 저장할 때 그대로 굳어버린다.
          tags: 수동태그읽기(a)
        }));
      });
    }
    return out;
  }

  function 다시계산() {
    줄 = M().sortRows(M().buildRows(안건, f => A().classify(f), 고친것()));
  }

  function 그리기(root) {
    const 고침 = 고친것();
    const 고친수 = Object.keys(고침).length;
    const 회의수 = Object.keys(W().groupByMeeting(고침)).length;
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
  ${고친수 ? `<div class="tr-save">
    <div><b>고친 것 ${고친수}건</b><small>회의 ${회의수}건을 다시 저장한다. 저장하면 회의록 앱에도 바로 반영된다.</small></div>
    <button class="aw-primary" data-save>회의록에 저장</button>
  </div>` : ''}
  <div class="tr-savelog" data-savelog hidden></div>
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
    const saveBtn = root.querySelector('[data-save]');
    if (saveBtn) saveBtn.onclick = () => 저장하기(root, saveBtn);
    const reset = root.querySelector('[data-reset]');
    if (reset) reset.onclick = () => {
      if (!confirm('직접 고친 주제를 모두 자동 판정으로 되돌릴까?')) return;
      try { localStorage.removeItem(저장키); } catch (e) {}
      다시계산(); 그리기(root); U().toast('모두 되돌렸어.');
    };
  }

  /* ── 회의록에 저장 ─────────────────────────────────────────
   * 저장 단위가 회의 레코드 하나라, 안건 태그만 바꿔도 회의 전체를 다시 쓴다.
   * 규칙과 검증은 shared/tag-writer.js에 있고 여기서는 키·네트워크만 잇는다.
   */
  const GAS = 'https://script.google.com/macros/s/AKfycbyhpE-DB5WAAEx7uqTCPwU-e0sPKuupkYN3YoQWALiFWe0IHFNh1y91e1VNtDmMxxoxLA/exec';
  const TOKEN = 'ITDXaUBDTmrz6DbQ3tv9R';

  function 수정용키() {
    const S = window.SandleAuthSession;
    if (S && S.savedKey) { if (S.expired && S.expired()) return ''; return S.savedKey() || ''; }
    try {
      const at = Number(localStorage.getItem('sandle_admin_unlock_at') || 0);
      if (!at || Date.now() - at > 24 * 60 * 60 * 1000) return '';
      return localStorage.getItem('sandle_admin_key') || '';
    } catch (e) { return ''; }
  }

  function 서버() {
    const key = 수정용키();
    return {
      wait: ms => new Promise(r => setTimeout(r, ms)),
      get: async id => {
        const x = await fetch(GAS + '?action=get&token=' + TOKEN + '&id=' + encodeURIComponent(id)).then(r => r.json());
        return (x && x.ok && x.item) ? x.item : null;
      },
      save: async (rec, tries) => {
        tries = tries || 0;
        const r = await fetch(GAS, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'save', record: rec, adminKey: key, token: TOKEN })
        });
        const x = await r.json();
        if (!x || !x.ok) {
          // 연속 저장 시 Apps Script가 간헐적으로 거부한다. 잠깐 쉬고 다시.
          if (tries < 3) { await new Promise(s => setTimeout(s, 1200 * (tries + 1))); return 서버().save(rec, tries + 1); }
          throw new Error((x && x.error) || '저장 거부');
        }
        return x;
      }
    };
  }

  async function 저장하기(root, btn) {
    const 고침 = 고친것();
    const 회의 = Object.keys(W().groupByMeeting(고침));
    if (!회의.length) return;
    if (!수정용키()) {
      U().toast('수정용 비밀번호가 필요해. 회의록 앱 관리자 메뉴에서 먼저 확인해줘.');
      return;
    }
    if (!confirm('고친 주제 ' + Object.keys(고침).length + '건을 회의록에 저장할까?\n'
      + '회의 ' + 회의.length + '건을 다시 저장한다. 회의록 앱에도 바로 반영된다.')) return;

    const log = root.querySelector('[data-savelog]');
    log.hidden = false;
    btn.disabled = true;
    log.textContent = '저장 중…';

    // 회의 하나에 읽기·저장·재조회 세 번을 왕복한다. Apps Script가 느릴 때는
    // 한 번에 20초 넘게 걸려 회의당 1분 가까이 든다. 멈춘 것처럼 보이지 않게 미리 알린다.
    const 시작 = Date.now();
    const 경과 = () => Math.round((Date.now() - 시작) / 1000) + '초';
    let 결과;
    try {
      결과 = await W().writeAll(고침, 서버(), p => {
        log.textContent = '저장 중… 회의 ' + p.진행 + '/' + p.전체
          + ' (' + 경과() + ' 지남) — 회의 하나에 1분까지 걸릴 수 있어. 창을 닫지 말아줘.';
      });
    } catch (e) {
      log.textContent = '저장 실패: ' + (e && e.message ? e.message : e);
      btn.disabled = false;
      return;
    }

    /* 저장된 것만 지역 저장에서 지우고, 화면의 안건에도 바로 반영한다.
     *
     * 다시 읽어오지 않는 이유: 이 화면은 `/minutes/data-YYYY.json` **정적 사본**을 읽는데
     * 그 파일은 하루 한 번 다시 만들어진다. 방금 클라우드에 저장한 값이 사본에는 아직 없어
     * 다시 읽으면 옛 값이 돌아온다(4.6 데이터 신선도). 그래서 저장한 값을 그대로 반영한다.
     * 사본은 다음 재발행 때 따라온다. */
    결과.성공.forEach(id => {
      const tags = (고침[id] || []).slice();
      고침저장(id, null);
      const a = (안건 || []).filter(x => x.id === id)[0];
      if (a) a.tags = tags;          // 다음 그리기에서 '이미 정해둠'으로 보인다
    });
    다시계산();
    U().toast('저장 ' + 결과.성공.length + '건' + (결과.실패.length ? ', 실패 ' + 결과.실패.length + '건' : ''));
    그리기(root);
    const 새log = root.querySelector('[data-savelog]');
    if (새log) {
      새log.hidden = false;
      새log.innerHTML = '<b>저장 ' + 결과.성공.length + '건</b> <small>(' + 경과() + ' 걸림)</small>'
        + (결과.실패.length ? '<br>실패 ' + 결과.실패.length + '건 — ' + 결과.실패.slice(0, 5).map(f => U().esc(f.줄 + ': ' + f.이유)).join('<br>') : '')
        + (결과.못찾음.length ? '<br>안건을 못 찾음 ' + 결과.못찾음.length + '건' : '');
    }
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
