'use strict';
// 4.3b 접근 판정 — role별 열람 범위, 미지 값 처리(fail-closed)
// 이 spec은 서버를 부르지 않는다. 판정 규칙만 본다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-access-control'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-access-control',
    title: '접근 판정(role → 공개등급)',
    deps: ['shared/access-control.js'],
    run: function (ctx) {
      var assert = ctx.assert, ac = ctx.global.SandleAccessControl;
      assert.ok(ac, 'SandleAccessControl 로드');

      // 비로그인은 public만
      assert.equal(ac.canView('', 'public'), true, '비로그인 → public 열람');
      assert.equal(ac.canView('', 'resident'), false, '비로그인 → resident 차단');
      assert.equal(ac.canView('', 'private'), false, '비로그인 → private 차단');

      // 열람용은 resident까지
      assert.equal(ac.canView('view', 'resident'), true, '열람용 → resident 열람');
      assert.equal(ac.canView('view', 'private'), false, '열람용 → private 차단');

      // 수정용은 전부
      assert.equal(ac.canView('edit', 'private'), true, '수정용 → private 열람');
      assert.equal(ac.canManage('edit'), true, '수정용만 관리 가능');
      assert.equal(ac.canManage('view'), false, '열람용은 관리 불가');
      assert.equal(ac.canManage(''), false, '비로그인은 관리 불가');

      // 모르는 값은 가장 엄격하게 (fail-closed)
      assert.equal(ac.normalizeRole('admin'), '', '모르는 role은 비로그인 취급');
      assert.equal(ac.normalizeRole(undefined), '', 'role 누락은 비로그인 취급');
      assert.equal(ac.normalizeVisibility('secret'), 'private', '모르는 등급은 private 취급');
      assert.equal(ac.normalizeVisibility(undefined), 'private', '등급 누락은 private 취급');
      assert.equal(ac.canView('unknown-role', 'resident'), false, '모르는 role은 resident도 못 봄');
      assert.equal(ac.canView('edit', 'weird-level'), true, '수정용은 미지 등급(=private)도 열람 가능');
      assert.equal(ac.canView('view', 'weird-level'), false, '열람용은 미지 등급(=private) 차단');

      // 목록 필터
      var records = [
        { id: 'a', visibility: 'public' },
        { id: 'b', visibility: 'resident' },
        { id: 'c', visibility: 'private' },
        { id: 'd' },                       // 등급 없음 → private 취급
        { id: 'e', visibility: 'nonsense' } // 미지 → private 취급
      ];
      assert.equal(ac.filterVisible(records, '').length, 1, '비로그인은 1건만');
      assert.equal(ac.filterVisible(records, 'view').length, 2, '열람용은 2건');
      assert.equal(ac.filterVisible(records, 'edit').length, 5, '수정용은 전부');
      assert.equal(ac.filterVisible(null, 'edit').length, 0, '배열이 아니면 빈 목록');

      // 안내 문구
      assert.equal(ac.requirementOf('resident').needs, 'view', 'resident는 열람용 필요');
      assert.equal(ac.requirementOf('private').needs, 'edit', 'private는 수정용 필요');
      assert.equal(ac.requirementOf('public').needs, 'none', 'public은 인증 불필요');
      assert.equal(ac.describeRole('edit'), '관리자', 'role 표기');
    }
  };
});
