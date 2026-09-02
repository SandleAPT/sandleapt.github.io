'use strict';
/*
 * 타임라인 연도별 접기 (5.5d)
 *
 * 사용자 지적에서 나왔다 — 회의록 앱 ③은 최근 해만 펼치고 옛 해는 한 줄로 접어
 * **11년치가 한 화면에 들어온다.** Archive는 최신 6건만 자르고 나머지를 숨겼다.
 *
 * 여기서 고정하는 것은 **접는 것과 숨기는 것의 차이**다.
 * 접힌 해도 몇 건인지·몇 월인지는 남아야 한다. 안 그러면 그 해에 아무 일도 없었던 것처럼 보인다.
 *
 * 그리고 **번호 어긋남**을 막는다. 화면은 펼친 해의 항목만 번호를 매기는데,
 * 클릭 처리가 전체 배열을 쓰면 엉뚱한 안건이 열린다. 눈으로는 절대 못 잡는 종류의 결함이다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage5-timeline-years'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // search-b.js 와 같은 규칙(그쪽은 DOM에 붙어 있어 통째로 못 불러온다 — 두 곳을 함께 고칠 것)
  function 연도(ym) { return String(ym || '').slice(0, 4); }
  function 해별로(items) {
    var out = [];
    (items || []).forEach(function (e) {
      var y = 연도(e.date); if (!y) return;
      var g = out.filter(function (x) { return x.해 === y; })[0];
      if (!g) { g = { 해: y, 항목: [] }; out.push(g); }
      g.항목.push(e);
    });
    return out.sort(function (a, b) { return b.해.localeCompare(a.해); });
  }
  function 펼친항목(items, 펼친연도) {
    return (items || []).filter(function (e) { return 연도(e.date) === 펼친연도; });
  }

  return {
    name: 'stage5-timeline-years',
    title: '타임라인 연도별 접기',
    deps: [],
    run: function (ctx) {
      var assert = ctx.assert;
      var 항목 = [
        { date: '2026.08', title: 'ㄱ' }, { date: '2026.02', title: 'ㄴ' },
        { date: '2025.09', title: 'ㄷ' }, { date: '2025.03', title: 'ㄹ' }, { date: '2025.01', title: 'ㅁ' },
        { date: '2016.06', title: 'ㅂ' }
      ];

      var 해 = 해별로(항목);
      assert.equal(해.length, 3, '2026·2025·2016 세 해');
      assert.equal(해[0].해, '2026', '최신 해가 먼저');
      assert.equal(해[해.length - 1].해, '2016', '가장 오래된 해가 끝');
      assert.equal(해[1].항목.length, 3, '2025년 3건');
      /* 접힌 해도 건수가 남는다. 이것이 '접는 것'과 '숨기는 것'의 차이다 —
         건수가 없으면 그 해에 아무 일도 없었던 것처럼 보인다. */
      assert.equal(해[2].항목.length, 1, '10년 전 해도 건수가 남는다');

      // 한 건도 빠지지 않는다 — 예전엔 40건에서 잘렸다
      var 총 = 해.reduce(function (n, g) { return n + g.항목.length; }, 0);
      assert.equal(총, 항목.length, '모든 항목이 어느 해엔가 들어간다');

      // 날짜가 없는 항목은 어느 해에도 넣지 않는다(빈 해를 만들지 않는다)
      assert.equal(해별로([{ date: '', title: 'x' }, { date: '2026.01', title: 'y' }]).length, 1, '날짜 없는 항목은 해를 만들지 않는다');
      assert.equal(해별로([]).length, 0, '빈 목록이면 해도 없다');

      /* 펼친 해의 항목만 화면에 번호가 붙는다. 클릭 처리도 같은 배열을 써야 한다.
         2026-09-02에 이 자리에서 전체 배열을 쓰면 2025년 첫 항목을 눌렀을 때
         2026년 것이 열린다 — 눈으로는 못 잡는다. */
      var 펼침 = 펼친항목(항목, '2025');
      assert.equal(펼침.length, 3, '2025년만 3건');
      assert.equal(펼침[0].title, 'ㄷ', '펼친 해의 0번은 그 해의 첫 항목');
      assert.equal(펼친항목(항목, '2026')[0].title, 'ㄱ', '2026년의 0번은 ㄱ');
      assert.equal(펼친항목(항목, '2016').length, 1, '한 건뿐인 해도 펼친다');
      assert.equal(펼친항목(항목, '2099').length, 0, '없는 해면 빈 목록 — 클릭해도 아무 일이 없어야 한다');
    }
  };
});
