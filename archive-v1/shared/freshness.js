/*
 * freshness.js — 사본이 얼마나 뒤처졌는지 확인한다 (4.6b)
 *
 * 배경: 공개 화면은 하루 한 번 만들어지는 정적 사본(`/minutes/data-*.json`)을 읽는다.
 * 4.6a에서 "언제까지의 자료인지"는 적었다. 여기서는 **뒤처졌을 때 무엇을 해줄 수 있는가**를 다룬다.
 *
 * ── 왜 '강제 갱신' 버튼이 없는가 ───────────────────────────────
 * 사본은 GitHub Actions가 만든다. 그것을 돌리려면 저장소 쓰기 토큰이 필요한데,
 * 공개 페이지에 그런 토큰을 넣을 수는 없다. **누르면 아무 일도 안 하는 버튼을 만드는 것이
 * 제일 나쁘다.** 그래서 만들지 않는다.
 *
 * ── 대신 되는 것 ──────────────────────────────────────────────
 * 클라우드에 **한 번** 물어보는 것은 싸다. `list`는 요청 1회에 메타데이터만 돌려준다
 * (본문 없음 — 회의 하나씩 받아오는 것과는 비용이 다르다). 그것으로,
 *
 *   1. 사본에 없는 회의가 몇 건인지, 어떤 것인지 정확히 말해 줄 수 있고
 *   2. 그 회의를 **회의록 앱에서 지금 바로 열 수 있는 링크**를 줄 수 있다.
 *
 * 2번이 핵심이다. 사본 갱신을 강제할 수 없어도 **사용자가 원하는 결과 — 그 자료를 지금
 * 보는 것 — 은 다른 길로 줄 수 있다.** 회의록 앱은 클라우드를 직접 읽으므로 늘 최신이다.
 *
 * 네트워크는 주입받는다(`tag-writer.js`와 같은 방식). 검사에서 실제 요청 없이 돌리기 위함이다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleFreshness = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* 회의록 앱과 같은 접속 설정을 쓴다.
   * 값을 여기에 베껴 두면 저쪽이 바뀌었을 때 **조용히 unauthorized가 나는** 상태가 된다.
   * 그래서 같은 사이트에 있는 회의록 앱 코드에서 직접 뽑아 쓰고, 못 뽑으면 박아둔 값으로 돌아간다.
   * (박아둔 값도 이미 공개 HTML에 들어 있는 읽기 전용 토큰이라 새로 드러나는 것은 없다.) */
  var 기본 = {
    url: 'https://script.google.com/macros/s/AKfycbyhpE-DB5WAAEx7uqTCPwU-e0sPKuupkYN3YoQWALiFWe0IHFNh1y91e1VNtDmMxxoxLA/exec',
    token: 'ITDXaUBDTmrz6DbQ3tv9R'
  };

  function 설정뽑기(text) {
    var u = String(text || '').match(/DEFAULT_URL\s*=\s*"([^"]+)"/);
    var t = String(text || '').match(/DEFAULT_TOKEN\s*=\s*"([^"]+)"/);
    if (u && t) return { url: u[1], token: t[1], 출처: '회의록 앱 설정' };
    return null;
  }

  function 설정(fetchFn) {
    return fetchFn('/minutes/assets/js/app/cloud.js', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { return 설정뽑기(t) || { url: 기본.url, token: 기본.token, 출처: '박아둔 값' }; })
      .catch(function () { return { url: 기본.url, token: 기본.token, 출처: '박아둔 값' }; });
  }

  // 클라우드 목록 — 메타데이터만. 본문은 받지 않는다.
  function 클라우드목록(fetchFn, cfg) {
    var u = cfg.url + '?action=list&token=' + encodeURIComponent(cfg.token);
    return fetchFn(u, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (x) {
        if (!x || !x.ok) throw new Error((x && x.error) || '목록을 받지 못했어');
        return x.items || [];
      });
  }

  /*
   * 시스템 레코드는 회의가 아니다(주제 요약·명단 이력 등). 세면 건수가 안 맞는다.
   * 기준은 회의록 앱과 같다 — id 접두어로 가른다.
   */
  function 회의인가(id) {
    var s = String(id || '');
    return !!s && s.indexOf('topic_summaries') !== 0 && s.indexOf('roster_history') !== 0;
  }

  /*
   * 사본과 클라우드를 대조한다.
   * 사본에 **없는** 것만 본다. 반대(사본에만 있는 것)는 삭제된 회의라 여기서 다루지 않는다.
   */
  function 비교(사본, 클라우드) {
    var 있음 = {};
    (사본 || []).forEach(function (m) { if (m && m.id) 있음[String(m.id)] = true; });
    var 회의 = (클라우드 || []).filter(function (it) { return 회의인가(it && it.id); });
    var 빠진것 = 회의.filter(function (it) { return !있음[String(it.id)]; })
      .map(function (it) {
        return {
          id: String(it.id),
          이름: String(it.name || it.id),
          날짜: String(it.date || ''),
          원문: '/minutes/?open=' + encodeURIComponent(String(it.id))
        };
      })
      .sort(function (a, b) { return String(b.날짜).localeCompare(String(a.날짜)); });
    var 최신 = function (arr, k) {
      return (arr || []).reduce(function (m, x) {
        var v = String((x && x[k]) || '');
        return v > m ? v : m;
      }, '');
    };
    return {
      사본건수: (사본 || []).length,
      클라우드건수: 회의.length,
      빠진것: 빠진것,
      최신클라우드: 최신(회의, 'updatedAt'),
      뒤처짐: 빠진것.length > 0
    };
  }

  // 화면에 그대로 쓸 한 줄. 숫자만 던지지 않고 무슨 뜻인지까지 적는다.
  function 문구(r) {
    if (!r) return '';
    if (!r.뒤처짐) return '클라우드와 같아. 빠진 회의 없어.';
    var n = r.빠진것.length;
    return '클라우드에 ' + n + '건이 더 있어. 사본에는 아직 안 들어왔고, 아래에서 바로 열어볼 수 있어.';
  }

  /*
   * 사본이 며칠째 안 만들어졌을 때의 안내.
   * "기다려 봐"로 끝내면 사용자가 할 수 있는 것이 없다. 어디를 봐야 하는지까지 적는다.
   */
  function 멈춤안내(지난날) {
    if (!(지난날 >= 3)) return '';
    return '사본은 원래 하루 한 번 다시 만들어지는데 ' + 지난날 + '일째 그대로야. ' +
      '만드는 작업(minutes 저장소의 자동 실행)이 실패하고 있을 가능성이 높아. ' +
      '그동안에도 회의록 앱은 클라우드를 직접 읽으니 최신이야.';
  }

  return {
    설정: 설정, 설정뽑기: 설정뽑기, 클라우드목록: 클라우드목록,
    회의인가: 회의인가, 비교: 비교, 문구: 문구, 멈춤안내: 멈춤안내
  };
});
