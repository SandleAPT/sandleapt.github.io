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

  // 마지막으로 서버가 확인해 준 role과 그 시각.
  // 캐시를 무기한 믿으면 비밀번호를 회수해도 그 세션이 24시간 내내 통과한다(검증에서 잡힌 결함).
  // 그래서 재확인 주기를 두고, 지나면 서버에 다시 묻는다.
  var verifiedRole = '', verifiedAt = 0;
  var RECHECK = 5 * 60 * 1000;

  var DEV_KEY = 'sandle_device_tag';

  function now() { return Date.now(); }

  /*
   * 기기 표시 (4.3c) — 인증 기록에서 같은 기기를 묶어 보기 위한 무작위 값.
   *
   * 사람을 가리키는 값이 아니다. 무작위로 만들고 이 기기에만 둔다.
   * 서버는 요청한 쪽의 IP를 알 수 없어서(Apps Script 한계) 이것이라도 없으면
   * 기록이 전부 "누군가"가 되어 실패가 한 곳에서 몰려 오는 것인지 알 수 없다.
   * **믿을 수 있는 값이 아니다** — 기기가 스스로 말하는 것이라 바꿔 보낼 수 있다.
   * 그래서 신원 확인에는 쓰지 않고, 기록을 읽을 때 참고로만 쓴다.
   */
  function deviceTag() {
    var t = read(DEV_KEY);
    if (!t) {
      t = 'd' + Math.random().toString(36).slice(2, 8);
      write(DEV_KEY, t);
    }
    return t;
  }

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
    verifiedRole = ''; verifiedAt = 0;
  }

  function remember(key, role) {
    write(KEY, key); write(AT_KEY, String(now()));
    verifiedRole = role; verifiedAt = now();
  }

  // 서버에 비밀번호를 확인한다. 실패·오류는 모두 '권한 없음'으로 떨어뜨린다(fail-closed).
  function verify(key) {
    if (!key) return Promise.resolve({ ok: false, role: '' });
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verify', adminKey: key, token: TOKEN, dev: deviceTag() })
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

  // 현재 role을 돌려준다.
  // 저장된 키가 있어도 캐시가 오래됐으면(RECHECK 초과) 서버에 다시 묻는다.
  // 비밀번호가 교체·회수됐을 때 옛 키로 계속 열리는 것을 막기 위함이다.
  // force=true면 캐시를 무시하고 즉시 서버에 확인한다(민감한 동작 직전에 사용).
  function currentRole(force) {
    var k = savedKey();
    if (!k) { verifiedRole = ''; verifiedAt = 0; return Promise.resolve(''); }
    var fresh = verifiedRole && (now() - verifiedAt) < RECHECK;
    if (fresh && !force) return Promise.resolve(verifiedRole);
    return verify(k).then(function (res) {
      if (!res.ok) { forget(); return ''; }
      verifiedRole = res.role; verifiedAt = now();
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

  /*
   * 인증 기록 읽기 (4.3c). 수정용 키만 통과한다 — 서버가 판정한다.
   * 서버에 아직 이 기능이 없으면(`unknown action`) 그대로 알린다. 빈 목록으로 두면
   * "기록이 없다"처럼 보여서 실제로 아무 일도 없었던 것과 구분되지 않는다.
   */
  function authLog(limit) {
    var k = savedKey();
    if (!k) return Promise.resolve({ ok: false, error: 'no_key' });
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'authLog', adminKey: k, token: TOKEN, limit: limit || 30, dev: deviceTag() })
    })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'network' }; });
  }

  window.SandleAuthSession = {
    TTL: TTL,
    RECHECK: RECHECK,
    signIn: signIn,
    verify: verify,
    authLog: authLog,
    deviceTag: deviceTag,
    currentRole: currentRole,
    cachedRole: cachedRole,
    savedKey: savedKey,
    forget: forget,
    expired: expired,
    remainingMs: remainingMs
  };
})();
