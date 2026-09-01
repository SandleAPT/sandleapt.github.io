/*
 * reference-resolver.js — 원문이 가리키는 말을 실제 기록으로 찾아준다
 *
 * 왜 필요한가: 지금 자동으로 만들어지는 관계의 대상이 `"공고 제2022-128호"`라는
 * **글자**다. 실제 기록을 가리키는 것이 아니라서, 그대로 저장하면 아무 데도 닿지 않는
 * 링크가 쌓인다. 링크가 있는데 눌러도 아무것도 안 나오는 것은 없느니만 못하다.
 *
 * 이 모듈의 원칙 — **모르면 만들지 않는다.**
 *   확정: 딱 하나가 맞는다. 이것만 자동으로 이어도 된다.
 *   후보: 여럿이 맞는다. 사람이 골라야 한다.
 *   없음: 못 찾았다. 관계를 만들지 않는다.
 * 억지로 하나를 고르면 없던 인과를 만들어내게 된다. 관계는 사실 주장이라
 * 틀리면 태그가 틀린 것보다 훨씬 나쁘다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleRefResolver = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /*
   * 공고 번호를 대조용 열쇠로 바꾼다.
   * 실제 값이 제각각이다: "제2015-17호", "임차인선거관리위 제2018-07호", "임차선거관리위 제2022-03호".
   * 앞의 발행 주체는 떼고 연도-번호만 쓴다. 앞자리 0도 없앤다("제2022-01호" = "제2022-1호").
   */
  function 공고열쇠(s) {
    var m = String(s || '').match(/(\d{4})\s*-\s*(\d+)/);
    if (!m) return '';
    return m[1] + '-' + String(parseInt(m[2], 10));
  }

  // 회의 id로 어느 회의체인지 안다. m_=입주자대표회의, t_=임차인대표회의
  function 회의체(id) {
    var s = String(id || '');
    if (s.indexOf('t_') === 0) return '임차';
    if (s.indexOf('m_') === 0) return '입대의';
    return '';
  }

  function 연월(dateLike) {
    var s = String(dateLike || '');
    var m = s.match(/^(\d{4})-(\d{1,2})/);
    if (m) return m[1] + '-' + String(parseInt(m[2], 10));
    var d = new Date(s);
    return isNaN(d) ? '' : d.getFullYear() + '-' + (d.getMonth() + 1);
  }

  /*
   * 찾기용 색인을 만든다.
   * notices: [{id, title, date, noticeNo, body}]
   * meetings: [{id, name, date}]
   */
  function buildIndex(data) {
    data = data || {};
    var 공고 = {}, 회의연월 = {};
    (data.notices || []).forEach(function (n) {
      if (!n || !n.id) return;
      var k = 공고열쇠(n.noticeNo);
      if (!k) return;
      (공고[k] = 공고[k] || []).push({ id: n.id, 제목: n.title || '', 날짜: n.date || '', 종류: '공고' });
    });
    (data.meetings || []).forEach(function (m) {
      if (!m || !m.id) return;
      var k = 연월(m.date);
      if (!k) return;
      (회의연월[k] = 회의연월[k] || []).push({
        id: m.id, 제목: m.name || '', 날짜: m.date || '', 종류: '회의', 회의체: 회의체(m.id)
      });
    });
    return { 공고: 공고, 회의연월: 회의연월 };
  }

  function 결과(상태, 목록, 이유) {
    var out = { 상태: 상태, 후보: 목록 || [], 이유: 이유 || '' };
    if (상태 === '확정' && out.후보.length === 1) {
      out.id = out.후보[0].id;
      out.제목 = out.후보[0].제목;
      out.종류 = out.후보[0].종류;
    }
    return out;
  }

  /*
   * 가리키는 말 하나를 찾는다.
   * ref: auto-assign 이 만든 target 문자열 (예: "공고 제2016-10호", "2018년 6월 의결")
   * ctx: 가리킨 쪽의 정보 { 회의id } — 같은 회의체로 좁히는 데 쓴다.
   */
  function resolve(ref, index, ctx) {
    ref = String(ref || '').trim();
    index = index || { 공고: {}, 회의연월: {} };
    ctx = ctx || {};
    if (!ref) return 결과('없음', [], '가리키는 말이 없다');

    // ── 공고 번호
    var k = 공고열쇠(ref);
    if (/공고|호/.test(ref) && k) {
      var 공고후보 = index.공고[k] || [];
      if (공고후보.length === 1) return 결과('확정', 공고후보);
      if (공고후보.length > 1) return 결과('후보', 공고후보, '같은 번호의 공고가 여럿이다');
      return 결과('없음', [], '보관함에 그 번호의 공고가 없다');
    }

    // ── 연·월 의결 (예: "2018년 6월 의결")
    var ym = ref.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/);
    if (ym) {
      var 키 = ym[1] + '-' + String(parseInt(ym[2], 10));
      var 회의후보 = (index.회의연월[키] || []).slice();
      // 가리킨 쪽과 같은 회의체로 좁힌다. 입대의 회의록이 임차 회의를 가리키는 일은 드물다.
      var 내회의체 = 회의체(ctx.회의id);
      if (내회의체) {
        var 같은체 = 회의후보.filter(function (x) { return x.회의체 === 내회의체; });
        if (같은체.length) 회의후보 = 같은체;
      }
      // 자기 자신은 뺀다. 자기를 가리키는 관계는 뜻이 없다.
      회의후보 = 회의후보.filter(function (x) { return x.id !== ctx.회의id; });
      if (회의후보.length === 1) return 결과('확정', 회의후보);
      if (회의후보.length > 1) return 결과('후보', 회의후보, '그 달에 회의가 여럿이다(정기·임시)');
      return 결과('없음', [], '그 연·월의 회의를 못 찾았다');
    }

    /* ── 제N차 회의
     * 차수는 기수 안에서 매겨지는데 원문에는 기수가 없는 경우가 많다.
     * "제12차 회의"만으로는 어느 기의 12차인지 알 수 없다. 억지로 고르지 않는다. */
    if (/제\s*\d+\s*차/.test(ref)) {
      return 결과('없음', [], '차수만으로는 어느 기수인지 알 수 없다 — 사람이 골라야 한다');
    }

    // ── 사건번호: 법원 사건을 담는 기록 종류가 아직 없다
    if (/\d{4}\s*[가-힣]{1,3}\s*\d{3,6}/.test(ref)) {
      return 결과('없음', [], '법원 사건을 담는 기록이 아직 없다');
    }

    return 결과('없음', [], '무엇을 가리키는지 알 수 없는 형식');
  }

  return {
    공고열쇠: 공고열쇠,
    회의체: 회의체,
    연월: 연월,
    buildIndex: buildIndex,
    resolve: resolve
  };
});
