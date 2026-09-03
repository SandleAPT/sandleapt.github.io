/*
 * unified-search.js — 한 낱말로 여러 갈래를 한꺼번에 찾는다
 *
 * ── 왜 만드는가 ────────────────────────────────────────────────
 * 사용자 요청: *"뭔가를 검색하면 연결된 정보들이 우르르 나와서 뭔가를 판단하는데 큰 역할이 됐으면 함."*
 *
 * 지금까지 자료는 갈래별로 다른 화면에 흩어져 있었다. 「커뮤니티센터」를 알아보려면
 * 계약 탭에서 위탁운영 계약을 찾고, 선거 탭에서 업체 선정 투표를 찾고, 주제 화면에서
 * 회의 안건을 찾아야 했다. **셋이 한 사건인데 세 번 뒤져야 했다.**
 *
 * 이 파일은 그 셋을 한 번에 찾아 돌려준다. 판단에 쓰이려면 흩어진 것이 모여야 한다.
 *
 * ── 어디서 읽는가 ──────────────────────────────────────────────
 * 회의 안건은 이미 화면이 들고 있는 것을 쓴다(`window.SANDLE_ARCHIVE_SAMPLE`).
 * 계약·선거·규약은 같은 origin의 정적 파일을 읽는다 —
 *   /minutes/contracts.json (364K) · /minutes/elections.json (104K)
 *   /minutes/rules.json (156K) · /minutes/trules.json (108K)
 *
 * 합쳐 730K다. 첫 화면에서 미리 받으면 느려지므로 **처음 검색할 때 한 번만** 받고
 * 그 뒤로는 다시 받지 않는다. 첫 검색이 1초쯤 걸리고 그다음부터는 곧바로 나온다.
 *
 * ── 무엇을 돌려주는가 ──────────────────────────────────────────
 * 갈래마다 { 제목, 부제, 조각, 열기 }를 담은 목록. `조각`은 낱말이 나온 자리의 앞뒤를
 * 잘라 온 것으로, 왜 걸렸는지를 눈으로 보게 한다. 열지 않고도 고를 수 있어야 한다.
 *
 * 잠긴 자료(제기된 절차 문제·관리규약 대조)는 **여기서 아예 읽지 않는다.**
 * 검색 결과에 제목만 스쳐도 특정 세대가 드러날 수 있기 때문이다(PLAN.md 원칙 1).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UnifiedSearch = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var 받아온것 = null;   // Promise 하나만 둔다 — 여러 번 검색해도 한 번만 받는다.

  function 읽기(fetchFn, 주소) {
    return fetchFn(주소, { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });   // 하나가 없어도 나머지는 찾을 수 있어야 한다
  }

  function 준비(fetchFn) {
    if (받아온것) return 받아온것;
    var f = fetchFn || function (u, o) { return fetch(u, o); };
    받아온것 = Promise.all([
      읽기(f, '/minutes/contracts.json'),
      읽기(f, '/minutes/elections.json'),
      읽기(f, '/minutes/rules.json'),
      읽기(f, '/minutes/trules.json')
    ]).then(function (a) {
      return { 계약: a[0], 선거: a[1], 분양규약: a[2], 임차규약: a[3] };
    });
    return 받아온것;
  }

  // 낱말이 나온 자리를 앞뒤로 잘라 온다. 어디에 걸렸는지 눈으로 보여주기 위한 것이다.
  function 조각내기(글, q, 앞뒤) {
    var s = String(글 || '');
    var i = s.toLowerCase().indexOf(q);
    if (i < 0) return '';
    var n = 앞뒤 == null ? 40 : 앞뒤;
    var a = Math.max(0, i - n), b = Math.min(s.length, i + q.length + n);
    return (a > 0 ? '…' : '') + s.slice(a, b).replace(/\s+/g, ' ') + (b < s.length ? '…' : '');
  }
  function 걸리나(값, q) { return String(값 == null ? '' : 값).toLowerCase().indexOf(q) >= 0; }
  // 여러 칸 가운데 처음 걸린 곳의 조각을 준다.
  function 첫조각(칸들, q) {
    for (var i = 0; i < 칸들.length; i++) {
      var c = 조각내기(칸들[i], q);
      if (c) return c;
    }
    return '';
  }

  function 계약찾기(j, q) {
    if (!j || !j.items) return [];
    var out = [];
    (j.items || []).forEach(function (d) {
      var 칸 = [d.title, d.group, d.type, d.amount, d.period, (d.parties || []).join(' '),
                (d.tags || []).join(' '), (d.deal || []).join(' '), d.sourceNote];
      // 조문 본문까지 훑는다 — 계약의 값어치는 조문에 있다.
      (d.chapters || []).forEach(function (ch) {
        (ch.clauses || []).forEach(function (c) { 칸.push(c.ref + ' ' + (c.title || '') + ' ' + (c.text || '') + ' ' + (c.note || '')); });
      });
      if (!칸.some(function (v) { return 걸리나(v, q); })) return;
      out.push({
        갈래: '계약', 제목: d.title || '',
        부제: [d.group, d.period, d.amount].filter(Boolean).join(' · '),
        조각: 첫조각(칸, q),
        열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=contracts&nq=' + encodeURIComponent(q) }
      });
    });
    // 묶음 안내(살펴볼 것 등)도 검색 대상이다. 거기에 판단에 쓸 말이 들어 있다.
    Object.keys(j.groups || {}).forEach(function (g) {
      var gi = j.groups[g] || {};
      var 칸 = [g, gi.요약].concat(gi.살펴볼것 || []).concat(gi.확인필요 || []);
      if (!칸.some(function (v) { return 걸리나(v, q); })) return;
      out.push({
        갈래: '계약 묶음', 제목: g,
        부제: gi.성격 ? ('성격: ' + gi.성격) : '계약 묶음 안내',
        조각: 첫조각(칸, q),
        열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=contracts&nq=' + encodeURIComponent(q) }
      });
    });
    return out;
  }

  function 선거찾기(j, q) {
    if (!j) return [];
    var out = [];
    (j.선거 || []).forEach(function (e) {
      var 칸 = [e.제목, e.회차, e.요약, e.임기, e.투표기간, e.근거, e.출처].concat(e.메모 || []);
      (e.결과 || []).forEach(function (r) { 칸.push([r.선거구, r.당선인, r.판정, r.비고].filter(Boolean).join(' ')); });
      if (!칸.some(function (v) { return 걸리나(v, q); })) return;
      out.push({ 갈래: '선거', 제목: e.제목 || '', 부제: [e.회차, e.투표기간].filter(Boolean).join(' · '),
                 조각: 첫조각(칸, q), 열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=elections' } });
    });
    (j.찬반투표 || []).forEach(function (v) {
      var 칸 = [v.제목, v.요약, v.근거, v.결과, v.투표기간, v.출처].concat(v.메모 || []);
      if (!칸.some(function (x) { return 걸리나(x, q); })) return;
      out.push({ 갈래: '찬반투표', 제목: v.제목 || '', 부제: [v.투표기간, v.결과].filter(Boolean).join(' · '),
                 조각: 첫조각(칸, q), 열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=elections' } });
    });
    (j.선관위회의 || []).forEach(function (m) {
      var 칸 = [m.날짜, m.회차, m.공고번호, m.메모, m.출처].concat(m.안건 || []);
      if (!칸.some(function (x) { return 걸리나(x, q); })) return;
      out.push({ 갈래: '선관위 회의', 제목: (m.날짜 || '') + ' ' + (m.회차 || '') + ' 선거관리위원회',
                 부제: m.공고번호 || '', 조각: 첫조각(칸, q),
                 열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=elections' } });
    });
    return out;
  }

  function 규약찾기(j, q, 이름) {
    if (!j) return [];
    var out = [];
    (j.chapters || []).forEach(function (ch) {
      (ch.articles || []).forEach(function (a) {
        var 칸 = [a.no, a.title, a.text];
        if (!칸.some(function (v) { return 걸리나(v, q); })) return;
        out.push({ 갈래: '규약 조문', 제목: 이름 + ' ' + (a.no || '') + (a.title ? '(' + a.title + ')' : ''),
                   부제: (ch.no ? ch.no + ' ' : '') + (ch.title || ''), 조각: 첫조각(칸, q),
                   열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=rules&nq=' + encodeURIComponent(q) } });
      });
    });
    (j.appendices || []).forEach(function (a) {
      var 칸 = [a.no, a.title, a.text];
      if (!칸.some(function (v) { return 걸리나(v, q); })) return;
      out.push({ 갈래: '규약 별표', 제목: 이름 + ' ' + (a.no || '') + ' ' + (a.title || ''),
                 부제: '별표', 조각: 첫조각(칸, q),
                 열기: { 종류: 'minutes', 주소: '/minutes/?tab=noticeView&sub=rules&nq=' + encodeURIComponent(q) } });
    });
    return out;
  }

  /* 회의 안건은 화면이 이미 들고 있다. 다시 받지 않는다.
   * records 한 줄은 [연월, 종류, 제목, 상태, 원문주소, 회의명, 다른주제들, 본문칸들] 이다
   * (archive-build.js에서 자리를 정해 두었고, 자리를 바꾸면 화면이 깨진다). */
  function 안건찾기(자료, q) {
    var out = [], 본것 = {};
    (자료 && 자료.topics || []).forEach(function (t) {
      (t.records || []).forEach(function (r) {
        var 제목 = r[2] || '', 회의 = r[5] || '';
        var 열쇠 = 회의 + '|' + 제목;
        if (본것[열쇠]) return;               // 한 안건이 여러 주제에 걸려 있어도 한 번만
        var 본문 = (r[7] || []).map(function (c) { return (c && c.이름 ? c.이름 + ' ' : '') + (c && c.글 ? c.글 : ''); });
        var 칸 = [제목, 회의, r[3]].concat(본문);
        if (!칸.some(function (v) { return 걸리나(v, q); })) return;
        본것[열쇠] = 1;
        out.push({ 갈래: '회의 안건', 제목: 제목,
                   부제: [r[0], r[1], 회의].filter(Boolean).join(' · '),
                   조각: 첫조각(칸, q), 날짜: r[0] || '',
                   열기: { 종류: '원문', 주소: r[4] || '' },
                   주제: t.label });
      });
    });
    // 최근 것이 먼저 보여야 지금 판단에 쓸모가 있다.
    out.sort(function (a, b) { return String(b.날짜).localeCompare(String(a.날짜)); });
    return out;
  }

  function 주제찾기(자료, q) {
    return (자료 && 자료.topics || []).filter(function (t) {
      return [t.label].concat(t.aliases || []).some(function (v) { return 걸리나(v, q); });
    }).map(function (t) {
      return { 갈래: '주제', 제목: t.label, 부제: (t.records || []).length + '건', 조각: t.description || '',
               열기: { 종류: '주제', id: t.id } };
    });
  }

  /* 찾기 — 갈래별로 나눠 돌려준다.
   * 갈래를 섞어 하나로 늘어놓으면 「무엇이 걸렸는지」는 보여도 「어느 갈래에 몇 건인지」가 안 보인다.
   * 판단에 쓰려면 갈래별 건수가 먼저 보여야 한다. */
  function 찾기(q, 묶음, 자료) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return null;
    var 계약 = 계약찾기(묶음 && 묶음.계약, q);
    return {
      질의: q,
      주제: 주제찾기(자료, q),
      계약: 계약.filter(function (x) { return x.갈래 === '계약'; }),
      계약묶음: 계약.filter(function (x) { return x.갈래 === '계약 묶음'; }),
      선거: 선거찾기(묶음 && 묶음.선거, q),
      규약: 규약찾기(묶음 && 묶음.분양규약, q, '◆ 분양')
              .concat(규약찾기(묶음 && 묶음.임차규약, q, '◇ 임차')),
      안건: 안건찾기(자료, q)
    };
  }

  function 건수(r) {
    if (!r) return 0;
    return (r.주제.length + r.계약.length + r.계약묶음.length + r.선거.length + r.규약.length + r.안건.length);
  }

  return { 준비: 준비, 찾기: 찾기, 건수: 건수, 조각내기: 조각내기 };
});
