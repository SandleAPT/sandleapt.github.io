'use strict';
// 2.4 자동 판정 — 사용자 결정(2026-09-01): 분류·관계는 자동으로 정하고 사람은 이상한 것만 고친다.
// 자동으로 넘어간 것은 아무도 다시 보지 않으므로, '애매한 것을 스스로 골라내는지'가 핵심이다.
//
// 분류표는 spec 안에서 직접 넘긴다. 실제 TopicTaxonomy가 로드됐는지에 따라
// 결과가 달라지면 그건 검증이 아니라 운에 맡기는 것이다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-auto-assign'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // 실제 분류표(topic-defs.js)에서 가져온 형태 그대로의 일부.
  var 분류표 = {
    TopicTaxonomy: {
      defs: [
        { key: '주차', kw: ['주차', '차단기', '반사경'] },
        { key: '하자·소송', kw: ['하자', '소송', '판결', '항소', '배당금'] },
        { key: '선거·임원', kw: ['선거관리위원회', '동별대표', '당선인', '보궐선거'] },
        { key: '승강기', kw: ['승강기', '엘리베이터'] },
        { key: '보험', kw: ['보험', '배상책임'] }
      ]
    }
  };

  return {
    name: 'stage4-auto-assign',
    title: '분류·관계 자동 판정',
    deps: ['shared/auto-assign.js'],
    run: function (ctx) {
      var assert = ctx.assert, A = ctx.global.SandleAutoAssign;
      assert.ok(A, 'SandleAutoAssign 로드');
      var 판정 = function (fields) { return A.classify(fields, 분류표); };

      /* ── 제목이 먼저다. 제목에서 걸리면 본문은 보지 않는다. ──────────────
       * 이 규칙이 이 모듈의 핵심이다. 실측(2026-09-01, 실제 안건 1,212건)에서
       * 제목과 본문을 함께 채점했더니 61%가 사람에게 넘어와 자동화가 무의미했다.
       * 본문에 논의 내용이 통째로 들어 있어 제목을 덮어버렸기 때문이다.
       * 제목 우선으로 바꾸니 92.1%가 제목만으로 판정됐다.
       */
      var 덮어쓰기시도 = 판정({
        title: '승강기 정기 점검 결과 보고',
        note: '주차 차단기 하자 소송 판결 배당금 반사경 항소 관련 논의가 길게 이어짐'
      });
      assert.equal(덮어쓰기시도.topic, '승강기', '본문이 아무리 길어도 제목이 이긴다');
      assert.equal(덮어쓰기시도.reason, 'title', '제목에서 판정했음을 남긴다');
      assert.equal(덮어쓰기시도.autoOk, true, '제목에서 걸리면 자동 확정');

      // 제목에서 여러 주제가 걸리는 것은 문제가 아니다. 대표 하나를 쓰고 나머지는 남긴다.
      var 다중 = 판정({ title: '주차장 차단기 하자 소송 판결 관련' });
      assert.equal(다중.autoOk, true, '여러 주제가 걸려도 자동 확정한다');
      assert.equal(다중.alternatives.length > 0, true, '나머지 주제를 남겨 화면에서 바꿀 수 있게 한다');
      assert.equal(/에도 해당/.test(다중.why), true, '다른 주제에도 해당함을 알린다');

      // 대표 주제는 분류표 순서를 따른다 — 회의록 앱의 autoTags와 같은 답이 나와야 한다.
      // 순서가 갈리면 같은 안건에 두 앱이 서로 다른 주제를 붙인다.
      var 순서 = 분류표.TopicTaxonomy.defs.map(function (d) { return d.key; });
      assert.equal(순서.indexOf(다중.topic) < 순서.indexOf(다중.alternatives[0].topic), true,
        '대표 주제는 분류표에서 먼저 나오는 것');

      // ── 제목에 단서가 없을 때만 본문을 본다. 그리고 자동 확정하지 않는다.
      //    실측에서 「기타 안건」 하나가 다섯 주제에 동시에 걸렸다.
      var 본문만 = 판정({ title: '기타 안건', note: '승강기 점검과 주차 차단기 건' });
      assert.equal(본문만.reason, 'body-only', '본문으로 판정했음을 남긴다');
      assert.equal(본문만.autoOk, false, '본문 판정은 사람이 확인한다');
      assert.equal(본문만.confidence < A.AUTO_MIN_CONFIDENCE, true, '신뢰도가 기준 아래');
      assert.equal(/믿기 어렵/.test(본문만.why), true, '왜 못 믿는지 설명한다');

      // ── 아무것도 안 걸리면 자동으로 넘기지 않는다
      var 무 = 판정({ title: '가나다라 마바사', note: '' });
      assert.equal(무.autoOk, false, '단서 없으면 사람에게');
      assert.equal(무.reason, 'no-match', '이유가 no-match');
      assert.equal(무.topic, '기타', '기타로 두고 사람을 기다린다');

      // ── 걸린 주제를 모두 찾되 분류표 순서를 지킨다
      var 훑기 = A.scanTopics('주차 차단기 소송 판결', 분류표.TopicTaxonomy.defs);
      assert.equal(훑기.length, 2, '겹치는 주제를 모두 찾는다');
      assert.equal(훑기[0].topic, '주차', '분류표 순서를 지킨다(점수순 아님)');
      assert.equal(훑기[0].hits.length, 2, '무엇이 걸렸는지 남긴다');

      // 같은 단어가 여러 번 나와도 한 번만 센다.
      var 반복 = A.scanTopics('주차 주차 주차 주차', [{ key: '주차', kw: ['주차'] }]);
      assert.equal(반복[0].hits.length, 1, '중복 출현은 1로 센다');

      // ── 관계: 원문이 실제로 가리킬 때만 만든다
      var 공고 = A.relate({ title: '공고 제2016-10호에 따른 후속 안내', documentType: '공고·안내' });
      assert.ok(공고, '공고 번호를 찾으면 관계 생성');
      assert.equal(공고.target, '공고 제2016-10호', '가리키는 대상을 target에 넣는다');
      assert.equal(공고.evidence, 'explicit', '원문에 적혀 있으므로 explicit');
      assert.equal(공고.approved, false, '대상 존재 확인 전이므로 자동 승인은 안 함');
      assert.equal(공고.why.length > 0, true, '어디서 찾았는지 남긴다');

      var 회차 = A.relate({ title: '제12차 회의 의결사항 집행', documentType: '' });
      assert.equal(회차.target, '제12차 회의', '회차 참조 인식');

      var 결의 = A.relate({ title: '2018년 2월 결의에 따라 계약 체결', documentType: '' });
      assert.equal(결의.type, 'implements', '결의 집행은 implements');

      // ── 가리키는 대상이 없으면 관계를 만들지 않는다 (이전 구현의 결함)
      //    문서 종류만 보고 '근거 회의 확인 필요' 같은 안내문을 target에 넣으면,
      //    공고가 들어올 때마다 할 일 메모가 관계인 척 검토함에 쌓인다.
      assert.equal(A.relate({ title: '일반 안내문', documentType: '공고·안내' }), null,
        '대상이 없으면 관계를 만들지 않는다');
      assert.equal(A.relate({ title: '보험 가입의 건', documentType: '보험증권' }), null,
        '문서 종류만으로는 관계를 만들지 않는다');
      assert.equal(A.relate({ title: '', documentType: '' }), null, '빈 입력은 null');

      // ── 분류표가 없으면? 대비책으로 동작하되 조용히 틀리지는 않아야 한다.
      var 대비 = A.classify({ title: '주차장 차단기' }, {});
      assert.equal(대비.topic, '주차', '분류표 없어도 최소 판정은 된다');
    }
  };
});
