'use strict';
// 4.3b 접근 판정 — role별 열람 범위, 미지 값 처리(fail-closed)
// 이 spec은 서버를 부르지 않는다. 판정 규칙만 본다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-access-control'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return {
    name: 'stage4-access-control',
    title: '접근 판정(role → 공개등급)',
    deps: ['shared/access-control.js'],
    run: function (ctx) {
      var assert = ctx.assert, ac = ctx.global.SandleAccessControl;
      assert.ok(ac, 'SandleAccessControl 로드');

      // 비로그인은 public만
      assert.equal(ac.canView('', 'public'), true, '비로그인 → public 열람');
      assert.equal(ac.canView('', 'resident'), false, '비로그인 → resident 차단');
      assert.equal(ac.canView('', 'private'), false, '비로그인 → private 차단');

      // 열람용은 resident까지
      assert.equal(ac.canView('view', 'resident'), true, '열람용 → resident 열람');
      assert.equal(ac.canView('view', 'private'), false, '열람용 → private 차단');

      // 수정용은 전부
      assert.equal(ac.canView('edit', 'private'), true, '수정용 → private 열람');
      assert.equal(ac.canManage('edit'), true, '수정용만 관리 가능');
      assert.equal(ac.canManage('view'), false, '열람용은 관리 불가');
      assert.equal(ac.canManage(''), false, '비로그인은 관리 불가');

      // 모르는 값은 가장 엄격하게 (fail-closed)
      assert.equal(ac.normalizeRole('admin'), '', '모르는 role은 비로그인 취급');
      assert.equal(ac.normalizeRole(undefined), '', 'role 누락은 비로그인 취급');
      assert.equal(ac.normalizeVisibility('secret'), 'private', '모르는 등급은 private 취급');
      assert.equal(ac.normalizeVisibility(undefined), 'private', '등급 누락은 private 취급');
      assert.equal(ac.canView('unknown-role', 'resident'), false, '모르는 role은 resident도 못 봄');
      assert.equal(ac.canView('edit', 'weird-level'), true, '수정용은 미지 등급(=private)도 열람 가능');
      assert.equal(ac.canView('view', 'weird-level'), false, '열람용은 미지 등급(=private) 차단');

      // 목록 필터
      var records = [
        { id: 'a', visibility: 'public' },
        { id: 'b', visibility: 'resident' },
        { id: 'c', visibility: 'private' },
        { id: 'd' },                       // 등급 없음 → private 취급
        { id: 'e', visibility: 'nonsense' } // 미지 → private 취급
      ];
      assert.equal(ac.filterVisible(records, '').length, 1, '비로그인은 1건만');
      assert.equal(ac.filterVisible(records, 'view').length, 2, '열람용은 2건');
      assert.equal(ac.filterVisible(records, 'edit').length, 5, '수정용은 전부');
      assert.equal(ac.filterVisible(null, 'edit').length, 0, '배열이 아니면 빈 목록');

      /*
       * 연결 유출 방지 (사용자 요구 2026-09-01):
       * 공개 권한으로 보는 사람에게는 비공개·내부공개 기록과의 연결이 아예 보이면 안 된다.
       * 등급만 가리고 연결을 남기면 "무엇이 감춰져 있는지"가 제목째 새어 나간다.
       */
      var 등급 = { pub: 'public', res: 'resident', priv: 'private' };
      var 찾기 = function (targetId) { return 등급[targetId]; };
      var 연결 = [
        { target: 'pub', type: 'based_on' },
        { target: 'res', type: 'follow_up_to' },
        { target: 'priv', type: 'supersedes' },
        { target: '없는id', type: 'related_to' }   // 못 찾으면 private 취급
      ];
      assert.equal(ac.filterRelations(연결, '', 찾기).length, 1, '비로그인에게는 공개 연결만');
      assert.equal(ac.filterRelations(연결, '', 찾기)[0].target, 'pub', '남는 것은 공개 상대');
      assert.equal(ac.filterRelations(연결, 'view', 찾기).length, 2, '열람용은 내부공개까지');
      assert.equal(ac.filterRelations(연결, 'edit', 찾기).length, 4, '수정용은 전부');
      // 조회 함수를 안 넘긴 경우(호출 쪽 실수). 등급을 알 수 없으니 전부 비공개로 본다.
      // 관리자는 비공개를 볼 수 있으므로 그대로 보이고, 아래 등급은 아무것도 못 본다.
      // 실수가 나도 자료가 아래로 새지 않는 것이 핵심이다.
      assert.equal(ac.filterRelations(연결, '', null).length, 0, '조회 함수 없으면 비로그인은 전부 차단');
      assert.equal(ac.filterRelations(연결, 'view', null).length, 0, '조회 함수 없으면 열람용도 전부 차단');
      assert.equal(ac.filterRelations(연결, 'edit', null).length, 4, '관리자는 비공개를 볼 수 있으므로 그대로');

      // 기록 단위 투영 — 원본을 건드리지 않아야 관리 화면이 계속 전체를 본다.
      var 원본 = { id: 'x', visibility: 'public', relations: 연결.slice() };
      var 공개본 = ac.projectRecord(원본, '', 찾기);
      assert.equal(공개본.relations.length, 1, '투영본에는 공개 연결만');
      assert.equal(원본.relations.length, 4, '원본은 그대로');
      assert.equal(ac.projectRecord({ id: 'y', visibility: 'private' }, '', 찾기), null, '못 보는 기록은 통째로 없음');
      assert.equal(ac.projectRecord(null, 'edit', 찾기), null, '빈 기록은 null');

      // 단일 relation 형태(현재 관리 화면 자료구조)도 같이 처리해야 한다.
      var 단일 = ac.projectRecord({ id: 'z', visibility: 'public', relation: { target: 'priv' } }, '', 찾기);
      assert.equal(단일.relation, null, '못 보는 상대와의 단일 연결은 제거');

      // 화면에 쓰는 이름
      assert.equal(ac.levelName('public'), '공개', 'public 이름');
      assert.equal(ac.levelName('resident'), '내부공개', 'resident 이름');
      assert.equal(ac.levelName('private'), '비공개', 'private 이름');
      assert.equal(ac.levelName('이상한값'), '비공개', '모르는 등급 이름도 비공개');

      // 안내 문구
      assert.equal(ac.requirementOf('resident').needs, 'view', 'resident는 열람용 필요');
      assert.equal(ac.requirementOf('private').needs, 'edit', 'private는 수정용 필요');
      assert.equal(ac.requirementOf('public').needs, 'none', 'public은 인증 불필요');
      assert.equal(ac.describeRole('edit'), '관리자', 'role 표기');
    }
  };
});
