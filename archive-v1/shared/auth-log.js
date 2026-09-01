/*
 * auth-log.js — 인증 기록을 사람이 읽을 수 있게 정리한다 (4.3c)
 *
 * 서버가 주는 것은 `{at, action, result, dev}` 줄의 나열이다. 그대로 늘어놓으면
 * 200줄을 눈으로 훑어야 하고, 그러면 아무도 안 본다. 여기서 **봐야 할 것을 먼저 말해 준다.**
 *
 * 무엇이 이상 신호인가
 *  - **실패가 몰린다** — 짧은 시간에 여러 번 틀렸다면 누가 비밀번호를 찍어보고 있는 것이다.
 *  - **수정용 통과가 낯설다** — 내가 일하지 않은 시각의 `edit` 통과는 비밀번호가 샌 신호다.
 *  - **모르는 기기 표시** — 다만 이 값은 기기가 스스로 말한 것이라 믿을 수 없다(참고용).
 *
 * 이 판정은 **의심할 거리를 골라 주는 것이지 사고를 단정하는 것이 아니다.**
 * 잘못 단정하면 사용자가 이웃을 의심하게 된다. 문구도 그렇게 쓴다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleAuthLog = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 몇 번을 몇 분 안에 틀리면 "찍어보는 중"으로 볼 것인가.
  // 사람이 오타로 연달아 틀리는 것은 보통 2~3번이라 5번으로 둔다.
  var 실패묶음 = 5, 묶음창 = 10 * 60 * 1000;

  function 시각(v) {
    var d = new Date(String(v || ''));
    return isNaN(d) ? null : d;
  }

  function 뜻(row) {
    var r = String((row && row.result) || '');
    if (r === 'edit') return '수정용 통과';
    if (r === 'view') return '열람용 통과';
    if (r === 'fail') return '비밀번호 틀림';
    if (r === 'denied') return '권한 없이 시도';
    return r || '알 수 없음';
  }

  function 정상인가(row) {
    var r = String((row && row.result) || '');
    return r === 'edit' || r === 'view';
  }

  /*
   * 짧은 시간에 몰린 실패를 찾는다.
   * 기기별로 나눠 센다 — 서로 다른 기기의 실패가 우연히 겹친 것을 한 덩어리로 보면 안 된다.
   */
  function 실패몰림(rows) {
    var 기기 = {};
    (rows || []).forEach(function (r) {
      if (정상인가(r)) return;
      var d = 시각(r.at); if (!d) return;
      var k = String(r.dev || '(표시 없음)');
      (기기[k] = 기기[k] || []).push(d.getTime());
    });
    var out = [];
    Object.keys(기기).forEach(function (k) {
      var ts = 기기[k].sort(function (a, b) { return a - b; });
      for (var i = 0; i + 실패묶음 - 1 < ts.length; i++) {
        var j = i + 실패묶음 - 1;
        if (ts[j] - ts[i] <= 묶음창) {
          out.push({ 기기: k, 횟수: ts.length, 처음: new Date(ts[i]).toISOString(), 마지막: new Date(ts[ts.length - 1]).toISOString() });
          break;   // 기기당 한 번만 알린다
        }
      }
    });
    return out;
  }

  /*
   * 요약. 숫자만 주지 않고 **무엇을 봐야 하는지**까지 말한다.
   * 아무 이상이 없으면 없다고 분명히 말한다 — 조용한 화면은 "확인이 안 된 것"과 구별되지 않는다.
   */
  function 요약(rows) {
    var r = rows || [];
    var 셈 = { 수정용: 0, 열람용: 0, 실패: 0, 거부: 0 };
    r.forEach(function (x) {
      var v = String(x.result || '');
      if (v === 'edit') 셈.수정용++;
      else if (v === 'view') 셈.열람용++;
      else if (v === 'fail') 셈.실패++;
      else if (v === 'denied') 셈.거부++;
    });
    var 기기 = {};
    r.forEach(function (x) { 기기[String(x.dev || '(표시 없음)')] = true; });
    var 몰림 = 실패몰림(r);
    var 문구 = [];
    if (!r.length) 문구.push('기록이 아직 없어. 서버에 기록 기능을 올린 뒤부터 쌓여.');
    else {
      문구.push('최근 ' + r.length + '건 — 수정용 ' + 셈.수정용 + ' · 열람용 ' + 셈.열람용 +
        ' · 틀림 ' + 셈.실패 + ' · 권한 없이 시도 ' + 셈.거부 + '. 기기 ' + Object.keys(기기).length + '대.');
      if (몰림.length) {
        문구.push('짧은 시간에 실패가 몰린 기기가 ' + 몰림.length + '대 있어. 누가 비밀번호를 찍어보고 있을 수 있어.');
      } else if (셈.실패 || 셈.거부) {
        문구.push('실패가 있지만 몰려 있지는 않아. 대개 오타야.');
      } else {
        문구.push('이상해 보이는 건 없어.');
      }
      문구.push('기기 표시는 그 기기가 스스로 말한 값이라 믿을 수 있는 신원은 아니야. 서버는 접속한 곳을 알 수 없어.');
    }
    return { 셈: 셈, 기기수: Object.keys(기기).length, 몰림: 몰림, 문구: 문구 };
  }

  return { 뜻: 뜻, 정상인가: 정상인가, 실패몰림: 실패몰림, 요약: 요약, 실패묶음: 실패묶음, 묶음창: 묶음창 };
});
