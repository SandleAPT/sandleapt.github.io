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
    /* 상단 작은 단추 + 눌러야 펼쳐지는 칸 (사용자 요청 2026-09-02).
       평소엔 단추 하나만 보이고, 누를 때만 입력칸이 나온다. */
    var 열림 = 자리.classList.contains('open');
    if (role) {
      자리.innerHTML =
        '<button type="button" class="login-chip on" data-toggle>' + esc(이름) + '</button>' +
        '<div class="login-panel"' + (열림 ? '' : ' hidden') + '>' +
        '<div class="login-box on">' +
        '<div class="login-who"><b>' + esc(이름) + '</b>으로 보는 중' +
        '<small>볼 수 있는 등급: ' + esc(볼수있는것) + (남은시간() ? ' · ' + esc(남은시간()) : '') + '</small></div>' +
        '<button type="button" class="login-out" data-logout>나가기</button>' +
        '</div>' +
        /* 지금은 로그인해도 보이는 자료가 늘지 않는다. 숨기지 않고 적는다. */
        '<p class="login-note">아직 <b>내부공개·비공개 자료를 내려주는 경로가 없어서</b>, 로그인해도 지금 보이는 회의록은 같습니다. ' +
        '그 자료를 연결하는 일은 아직 남아 있습니다.</p>' +
        /* 인증 기록은 관리자만. 입주민에게 접근 기록을 보여주지 않는다(서버도 같은 판정을 한다). */
        (role === 'edit' ? '<div class="login-audit"><button type="button" class="fresh-btn" data-audit>인증 기록 보기</button></div>' : '') +
        '</div>';
    } else {
      자리.innerHTML =
        '<button type="button" class="login-chip" data-toggle>🔑 로그인</button>' +
        '<div class="login-panel"' + (열림 || 안내 ? '' : ' hidden') + '>' +
        '<form class="login-box" data-login>' +
        '<label for="loginPw">입주민·관리자 확인</label>' +
        '<input id="loginPw" type="password" autocomplete="current-password" placeholder="회의록 앱과 같은 비밀번호">' +
        '<button type="submit">확인</button>' +
        '</form>' +
        (안내 ? '<p class="login-note bad">' + esc(안내) + '</p>' :
          '<p class="login-note">회의록은 누구나 볼 수 있습니다. 비밀번호는 <b>입주민 전용 자료</b>를 위한 것입니다.</p>') +
        '</div>';
      if (안내) 자리.classList.add('open');
    }
    붙이기();
  }

  function 붙이기() {
    // 단추를 누르면 칸이 열리고 닫힌다. 화면 밖을 누르면 닫는다.
    var chip = 자리.querySelector('[data-toggle]');
    if (chip) chip.onclick = function (e) {
      e.stopPropagation();
      자리.classList.toggle('open');
      var p = 자리.querySelector('.login-panel');
      if (p) p.hidden = !자리.classList.contains('open');
    };
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
        else 그리기('', '비밀번호가 맞지 않습니다. 회의록 앱과 같은 비밀번호입니다.');
      }).catch(function () {
        그리기('', '확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
      });
    };
    var out = 자리.querySelector('[data-logout]');
    if (out) out.onclick = function () { S.forget(); 그리기(''); };

    var a = 자리.querySelector('[data-audit]');
    if (a) a.onclick = function () { 기록보기(a); };
  }

  // 인증 기록 (4.3c). 판정은 서버가 한다 — 여기서 role을 보고 숨기는 것은 화면 정리일 뿐이다.
  function 기록보기(btn) {
    btn.disabled = true; btn.textContent = '불러오는 중…';
    S.authLog(50).then(function (res) {
      btn.disabled = false; btn.textContent = '다시 불러오기';
      var 통 = 자리.querySelector('.login-audit');
      var 옛 = 통.querySelector('.audit-out'); if (옛) 옛.remove();
      var box = document.createElement('div');
      box.className = 'audit-out';

      if (!res || !res.ok) {
        var 왜 = (res && res.error) || '알 수 없음';
        box.innerHTML = '<p class="fresh-line">' + esc(
          왜 === 'unknown action' ? '서버에 기록 기능이 아직 없습니다. Apps Script를 새 버전으로 배포하면 그때부터 쌓입니다.' :
          왜 === 'admin_required' ? '수정용 비밀번호가 필요합니다.' :
          '기록을 불러오지 못했습니다 — ' + 왜) + '</p>';
        통.appendChild(box); return;
      }

      var rows = res.items || [];
      var L = window.SandleAuthLog;
      var html = '';
      if (L) html += L.요약(rows).문구.map(function (t) { return '<p class="fresh-line">' + esc(t) + '</p>'; }).join('');
      if (rows.length) {
        html += '<table class="audit-tb"><tbody>' + rows.map(function (r) {
          var 나쁨 = L ? !L.정상인가(r) : false;
          var d = new Date(String(r.at || ''));
          var 때 = isNaN(d) ? String(r.at || '') :
            (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
          return '<tr' + (나쁨 ? ' class="bad"' : '') + '><td>' + esc(때) + '</td><td>' +
            esc(L ? L.뜻(r) : (r.result || '')) + '</td><td>' + esc(r.action || '') + '</td><td>' + esc(r.dev || '') + '</td></tr>';
        }).join('') + '</tbody></table>';
      }
      box.innerHTML = html;
      통.appendChild(box);
    }).catch(function () {
      btn.disabled = false; btn.textContent = '다시 불러오기';
    });
  }

  // 화면 밖을 누르면 닫는다 — 상단 단추 옆에 열린 채로 남아 있으면 거슬린다.
  document.addEventListener('click', function (e) {
    if (!자리.classList.contains('open')) return;
    if (자리.contains(e.target)) return;
    자리.classList.remove('open');
    var p = 자리.querySelector('.login-panel');
    if (p) p.hidden = true;
  });

  // 처음 열 때: 저장된 키가 있으면 서버에 다시 물어 확인한다(만료·회수 반영).
  그리기('');
  if (S.savedKey && S.savedKey() && !(S.expired && S.expired())) {
    S.currentRole().then(function (r) { var role = 역할(r); if (role) 그리기(role); }).catch(function () {});
  }
})();
