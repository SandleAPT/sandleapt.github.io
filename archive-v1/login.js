/*
 * login.js — 공개 화면의 로그인 (4.4)
 *
 * 지금까지 권한 규칙과 판정 모듈은 만들어 검증까지 했는데, **입주민이 실제로 비밀번호를
 * 넣는 자리가 없었다.** 그래서 “규칙은 있는데 쓸 수가 없는” 상태였다. 그 자리를 만든다.
 *
 * 무엇을 하고 무엇을 하지 않는가
 *  - 한다: 비밀번호를 받아 서버에 확인시키고, 지금 누구로 보고 있는지 화면에 알린다.
 *  - 하지 않는다: **내부공개·비공개 자료를 실제로 내려주지 않는다.** 그 자료는 아직
 *    공개 번들에 없고(정책상 넣지 않는다), 서버에서 받아오는 경로도 아직 없다(`4.1`).
 *    그러므로 지금 로그인해도 보이는 자료는 늘어나지 않는다. 그 사실을 화면에 그대로 적는다.
 *    "로그인했는데 왜 똑같지?"라고 헷갈리게 두는 것이 더 나쁘다.
 *
 * 비밀번호는 회의록 앱과 같은 것을 쓴다(사용자 결정 2026-09-01). 검증은 서버가 한다.
 */
(function () {
  'use strict';
  /* signIn이 돌려주는 {ok, role}에서 역할만 꺼낸다.
     이 한 줄이 따로 나와 있는 이유: 응답을 그냥 참/거짓으로 봤다가 **틀린 비밀번호에도
     로그인된 것처럼 그려진 적이 있다**(2026-09-02, 검증에서 잡음). 검사로 묶어 둔다. */
  function 역할(res) {
    if (!res) return '';
    if (typeof res === 'string') return res;          // 옛 형태도 받아준다
    return res.ok ? String(res.role || '') : '';
  }
  window.SandleLogin = { 역할: 역할 };

  var S = window.SandleAuthSession, A = window.SandleAccessControl;
  if (!S || !A) return;

  var 자리 = document.getElementById('loginSlot');
  if (!자리) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function 남은시간() {
    var ms = S.remainingMs ? S.remainingMs() : 0;
    if (!ms || ms <= 0) return '';
    var h = Math.floor(ms / 3600000), m = Math.round((ms % 3600000) / 60000);
    return h ? (h + '시간 ' + m + '분 남음') : (m + '분 남음');
  }

  function 그리기(role, 안내) {
    var 이름 = A.describeRole(role);
    var 볼수있는것 = A.allowedLevels(role).map(function (v) { return A.levelName(v); }).join(' · ');
    if (role) {
      자리.innerHTML =
        '<div class="login-box on">' +
        '<div class="login-who"><b>' + esc(이름) + '</b>으로 보는 중' +
        '<small>볼 수 있는 등급: ' + esc(볼수있는것) + (남은시간() ? ' · ' + esc(남은시간()) : '') + '</small></div>' +
        '<button type="button" class="login-out" data-logout>나가기</button>' +
        '</div>' +
        /* 지금은 로그인해도 보이는 자료가 늘지 않는다. 숨기지 않고 적는다. */
        '<p class="login-note">아직 <b>내부공개·비공개 자료를 내려주는 경로가 없어서</b>, 로그인해도 지금 보이는 회의록은 같아. ' +
        '그 자료를 붙이는 일은 따로 남아 있어(4.1 외부 저장소).</p>';
    } else {
      자리.innerHTML =
        '<form class="login-box" data-login>' +
        '<label for="loginPw">입주민·관리자 확인</label>' +
        '<input id="loginPw" type="password" autocomplete="current-password" placeholder="회의록 앱과 같은 비밀번호">' +
        '<button type="submit">확인</button>' +
        '</form>' +
        (안내 ? '<p class="login-note bad">' + esc(안내) + '</p>' :
          '<p class="login-note">회의록은 누구나 볼 수 있어. 비밀번호는 <b>입주민 전용 자료</b>를 붙였을 때를 위한 거야.</p>');
    }
    붙이기();
  }

  function 붙이기() {
    var f = 자리.querySelector('[data-login]');
    if (f) f.onsubmit = function (e) {
      e.preventDefault();
      var pw = (자리.querySelector('#loginPw') || {}).value || '';
      if (!pw) return;
      자리.querySelector('button[type=submit]').disabled = true;
      /* signIn은 역할 문자열이 아니라 {ok, role}을 돌려준다.
         돌려받은 값을 그냥 참/거짓으로 보면 **틀린 비밀번호에도 객체가 참이라 로그인된
         것처럼 그려진다.** 2026-09-02 실제로 그렇게 만들었다가 검증에서 잡혔다.
         그래서 ok와 role을 모두 확인한다. */
      S.signIn(pw).then(function (res) {
        var role = 역할(res);
        if (role) 그리기(role);
        else 그리기('', '비밀번호가 맞지 않아. 회의록 앱에서 쓰는 것과 같은 비밀번호야.');
      }).catch(function () {
        그리기('', '확인하지 못했어. 잠시 뒤 다시 해줘.');
      });
    };
    var out = 자리.querySelector('[data-logout]');
    if (out) out.onclick = function () { S.forget(); 그리기(''); };
  }

  // 처음 열 때: 저장된 키가 있으면 서버에 다시 물어 확인한다(만료·회수 반영).
  그리기('');
  if (S.savedKey && S.savedKey() && !(S.expired && S.expired())) {
    S.currentRole().then(function (r) { var role = 역할(r); if (role) 그리기(role); }).catch(function () {});
  }
})();
