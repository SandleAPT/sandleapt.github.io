'use strict';
// 4.2 SourceReference v1 — 원본 참조 형식과 공개 링크 가능 여부
// 대응 node 테스트: archive-v1/tests/stage4-source-reference.test.js (케이스 동일)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-source-reference'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-source-reference',
    title: '원본 참조(SourceReference v1)',
    // 러너가 이 순서대로 로드한 뒤 run을 호출한다.
    deps: ['admin/stage4/source-reference.js'],
    run: function (ctx) {
      var assert = ctx.assert, api = ctx.global.SandleSourceReference;
      assert.ok(api, 'SandleSourceReference 로드');

      var publicRef = {
        ref_id: 'src-1', provider: 'repository', label: '공개 회의록', original_type: 'json',
        visibility: 'public', access: 'public',
        locator: { repository: 'SandleAPT/minutes', path: 'data-2026.json', url: '/minutes/#archiveView' }
      };
      assert.equal(api.validate(publicRef).valid, true, 'public 참조는 유효');
      assert.equal(api.isPubliclyLinkable(publicRef), true, 'public 참조는 공개 링크 가능');
      assert.equal(api.toPublicReference(publicRef).locator.path, 'data-2026.json', 'public 참조는 locator 유지');

      var residentRef = {
        ref_id: 'src-2', provider: 'google_drive', label: '입주민 자료', original_type: 'pdf',
        visibility: 'resident', access: 'authenticated', locator: { file_id: 'resident-file-id' }
      };
      assert.equal(api.validate(residentRef).valid, true, 'resident 참조는 형식상 유효');
      assert.equal(api.isPubliclyLinkable(residentRef), false, 'resident 참조는 공개 링크 불가');
      assert.isNull(api.toPublicReference(residentRef), 'resident 참조는 공개 투영에서 제외');

      // resident 자료에 public 접근이 붙는 조합은 형식 자체를 무효로 본다(권한 상향 방지).
      var unsafe = Object.assign({}, residentRef, { access: 'public' });
      assert.equal(api.validate(unsafe).valid, false, 'resident + access:public 조합은 무효');
    }
  };
});
