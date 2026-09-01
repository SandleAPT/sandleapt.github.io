'use strict';
// 4.2~4.3a 공개등급 정책 — 공개 번들 projection과 금지 필드 제거
// 대응 node 테스트: archive-v1/tests/stage4-visibility.test.js (케이스 동일)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-visibility'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-visibility',
    title: '공개등급 정책(public/resident/private)',
    deps: ['admin/stage4/source-reference.js', 'admin/stage4/visibility-policy.js'],
    run: function (ctx) {
      var assert = ctx.assert, api = ctx.global.SandleVisibilityPolicy;
      assert.ok(api, 'SandleVisibilityPolicy 로드');

      var records = [
        {
          id: 'public-1', title: '공개 자료', summary: '공개 요약', visibility: 'public',
          private_notes: '공개되면 안 됨',
          sources: [{ ref_id: 'src-public', provider: 'repository', visibility: 'public', access: 'public', locator: { repository: 'SandleAPT/minutes', path: 'data-2026.json' } }]
        },
        {
          id: 'resident-1', title: '입주민 자료', summary: '입주민 본문', visibility: 'resident',
          sources: [{ ref_id: 'src-resident', provider: 'google_drive', visibility: 'resident', access: 'authenticated', locator: { file_id: 'secret-id' } }]
        },
        { id: 'private-1', title: '관리자 자료', visibility: 'private', admin_notes: '내부 메모' }
      ];

      var bundle = api.buildPublicBundle(records);
      assert.equal(bundle.length, 1, '공개 번들에는 public 1건만 남는다');
      assert.equal(bundle[0].id, 'public-1', '남은 항목은 public-1');
      assert.equal(bundle[0].private_notes, undefined, 'private_notes는 공개 번들에서 제거');
      assert.equal(bundle[0].sources.length, 1, 'public 원본 참조는 유지');
      assert.equal(api.validatePublicBundle(bundle).valid, true, '공개 번들 자체 검증 통과');
      assert.equal(api.targetFor('resident').publicBundle, false, 'resident는 공개 번들 대상 아님');
      // 알 수 없는 등급은 공개가 아니라 private로 떨어져야 한다(fail-closed).
      assert.equal(api.targetFor('unknown').visibility, 'private', '미지 등급은 private로 처리');
    }
  };
});
