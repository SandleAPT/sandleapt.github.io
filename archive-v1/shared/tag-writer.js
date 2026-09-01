/*
 * tag-writer.js — 주제 훑어보기에서 고친 태그를 회의록 레코드에 쓴다 (2.4g)
 *
 * 사용자 결정(2026-09-02): 태그는 회의록 앱의 안건 태그(`a.tags`)를 단일 출처로 삼는다.
 * 2026-09-02 03:10 KST에 3건으로 직접 확인한 절차를 그대로 코드로 옮긴 것이다.
 *
 * 왜 조심해야 하나 — 저장 단위가 **회의 레코드 하나**다.
 *   안건 태그 하나를 바꾸려 해도 그 회의 전체(8~12K자)를 다시 저장해야 한다.
 *   이 구조 때문에 2026-09-01에 회의 64건의 `date`가 지워졌다.
 *   그래서 아래 세 가지를 규칙으로 박아 둔다.
 *     ① `date`를 반드시 실어 보낸다. 값은 `json.meeting.date`에서 가져온다.
 *     ② 재조회 검증은 문자열이 아니라 **파싱한 내용**으로 대조한다.
 *        (원본은 콜론 뒤에 공백이 있어 문자열 비교하면 멀쩡한 저장도 실패로 잡힌다)
 *     ③ 바꾸려는 안건 말고 달라진 곳이 없는지 저장 **전에** 확인한다.
 *
 * 네트워크는 주입받는다(`api`). 그래야 검증에서 실제 저장 없이 흐름을 확인할 수 있다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleTagWriter = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 훑어보기 화면의 줄 id는 `<회의id>#<안건id>` 꼴이다.
  function splitRowId(rowId) {
    var s = String(rowId || ''), i = s.indexOf('#');
    if (i <= 0 || i === s.length - 1) return null;
    return { meetingId: s.slice(0, i), agendaId: s.slice(i + 1) };
  }

  // { '회의id#안건id': [주제...] } → { 회의id: { 안건id: [주제...] } }
  // 회의 하나를 한 번만 저장하기 위해 묶는다.
  function groupByMeeting(fixes) {
    var out = {};
    Object.keys(fixes || {}).forEach(function (rowId) {
      var p = splitRowId(rowId);
      if (!p) return;
      var tags = (fixes[rowId] || []).filter(Boolean);
      if (!tags.length) return;          // 빈 태그로 덮어쓰지 않는다
      (out[p.meetingId] = out[p.meetingId] || {})[p.agendaId] = tags;
    });
    return out;
  }

  function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  /*
   * 레코드 json에 태그를 적용한 새 json을 만든다.
   * 원본을 건드리지 않고, 무엇이 적용됐고 무엇을 못 찾았는지 함께 돌려준다.
   * 태그 말고 달라진 곳이 있으면 `안전함:false`가 된다.
   */
  function applyTags(jsonText, changes) {
    var obj;
    try { obj = JSON.parse(jsonText); } catch (e) { return { 오류: 'json 파싱 실패' }; }
    var 원본 = JSON.parse(jsonText);     // 대조용 사본
    var applied = [], missing = [];

    Object.keys(changes || {}).forEach(function (agendaId) {
      var a = (obj.agendas || []).filter(function (x) { return x && x.id === agendaId; })[0];
      if (!a) { missing.push(agendaId); return; }
      a.tags = changes[agendaId].slice();
      applied.push(agendaId);
    });

    // 태그를 도로 떼면 원본과 같아야 한다. 다르면 다른 곳이 바뀐 것이다.
    var 되돌림 = JSON.parse(JSON.stringify(obj));
    applied.forEach(function (id) {
      var a = (되돌림.agendas || []).filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      var 옛 = (원본.agendas || []).filter(function (x) { return x.id === id; })[0];
      if (옛 && Object.prototype.hasOwnProperty.call(옛, 'tags')) a.tags = 옛.tags;
      else delete a.tags;
    });

    return {
      json: JSON.stringify(obj),
      date: (obj.meeting && obj.meeting.date) || '',
      applied: applied,
      missing: missing,
      안전함: deepEqual(되돌림, 원본)
    };
  }

  function 같은날(a, b) {
    var da = new Date(a), db = new Date(b);
    if (isNaN(da) || isNaN(db)) return String(a || '') === String(b || '');
    return da.toDateString() === db.toDateString();
  }

  /*
   * 실제 쓰기. api = { get(id) -> item, save(record) -> {ok}, wait(ms) }
   * 회의 하나가 실패해도 나머지는 계속한다. 성공한 회의의 줄 id를 돌려주므로
   * 화면은 그것만 지역 저장에서 지우면 된다.
   */
  async function writeAll(fixes, api, onProgress) {
    var grouped = groupByMeeting(fixes);
    var 회의목록 = Object.keys(grouped);
    var 성공 = [], 실패 = [], 못찾음 = [];

    for (var i = 0; i < 회의목록.length; i++) {
      var mid = 회의목록[i];
      if (onProgress) onProgress({ 진행: i + 1, 전체: 회의목록.length, 회의: mid });
      try {
        var it = await api.get(mid);
        if (!it || !it.json) throw new Error('레코드를 못 읽었다');

        var r = applyTags(it.json, grouped[mid]);
        if (r.오류) throw new Error(r.오류);
        if (!r.안전함) throw new Error('태그 말고 다른 곳이 바뀌었다 — 저장하지 않는다');
        if (!r.applied.length) throw new Error('바꿀 안건을 하나도 못 찾았다');
        if (!r.date) throw new Error('회의 날짜(meeting.date)가 없다 — 날짜가 지워질 수 있어 저장하지 않는다');

        await api.save({ id: mid, name: it.name || '', date: r.date, json: r.json });
        if (api.wait) await api.wait(400);

        var back = await api.get(mid);
        if (!back) throw new Error('재조회 실패');
        // 문자열이 아니라 내용으로 대조한다
        if (!deepEqual(JSON.parse(back.json), JSON.parse(r.json))) throw new Error('재조회 내용 불일치');
        if (!같은날(back.date, r.date)) throw new Error('날짜가 달라졌다: ' + back.date);

        r.applied.forEach(function (aid) { 성공.push(mid + '#' + aid); });
        r.missing.forEach(function (aid) { 못찾음.push(mid + '#' + aid); });
      } catch (e) {
        Object.keys(grouped[mid]).forEach(function (aid) {
          실패.push({ 줄: mid + '#' + aid, 이유: (e && e.message) ? e.message : String(e) });
        });
      }
      if (api.wait) await api.wait(200);
    }
    return { 성공: 성공, 실패: 실패, 못찾음: 못찾음, 회의수: 회의목록.length };
  }

  return {
    splitRowId: splitRowId,
    groupByMeeting: groupByMeeting,
    applyTags: applyTags,
    writeAll: writeAll
  };
});
