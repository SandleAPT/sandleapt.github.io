'use strict';
// Archive v1 인증 세션 (4.3b)
// 결정: 별도 회원제를 만들지 않고 회의록 앱의 열람용/수정용 비밀번호를 재사용한다.
//       (사용자 결정 2026-09-01, docs/archive-v1/AUTH_V1.md)
//
// 검증은 클라이언트가 하지 않는다. Apps Script가 비밀번호를 확인하고 role을 돌려준다.
//   열람용 → {ok:true, role:'view'} / 수정용 → {ok:true, role:'edit'} / 틀림 → {ok:false, role:''}
//
// 저장 키와 24시간 만료는 회의록 앱 AdminGate와 동일하다. 같은 origin이라 localStorage를 공유하므로
// 한쪽에서 인증하면 다른 쪽에서도 유효하다. 만료 규칙은 사용자가 요청한 보안 장치이므로 완화하지 않는다.
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyhpE-DB5WAAEx7uqTCPwU-e0sPKuupkYN3YoQWALiFWe0IHFNh1y91e1VNtDmMxxoxLA/exec';
  var TOKEN = 'ITDXaUBDTmrz6DbQ3tv9R';
  var KEY = 'sandle_admin_key';
  var AT_KEY = 'sandle_admin_unlock_at';
  var TTL = 24 * 60 * 60 * 1000;

  // 마지막으로 서버가 확인해 준 role. 새로고침하면 사라지므로 저장된 키로 다시 확인한다.
  var verifiedRole = '';

  function now() { return Date.now(); }

  function read(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 사파리 프라이빗 등 */ } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function expired() {
    var at = Number(read(AT_KEY) || 0);
    // 확인 시각이 없는 키는 만료로 본다(예전 방식으로 저장된 키).
    return !at || (now() - at) > TTL;
  }

  function savedKey() {
    var k = read(KEY);
    if (k && expired()) { forget(); return ''; }
    return k;
  }

  function forget() {
    drop(KEY); drop(AT_KEY);
    verifiedRole = '';
  }

  function remember(key, role) {
    write(KEY, key); write(AT_KEY, String(now()));
    verifiedRole = role;
  }

  // 서버에 비밀번호를 확인한다. 실패·오류는 모두 '권한 없음'으로 떨어뜨린다(fail-closed).
  function verify(key) {
    if (!key) return Promise.resolve({ ok: false, role: '' });
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verify', adminKey: key, token: TOKEN })
    })
      .then(function (r) { return r.json(); })
      .then(function (x) {
        var role = (x && x.ok && (x.role === 'edit' || x.role === 'view')) ? x.role : '';
        return { ok: !!role, role: role };
      })
      .catch(function () { return { ok: false, role: '' }; });
  }

  // 비밀번호를 확인하고 통과하면 세션에 저장한다.
  function signIn(key) {
    return verify(key).then(function (res) {
      if (res.ok) remember(key, res.role);
      return res;
    });
  }

  // 현재 role을 돌려준다. 저장된 키가 있으면 서버에 한 번 더 확인한다.
  // 비밀번호가 바뀌었거나 회수됐을 때 옛 키로 계속 열리는 것을 막기 위함이다.
  function currentRole() {
    if (verifiedRole) return Promise.resolve(verifiedRole);
    var k = savedKey();
    if (!k) return Promise.resolve('');
    return verify(k).then(function (res) {
      if (!res.ok) { forget(); return ''; }
      verifiedRole = res.role;
      return res.role;
    });
  }

  // 서버 왕복 없이 지금 알고 있는 값만 본다(화면 초기 렌더용). 확정 판단에는 쓰지 않는다.
  function cachedRole() { return savedKey() ? verifiedRole : ''; }

  function remainingMs() {
    var at = Number(read(AT_KEY) || 0);
    if (!at) return 0;
    return Math.max(0, TTL - (now() - at));
  }

  window.SandleAuthSession = {
    TTL: TTL,
    signIn: signIn,
    verify: verify,
    currentRole: currentRole,
    cachedRole: cachedRole,
    savedKey: savedKey,
    forget: forget,
    expired: expired,
    remainingMs: remainingMs
  };
})();
