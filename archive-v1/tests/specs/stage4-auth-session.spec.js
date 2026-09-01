'use strict';
// 4.3b 인증 세션 — 24시간 만료, 서버 응답 처리, 실패 시 fail-closed
// 실제 서버를 부르지 않도록 fetch를 스텁으로 바꾸고 localStorage를 건드리므로 격리 실행한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-auth-session'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-auth-session',
    title: '인증 세션(만료·fail-closed)',
    deps: ['shared/auth-session.js'],
    isolate: true,
    // 모듈이 로드되기 전에 fetch를 갈아끼워 실제 Apps Script를 호출하지 않게 한다.
    setup: function (ctx) {
      var g = ctx.global;
      g.__authCalls = [];
      g.__authReply = { ok: true, role: 'view' };
      g.fetch = function (url, opt) {
        var body = {};
        try { body = JSON.parse((opt && opt.body) || '{}'); } catch (e) {}
        g.__authCalls.push(body);
        if (g.__authFail) return Promise.reject(new Error('network down'));
        var reply = g.__authReply;
        return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(reply); } });
      };
    },
    run: async function (ctx) {
      var assert = ctx.assert, g = ctx.global;
      var auth = g.SandleAuthSession;
      assert.ok(auth, 'SandleAuthSession 로드');

      var KEY = 'sandle_admin_key', AT = 'sandle_admin_unlock_at';
      // 격리 iframe이라도 localStorage는 origin 단위로 공유된다.
      // 실제 사용 중인 키를 건드리지 않도록 원래 값을 보관했다가 반드시 되돌린다.
      var backupKey = null, backupAt = null;
      try { backupKey = localStorage.getItem(KEY); backupAt = localStorage.getItem(AT); } catch (e) {}

      try {
        try { localStorage.removeItem(KEY); localStorage.removeItem(AT); } catch (e) {}

        // 빈 비밀번호는 서버를 부르지 않는다.
        var before = g.__authCalls.length;
        var empty = await auth.verify('');
        assert.equal(empty.ok, false, '빈 비밀번호는 실패');
        assert.equal(g.__authCalls.length, before, '빈 비밀번호는 서버 호출 안 함');

        // 열람용 로그인
        g.__authReply = { ok: true, role: 'view' };
        var viewIn = await auth.signIn('열람용-테스트');
        assert.equal(viewIn.role, 'view', '열람용 role 반환');
        assert.equal(auth.savedKey(), '열람용-테스트', '키 저장됨');
        assert.equal(auth.expired(), false, '방금 인증했으므로 만료 아님');
        assert.ok(auth.remainingMs() > 23 * 60 * 60 * 1000, '남은 시간이 23시간 이상');
        assert.equal(await auth.currentRole(), 'view', '현재 role은 view');

        // 서버가 거부하면 저장된 키를 버린다(비밀번호 교체·회수 대응)
        g.__authReply = { ok: false, role: '' };
        var revoked = await auth.currentRole();
        assert.equal(revoked, '', '서버가 거부하면 role 없음');
        assert.equal(auth.savedKey(), '', '거부되면 저장된 키도 삭제');

        // 수정용 로그인
        g.__authReply = { ok: true, role: 'edit' };
        var editIn = await auth.signIn('수정용-테스트');
        assert.equal(editIn.role, 'edit', '수정용 role 반환');

        // 24시간 경과 → 만료 처리
        try { localStorage.setItem(AT, String(Date.now() - (auth.TTL + 1000))); } catch (e) {}
        assert.equal(auth.expired(), true, 'TTL 초과는 만료');
        assert.equal(auth.savedKey(), '', '만료된 키는 읽을 때 삭제');
        assert.equal(await auth.currentRole(), '', '만료 후 role 없음');

        // 확인 시각이 없는 옛 키도 만료로 본다
        try { localStorage.setItem(KEY, '시각없는-키'); localStorage.removeItem(AT); } catch (e) {}
        assert.equal(auth.expired(), true, '확인 시각 없으면 만료');
        assert.equal(auth.savedKey(), '', '시각 없는 키는 사용하지 않음');

        // 네트워크 오류는 실패로 떨어진다(fail-closed)
        g.__authFail = true;
        var netFail = await auth.signIn('아무거나');
        assert.equal(netFail.ok, false, '네트워크 오류는 인증 실패');
        assert.equal(netFail.role, '', '오류 시 role 없음');
        g.__authFail = false;

        // 서버가 모르는 role을 주면 통과시키지 않는다
        g.__authReply = { ok: true, role: 'superuser' };
        var weird = await auth.signIn('이상한-응답');
        assert.equal(weird.ok, false, '모르는 role은 인증 실패로 처리');

        auth.forget();
        assert.equal(auth.savedKey(), '', 'forget 후 키 없음');
      } finally {
        // 이 spec 때문에 실제 로그인 상태가 풀리지 않도록 원상 복구한다.
        try {
          if (backupKey === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, backupKey);
          if (backupAt === null) localStorage.removeItem(AT); else localStorage.setItem(AT, backupAt);
        } catch (e) {}
      }
    }
  };
});
