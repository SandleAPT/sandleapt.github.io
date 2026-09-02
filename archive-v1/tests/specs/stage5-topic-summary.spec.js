'use strict';
/*
 * 주제 흐름 요약 읽기 (5.5a)
 *
 * 사용자 지적에서 나온 기능이다 — 회의록 앱은 주제를 열면 「현재 상태」 한 줄로 답을 주는데
 * Archive는 「29건 · 2016.06 ~ 2026.08」을 내놨다. 숫자는 정보가 아니다.
 * 그 요약은 이미 회의록 앱에 있었고, Archive가 안 읽고 있었을 뿐이다.
 *
 * 여기서 고정하는 것:
 *  1. 조각을 **번호순**으로 잇는다 — 문자열 정렬이면 p10이 p2보다 앞에 와서 글이 깨진다.
 *  2. 「현재 상태」는 글 어디에 있든 뽑아낸다 — 회의록 앱은 그것을 맨 끝에 적는다.
 *  3. 못 읽으면 **없는 것으로 둔다** — 빈 상자를 보여주거나 지어내지 않는다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage5-topic-summary'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage5-topic-summary',
    title: '주제 흐름 요약 읽기',
    deps: ['shared/topic-summary.js'],
    run: function (ctx) {
      var assert = ctx.assert, S = ctx.global.SandleTopicSummary;
      assert.ok(S, 'SandleTopicSummary 로드');

      // ── 파싱 — 실제 회의록 앱이 쓰는 모양 그대로 ──
      var 글 = [
        '## 요점',
        '- 24년: 유지보수 현대개발공사 2년 재계약(동결).',
        '- 26년 재계약 인상 요구 거절 → 공개입찰로 교체(5월 신규업체).',
        '## 시간 흐름',
        '- 26.06 정기: 신규 유지관리업체 4월 말 계약·5월 업무 시작.',
        '- 26.01 정기: 재계약 요청 6.25% 인상 → 차기 재심의.',
        '- 현재 상태: 신규 업체 관리 체제, 반복 고장 호기 원인 보고 대기.'
      ].join('\n');

      var r = S.파싱(글);
      assert.ok(r, '요약을 읽는다');
      assert.equal(r.현재상태, '신규 업체 관리 체제, 반복 고장 호기 원인 보고 대기.', '현재 상태는 글 끝에 있어도 뽑는다');
      assert.equal(r.요점.length, 2, '요점 2줄');
      assert.equal(r.요점[0].indexOf('24년') === 0, true, '가운뎃점 기호는 떼고 본문만');
      assert.equal(r.흐름.length, 2, '시간 흐름 2줄 — 현재 상태 줄은 흐름에 넣지 않는다');
      assert.equal(r.흐름.some(function (x) { return /현재 상태/.test(x); }), false, '현재 상태가 흐름에 섞이면 두 번 보인다');

      // 없는 것은 없는 대로. 빈 상자를 만들지 않는다.
      assert.equal(S.파싱(''), null, '빈 글이면 없음');
      assert.equal(S.파싱('   '), null, '공백뿐이어도 없음');
      assert.equal(S.파싱(null), null, '값이 없어도 죽지 않는다');
      assert.equal(S.파싱('## 요점\n## 시간 흐름'), null, '제목만 있고 알맹이가 없으면 없음');

      // 현재 상태만 있어도 보여준다 — 그것이 이 화면의 핵심이다
      var 상태만 = S.파싱('- 현재 상태: 계약 만료 대기.');
      assert.ok(상태만, '현재 상태만 있어도 읽는다');
      assert.equal(상태만.현재상태, '계약 만료 대기.', '그 한 줄');

      // ── 조각 잇기 ──
      var 원본 = { version: 1, topics: { '승강기': { text: '## 요점\n- 가나다' }, '주차': { text: '- 현재 상태: 차단기 교체 검토' } } };
      var 전체 = JSON.stringify(원본);
      var 자르기 = function (n) {
        var out = [], 크기 = Math.ceil(전체.length / n);
        for (var i = 0; i < n; i++) out.push({ id: 'topic_summaries_v1_p' + (i + 1), json: 전체.slice(i * 크기, (i + 1) * 크기) });
        return out;
      };

      var 조각 = 자르기(3);
      var m = S.조립(조각.concat([{ id: 'topic_summaries_v1', json: '{"chunked":true,"parts":3}' }]));
      assert.ok(m, '조각을 이어 붙인다');
      assert.equal(!!m['승강기'], true, '주제별로 들어온다');
      assert.equal(S.파싱(m['주차'].text).현재상태, '차단기 교체 검토', '이어 붙인 뒤에도 내용이 온전하다');

      /* 순서가 뒤섞여 들어와도 번호순으로 잇는다.
         문자열 정렬이면 p10 < p2 라 글이 깨지는데, 깨진 JSON은 조용히 null이 되어
         화면만 비고 원인은 안 보인다. */
      var 뒤섞임 = [조각[2], 조각[0], 조각[1]];
      assert.equal(!!S.조립(뒤섞임), true, '순서가 뒤섞여도 조립된다');
      assert.equal(!!S.조립(자르기(12)), true, '조각이 10개를 넘어도 번호순으로 잇는다');

      // 조각이 빠지면 지어내지 않는다
      assert.equal(S.조립([조각[0]]), null, '조각이 모자라면 없음');
      assert.equal(S.조립([]), null, '조각이 없으면 없음');
      assert.equal(S.조립(null), null, '입력이 없어도 죽지 않는다');
      // 다른 시스템 레코드를 요약으로 착각하지 않는다
      assert.equal(S.조립([{ id: 'roster_history_v1', json: '{}' }]), null, '명단 이력은 요약이 아니다');
    }
  };
});
