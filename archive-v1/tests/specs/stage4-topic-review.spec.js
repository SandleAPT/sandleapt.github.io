'use strict';
// 2.4 주제 훑어보기 — 줄 만들기·정렬·거르기 로직.
// 화면은 검증하지 않고, 무엇이 위로 오고 무엇이 걸러지는지만 고정한다.
// 확인이 급한 것이 위로 오지 않으면 1,200줄짜리 화면은 쓸모가 없다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-topic-review'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 실제 classify를 부르지 않고, 판정 결과를 흉내 내 로직만 본다.
  function 가짜판정(맵) {
    return function (f) { return 맵[f.title] || { topic: '기타', reason: 'no-match', alternatives: [], why: '' }; };
  }

  return {
    name: 'stage4-topic-review',
    title: '주제 훑어보기 로직',
    deps: ['shared/topic-review-model.js'],
    run: function (ctx) {
      var assert = ctx.assert, M = ctx.global.SandleTopicReview;
      assert.ok(M, 'SandleTopicReview 로드');

      var 판정 = 가짜판정({
        '주차장 차단기': { topic: '주차', reason: 'title', alternatives: [], why: '주차가 걸림' },
        '주차 하자 건': { topic: '주차', reason: 'title', alternatives: [{ topic: '하자·소송' }], why: '둘 다' },
        '기타 안건': { topic: '승강기', reason: 'body-only', alternatives: [], why: '본문으로 짐작' },
        '가나다라': { topic: '기타', reason: 'no-match', alternatives: [], why: '단서 없음' }
      });
      var 안건 = [
        { id: 'a', title: '주차장 차단기', note: '', 날짜: '2020-01-01' },
        { id: 'b', title: '주차 하자 건', note: '', 날짜: '2021-01-01' },
        { id: 'c', title: '기타 안건', note: '승강기 점검', 날짜: '2022-01-01' },
        { id: 'd', title: '가나다라', note: '', 날짜: '2023-01-01' }
      ];

      var 줄 = M.buildRows(안건, 판정, {});
      assert.equal(줄.length, 4, '안건 수만큼 줄이 나온다');

      // 상태 판정
      var byId = {}; 줄.forEach(function (r) { byId[r.id] = r; });
      assert.equal(byId.a.상태, 'title', '제목에서 단일 판정');
      assert.equal(byId.b.상태, 'title-multi', '제목에서 여러 주제면 따로 표시');
      assert.equal(byId.c.상태, 'body-only', '본문 판정');
      assert.equal(byId.d.상태, 'no-match', '못 찾음');

      /* 정렬 — 확인이 급한 것이 위로. 이게 이 화면의 전부다.
         못 찾음 → 본문으로 짐작 → 여러 주제 → 안건명으로 판정 */
      var 정렬 = M.sortRows(줄).map(function (r) { return r.상태; });
      assert.equal(정렬[0], 'no-match', '못 찾음이 맨 위');
      assert.equal(정렬[1], 'body-only', '본문 판정이 그 다음');
      assert.equal(정렬[3], 'title', '깔끔히 판정된 것이 맨 아래');

      // 사람이 고친 것은 맨 위로 온다(방금 바꾼 것이 눈에 보여야 한다).
      var 고침 = M.buildRows(안건, 판정, { d: '선거·임원' });
      var 고친줄 = 고침.filter(function (r) { return r.id === 'd'; })[0];
      assert.equal(고친줄.상태, 'fixed', '고친 것은 fixed');
      assert.equal(고친줄.주제, '선거·임원', '고친 주제가 반영된다');
      assert.equal(고친줄.자동주제, '기타', '자동 판정이 무엇이었는지도 남긴다');
      assert.equal(M.sortRows(고침)[0].id, 'd', '고친 것이 맨 위로');

      // 같은 급함 안에서는 날짜 최신순
      var 같은급 = M.sortRows(M.buildRows([
        { id: 'x', title: '주차장 차단기', note: '', 날짜: '2019-01-01' },
        { id: 'y', title: '주차장 차단기', note: '', 날짜: '2024-01-01' }
      ], 판정, {}));
      assert.equal(같은급[0].id, 'y', '같은 상태면 최신이 위');

      // 거르기 — 조건은 모두 만족해야 한다
      assert.equal(M.filterRows(줄, { 상태: 'no-match' }).length, 1, '상태로 거르기');
      assert.equal(M.filterRows(줄, { 상태: '전체' }).length, 4, '전체는 다 통과');
      assert.equal(M.filterRows(줄, { 주제: '주차' }).length, 2, '주제로 거르기');
      assert.equal(M.filterRows(줄, { 검색: '차단기' }).length, 1, '안건명 검색');
      assert.equal(M.filterRows(줄, { 검색: '승강기 점검' }).length, 1, '본문도 검색된다');
      assert.equal(M.filterRows(줄, { 주제: '주차', 검색: '하자' }).length, 1, '조건은 함께 적용된다');
      assert.equal(M.filterRows(줄, { 검색: '없는말' }).length, 0, '없으면 0건');

      // 세기
      var 상태수 = M.countByStatus(줄);
      assert.equal(상태수.전체, 4, '전체 수');
      assert.equal(상태수['no-match'], 1, '상태별 수');
      var 주제수 = M.countByTopic(줄);
      assert.equal(주제수[0].주제, '주차', '많이 붙은 주제가 앞');
      assert.equal(주제수[0].수, 2, '주제별 수');

      // 빈 입력에도 죽지 않는다
      assert.equal(M.buildRows(null, 판정, {}).length, 0, '배열이 아니면 빈 목록');
      assert.equal(M.filterRows(null, {}).length, 0, '빈 목록 거르기');
      assert.equal(M.countByStatus(null).전체, 0, '빈 목록 세기');
    }
  };
});
