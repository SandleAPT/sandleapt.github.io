'use strict';
// 2.4g 태그 쓰기 — 회의록 레코드에 안건 태그를 저장하는 경로.
// 저장 단위가 회의 레코드 하나라, 안건 태그만 바꾸려 해도 회의 전체를 다시 쓴다.
// 이 구조 때문에 2026-09-01에 회의 64건의 date가 지워졌다. 그 사고를 막는 규칙을 고정한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-tag-writer'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // 실제 원본처럼 콜론 뒤에 공백이 있는 형식으로 만든다.
  // 압축형으로 다시 쓰면 문자열은 달라지지만 내용은 같다 — 이걸 실패로 잡으면 안 된다.
  function 레코드(agendas, date) {
    return JSON.stringify({ meeting: { date: date || '2026-06-24', name: '테스트 회의' }, agendas: agendas }, null, 1);
  }

  // 가짜 서버. 저장된 것을 그대로 돌려준다.
  function 가짜서버(초기) {
    var 저장소 = JSON.parse(JSON.stringify(초기));
    var 기록 = [];
    return {
      기록: 기록,
      저장소: 저장소,
      get: function (id) { return Promise.resolve(저장소[id] ? JSON.parse(JSON.stringify(저장소[id])) : null); },
      save: function (rec) { 기록.push(rec); 저장소[rec.id] = JSON.parse(JSON.stringify(rec)); return Promise.resolve({ ok: true }); }
    };
  }

  return {
    name: 'stage4-tag-writer',
    title: '태그 쓰기(회의록 저장)',
    deps: ['shared/tag-writer.js'],
    run: async function (ctx) {
      var assert = ctx.assert, W = ctx.global.SandleTagWriter;
      assert.ok(W, 'SandleTagWriter 로드');

      // ── 줄 id 나누기
      assert.equal(W.splitRowId('m_1#a_2').meetingId, 'm_1', '회의 id를 뽑는다');
      assert.equal(W.splitRowId('m_1#a_2').agendaId, 'a_2', '안건 id를 뽑는다');
      assert.equal(W.splitRowId('회의만있음'), null, '# 없으면 null');
      assert.equal(W.splitRowId('#a'), null, '회의 id가 비면 null');

      // ── 회의 단위로 묶는다(회의 하나를 한 번만 저장하려고)
      var 묶음 = W.groupByMeeting({ 'm1#a': ['주차'], 'm1#b': ['조경·환경'], 'm2#c': ['장기수선'] });
      assert.equal(Object.keys(묶음).length, 2, '회의 두 개로 묶인다');
      assert.equal(Object.keys(묶음.m1).length, 2, 'm1에 안건 두 개');
      // 빈 태그로 덮어쓰지 않는다 — 실수로 태그를 지우는 경로를 막는다.
      assert.equal(Object.keys(W.groupByMeeting({ 'm1#a': [] })).length, 0, '빈 태그는 무시');

      // ── 태그만 적용되고 다른 곳은 그대로여야 한다
      var json = 레코드([
        { id: 'a', title: '안건 하나', summary: '내용', votes: { for: 3 } },
        { id: 'b', title: '안건 둘', tags: ['관리규약', '잡수입·예산'] }
      ]);
      var r = W.applyTags(json, { a: ['주차'] });
      assert.equal(r.안전함, true, '태그 말고 바뀐 곳이 없다');
      assert.equal(r.applied.join(','), 'a', '적용된 안건');
      assert.equal(r.date, '2026-06-24', '날짜를 meeting.date에서 꺼낸다');
      var 새 = JSON.parse(r.json);
      assert.equal(새.agendas[0].tags.join(','), '주차', '태그가 붙었다');
      assert.equal(새.agendas[0].summary, '내용', '다른 필드는 그대로');
      assert.equal(새.agendas[1].tags.join(','), '관리규약,잡수입·예산', '다른 안건의 태그를 건드리지 않는다');
      assert.equal(새.meeting.name, '테스트 회의', '회의 정보도 그대로');

      // 없는 안건은 조용히 건너뛰되 알린다
      var r2 = W.applyTags(json, { 없는안건: ['주차'] });
      assert.equal(r2.missing.join(','), '없는안건', '못 찾은 안건을 남긴다');
      assert.equal(r2.applied.length, 0, '적용된 것 없음');
      assert.equal(W.applyTags('{망가진', { a: ['주차'] }).오류.length > 0, true, '깨진 json은 오류');

      // ── 실제 흐름: 저장되고, 검증되고, 성공 목록이 돌아온다
      var 서버 = 가짜서버({ m1: { id: 'm1', name: '회의1', date: '2026-06-24', json: json } });
      var 결과 = await W.writeAll({ 'm1#a': ['주차'] }, 서버);
      assert.equal(결과.성공.join(','), 'm1#a', '성공 줄 id를 돌려준다');
      assert.equal(결과.실패.length, 0, '실패 없음');
      assert.equal(서버.기록.length, 1, '회의 하나를 한 번만 저장한다');

      /* ── 가장 중요한 규칙: date를 반드시 실어 보낸다 ──────────────
       * 2026-09-01에 이 자리에서 회의 64건의 date가 지워졌다.
       * GAS는 받은 값을 그대로 쓰므로 빠뜨리면 기존 날짜가 사라진다. */
      assert.equal(서버.기록[0].date, '2026-06-24', 'date를 실어 보냈다');
      assert.equal(서버.기록[0].id, 'm1', 'id를 실어 보냈다');
      assert.equal(서버.기록[0].name, '회의1', 'name을 실어 보냈다');

      // 회의 날짜가 없으면 아예 저장하지 않는다(날짜를 지우느니 멈춘다).
      var 날짜없음 = JSON.stringify({ meeting: { name: '날짜 없는 회의' }, agendas: [{ id: 'a' }] });
      var 서버2 = 가짜서버({ m1: { id: 'm1', name: '회의1', date: '', json: 날짜없음 } });
      var 결과2 = await W.writeAll({ 'm1#a': ['주차'] }, 서버2);
      assert.equal(서버2.기록.length, 0, '날짜가 없으면 저장하지 않는다');
      assert.equal(/날짜/.test(결과2.실패[0].이유), true, '이유에 날짜가 나온다');

      /* ── 형식 차이를 실패로 잡지 않는다 ────────────────────────
       * 원본은 콜론 뒤에 공백이 있고 우리가 쓰는 것은 압축형이다.
       * 문자열로 대조하면 멀쩡한 저장이 전부 실패로 잡힌다(2026-09-01 실제로 겪음). */
      assert.equal(서버.저장소.m1.json.indexOf('\n') < 0, true, '저장된 것은 압축형');
      assert.equal(json.indexOf('\n') >= 0, true, '원본은 형식이 다름');
      assert.equal(결과.성공.length, 1, '형식이 달라도 통과한다');

      // ── 한 회의가 실패해도 다른 회의는 저장된다
      var 서버3 = 가짜서버({
        m1: { id: 'm1', name: '회의1', date: '2026-06-24', json: json },
        m2: { id: 'm2', name: '회의2', date: '2026-05-20', json: '{깨진json' }
      });
      var 결과3 = await W.writeAll({ 'm1#a': ['주차'], 'm2#z': ['장기수선'] }, 서버3);
      assert.equal(결과3.성공.join(','), 'm1#a', '멀쩡한 회의는 저장된다');
      assert.equal(결과3.실패.length, 1, '깨진 회의만 실패');
      assert.equal(결과3.실패[0].줄, 'm2#z', '실패한 줄을 알려준다');

      // 재조회 내용이 다르면 실패로 잡는다(서버가 다른 걸 돌려준 경우)
      var 서버4 = 가짜서버({ m1: { id: 'm1', name: '회의1', date: '2026-06-24', json: json } });
      서버4.save = function (rec) { 서버4.기록.push(rec); return Promise.resolve({ ok: true }); }; // 저장한 척만 함
      var 결과4 = await W.writeAll({ 'm1#a': ['주차'] }, 서버4);
      assert.equal(결과4.성공.length, 0, '저장이 안 됐으면 성공으로 치지 않는다');
      assert.equal(/불일치/.test(결과4.실패[0].이유), true, '재조회 불일치를 잡는다');

      /* ── setTags 경로 (GAS v3, 2026-09-02 배포) ────────────────────
       * 서버가 시트의 json 열만 고친다. 브라우저가 레코드를 다시 만들지 않으므로
       * date를 건드릴 여지가 아예 없다. 왕복도 3회에서 1회로 준다.
       * api에 setTags가 있으면 이 길을 쓰고, 없으면 옛 길로 돌아간다.
       */
      var 부른것 = [];
      var 새서버 = {
        setTags: function (id, changes) {
          부른것.push({ id: id, changes: changes });
          return Promise.resolve({ ok: true, id: id, applied: Object.keys(changes), missing: [] });
        }
      };
      var 결과5 = await W.writeAll({ 'm1#a': ['주차'], 'm1#b': ['조경·환경'], 'm2#c': ['장기수선'] }, 새서버);
      assert.equal(결과5.방식, 'setTags', 'setTags가 있으면 그 길을 쓴다');
      assert.equal(부른것.length, 2, '회의 단위로 한 번씩만 부른다');
      assert.equal(Object.keys(부른것[0].changes).length, 2, '한 회의의 안건들을 한 번에 보낸다');
      assert.equal(결과5.성공.length, 3, '안건 셋 모두 성공');
      // 옛 길과 달리 레코드를 읽지도 저장하지도 않는다 — get/save가 없어도 된다.
      assert.equal(새서버.get === undefined && 새서버.save === undefined, true, 'get/save 없이 동작한다');

      // 서버가 거부하면 그 회의만 실패로 남는다
      var 거부서버 = { setTags: function () { return Promise.resolve({ ok: false, error: 'admin_required' }); } };
      var 결과6 = await W.writeAll({ 'm1#a': ['주차'] }, 거부서버);
      assert.equal(결과6.성공.length, 0, '거부되면 성공 없음');
      assert.equal(/admin_required/.test(결과6.실패[0].이유), true, '서버가 준 이유를 그대로 전한다');

      // 못 찾은 안건은 missing으로 돌아온다
      var 일부서버 = {
        setTags: function (id, changes) {
          var ks = Object.keys(changes);
          return Promise.resolve({ ok: true, applied: [ks[0]], missing: ks.slice(1) });
        }
      };
      var 결과7 = await W.writeAll({ 'm1#a': ['주차'], 'm1#b': ['조경·환경'] }, 일부서버);
      assert.equal(결과7.성공.join(','), 'm1#a', '적용된 것만 성공');
      assert.equal(결과7.못찾음.join(','), 'm1#b', '못 찾은 것은 따로 알린다');

      // setTags가 없으면 옛 길로 돌아간다 — 서버 배포가 되돌려져도 동작해야 한다
      var 옛서버 = 가짜서버({ m1: { id: 'm1', name: '회의1', date: '2026-06-24', json: json } });
      var 결과8 = await W.writeAll({ 'm1#a': ['주차'] }, 옛서버);
      assert.equal(결과8.방식, '전체쓰기', 'setTags가 없으면 옛 길');
      assert.equal(결과8.성공.length, 1, '옛 길도 여전히 동작한다');
      assert.equal(옛서버.기록[0].date, '2026-06-24', '옛 길에서도 date는 반드시 실린다');
    }
  };
});
