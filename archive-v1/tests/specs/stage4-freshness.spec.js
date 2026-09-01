'use strict';
/*
 * 사본이 얼마나 뒤처졌는지 대조하기 (4.6b)
 *
 * 이 검사는 **실제 요청을 하지 않는다.** fetch를 주입해서 돌린다(`tag-writer` spec과 같은 방식).
 * 검증 러너가 클라우드를 두드리면 안 되기 때문이다.
 *
 * 여기서 고정하는 것은 셋이다.
 *   1. 시스템 레코드를 회의로 세지 않는다 — 세면 건수가 안 맞아 늘 "뒤처졌다"고 나온다.
 *   2. 빠진 회의마다 **원문 링크**를 준다 — 건수만 알려 주면 사용자가 할 수 있는 것이 없다.
 *   3. 못 물어봤을 때 조용히 '최신'처럼 보이지 않는다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-freshness'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-freshness',
    title: '사본 신선도 대조',
    deps: ['shared/freshness.js'],
    run: function (ctx) {
      var assert = ctx.assert, F = ctx.global.SandleFreshness;
      assert.ok(F, 'SandleFreshness 로드');

      // ── 설정 뽑기: 회의록 앱 코드에서 직접 읽는다 ──
      var 코드 = 'var DEFAULT_URL = "https://example.test/exec";\n  var DEFAULT_TOKEN = "TOK123";';
      var cfg = F.설정뽑기(코드);
      assert.equal(cfg.url, 'https://example.test/exec', '주소를 뽑는다');
      assert.equal(cfg.token, 'TOK123', '토큰을 뽑는다');
      assert.equal(F.설정뽑기('아무 상관 없는 글'), null, '못 뽑으면 null — 지어내지 않는다');

      // ── 시스템 레코드는 회의가 아니다 ──
      assert.equal(F.회의인가('m_2026_06'), true, '회의');
      assert.equal(F.회의인가('t_2016_03'), true, '임차 회의도 회의');
      /* 네 종류를 모두 건다. 2026-09-02에 앞의 둘만 걸렀다가 공고·점검 5건을
         "빠진 회의"로 내놨다. 기준은 minutes의 isSysRecord / isSystemRecord와 같아야 한다. */
      assert.equal(F.회의인가('topic_summaries'), false, '주제 요약은 회의가 아니다');
      assert.equal(F.회의인가('roster_history_v1'), false, '명단 이력도 아니다');
      assert.equal(F.회의인가('notices_v1'), false, '공고 보관함도 아니다');
      assert.equal(F.회의인가('notices_v1_p3'), false, '공고 조각도 아니다');
      assert.equal(F.회의인가('checks_v1'), false, '절차 점검도 아니다');
      assert.equal(F.회의인가(''), false, '빈 id는 세지 않는다');

      /* ── 날짜 정리 ──
       * 시트가 그 칸을 Date 객체로 돌려주면 GAS의 String()이 긴 글자를 만든다.
       * 그대로 뿌리면 회의 이름 옆에 "Wed Aug 26 2026 00:00:00 GMT+0900 (한국 표준시)"가 붙는다.
       * 이 프로젝트에서 시트의 Date 때문에 틀린 것이 세 번째라 검사로 고정한다. */
      assert.equal(F.날짜정리('2026-08-26'), '2026-08-26', '이미 맞는 모양은 그대로');
      assert.equal(F.날짜정리('2026-08-26T00:00:00Z'), '2026-08-26', '시각이 붙어도 날짜만');
      assert.equal(F.날짜정리('Wed Aug 26 2026 00:00:00 GMT+0900 (한국 표준시)'), '2026-08-26', '시트 Date 문자열도 읽는다');
      assert.equal(F.날짜정리(''), '', '빈 값은 빈 값');
      assert.equal(F.날짜정리('날짜 아님'), '', '못 읽으면 빈 값 — 이상한 글자를 보여주지 않는다');

      // ── 대조 ──
      var 사본 = [{ id: 'a', name: '1월 회의', date: '2026-01-10' },
                  { id: 'b', name: '2월 회의', date: '2026-02-10' }];
      var 클라우드 = [
        { id: 'a', name: '1월 회의', date: '2026-01-10', updatedAt: '2026-01-11T00:00:00Z' },
        { id: 'b', name: '2월 회의', date: '2026-02-10', updatedAt: '2026-02-11T00:00:00Z' },
        { id: 'c', name: '3월 회의', date: '2026-03-10', updatedAt: '2026-03-11T00:00:00Z' },
        { id: 'topic_summaries', name: '주제요약', date: '', updatedAt: '2026-09-01T00:00:00Z' },
        { id: 'notices_v1_p2', name: '공고·기록 (시스템)', date: '', updatedAt: '2026-09-01T00:00:00Z' },
        { id: 'checks_v1', name: '절차 점검 기록 (시스템)', date: '', updatedAt: '2026-09-01T00:00:00Z' }
      ];
      var r = F.비교(사본, 클라우드);
      assert.equal(r.클라우드건수, 3, '시스템 레코드를 뺀 회의 수');
      assert.equal(r.사본건수, 2, '사본 수');
      assert.equal(r.뒤처짐, true, '빠진 것이 있으면 뒤처진 것');
      assert.equal(r.빠진것.length, 1, '빠진 회의 1건');
      assert.equal(r.빠진것[0].이름, '3월 회의', '어느 회의인지 이름으로');
      /* 링크가 이 기능의 요점이다. 사본 갱신은 강제할 수 없지만 그 회의를 지금 볼 수는 있다. */
      assert.equal(r.빠진것[0].원문, '/minutes/?open=c', '빠진 회의를 바로 여는 링크');
      assert.equal(r.최신클라우드, '2026-03-11T00:00:00Z', '시스템 레코드는 최신 계산에서도 뺀다');

      // 같으면 뒤처지지 않았다고 한다
      var 같음 = F.비교(사본, 클라우드.slice(0, 2));
      assert.equal(같음.뒤처짐, false, '빠진 것이 없으면 최신');
      assert.equal(같음.빠진것.length, 0, '빠진 목록도 비어 있다');
      assert.equal(/같아/.test(F.문구(같음)), true, '최신이면 그렇게 말한다');
      assert.equal(/1건/.test(F.문구(r)), true, '뒤처졌으면 몇 건인지 말한다');

      // 빈 입력에도 죽지 않는다
      assert.equal(F.비교(null, null).뒤처짐, false, '입력이 없어도 동작');

      // ── 며칠째 안 만들어졌을 때의 안내 ──
      assert.equal(F.멈춤안내(1), '', '하루 늦는 것은 정상 — 아무 말 안 한다');
      assert.equal(F.멈춤안내(2), '', '이틀도 정상');
      assert.equal(/4일째/.test(F.멈춤안내(4)), true, '사흘 넘으면 며칠째인지 말한다');
      assert.equal(/실패/.test(F.멈춤안내(4)), true, '원인 짐작까지 알려 준다 — 기다리라고만 하면 할 수 있는 게 없다');

      // ── 클라우드 목록 (fetch 주입, 실제 요청 없음) ──
      var 부른주소 = '';
      var 가짜 = function (u) {
        부른주소 = u;
        return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ ok: true, items: 클라우드 }); } });
      };
      return F.클라우드목록(가짜, { url: 'https://example.test/exec', token: 'TOK123' }).then(function (items) {
        assert.equal(items.length, 6, '목록은 거르지 않고 그대로 돌려준다 — 거르는 것은 비교()의 몫');
        assert.equal(부른주소.indexOf('action=list') > 0, true, 'list 액션 — 본문은 받지 않는다');
        assert.equal(부른주소.indexOf('token=TOK123') > 0, true, '토큰을 붙인다');

        // 서버가 거절하면 실패로 알린다 — 조용히 빈 목록으로 두면 '최신'처럼 보인다
        var 거절 = function () {
          return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ ok: false, error: 'unauthorized' }); } });
        };
        return F.클라우드목록(거절, { url: 'x', token: 'y' }).then(function () {
          assert.equal(true, false, '거절인데 성공으로 처리하면 안 된다');
        }, function (e) {
          assert.equal(/unauthorized/.test(e.message), true, '거절 사유를 그대로 전한다');
        });
      });
    }
  };
});
