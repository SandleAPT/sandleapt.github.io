'use strict';
// 4.4 관계 문구 — 사용자 피드백(2026-09-01)에서 나온 요구를 코드로 고정한다.
//  ① 화면에 개발자용 영어 식별자가 그대로 나오면 안 된다.
//  ② 모르는 값은 감추지 말고 그대로 드러내야 한다(잘못 저장된 값을 놓치지 않게).
//  ③ verified와 inferred의 구분이 문구에서 드러나야 한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-relation-labels'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-relation-labels',
    title: '관계 문구(사람이 읽는 말)',
    deps: ['shared/relation-labels.js'],
    run: function (ctx) {
      var assert = ctx.assert, L = ctx.global.SandleRelationLabels;
      assert.ok(L, 'SandleRelationLabels 로드');

      // store.js·sample.js가 쓰는 관계 종류가 모두 문구를 가져야 한다.
      // 하나라도 빠지면 그 값을 고른 사람에게 식별자가 그대로 보인다.
      var USED = ['based_on', 'follow_up_to', 'implements', 'contract_for', 'supersedes', 'amends', 'related_to'];
      USED.forEach(function (v) {
        assert.equal(L.isKnownType(v), true, v + ' 문구 있음');
      });
      assert.equal(L.TYPES.length, USED.length, '정의된 관계 종류 수 일치');

      // ① 화면 문구에 영어 식별자가 섞이면 안 된다.
      L.TYPES.forEach(function (t) {
        assert.equal(/[a-z]+_[a-z]/.test(t.phrase), false, t.value + ' 문구에 식별자 없음');
        assert.equal(t.phrase.length > 4, true, t.value + ' 문구가 설명이 됨');
        assert.equal(t.help.length > 8, true, t.value + ' 도움말 있음');
      });
      L.EVIDENCE.forEach(function (e) {
        assert.equal(/[a-z]{4,}/.test(e.phrase), false, e.value + ' 문구에 영문 없음');
      });

      // ② 모르는 값은 감추지 않는다.
      assert.equal(L.typePhrase('made_up_type'), 'made_up_type', '모르는 종류는 그대로 노출');
      assert.equal(L.isKnownType('made_up_type'), false, '모르는 종류는 미지로 판정');
      assert.equal(L.typePhrase(''), '(지정 안 됨)', '빈 값은 빈칸이 아니라 표시');
      assert.equal(L.typePhrase(null), '(지정 안 됨)', 'null도 표시');

      // ③ verified와 inferred는 서로 다른 말이어야 한다.
      //    둘을 같은 뜻으로 쓰면 추정이 사실로 새어 나간다.
      assert.equal(L.evidencePhrase('verified') !== L.evidencePhrase('inferred'), true,
        'verified와 inferred 문구가 다름');
      assert.equal(L.evidenceTone('inferred'), 'low', 'inferred는 가장 약한 표시');
      assert.equal(L.evidenceTone('explicit'), 'good', 'explicit은 가장 강한 표시');
      // 모르는 근거 수준은 가장 약하게 본다(fail-closed).
      assert.equal(L.evidenceTone('whatever'), 'low', '모르는 근거 수준은 약하게 취급');

      // inferred 도움말은 '확인되지 않았다'는 뜻을 반드시 담는다.
      assert.equal(/확인/.test(L.EVIDENCE[2].help), true, 'inferred 도움말에 확인 여부 언급');
    }
  };
});
