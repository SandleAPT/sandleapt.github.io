/*
 * unified-ui.js — 통합검색 결과 화면
 *
 * 검색창에 무엇을 넣든 **여러 갈래를 한꺼번에** 찾아 보여준다.
 * 지금까지는 주제 하나로만 갔다 — 「커뮤니티센터」를 넣으면 주제 화면이 열리고 끝이라,
 * 같은 낱말로 걸리는 계약·투표·규약 조문은 각각 다른 탭에서 따로 찾아야 했다.
 *
 * 이 파일은 search-b.js **앞에** 실려야 한다. 둘 다 submit을 capture로 잡는데
 * 같은 단계에서는 먼저 등록한 쪽이 먼저 돌기 때문이다. 여기서 stopImmediatePropagation으로
 * 끊고 결과 화면을 그린 뒤, 「주제」 항목을 누르면 그때 search-b의 주제 화면으로 넘긴다.
 * (주제 화면 자체는 search-b가 더 잘 그린다. 그 일을 여기서 다시 만들지 않는다.)
 *
 * 잠긴 자료는 unified-search.js가 아예 읽지 않는다 — 결과에 제목만 스쳐도
 * 특정 세대가 드러날 수 있기 때문이다. 대신 그런 자료가 있다는 것만 맨 아래에 한 줄 적는다.
 */
