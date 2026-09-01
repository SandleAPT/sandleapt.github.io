'use strict';
// 2.4 관계 대상 찾기 — 원문이 가리키는 말을 실제 기록으로 잇는다.
//
// 이 모듈의 핵심은 "찾는 것"이 아니라 **"모르면 만들지 않는 것"**이다.
// 관계는 사실 주장이라, 억지로 하나를 고르면 없던 인과가 생긴다.
// 그래서 아래 단언 대부분이 '확정하지 않는다'를 확인한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-reference-resolver'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-reference-resolver',
    title: '관계 대상 찾기',
    deps: ['shared/reference-resolver.js'],
    run: function (ctx) {
      var assert = ctx.assert, R = ctx.global.SandleRefResolver;
      assert.ok(R, 'SandleRefResolver 로드');

      /* ── 공고 번호 열쇠 만들기
       * 실제 값이 제각각이다: "제2015-17호", "임차인선거관리위 제2018-07호". */
      assert.equal(R.공고열쇠('제2015-17호'), '2015-17', '기본 형식');
      assert.equal(R.공고열쇠('임차선거관리위 제2022-03호'), '2022-3', '발행 주체는 떼고 앞자리 0도 없앤다');
      assert.equal(R.공고열쇠('공고 제2022-3호'), '2022-3', '"제2022-03호"와 같은 것으로 본다');
      assert.equal(R.공고열쇠('번호 없음'), '', '번호가 없으면 빈 값');

      assert.equal(R.회의체('t_2026_06_v1'), '임차', 't_ 는 임차');
      assert.equal(R.회의체('m_m06_v2'), '입대의', 'm_ 는 입대의');
      assert.equal(R.연월('2026-06-24'), '2026-6', '연월 열쇠');

      var index = R.buildIndex({
        notices: [
          { id: 'n_a', title: '전기안전 업체 선정 공고', date: '2022-05-01', noticeNo: '제2022-128호' },
          { id: 'n_b', title: '선관위 모집', date: '2022-01-05', noticeNo: '임차선거관리위 제2022-03호' },
          { id: 'n_없음', title: '번호 없는 공고', date: '2022-02-01' }
        ],
        meetings: [
          { id: 'm_2018_06_v1', name: '2018년 6월 정기 입주자대표회의', date: '2018-06-20' },
          { id: 'm_2020_03_v1', name: '2020년 3월 정기 입주자대표회의', date: '2020-03-10' },
          { id: 'm_2020_03s_v1', name: '2020년 3월 임시 입주자대표회의', date: '2020-03-25' },
          { id: 't_2020_03_v1', name: '2020년 3월 임차인대표회의', date: '2020-03-15' }
        ]
      });

      // ── 공고: 딱 하나면 확정
      var 공고 = R.resolve('공고 제2022-128호', index, {});
      assert.equal(공고.상태, '확정', '번호가 맞는 공고 하나면 확정');
      assert.equal(공고.id, 'n_a', '그 공고를 가리킨다');
      assert.equal(공고.종류, '공고', '종류를 알려준다');

      // 앞자리 0이 달라도 같은 것으로 본다
      assert.equal(R.resolve('공고 제2022-3호', index, {}).id, 'n_b', '제2022-03호와 제2022-3호는 같다');

      // 보관함에 없으면 만들지 않는다
      var 없음 = R.resolve('공고 제2099-1호', index, {});
      assert.equal(없음.상태, '없음', '없는 번호는 확정하지 않는다');
      assert.equal(없음.id, undefined, 'id를 주지 않는다');
      assert.equal(없음.이유.length > 0, true, '왜 못 찾았는지 남긴다');

      /* ── 연·월 의결: 그 달에 회의가 여럿이면 확정하지 않는다
       * 2020년 3월에 정기·임시가 모두 있다. 둘 중 하나를 찍으면 틀릴 수 있다. */
      var 여럿 = R.resolve('2020년 3월 의결', index, { 회의id: 'm_2021_01_v1' });
      assert.equal(여럿.상태, '후보', '같은 달에 여럿이면 후보로만');
      assert.equal(여럿.후보.length, 2, '입대의 회의 둘이 후보(임차는 제외)');
      assert.equal(여럿.id, undefined, '후보일 때는 id를 주지 않는다');

      // 같은 회의체로 좁힌다 — 임차 회의록이 가리키면 임차 회의만 본다
      var 임차 = R.resolve('2020년 3월 의결', index, { 회의id: 't_2021_01_v1' });
      assert.equal(임차.상태, '확정', '임차 쪽은 그 달에 하나뿐이라 확정');
      assert.equal(임차.id, 't_2020_03_v1', '임차 회의를 가리킨다');

      // 딱 하나면 확정
      var 하나 = R.resolve('2018년 6월 의결', index, { 회의id: 'm_2019_01_v1' });
      assert.equal(하나.상태, '확정', '그 달에 하나면 확정');
      assert.equal(하나.id, 'm_2018_06_v1', '그 회의를 가리킨다');

      // 자기 자신은 가리키지 않는다
      var 자기 = R.resolve('2018년 6월 의결', index, { 회의id: 'm_2018_06_v1' });
      assert.equal(자기.상태, '없음', '자기를 가리키는 관계는 만들지 않는다');

      /* ── 차수: 기수를 모르면 찍지 않는다
       * "제12차 회의"는 어느 기의 12차인지 원문에 없는 경우가 많다. */
      var 차수 = R.resolve('제12차 회의', index, { 회의id: 'm_2020_03_v1' });
      assert.equal(차수.상태, '없음', '차수만으로는 확정하지 않는다');
      assert.equal(/기수/.test(차수.이유), true, '왜 못 정하는지 설명한다');

      // ── 사건번호: 담을 기록 종류가 아직 없다
      var 사건 = R.resolve('사건 2020가합12345', index, {});
      assert.equal(사건.상태, '없음', '법원 사건은 아직 이을 곳이 없다');

      // ── 빈 입력에도 죽지 않는다
      assert.equal(R.resolve('', index, {}).상태, '없음', '빈 말은 없음');
      assert.equal(R.resolve('공고 제2022-128호', null, {}).상태, '없음', '색인이 없으면 없음');
      assert.equal(R.buildIndex(null).공고 !== undefined, true, '빈 자료로도 색인은 만들어진다');
      assert.equal(R.resolve('알 수 없는 말', index, {}).상태, '없음', '모르는 형식은 없음');
    }
  };
});
