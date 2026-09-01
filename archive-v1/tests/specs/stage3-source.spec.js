'use strict';
// 3.1 회의록 원본 읽기 — 인덱스/연도 로드와 연도 캐시 재사용
// 대응 node 테스트: archive-v1/tests/stage3-source.test.js (케이스 동일)
// fetch를 fixture로 가로채고 모듈 내부 캐시 상태에 의존하므로 격리 실행(isolate)한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage3-source'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage3-source',
    title: '회의록 원본 읽기·연도 캐시',
    deps: ['admin/stage3/meeting-source.js'],
    isolate: true,
    run: async function (ctx) {
      var assert = ctx.assert, g = ctx.global;
      var fixture = JSON.parse(await ctx.readText('tests/fixtures/stage3-meetings.json'));

      // 실제 /minutes/ 를 때리지 않도록 fetch를 fixture 응답으로 교체한다.
      var requests = [];
      g.fetch = function (url) {
        requests.push(String(url));
        var data = String(url).indexOf('data-index.json') >= 0 ? fixture.index : fixture.year;
        return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(JSON.stringify(data))); } });
      };

      var api = g.SandleMeetingSource;
      assert.ok(api, 'SandleMeetingSource 로드');

      var index = await api.loadIndex(false);
      assert.equal(index.years[0].year, '2026', '인덱스는 최신 연도가 앞');

      var pack = await api.loadYear('2026', false);
      assert.equal(pack.items.length, 1, '연도 데이터 1건');

      var parsed = api.parseRecord(pack.items[0]);
      assert.equal(api.bodyOf(parsed), '입대의', '회의체 판별');
      assert.equal(requests.length, 2, '인덱스 1회 + 연도 1회만 요청');

      await api.loadYear('2026', false);
      assert.equal(requests.length, 2, '같은 연도 재요청 시 캐시를 재사용해야 함');
    }
  };
});
