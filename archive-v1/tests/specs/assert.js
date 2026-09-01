'use strict';
// Archive v1 검증 공용 단언 유틸 (4.3d)
// node와 브라우저 양쪽에서 같은 spec을 돌리기 위한 최소 단언 집합.
// node에는 node:assert가 있지만, spec 파일이 런타임에 따라 갈라지지 않도록 여기 것만 쓴다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs.assert = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function show(v) {
    if (v === undefined) return 'undefined';
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  // 실패는 즉시 throw한다. 러너가 spec 단위로 잡아 결과를 모은다.
  function fail(label, actual, expected) {
    var e = new Error(label + ' — 기대 ' + show(expected) + ', 실제 ' + show(actual));
    e.name = 'AssertionError';
    throw e;
  }
  return {
    equal: function (actual, expected, label) {
      if (actual !== expected) fail(label || 'equal', actual, expected);
    },
    deepEqual: function (actual, expected, label) {
      if (show(actual) !== show(expected)) fail(label || 'deepEqual', actual, expected);
    },
    ok: function (value, label) {
      if (!value) fail(label || 'ok', value, '참인 값');
    },
    match: function (text, re, label) {
      if (!re.test(String(text == null ? '' : text))) fail(label || 'match', String(text).slice(0, 60) + '…', re.toString());
    },
    isNull: function (actual, label) {
      if (actual !== null) fail(label || 'isNull', actual, null);
    }
  };
});
