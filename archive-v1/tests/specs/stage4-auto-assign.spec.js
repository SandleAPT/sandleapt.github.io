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

      // ── 단서가 여럿이면 당연히 자동 확정
      var 주차 = 판정({ title: '주차장 차단기 교체 및 반사경 설치', documentType: '의결' });
      assert.equal(주차.topic, '주차', '주제를 맞게 고른다');
      assert.equal(주차.autoOk, true, '단서가 여럿이면 자동 확정');
      assert.equal(주차.matched.length >= 2, true, '무엇이 걸렸는지 남긴다');
      assert.equal(주차.why.length > 0, true, '판단 이유가 있다');

      // ── 단서 하나뿐이어도 자동 확정한다
      //    실제 제목 대부분이 키워드 하나만 걸린다. 이걸 사람에게 보내면
      //    검토함이 1,000건이 되어 자동화한 의미가 없어진다.
      var 하나 = 판정({ title: '승강기 정기 점검 결과 보고', documentType: '보고' });
      assert.equal(하나.topic, '승강기', '단서 하나로도 주제 판정');
      assert.equal(하나.autoOk, true, '단서 1개도 자동 확정(겹치지만 않으면)');
      assert.equal(하나.confidence < 주차.confidence, true, '단서가 적으면 신뢰도는 낮게');

      // ── 아무것도 안 걸리면 자동으로 넘기지 않는다
      var 무 = 판정({ title: '가나다라 마바사', documentType: '' });
      assert.equal(무.autoOk, false, '단서 없으면 사람에게');
      assert.equal(무.reason, 'no-match', '이유가 no-match');
      assert.equal(무.topic, '기타', '기타로 두고 사람을 기다린다');

      // ── 두 주제가 비슷하게 걸리면 사람이 본다 (가장 중요한 안전장치)
      var 애매 = 판정({ title: '주차장 차단기 하자 소송 판결 관련', documentType: '' });
      assert.equal(애매.autoOk, false, '두 주제가 겹치면 자동 확정 안 함');
      assert.equal(애매.reason, 'ambiguous', '이유가 ambiguous');
      assert.equal(애매.alternatives.length > 0, true, '경쟁 후보를 남긴다');
      assert.equal(/둘 다/.test(애매.why), true, '왜 애매한지 사람 말로 설명');

      // ── 모든 주제를 채점한다(첫 일치로 끝내지 않는다)
      var 점수 = A.scoreTopics('주차 차단기 소송 판결', 분류표.TopicTaxonomy.defs);
      assert.equal(점수.length, 2, '겹치는 주제를 모두 찾는다');
      assert.equal(점수[0].score, 2, '일치 개수로 채점');

      // 같은 단어가 여러 번 나와도 한 번만 센다 — 긴 문서가 무조건 이기면 안 된다.
      var 반복 = A.scoreTopics('주차 주차 주차 주차', [{ key: '주차', kw: ['주차'] }]);
      assert.equal(반복[0].score, 1, '중복 출현은 1로 센다');

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
