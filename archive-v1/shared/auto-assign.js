/*
 * auto-assign.js — 분류·관계 자동 판정 (2.4)
 *
 * 배경: 사용자 결정(2026-09-01) — "분류나 관계는 자동으로 세팅해주고,
 *      내가 이상하다 느끼면 그걸 수동으로 바꾸는 게 낫다."
 *      회의 224건·안건 1,125건을 하나씩 승인하는 것은 애초에 불가능하다.
 *
 * 그래서 판정 자체보다 **자기가 틀렸을 수 있음을 알아채는 것**이 중요하다.
 * 자동으로 넘어간 것은 아무도 안 보기 때문에, 애매한 것을 골라내지 못하면
 * 틀린 분류가 조용히 쌓인다. 이 모듈이 하는 일의 절반은 그 선별이다.
 *
 * 판정 방식
 *  - 주제: 회의록 앱의 분류표(TopicTaxonomy, 38종)를 그대로 쓴다. 별도 표를 만들면
 *    두 앱의 분류가 갈라진다. 첫 일치로 끝내지 않고 **모든 주제를 채점**한다.
 *  - 애매함: 1등과 2등 점수 차가 작으면 확신이 아니라 우연이다. 사람에게 보낸다.
 *  - 관계: 원문이 상대를 실제로 가리킬 때만 만든다. 가리키는 대상이 없으면
 *    관계를 만들지 않는다(뒤의 '왜 안내문 관계를 만들지 않는가' 참고).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleAutoAssign = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 자동 확정 기준. 이 아래는 사람이 본다.
  var AUTO_MIN_CONFIDENCE = 80;

  // TopicTaxonomy가 없을 때만 쓰는 최소 대비책. 정상 경로에서는 쓰이지 않는다.
  var FALLBACK_DEFS = [
    { key: '주차', kw: ['주차', '차단기'] },
    { key: '하자·소송', kw: ['하자', '소송', '판결'] },
    { key: '선거·임원', kw: ['선거', '선관위', '동별대표', '임원'] },
    { key: '관리비', kw: ['관리비', '부과'] },
    { key: '규약·계약', kw: ['관리규약', '계약'] }
  ];

  function defs(global) {
    var g = global || (typeof window !== 'undefined' ? window : {});
    var t = g.TopicTaxonomy;
    return (t && Array.isArray(t.defs) && t.defs.length) ? t.defs : FALLBACK_DEFS;
  }

  function bodyOf(fields) {
    return [fields.note, fields.summary, fields.decision, fields.body, fields.documentType]
      .filter(Boolean).join(' ');
  }

  /*
   * 걸린 주제를 모두 찾는다. 순서는 분류표(DEFS) 순서를 그대로 지킨다.
   *
   * 왜 점수순으로 정렬하지 않는가:
   *   회의록 앱의 `autoTags`(archive-topics.js)가 분류표 순서로 훑고 첫 번째를
   *   대표 주제로 쓴다. Archive가 다른 순서를 쓰면 같은 안건에 두 앱이 서로 다른
   *   주제를 붙이게 된다. 사용자가 v98에서 1,125건을 직접 검토한 결과가
   *   그 순서 위에 쌓여 있으므로, 여기서는 그 규칙을 그대로 따른다.
   */
  function scanTopics(text, list) {
    var low = String(text || '').toLowerCase();
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var d = list[i], hits = [];
      for (var j = 0; j < (d.kw || []).length; j++) {
        var k = String(d.kw[j]).toLowerCase();
        if (k && low.indexOf(k) >= 0 && hits.indexOf(d.kw[j]) < 0) hits.push(d.kw[j]);
      }
      if (hits.length) out.push({ topic: d.key, hits: hits });
    }
    return out;
  }

  /*
   * 분류. **제목을 먼저 보고, 제목에서 걸리면 본문은 아예 보지 않는다.**
   *
   * 실측으로 확인한 것(2026-09-01, 실제 안건 1,212건):
   *   제목과 본문을 함께 채점했더니 61%가 '애매'로 떨어져 자동화한 의미가 없었다.
   *   원인은 본문에 논의 내용이 통째로 들어 있어 제목을 덮어버린 것이었다.
   *   실제로 「잡수입 보고의 건」이 경비·보안으로, 「주차장 운영규정(안)」이
   *   장기수선으로 분류됐다.
   *   제목 우선으로 바꾸니 92.1%가 제목만으로 판정되고, 사람이 볼 것은 7.9%가 됐다.
   *
   * 제목에서 여러 주제가 걸리는 것은 문제가 아니다(1,116건 중 402건).
   * 「작은도서관 잡수입 지원」은 둘 다 맞다. 대표 주제만 첫 번째로 쓰고
   * 나머지는 alternatives로 넘겨 화면에서 바꿀 수 있게 한다.
   */
  function classify(fields, global) {
    fields = fields || {};
    var list = defs(global);

    var byTitle = scanTopics(fields.title, list);
    if (byTitle.length) {
      return {
        topic: byTitle[0].topic,
        confidence: byTitle.length === 1 ? 92 : 88,
        autoOk: true,
        reason: 'title',
        why: byTitle[0].hits.join('·') + ' 이(가) 안건명에 있어 ‘' + byTitle[0].topic + '’으로 봤다.'
          + (byTitle.length > 1 ? ' (' + byTitle.slice(1).map(function (t) { return t.topic; }).join('·') + '에도 해당)' : ''),
        matched: byTitle[0].hits,
        alternatives: byTitle.slice(1, 4).map(function (t) { return { topic: t.topic, hits: t.hits }; })
      };
    }

    // 제목에 단서가 없을 때만 본문을 본다. 본문은 논의 내용이 섞여 있어 믿기 어려우므로
    // 자동 확정하지 않는다. 실측에서 「기타 안건」 하나가 주차·경비·통신·승강기·지원사업
    // 다섯 주제에 동시에 걸렸다.
    var byBody = scanTopics(bodyOf(fields), list);
    if (byBody.length) {
      return {
        topic: byBody[0].topic,
        confidence: 65,
        autoOk: false,
        reason: 'body-only',
        why: '안건명에는 단서가 없고 본문에서 ' + byBody.map(function (t) { return t.topic; }).slice(0, 4).join('·')
          + ' 이(가) 걸렸다. 본문은 논의 내용이 섞여 있어 그대로 믿기 어렵다.',
        matched: byBody[0].hits,
        alternatives: byBody.slice(1, 4).map(function (t) { return { topic: t.topic, hits: t.hits }; })
      };
    }

    return {
      topic: '기타', confidence: 0, autoOk: false, reason: 'no-match',
      why: '안건명에도 본문에도 걸린 단어가 없다. 사람이 정해야 한다.',
      matched: [], alternatives: []
    };
  }

  /*
   * 관계 자동 판정.
   *
   * 왜 안내문 관계를 만들지 않는가:
   *  이전 구현은 문서 종류만 보고 target을 '근거 회의·결정 확인 필요' 같은
   *  안내문으로 채운 관계를 만들었다. 그러면 공고가 들어올 때마다 가리키는 대상이
   *  없는 항목이 검토함에 쌓이고, 사람은 매번 '연결 없이 진행'을 눌러야 한다.
   *  할 일 메모를 관계인 척 저장한 셈이다.
   *  여기서는 원문이 상대를 실제로 가리킬 때만 관계를 만든다. 못 찾으면 null이다.
   */
  var REFERENCE_RULES = [
    // 공고 번호: 공고 제2016-10호 / 제2016-10호
    { re: /(?:공고\s*)?제\s*(\d{4}\s*-\s*\d+)\s*호/, type: 'based_on', label: function (m) { return '공고 제' + m[1].replace(/\s/g, '') + '호'; } },
    // 회차 참조: 제12차 회의 / 제12차 정기회의
    { re: /제\s*(\d+)\s*차\s*(?:정기|임시)?\s*회의/, type: 'follow_up_to', label: function (m) { return '제' + m[1] + '차 회의'; } },
    // 날짜 결의: 2018년 2월 결의 / 2018.2. 의결
    { re: /(\d{4})\s*[년.]\s*(\d{1,2})\s*[월.]?\s*(?:자\s*)?(?:결의|의결)/, type: 'implements', label: function (m) { return m[1] + '년 ' + Number(m[2]) + '월 의결'; } },
    // 사건번호: 2020가합12345
    { re: /(\d{4}\s*[가-힣]{1,3}\s*\d{3,6})/, type: 'related_to', label: function (m) { return '사건 ' + m[1].replace(/\s/g, ''); } }
  ];

  function relate(fields) {
    var text = textOf(fields);
    for (var i = 0; i < REFERENCE_RULES.length; i++) {
      var r = REFERENCE_RULES[i], m = text.match(r.re);
      if (m) {
        return {
          target: r.label(m),
          type: r.type,
          // 원문이 직접 가리키고 있으므로 explicit. 다만 그 대상이 우리 기록에
          // 실제로 있는지는 아직 확인하지 않았다 → 자동 확정은 하지 않는다.
          evidence: 'explicit',
          approved: false,
          skipped: false,
          autoFound: true,
          why: '원문에 “' + m[0].trim() + '”라고 적혀 있다.'
        };
      }
    }
    return null; // 가리키는 대상이 없으면 관계를 만들지 않는다.
  }

  return {
    AUTO_MIN_CONFIDENCE: AUTO_MIN_CONFIDENCE,
    classify: classify,
    relate: relate,
    scanTopics: scanTopics
  };
});
