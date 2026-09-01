'use strict';
/*
 * 로그인 결과 읽기 (4.4)
 *
 * 왜 이런 작은 것에 검사를 붙이는가: 2026-09-02에 실제로 틀렸다.
 * signIn은 역할 문자열이 아니라 {ok, role}을 돌려주는데, 그 값을 그냥 참/거짓으로 봤다.
 * 객체는 언제나 참이므로 **틀린 비밀번호를 넣어도 로그인된 것처럼 그려졌다.**
 * 권한 화면이 실패를 성공처럼 보이는 쪽으로 틀리면 제일 나쁘다. 그래서 여기 고정한다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-login'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-login',
    title: '로그인 결과 읽기',
    deps: ['login.js'],
    run: function (ctx) {
      var assert = ctx.assert, L = ctx.global.SandleLogin;
      assert.ok(L, 'SandleLogin 로드');

      // 성공
      assert.equal(L.역할({ ok: true, role: 'view' }), 'view', '통과하면 역할을 준다');
      assert.equal(L.역할({ ok: true, role: 'edit' }), 'edit', '관리자도 마찬가지');

      // 실패 — 여기가 사고가 났던 자리
      assert.equal(L.역할({ ok: false, role: '' }), '', '거절이면 빈 값');
      assert.equal(L.역할({ ok: false, role: 'edit' }), '', 'ok가 아니면 role이 있어도 안 믿는다');
      assert.equal(L.역할({}), '', 'ok가 없으면 거절로 본다');
      assert.equal(L.역할(null), '', 'null도 거절');
      assert.equal(L.역할(undefined), '', 'undefined도 거절');

      // 옛 형태(역할 문자열)도 받아준다 — currentRole은 문자열을 준다
      assert.equal(L.역할('view'), 'view', '문자열로 와도 읽는다');
      assert.equal(L.역할(''), '', '빈 문자열은 비로그인');
    }
  };
});
