'use strict';
// 4.3a 발행 경계 — 공개 가능 여부 판정과 projection 생성
// 대응 node 테스트: archive-v1/tests/stage4-publish-guard.test.js (케이스 동일)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-publish-guard'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-publish-guard',
    title: '발행 경계(PublishGuard)',
    deps: ['admin/stage4/source-reference.js', 'admin/stage4/visibility-policy.js', 'admin/stage4/publish-guard.js'],
    run: function (ctx) {
      var assert = ctx.assert, guard = ctx.global.SandlePublishGuard;
      assert.ok(guard, 'SandlePublishGuard 로드');

      var base = {
        id: 'record-1', title: '공개 자료', documentType: '공고·안내', date: '2026-09-01',
        scope: 'all_residents', suggestions: { topic: '주차', organization: '관리사무소' }
      };

      var pub = guard.evaluate(Object.assign({}, base, { visibility: 'public', private_notes: '숨김' }));
      assert.equal(pub.canPublish, true, 'public 자료는 발행 가능');
      assert.equal(pub.projection.title, '공개 자료', 'projection에 제목 유지');
      assert.equal(pub.projection.private_notes, undefined, 'projection에서 private_notes 제거');

      var resident = guard.evaluate(Object.assign({}, base, {
        visibility: 'resident',
        sources: [{ ref_id: 'secret', provider: 'google_drive', visibility: 'resident', access: 'authenticated', locator: { file_id: 'secret-id' } }]
      }));
      assert.equal(resident.canPublish, false, 'resident 자료는 발행 차단');
      assert.isNull(resident.projection, 'resident 자료는 projection 없음');
      assert.equal(resident.excludedSources, 1, '제외된 원본 참조 1건 보고');

      // 공개등급이 비어 있으면 공개가 아니라 private로 간주해 막는다.
      var missing = guard.evaluate(Object.assign({}, base, { visibility: undefined }));
      assert.equal(missing.visibility, 'private', '등급 누락은 private로 정규화');
      assert.equal(missing.canPublish, false, '등급 누락 자료는 발행 차단');
    }
  };
});
