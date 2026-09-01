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
  var AMBIGUOUS_MARGIN = 1; // 1등과 2등의 일치 개수 차가 이 값 이하면 애매

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

  function textOf(fields) {
    return [fields.title, fields.note, fields.documentType, fields.summary, fields.body]
      .filter(Boolean).join(' ');
  }

  /*
   * 주제 채점. 대소문자만 무시하고, 키워드가 몇 종류 걸렸는지 센다.
   * 같은 키워드가 여러 번 나와도 1로 센다 — 긴 문서가 무조건 이기지 않게.
   */
  function scoreTopics(text, list) {
    var low = String(text || '').toLowerCase();
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var d = list[i], hits = [];
      for (var j = 0; j < (d.kw || []).length; j++) {
        var k = String(d.kw[j]).toLowerCase();
        if (k && low.indexOf(k) >= 0 && hits.indexOf(d.kw[j]) < 0) hits.push(d.kw[j]);
      }
      if (hits.length) out.push({ topic: d.key, hits: hits, score: hits.length });
    }
    out.sort(function (a, b) { return b.score - a.score || String(a.topic).localeCompare(String(b.topic), 'ko'); });
    return out;
  }

  function classify(fields, global) {
    fields = fields || {};
    var ranked = scoreTopics(textOf(fields), defs(global));
    var top = ranked[0], second = ranked[1];

    if (!top) {
      return {
        topic: '기타', confidence: 0, autoOk: false, reason: 'no-match',
        why: '걸린 키워드가 없다. 사람이 정해야 한다.',
        matched: [], alternatives: []
      };
    }

    /*
     * 일치 개수를 신뢰도로 환산.
     *
     * 단서 1개(예: 제목이 "주차장 도색 공사")도 자동 확정한다. 실제 제목 대부분이
     * 키워드 하나만 걸리는데, 이걸 전부 사람에게 보내면 검토함이 1,000건이 되어
     * 자동화한 의미가 없어진다. 주제를 잘못 붙이는 것은 권한 문제가 아니라
     * 나중에 고치면 되는 이름표 문제이므로, 여기서는 통과시키는 쪽이 낫다.
     *
     * 진짜 위험한 것은 단서가 적은 경우가 아니라 **두 주제가 맞붙는 경우**다.
     * 그건 아래 ambiguous에서 걸러 사람에게 보낸다.
     */
    var base = [60, 82, 88, 93, 96][Math.min(top.score, 4)];
    var ambiguous = !!second && (top.score - second.score) <= AMBIGUOUS_MARGIN;
    var confidence = ambiguous ? Math.min(base, 70) : base;

    var why, reason;
    if (ambiguous) {
      reason = 'ambiguous';
      why = '‘' + top.topic + '’과 ‘' + second.topic + '’ 둘 다 비슷하게 걸렸다. 어느 쪽인지 사람이 봐야 한다.';
    } else if (confidence < AUTO_MIN_CONFIDENCE) {
      reason = 'weak';
      why = '걸린 단서가 약해 확신하기 이르다.';
    } else {
      reason = 'ok';
      why = top.hits.join('·') + ' 이(가) 걸려 ‘' + top.topic + '’으로 봤다.';
    }

    return {
      topic: top.topic,
      confidence: confidence,
      autoOk: reason === 'ok',
      reason: reason,
      why: why,
      matched: top.hits,
      alternatives: ranked.slice(1, 4).map(function (r) { return { topic: r.topic, hits: r.hits }; })
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
    AMBIGUOUS_MARGIN: AMBIGUOUS_MARGIN,
    classify: classify,
    relate: relate,
    scoreTopics: scoreTopics
  };
});
