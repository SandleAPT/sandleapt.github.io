/*
 * freshness-ui.js — "지금 클라우드에 물어보기" (4.6b)
 *
 * 4.6a는 사본이 언제 것인지 알려 준다. 그것만으로는 **뒤처졌을 때 할 수 있는 일이 없다.**
 * 여기서 두 가지를 준다.
 *   1. 지금 정확히 몇 건이 빠졌는지 (요청 1회 — 본문은 안 받는다)
 *   2. 빠진 회의를 회의록 앱에서 **바로 여는 링크**
 *
 * 2번이 핵심이다. 사본 갱신은 강제할 수 없지만, 사용자가 원하는 결과 — 그 회의를 지금
 * 보는 것 — 은 다른 길로 줄 수 있다. 회의록 앱은 클라우드를 직접 읽으므로 늘 최신이다.
 *
 * 평소 방문에서는 아무 요청도 하지 않는다. 눌렀을 때만 물어본다.
 * 그러지 않으면 방문자마다 Apps Script를 두드리게 되어 4.6에서 정적 사본을 쓰기로 한 이유가 사라진다.
 */
(function () {
  'use strict';
  var F = window.SandleFreshness;
  if (!F) return;

  var 자리 = document.getElementById('freshCheck');
  if (!자리) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function 버튼(라벨) {
    자리.innerHTML = '<button type="button" class="fresh-btn" data-check>' + esc(라벨) + '</button>';
    자리.querySelector('[data-check]').onclick = 확인;
  }

  function 알림(html, 나쁨) {
    var p = document.createElement('div');
    p.className = 'fresh-out' + (나쁨 ? ' bad' : '');
    p.innerHTML = html;
    자리.appendChild(p);
  }

  function 확인() {
    var b = 자리.querySelector('[data-check]');
    b.disabled = true; b.textContent = '클라우드에 확인하는 중…';

    var 사본 = window.SANDLE_ARCHIVE_COPY;
    if (!사본) {
      버튼('지금 클라우드에 물어보기');
      알림('아직 사본을 다 읽지 못했습니다. 잠시 뒤 다시 눌러 주세요.', true);
      return;
    }

    F.설정(window.fetch.bind(window))
      .then(function (cfg) { return F.클라우드목록(window.fetch.bind(window), cfg); })
      .then(function (items) {
        var r = F.비교(사본, items);
        버튼('다시 확인');
        var html = '<p class="fresh-line">' + esc(F.문구(r)) +
          ' <small>(사본 ' + r.사본건수 + '건 · 클라우드 ' + r.클라우드건수 + '건)</small></p>';
        if (r.뒤처짐) {
          /* 링크를 주는 것이 이 화면의 요점이다. 몇 건인지만 알려 주면 사용자가 할 수 있는 것이 없다. */
          html += '<ul class="fresh-list">' + r.빠진것.slice(0, 20).map(function (m) {
            return '<li><a href="' + esc(m.원문) + '">' + esc(m.이름) + '</a>' +
              (m.날짜 ? ' <small>' + esc(m.날짜) + '</small>' : '') + '</li>';
          }).join('') + '</ul>';
          if (r.빠진것.length > 20) html += '<p class="fresh-line"><small>…그 밖에 ' + (r.빠진것.length - 20) + '건 더</small></p>';
        }
        var 기준 = (window.SANDLE_ARCHIVE_SAMPLE || {}).기준;
        var 멈춤 = 기준 ? F.멈춤안내(기준.지난날) : '';
        if (멈춤) html += '<p class="fresh-line">' + esc(멈춤) + '</p>';
        알림(html, r.뒤처짐);
      })
      .catch(function (e) {
        // 못 물어봤으면 못 물어봤다고 한다. 조용히 '최신'처럼 보이게 두지 않는다.
        버튼('다시 확인');
        알림('클라우드에 확인하지 못했습니다 — ' + esc(e && e.message ? e.message : '연결 실패') +
          '. 사본에 있는 자료는 그대로 볼 수 있습니다.', true);
      });
  }

  버튼('지금 클라우드에 물어보기');
})();
