'use strict';
/*
 * 핵심 요약이 실제 자료와 맞는가 (5.2)
 *
 * 왜 이 검사가 생겼나: 손으로 쓴 샘플에서는 맞던 요약이 **실제 회의록을 붙이니 틀렸다.**
 * 「가장 최근 흐름」이 가장 오래된 것을 가리켰다(하자·소송 화면에 2016.06이 '최근'으로 표시).
 * 샘플의 타임라인은 오래된 것이 먼저였고 실제 자료는 최신이 먼저인데, 코드가 **마지막 칸**을 집었다.
 *
 * 그래서 여기서 고정하는 것은 "순서에 기대지 않는다"이다. 정렬이 또 바뀌어도 답이 안 바뀌어야 한다.
 *
 * `search-b.js`는 DOM에 붙어 도는 화면 코드라 통째로 불러올 수 없다. 요약을 만드는 규칙만
 * 같은 모양으로 옮겨 검사한다 — 규칙이 갈리지 않도록 두 곳을 함께 고칠 것.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage5-summary'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // search-b.js 의 summaryItems 와 같은 규칙
  function 최근항목(timeline) {
    if (!timeline || !timeline.length) return null;
    return timeline.reduce(function (a, b) { return String(b.date || '') > String(a.date || '') ? b : a; });
  }

  return {
    name: 'stage5-summary',
    title: '핵심 요약 — 가장 최근이 정말 최근인가',
    deps: [],
    run: function (ctx) {
      var assert = ctx.assert;

      var 최신먼저 = [
        { date: '2026.08', title: '민사소송 진행' },
        { date: '2026.06', title: '손해배상금 공용부분' },
        { date: '2016.06', title: '공공시설물 하자' }
      ];
      var 오래된것먼저 = 최신먼저.slice().reverse();

      /* 어느 순서로 들어와도 답이 같아야 한다. 이것이 이 검사의 전부다. */
      assert.equal(최근항목(최신먼저).date, '2026.08', '최신이 먼저 와도 2026.08');
      assert.equal(최근항목(오래된것먼저).date, '2026.08', '오래된 것이 먼저 와도 2026.08');
      assert.equal(최근항목(오래된것먼저).title, '민사소송 진행', '제목도 그 항목의 것');

      // 정렬이 아예 뒤죽박죽이어도
      var 뒤죽박죽 = [최신먼저[1], 최신먼저[2], 최신먼저[0]];
      assert.equal(최근항목(뒤죽박죽).date, '2026.08', '순서가 없어도 가장 큰 날짜');

      // 한 건뿐이면 그것
      assert.equal(최근항목([{ date: '2020.01', title: 'x' }]).date, '2020.01', '한 건이면 그것');

      // 비어 있으면 만들지 않는다 — 없는 것을 있는 것처럼 쓰지 않는다
      assert.equal(최근항목([]), null, '빈 목록이면 없음');
      assert.equal(최근항목(null), null, '입력이 없어도 죽지 않는다');

      /* 날짜가 빠진 항목이 섞여도 날짜 있는 것을 고른다.
         빈 날짜가 이기면 '가장 최근'이 빈칸으로 나온다. */
      var 날짜없음섞임 = [{ date: '', title: '날짜 미상' }, { date: '2026.08', title: '민사소송 진행' }];
      assert.equal(최근항목(날짜없음섞임).date, '2026.08', '날짜 없는 항목이 이기면 안 된다');
    }
  };
});
