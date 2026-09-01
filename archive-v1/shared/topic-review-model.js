/*
 * topic-review-model.js — 주제 훑어보기 화면의 순수 로직
 *
 * 배경: 분류는 기록당 한 번만 하면 되는 일이다(사용자 지적 2026-09-01).
 *      그래서 한 건씩 승인받는 게이트보다, **전부 한눈에 훑어보고 이상한 것만 고치는**
 *      화면이 맞다. 96건이든 1,212건이든 훑는 부담은 크게 다르지 않다.
 *
 * 화면(그리기)과 로직(줄 만들기·정렬·거르기)을 나눠 둔다. 로직만 spec으로 검증한다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleTopicReview = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /*
   * 확인이 얼마나 급한지. 낮을수록 먼저 본다.
   * 자동 판정을 못 한 것이 맨 위로 오고, 제목으로 깔끔히 판정된 것이 맨 아래로 간다.
   */
  var STATUS = {
    'no-match':  { rank: 0, key: 'no-match',  label: '못 찾음',      hint: '단서가 없어 사람이 정해야 한다', tone: 'low' },
    'body-only': { rank: 1, key: 'body-only', label: '본문으로 짐작', hint: '안건명에 단서가 없어 본문으로 짐작했다. 믿기 어렵다', tone: 'warn' },
    'title-multi': { rank: 2, key: 'title-multi', label: '여러 주제', hint: '안건명이 여러 주제에 걸린다. 대표 주제가 맞는지만 보면 된다', tone: 'ok' },
    'title':     { rank: 3, key: 'title',     label: '안건명으로 판정', hint: '안건명에서 바로 걸렸다', tone: 'good' },
    'fixed':     { rank: -1, key: 'fixed',    label: '직접 고침',    hint: '사람이 정한 주제', tone: 'good' }
  };

  function statusOf(판정, 고친주제) {
    if (고친주제) return STATUS.fixed;
    if (판정.reason === 'title') {
      return (판정.alternatives && 판정.alternatives.length) ? STATUS['title-multi'] : STATUS.title;
    }
    return STATUS[판정.reason] || STATUS['no-match'];
  }

  /*
   * 검토용 줄을 만든다.
   * agendas: [{id, 회의id, 회의명, 날짜, title, note}]
   * classify: fields -> 판정 (SandleAutoAssign.classify)
   * 고친것: { 안건id: '주제' }  사람이 바꾼 값
   */
  function buildRows(agendas, classify, 고친것) {
    고친것 = 고친것 || {};
    if (!Array.isArray(agendas)) return [];
    return agendas.map(function (a) {
      var 판정 = classify({ title: a.title, note: a.note });
      var 고침 = 고친것[a.id];
      var st = statusOf(판정, 고침);
      return {
        id: a.id,
        회의id: a.회의id, 회의명: a.회의명, 날짜: a.날짜,
        title: a.title || '',
        note: a.note || '',
        주제: 고침 || 판정.topic,
        자동주제: 판정.topic,
        고쳐짐: !!고침,
        후보: (판정.alternatives || []).map(function (x) { return x.topic; }),
        why: 판정.why || '',
        상태: st.key, 상태이름: st.label, 상태색: st.tone, rank: st.rank
      };
    });
  }

  // 확인이 급한 것부터, 같은 급함 안에서는 날짜 최신순.
  function sortRows(rows) {
    return rows.slice().sort(function (a, b) {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return String(b.날짜 || '').localeCompare(String(a.날짜 || ''));
    });
  }

  /*
   * 거르기. 조건은 모두 만족해야 한다(AND).
   *   상태: STATUS 키 또는 '전체'
   *   주제: 주제명 또는 '전체'
   *   검색: 안건명·본문에 들어 있는 글자
   */
  function filterRows(rows, 조건) {
    조건 = 조건 || {};
    var q = String(조건.검색 || '').trim().toLowerCase();
    return (rows || []).filter(function (r) {
      if (조건.상태 && 조건.상태 !== '전체' && r.상태 !== 조건.상태) return false;
      if (조건.주제 && 조건.주제 !== '전체' && r.주제 !== 조건.주제) return false;
      if (q && (r.title + ' ' + r.note).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  // 상태별 개수. 화면 위 요약과 필터 버튼에 쓴다.
  function countByStatus(rows) {
    var out = { 전체: (rows || []).length };
    (rows || []).forEach(function (r) { out[r.상태] = (out[r.상태] || 0) + 1; });
    return out;
  }

  // 주제별 개수(많은 것부터). 어떤 주제가 과하게 붙었는지 눈에 띄게 한다.
  function countByTopic(rows) {
    var m = {};
    (rows || []).forEach(function (r) { m[r.주제] = (m[r.주제] || 0) + 1; });
    return Object.keys(m).map(function (k) { return { 주제: k, 수: m[k] }; })
      .sort(function (a, b) { return b.수 - a.수 || a.주제.localeCompare(b.주제, 'ko'); });
  }

  return {
    STATUS: STATUS,
    statusOf: statusOf,
    buildRows: buildRows,
    sortRows: sortRows,
    filterRows: filterRows,
    countByStatus: countByStatus,
    countByTopic: countByTopic
  };
});
