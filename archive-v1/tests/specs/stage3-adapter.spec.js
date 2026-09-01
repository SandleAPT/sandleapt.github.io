'use strict';
// 3.2 회의 → Document / 안건 → Fragment 변환 — 주제 출처 구분, 표결 요약, 검토함 draft
// 대응 node 테스트: archive-v1/tests/stage3-adapter.test.js (케이스 동일)
// TopicTaxonomy와 SandleMeetingSource를 스텁으로 주입하므로 격리 실행(isolate)한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage3-adapter'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage3-adapter',
    title: '회의 변환(Document/Fragment)',
    // 어댑터는 로드 시점에 전역 스텁을 참조할 수 있어 deps보다 먼저 setup을 돌린다.
    deps: ['admin/stage3/meeting-adapter.js'],
    isolate: true,
    setup: function (ctx) {
      var g = ctx.global;
      // 어댑터가 참조하는 전역 스텁 — 실제 minutes taxonomy의 정규화 규칙만 축약해 재현한다.
      g.TopicTaxonomy = {
        defs: [
          { key: '주차', kw: ['주차', '차단기'] },
          { key: '청소·미화', kw: ['청소', '미화원'] },
          { key: '급수·배수·난방', kw: ['저수조'] }
        ],
        resolveStored: function (agenda, autoTags) {
          var raw = (Array.isArray(agenda.tags) && agenda.tags.length) ? agenda.tags : (agenda.category ? [agenda.category] : []);
          var needsAuto = false, out = [];
          raw.forEach(function (value) {
            var topic = String(value || '').trim();
            if (topic === '기타' || topic === '저수조·청소') { needsAuto = true; return; }
            if (topic === '미화') topic = '청소·미화';
            if (topic === '소송') topic = '하자·소송';
            if (topic && out.indexOf(topic) < 0) out.push(topic);
          });
          if (needsAuto) autoTags(agenda).filter(function (t) { return t !== '기타'; }).forEach(function (t) { if (out.indexOf(t) < 0) out.push(t); });
          return out.length ? out : ['기타'];
        }
      };
      g.SandleMeetingSource = { bodyLabel: function (body) { return body === '임차' ? '임차인대표회의' : '입주자대표회의'; } };
    },
    run: async function (ctx) {
      var assert = ctx.assert, g = ctx.global;
      var fixture = JSON.parse(await ctx.readText('tests/fixtures/stage3-meetings.json'));
      var adapter = g.SandleMeetingAdapter;
      assert.ok(adapter, 'SandleMeetingAdapter 로드');

      var record = fixture.year.items[0];
      var state = JSON.parse(record.json);
      var conv = adapter.convert({ record: record, state: state });

      assert.equal(conv.document.id, 'meeting:fixture-meeting-1', 'Document id');
      assert.equal(conv.document.fragment_count, 3, 'Fragment 3건');
      assert.equal(conv.document.meeting.attendee_count, 1, '참석자 수');
      assert.equal(conv.fragments.length, 3, 'fragments 길이');

      assert.deepEqual(conv.fragments[0].topics, ['주차'], '저장 태그 없으면 추론 주제');
      assert.equal(conv.fragments[0].topic_source, 'inferred', '추론 주제는 inferred로 표시');
      assert.deepEqual(conv.fragments[0].vote, { for: 1, against: 1, abstain: 0, other: 0, total: 2 }, '표결 요약');

      assert.deepEqual(conv.fragments[1].topics, ['청소·미화'], '과거 분류명 미화 → 청소·미화');
      assert.equal(conv.fragments[1].topic_source, 'stored', '저장 태그는 stored');

      assert.ok(conv.fragments[2].topics.indexOf('저수조·청소') < 0, '폐기된 분류명은 그대로 쓰지 않음');
      assert.equal(conv.fragments[2].topic_source, 'inferred', '재추론된 주제는 inferred');

      var drafts = adapter.toAdminDrafts(conv);
      assert.equal(drafts.length, 3, 'draft 3건');
      var ids = {};
      drafts.forEach(function (d) { ids[d.id] = 1; });
      assert.equal(Object.keys(ids).length, 3, 'draft id 중복 없음');
      assert.ok(drafts.every(function (d) { return d.importedMeeting; }), '모든 draft에 회의록 변환 표시');
    }
  };
});
