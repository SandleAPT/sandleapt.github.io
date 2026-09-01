/*
 * live.js — 실제 회의록을 읽어 공개 화면 자료로 바꾼다
 *
 * 지금까지 공개 화면은 손으로 쓴 샘플로 돌았다. 이제 `/minutes/data-YYYY.json`
 * 정적 사본(같은 origin)을 읽어 실제 회의 224건·안건 1,212건을 보여준다.
 *
 * 왜 정적 사본을 읽는가: 클라우드를 직접 부르면 방문자마다 Apps Script를 두드리게 되고
 * 느리다(건당 2초 이상). 사본은 하루 한 번 다시 만들어지므로 그날 새로 저장한 것은
 * 하루 늦게 보인다(`4.6` 신선도). 공개 화면에는 그 정도 지연이 문제되지 않는다.
 *
 * app.js는 이 전역을 읽어 그린다. 다 읽기 전에는 안내 문구를 보여준다.
 */
(function () {
  'use strict';

  // 샘플이 있으면 그것부터 넣어 화면이 비어 보이지 않게 한다.
  window.SANDLE_ARCHIVE_SAMPLE = window.SANDLE_ARCHIVE_SAMPLE || { topics: [], recentRecords: [] };

  async function 연도목록() {
    try {
      var idx = await fetch('/minutes/data-index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; });
      if (idx && idx.years && idx.years.length) {
        return idx.years.map(function (y) { return { year: y.year, file: y.file, v: y.updatedAt || '' }; });
      }
    } catch (e) {}
    // 목차를 못 읽으면 연도를 훑는다. 없는 해는 그냥 건너뛴다.
    var out = [];
    for (var y = 2015; y <= new Date().getFullYear() + 1; y++) out.push({ year: String(y), file: 'data-' + y + '.json', v: '' });
    return out;
  }

  async function 회의불러오기() {
    var 연도 = await 연도목록();
    var 회의 = [];
    await Promise.all(연도.map(async function (y) {
      try {
        // 연도 파일은 updatedAt을 캐시 키로 쓴다. 안 바뀐 해는 브라우저 캐시를 그대로 쓴다.
        var url = '/minutes/' + y.file + (y.v ? '?v=' + encodeURIComponent(y.v) : '');
        var j = await fetch(url, { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : null; });
        if (!j || !j.items) return;
        j.items.forEach(function (it) {
          var o;
          try { o = JSON.parse(it.json); } catch (e) { return; }
          회의.push({
            id: it.id,
            name: (o.meeting && o.meeting.name) || it.name || it.id,
            date: (o.meeting && o.meeting.date) || it.date || '',
            agendas: o.agendas || []
          });
        });
      } catch (e) {}
    }));
    회의.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    return 회의;
  }

  /*
   * 회의록 앱의 `autoTags`와 **같은 규칙**을 여기서 다시 만든다.
   *   제목을 먼저 훑고, 걸리면 본문은 보지 않는다. 걸린 주제는 모두 돌려준다.
   * 회의록의 `archive-topics.js`를 그대로 싣지 않는 이유: 그 파일은 주제 화면 UI와
   * 클라우드 설정까지 들어 있어 공개 페이지에서 없는 요소를 건드릴 수 있다.
   * 규칙이 갈리지 않도록 두 곳을 함께 고칠 것 — 기준은 `minutes/assets/js/app/archive-topics.js`.
   */
  function 훑기(t, defs) {
    var s = String(t || ''), out = [];
    for (var i = 0; i < defs.length; i++) {
      for (var j = 0; j < (defs[i].kw || []).length; j++) {
        if (s.indexOf(defs[i].kw[j]) >= 0) { out.push(defs[i].key); break; }
      }
    }
    return out;
  }
  function 자동태그(a) {
    var defs = (window.TopicTaxonomy && window.TopicTaxonomy.defs) || [];
    var 제목 = 훑기(a && a.title, defs);
    if (제목.length) return 제목;
    var 본문 = 훑기(((a && a.decision) || '') + ' ' + ((a && a.summary) || ''), defs);
    return 본문.length ? 본문 : ['기타'];
  }

  window.SandleArchiveLive = {
    자동태그: 자동태그,
    준비: (async function () {
      var B = window.SandleArchiveBuild;
      if (!B) return null;
      var 회의 = await 회의불러오기();
      if (!회의.length) return null;           // 못 읽으면 샘플을 그대로 둔다
      var 자료 = B.build(회의, window.TopicTaxonomy, 자동태그, Date.now());
      window.SANDLE_ARCHIVE_SAMPLE = 자료;
      window.SANDLE_ARCHIVE_LIVE = true;
      return 자료;
    })()
  };
})();