(function () {
  'use strict';

  var form = document.getElementById('searchForm');
  var input = document.getElementById('searchInput');
  var home = document.getElementById('homeView');
  var view = document.getElementById('topicView');
  if (!form || !input || !view) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  // 걸린 낱말에 표시를 해 준다 — 왜 이게 나왔는지 눈으로 보이게.
  function 강조(글, q) {
    var t = esc(글), qq = esc(q), out = '', low = t.toLowerCase(), ql = qq.toLowerCase(), from = 0, i;
    if (!ql) return t;
    while ((i = low.indexOf(ql, from)) >= 0) {
      out += t.slice(from, i) + '<mark>' + t.slice(i, i + qq.length) + '</mark>';
      from = i + qq.length;
    }
    return out + t.slice(from);
  }

  var 더보기 = {};   // 갈래마다 몇 개까지 폈는지
  var 처음 = 6;

  function 목록HTML(키, 이름, 설명, 항목들, q) {
    if (!항목들.length) return '';
    var n = 더보기[키] || 처음;
    var 보임 = 항목들.slice(0, n);
    var h = '<section class="uni-sec" id="uni-' + 키 + '"><div class="uni-sec-head"><h3>' + esc(이름) + '</h3>' +
      '<small>' + 항목들.length + '건' + (설명 ? ' · ' + esc(설명) : '') + '</small></div><div class="uni-list">';
    보임.forEach(function (x, i) {
      h += '<button type="button" class="uni-item" data-uni="' + esc(키) + '" data-i="' + i + '">' +
        '<b>' + 강조(x.제목, q) + '</b>' +
        (x.부제 ? '<span class="uni-meta">' + 강조(x.부제, q) + '</span>' : '') +
        (x.조각 ? '<span class="uni-snip">' + 강조(x.조각, q) + '</span>' : '') +
        '</button>';
    });
    h += '</div>';
    if (항목들.length > n)
      h += '<button type="button" class="uni-more" data-more="' + esc(키) + '">' +
        (항목들.length - n) + '건 더 보기</button>';
    h += '</section>';
    return h;
  }

  var 마지막결과 = null;

  function 그리기(r) {
    마지막결과 = r;
    var q = r.질의;
    var 총 = window.UnifiedSearch.건수(r);
    var 갈래 = [
      ['주제', '주제', r.주제, '이 낱말로 모아 둔 안건 묶음'],
      ['계약', '계약', r.계약, '계약서 본문과 조문까지 찾습니다'],
      ['계약묶음', '계약 묶음 안내', r.계약묶음, '살펴볼 것·확인이 필요한 것'],
      ['선거', '선거 · 투표 · 선관위', r.선거, ''],
      ['규약', '관리규약 조문', r.규약, '분양 ◆ / 임차 ◇'],
      ['안건', '회의 안건', r.안건, '최근 회의부터']
    ];
    var 칩 = 갈래.map(function (g) {
      return '<button type="button" data-jump="' + esc(g[0]) + '"' + (g[2].length ? '' : ' disabled') + '>' +
        esc(g[1]) + '<b>' + g[2].length + '</b></button>';
    }).join('');

    var 본문 = 갈래.map(function (g) { return 목록HTML(g[0], g[1], g[3], g[2], q); }).join('');
    if (!총) 본문 = '<p class="uni-empty">「' + esc(q) + '」로 찾은 것이 없습니다. 낱말을 줄여서 다시 찾아보세요 — 예를 들어 「승강기 유지관리」 대신 「승강기」.</p>';

    home.classList.add('is-hidden');
    view.classList.remove('is-hidden');
    view.innerHTML =
      '<div class="uni"><button type="button" class="home-link" data-b-home>← 첫 화면으로</button>' +
      '<header class="uni-head"><p class="uni-kicker">통합 검색</p><h2>' + esc(q) + '</h2>' +
      '<p class="uni-sub">' + (총 ? '회의 안건 · 계약 · 선거 · 관리규약에서 <b>' + 총 + '건</b>을 찾았습니다.' : '찾은 것이 없습니다.') + '</p>' +
      '<div class="uni-counts">' + 칩 + '</div></header>' + 본문 +
      '<div class="uni-locked">특정 세대나 개인이 드러나는 기록(제기된 절차 문제, 관리규약 대조)은 이 검색에 넣지 않습니다. 그 자료는 회의록 앱의 <b>⑤ 규약·공고 → 선거·선관위</b>에서 관리자 비밀번호를 넣은 기기에서만 보입니다.</div>' +
      '</div>';

    var hb = view.querySelector('[data-b-home]');
    if (hb) hb.onclick = function () {
      home.classList.remove('is-hidden'); view.classList.add('is-hidden');
      view.innerHTML = ''; input.value = '';
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    view.querySelectorAll('[data-jump]').forEach(function (b) {
      b.onclick = function () {
        var el = document.getElementById('uni-' + b.dataset.jump);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    });
    view.querySelectorAll('[data-more]').forEach(function (b) {
      b.onclick = function () { 더보기[b.dataset.more] = (더보기[b.dataset.more] || 처음) + 20; 그리기(마지막결과); };
    });
    view.querySelectorAll('[data-uni]').forEach(function (b) {
      b.onclick = function () { 열기(b.dataset.uni, Number(b.dataset.i)); };
    });
    view.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function 열기(키, i) {
    var 표 = { 주제: 마지막결과.주제, 계약: 마지막결과.계약, 계약묶음: 마지막결과.계약묶음,
               선거: 마지막결과.선거, 규약: 마지막결과.규약, 안건: 마지막결과.안건 };
    var x = (표[키] || [])[i];
    if (!x || !x.열기) return;
    if (x.열기.종류 === '주제') {
      /* 주제 화면은 search-b가 그린다. 그쪽이 붙여 둔 단추를 누르는 방식으로 넘긴다 —
         id로 찾는다. 글자로 찾으면 이름 옆 건수가 붙는 순간 조용히 끊긴다(2026-09-02 사고). */
      var btn = [].slice.call(document.querySelectorAll('#allTopics .topic-text-btn'))
        .filter(function (v) { return v.dataset.topicId === x.열기.id; })[0];
      if (btn) { btn.click(); return; }
      location.hash = '#topic-' + encodeURIComponent(x.열기.id);
      location.reload();
      return;
    }
    if (x.열기.주소) window.open(x.열기.주소, '_blank', 'noopener');
  }

  form.addEventListener('submit', function (e) {
    var q = input.value.trim();
    if (!q) return;
    if (!window.UnifiedSearch) return;   // 파일이 안 실렸으면 예전 동작에 맡긴다
    e.preventDefault();
    e.stopImmediatePropagation();
    더보기 = {};
    home.classList.add('is-hidden');
    view.classList.remove('is-hidden');
    view.innerHTML = '<div class="uni"><p class="uni-loading">「' + esc(q) + '」 찾는 중… 계약·선거·규약 자료를 처음 한 번만 받아옵니다.</p></div>';
    window.UnifiedSearch.준비().then(function (묶음) {
      그리기(window.UnifiedSearch.찾기(q, 묶음, window.SANDLE_ARCHIVE_SAMPLE || { topics: [] }));
    }).catch(function () {
      view.innerHTML = '<div class="uni"><p class="uni-empty">자료를 불러오지 못했습니다. 잠시 뒤 다시 찾아보세요.</p></div>';
    });
  }, true);
})();
