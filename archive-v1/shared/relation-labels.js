/*
 * relation-labels.js — 관계 종류·근거 수준의 사람이 읽는 문구 (단일 출처)
 *
 * 배경: 관리자 화면이 `based_on · 근거`처럼 영어 식별자를 앞세워 보여줘서
 *      "무슨 말인지 모르겠다"는 사용자 지적이 있었다(2026-09-01).
 *      식별자는 저장·검색용이고, 화면에는 문장으로 읽히는 우리말이 나와야 한다.
 *
 * 원칙
 *  - 화면 문구는 '현재 자료'를 주어로 삼아 완결된 문장으로 읽히게 쓴다.
 *    화면이 「현재 자료 → 연결 후보」로 배치되므로, 목록에서 고른 항목이
 *    그대로 "이 자료는 (연결 후보를) …" 로 이어져야 뜻이 분명해진다.
 *  - 모르는 값이 들어오면 숨기지 말고 식별자를 그대로 보여준다.
 *    빈칸으로 두면 잘못 저장된 값을 아무도 눈치채지 못한다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleRelationLabels = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 순서 = 화면 선택 목록 순서. 자주 쓰는 것부터.
  var TYPES = [
    { value: 'based_on',     short: '근거로 삼음',   phrase: '이 자료가 근거로 삼은 문서',        help: '이 자료를 만들 때 바탕이 된 문서. 예: 의결의 바탕이 된 규약·공고' },
    { value: 'follow_up_to', short: '뒤이은 일',     phrase: '앞서 있었던 일의 후속',            help: '같은 사안이 이어진 경우. 예: 1차 공고 뒤의 2차 공고' },
    { value: 'implements',   short: '결정을 실행',   phrase: '앞선 결정을 실제로 집행한 기록',    help: '결정이 말로 그치지 않고 실행된 것. 예: 의결 뒤의 계약 체결' },
    { value: 'contract_for', short: '계약·운영',     phrase: '그 사안에 대한 계약·운영 문서',     help: '해당 사안을 실제로 굴리는 계약이나 운영 서류' },
    { value: 'supersedes',   short: '대체함',        phrase: '이전 것을 대체해 효력을 없앰',      help: '앞의 것이 더는 쓰이지 않게 된 경우' },
    { value: 'amends',       short: '고침',          phrase: '이전 것의 일부를 고침',            help: '전체를 갈아치우지 않고 일부만 바꾼 경우' },
    { value: 'related_to',   short: '그냥 관련',     phrase: '위 어느 것도 아니지만 관련 있음',   help: '관계가 분명하지 않을 때. 애매하면 연결하지 않는 편이 낫다' }
  ];

  /*
   * verified와 inferred의 차이가 실제로 가장 헷갈린다(사용자 질문, 2026-09-01).
   * 가르는 기준은 하나다 — **확인 작업을 실제로 했는가.**
   *   verified: 원문에 안 적혀 있지만, 다른 기록을 찾아보고 맞다고 확인했다. → 사실로 다뤄도 된다.
   *   inferred: 그럴듯해 보일 뿐, 확인한 사람이 없다.                     → 사실로 다루면 안 된다.
   * "아마 맞을 것 같다"는 verified가 아니라 inferred다. 확신의 세기가 아니라
   * 확인 행위의 유무로 나눈다. 그래야 나중에 누가 봐도 같은 기준이 된다.
   */
  var EVIDENCE = [
    { value: 'explicit', short: '문서에 적혀 있음', phrase: '문서에 그렇게 적혀 있음',
      help: '원문에 직접 쓰여 있다. 예: 회의록에 “2018년 2월 결의에 따라”라고 명시.', tone: 'good' },
    { value: 'verified', short: '찾아봐서 확인함', phrase: '원문엔 없지만 찾아봐서 확인함',
      help: '원문엔 없지만 다른 기록을 대조해 맞다고 확인했다. 예: 사건번호·날짜·금액이 일치. 무엇으로 확인했는지 말할 수 있어야 한다.', tone: 'warn' },
    { value: 'inferred', short: '추정 — 확인 안 함', phrase: '그래 보이지만 아직 확인 못 함',
      help: '시기나 주제가 비슷해 그래 보일 뿐, 대조해 본 사람이 없다. “아마 맞을 것 같다”도 여기다. 사실처럼 보이면 안 되고, 나중에 확인되면 위로 올린다.', tone: 'low' }
  ];

  function index(list) {
    var m = {};
    for (var i = 0; i < list.length; i++) m[list[i].value] = list[i];
    return m;
  }
  var TYPE_MAP = index(TYPES), EVIDENCE_MAP = index(EVIDENCE);

  // 모르는 값은 식별자를 그대로 돌려준다(감추지 않는다).
  function pick(map, value, field) {
    var hit = map[value];
    if (hit) return hit[field];
    return value == null || value === '' ? '(지정 안 됨)' : String(value);
  }

  return {
    TYPES: TYPES,
    EVIDENCE: EVIDENCE,
    typeShort: function (v) { return pick(TYPE_MAP, v, 'short'); },
    typePhrase: function (v) { return pick(TYPE_MAP, v, 'phrase'); },
    typeHelp: function (v) { return TYPE_MAP[v] ? TYPE_MAP[v].help : ''; },
    evidenceShort: function (v) { return pick(EVIDENCE_MAP, v, 'short'); },
    evidencePhrase: function (v) { return pick(EVIDENCE_MAP, v, 'phrase'); },
    evidenceTone: function (v) { return EVIDENCE_MAP[v] ? EVIDENCE_MAP[v].tone : 'low'; },
    isKnownType: function (v) { return !!TYPE_MAP[v]; },
    isKnownEvidence: function (v) { return !!EVIDENCE_MAP[v]; }
  };
});
