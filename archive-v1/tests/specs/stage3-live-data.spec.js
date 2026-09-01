'use strict';
// 3.6 실제 데이터 전량 변환 — /minutes/ 연도 샤드를 모두 읽어 Document/Fragment로 변환한다.
// 대응 node 테스트: archive-v1/tests/stage3-live-data.test.js (SANDLE_MINUTES_ROOT 필요)
//
// node판은 파일시스템을 훑지만 브라우저에서는 같은 origin의 /minutes/data-index.json으로 연도를 찾는다.
// 실제 taxonomy(/minutes/assets/js/app/topic-defs.js)를 그대로 싣기 때문에 minutes 쪽 분류 규칙이 바뀌면
// 이 spec이 먼저 깨진다 — Archive와 minutes의 접점을 지키는 회귀 검사 역할을 한다.
//
// 검증은 건수를 고정하지 않는다. 회의록이 계속 늘어나므로 '구조가 어긋나지 않는지'만 본다.
// (2026-09-01 입대의 게시판 전수 이관으로 213회의/1,125안건 → 크게 증가)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage3-live-data'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage3-live-data',
    title: '실제 회의록 전량 변환(/minutes/)',
    deps: ['admin/stage3/meeting-adapter.js'],
    isolate: true,
    // 어댑터가 로드 시점에 참조하므로 실제 taxonomy와 라벨러를 먼저 깐다.
    setup: async function (ctx) {
      var g = ctx.global;
      g.SandleMeetingSource = { bodyLabel: function (b) { return b === '임차' ? '임차인대표회의' : '입주자대표회의'; } };
      // 격리 iframe의 location은 about:blank라 ctx.origin(부모 기준)을 쓴다.
      var origin = ctx.origin || location.origin;
      await new Promise(function (resolve, reject) {
        var s = g.document.createElement('script');
        s.src = origin + '/minutes/assets/js/app/topic-defs.js?cb=' + Date.now();
        s.onload = resolve;
        s.onerror = function () { reject(new Error('minutes topic-defs.js 로드 실패')); };
        g.document.head.appendChild(s);
      });
      if (!g.TopicTaxonomy) throw new Error('TopicTaxonomy 전역이 만들어지지 않음');
    },
    run: async function (ctx) {
      var assert = ctx.assert, g = ctx.global;
      var adapter = g.SandleMeetingAdapter;
      assert.ok(adapter, 'SandleMeetingAdapter 로드');

      var origin = ctx.origin || location.origin;
      var getJson = function (url) {
        return fetch(origin + url + '?cb=' + Date.now()).then(function (r) {
          if (!r.ok) throw new Error('불러오기 실패(' + r.status + '): ' + url);
          return r.json();
        });
      };

      var index = await getJson('/minutes/data-index.json');
      var years = (index && index.years) || [];
      assert.ok(years.length > 0, '연도 인덱스가 비어 있지 않음');

      var meetings = 0, fragments = 0, ids = {}, dup = 0, mismatch = 0, perYear = [];
      for (var i = 0; i < years.length; i++) {
        var y = years[i];
        var pack = await getJson('/minutes/' + (y.file || ('data-' + y.year + '.json')));
        var items = (pack && pack.items) || [];
        var yearFragments = 0;
        for (var j = 0; j < items.length; j++) {
          var record = items[j];
          var state = typeof record.json === 'string' ? JSON.parse(record.json) : record.json;
          var conv = adapter.convert({ record: record, state: state });
          // 안건 수와 Fragment 수가 다르면 변환에서 누락·중복이 생긴 것이다.
          if (conv.fragments.length !== (state.agendas || []).length) mismatch++;
          for (var k = 0; k < conv.fragments.length; k++) {
            var id = conv.fragments[k].id;
            if (ids[id]) dup++;
            ids[id] = 1;
            fragments++; yearFragments++;
          }
          meetings++;
        }
        perYear.push(y.year + ':' + items.length + '회의/' + yearFragments + '안건');
      }

      assert.ok(meetings > 0, '회의 데이터가 있어야 함');
      assert.equal(mismatch, 0, '안건 수와 Fragment 수 불일치 0건');
      assert.equal(dup, 0, 'Fragment ID 중복 0건');

      // 러너 화면에는 통과 여부만 남으므로, 실제 건수는 전역에 남겨 인계 기록에 옮긴다.
      g.parent.__sandleLiveDataStats = { meetings: meetings, fragments: fragments, years: years.length, perYear: perYear };
    }
  };
});
