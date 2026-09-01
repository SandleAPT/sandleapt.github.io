'use strict';
// 4.3a 관리 화면 결합 — store.publish()가 정책을 강제하는지, 관리자 화면이 모듈을 올바른 순서로 싣는지
// 대응 node 테스트: archive-v1/tests/stage4-admin-integration.test.js (케이스 동일)
// 파일 읽기는 런타임마다 다르므로 ctx.readText로 위임한다(브라우저 fetch / node fs).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-admin-integration'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-admin-integration',
    title: '관리 화면 결합(store·index.html)',
    deps: [
      'admin/stage4/source-reference.js',
      'admin/stage4/visibility-policy.js',
      'admin/stage4/publish-guard.js',
      'admin/data/sample.js',
      'admin/store.js'
    ],
    run: async function (ctx) {
      var assert = ctx.assert, g = ctx.global, store = g.SandleAdminStore;
      assert.ok(store, 'SandleAdminStore 로드');

      // 이 spec은 store 상태를 바꾸므로 끝나고 반드시 reset한다.
      var item = store.find('sample-publish');
      assert.ok(item, 'sample-publish 항목 존재');

      store.setVisibility(item.id, 'resident');
      assert.equal(store.publish(item.id), false, 'resident는 store에서도 발행 차단');
      assert.equal(item.published, false, '차단 시 published 플래그 그대로');

      store.setVisibility(item.id, 'private');
      assert.equal(store.publish(item.id), false, 'private도 발행 차단');

      store.setVisibility(item.id, 'public');
      assert.equal(store.publish(item.id), true, 'public은 발행 허용');
      assert.equal(item.published, true, '발행 후 published 플래그 true');

      // 정책 모듈이 사라지면 발행을 허용하지 말고 막아야 한다(fail-closed).
      var savedGuard = g.SandlePublishGuard;
      store.reset();
      g.SandlePublishGuard = null;
      try {
        assert.equal(store.publish('sample-publish'), false, '정책 모듈 부재 시 발행 차단');
      } finally {
        g.SandlePublishGuard = savedGuard;
        store.reset();
      }

      // 관리 화면이 정책 모듈을 store보다 먼저 싣는지 — 순서가 뒤집히면 fail-closed가 깨진다.
      var html = await ctx.readText('admin/index.html');
      assert.match(html, /data-view="storagePolicy"/, '저장·권한 화면 메뉴 존재');
      assert.match(html, /admin-stage4\.css/, 'Stage 4 스타일 연결');
      var policyAt = html.indexOf('./stage4/visibility-policy.js');
      var guardAt = html.indexOf('./stage4/publish-guard.js');
      var storeAt = html.indexOf('./store.js');
      assert.ok(policyAt >= 0 && guardAt > policyAt && storeAt > guardAt, '로드 순서: visibility-policy → publish-guard → store');
      assert.match(html, /views\/storage-policy\.js/, '저장·권한 화면 뷰 연결');
      assert.match(html, /views\/publish-stage4\.js/, '발행 대기 화면 뷰 연결');
    }
  };
});
