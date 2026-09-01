'use strict';
/*
 * 인증 기록 읽기 (4.3c)
 *
 * 서버가 주는 줄을 그대로 늘어놓으면 아무도 안 본다. 봐야 할 것을 골라 주는 부분을 고정한다.
 * 특히 **잘못 단정하지 않는 것**이 중요하다. "누가 침입했다"고 말해 버리면 사용자가
 * 이웃을 의심하게 된다. 실제로 말할 수 있는 것은 "이건 좀 봐야 한다"까지다.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-auth-log'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-auth-log',
    title: '인증 기록 읽기',
    deps: ['shared/auth-log.js'],
    run: function (ctx) {
      var assert = ctx.assert, L = ctx.global.SandleAuthLog;
      assert.ok(L, 'SandleAuthLog 로드');

      // ── 결과를 사람 말로 ──
      assert.equal(L.뜻({ result: 'edit' }), '수정용 통과', '수정용');
      assert.equal(L.뜻({ result: 'view' }), '열람용 통과', '열람용');
      assert.equal(L.뜻({ result: 'fail' }), '비밀번호 틀림', '틀림');
      assert.equal(L.뜻({ result: 'denied' }), '권한 없이 시도', '권한 없이 시도');
      assert.equal(L.뜻({}), '알 수 없음', '모르는 값도 빈칸으로 두지 않는다');

      assert.equal(L.정상인가({ result: 'edit' }), true, '통과는 정상');
      assert.equal(L.정상인가({ result: 'fail' }), false, '실패는 정상이 아니다');
      assert.equal(L.정상인가({ result: 'denied' }), false, '거부도 정상이 아니다');

      // ── 실패 몰림 ──
      var t0 = new Date('2026-09-02T10:00:00Z').getTime();
      var 줄 = function (분, res, dev) {
        return { at: new Date(t0 + 분 * 60000).toISOString(), action: 'verify', result: res, dev: dev };
      };

      // 5분 안에 5번 틀림 — 찍어보는 중
      var 몰림 = L.실패몰림([줄(0, 'fail', 'dA'), 줄(1, 'fail', 'dA'), 줄(2, 'fail', 'dA'), 줄(3, 'fail', 'dA'), 줄(4, 'fail', 'dA')]);
      assert.equal(몰림.length, 1, '짧은 시간에 5번 틀리면 알린다');
      assert.equal(몰림[0].기기, 'dA', '어느 기기인지');
      assert.equal(몰림[0].횟수, 5, '몇 번인지');

      // 오타 수준(3번)은 알리지 않는다 — 매번 경고하면 아무도 안 본다
      assert.equal(L.실패몰림([줄(0, 'fail', 'dA'), 줄(1, 'fail', 'dA'), 줄(2, 'fail', 'dA')]).length, 0, '3번은 오타로 본다');

      // 하루에 걸쳐 흩어진 5번은 몰린 것이 아니다
      var 흩어짐 = [줄(0, 'fail', 'dA'), 줄(60, 'fail', 'dA'), 줄(200, 'fail', 'dA'), 줄(400, 'fail', 'dA'), 줄(800, 'fail', 'dA')];
      assert.equal(L.실패몰림(흩어짐).length, 0, '흩어진 실패는 몰림이 아니다');

      /* 기기별로 나눠 센다. 서로 다른 기기의 실패가 우연히 겹친 것을 한 덩어리로 보면
         아무 일도 없는데 "누가 찍어보고 있다"고 말하게 된다. */
      var 섞임 = [줄(0, 'fail', 'dA'), 줄(1, 'fail', 'dB'), 줄(2, 'fail', 'dC'), 줄(3, 'fail', 'dD'), 줄(4, 'fail', 'dE')];
      assert.equal(L.실패몰림(섞임).length, 0, '다른 기기 5대의 실패는 한 덩어리가 아니다');

      // 통과는 몰림 계산에 넣지 않는다
      assert.equal(L.실패몰림([줄(0, 'edit', 'dA'), 줄(1, 'edit', 'dA'), 줄(2, 'edit', 'dA'), 줄(3, 'edit', 'dA'), 줄(4, 'edit', 'dA')]).length, 0, '정상 통과는 몰림이 아니다');

      // ── 요약 문구 ──
      var 빈것 = L.요약([]);
      assert.equal(/기록이 아직 없어/.test(빈것.문구.join(' ')), true, '기록이 없으면 없다고 분명히 말한다');

      var 평범 = L.요약([줄(0, 'edit', 'dA'), 줄(10, 'view', 'dB'), 줄(20, 'fail', 'dB')]);
      assert.equal(평범.셈.수정용, 1, '수정용 셈');
      assert.equal(평범.셈.열람용, 1, '열람용 셈');
      assert.equal(평범.셈.실패, 1, '실패 셈');
      assert.equal(평범.기기수, 2, '기기 수');
      assert.equal(/오타/.test(평범.문구.join(' ')), true, '실패가 몰리지 않았으면 오타라고 말해 준다');

      var 깨끗 = L.요약([줄(0, 'edit', 'dA')]);
      assert.equal(/이상해 보이는 건 없어/.test(깨끗.문구.join(' ')), true, '이상 없으면 없다고 말한다 — 조용한 화면은 확인 안 된 것과 구별되지 않는다');

      var 위험 = L.요약([줄(0, 'fail', 'dA'), 줄(1, 'fail', 'dA'), 줄(2, 'fail', 'dA'), 줄(3, 'fail', 'dA'), 줄(4, 'fail', 'dA')]);
      assert.equal(/찍어보고 있을 수 있어/.test(위험.문구.join(' ')), true, '몰렸을 때도 단정하지 않는다 — 있을 수 있다까지');
      assert.equal(/침입|해킹|공격/.test(위험.문구.join(' ')), false, '단정적인 말을 쓰지 않는다');

      /* 기기 표시의 한계를 화면이 늘 같이 말해야 한다.
         이 값을 신원처럼 믿으면 엉뚱한 사람을 의심하게 된다. */
      assert.equal(/믿을 수 있는 신원은 아니야/.test(평범.문구.join(' ')), true, '기기 표시는 믿을 수 없다고 함께 말한다');
    }
  };
});
