'use strict';
// Archive v1 접근 판정 (4.3b)
// role(''|'view'|'edit') → 볼 수 있는 공개등급을 정하는 단일 출처.
// 화면 여러 곳에서 각자 조건문을 쓰면 한 곳만 고쳤을 때 경계가 어긋난다. 판정은 여기서만 한다.
//
// 중요: 이 모듈은 '화면 제어'용이다. 실제 보안 경계는 서버가 resident/private 원본을 내줄 때뿐이며,
//       공개 정적 번들에는 애초에 public 자료만 들어간다(docs/archive-v1/AUTH_V1.md 5절).
(function () {
  var LEVELS = ['public', 'resident', 'private'];

  // role별로 볼 수 있는 등급. 모르는 role은 public만(fail-closed).
  var MATRIX = {
    '': ['public'],
    'view': ['public', 'resident'],
    'edit': ['public', 'resident', 'private']
  };

  function normalizeRole(role) {
    return (role === 'view' || role === 'edit') ? role : '';
  }

  function normalizeVisibility(v) {
    // 등급이 비었거나 모르는 값이면 가장 엄격한 쪽으로 본다.
    return LEVELS.indexOf(v) >= 0 ? v : 'private';
  }

  function allowedLevels(role) {
    return MATRIX[normalizeRole(role)].slice();
  }

  function canView(role, visibility) {
    return allowedLevels(role).indexOf(normalizeVisibility(visibility)) >= 0;
  }

  // 관리 화면(작성·발행)은 수정용만.
  function canManage(role) {
    return normalizeRole(role) === 'edit';
  }

  // 목록을 볼 수 있는 것만 남긴다. 등급이 없는 항목은 버린다.
  function filterVisible(records, role) {
    if (!Array.isArray(records)) return [];
    return records.filter(function (r) { return r && canView(role, r.visibility); });
  }

  // 화면에 쓸 이름. 사용자가 부르는 말(2026-09-01)에 맞춘다: 공개 / 내부공개 / 비공개.
  var NAMES = { 'public': '공개', 'resident': '내부공개', 'private': '비공개' };
  function levelName(visibility) { return NAMES[normalizeVisibility(visibility)]; }

  // 화면에 쓸 안내 문구. 등급별로 무엇이 필요한지 사용자에게 알려 준다.
  function requirementOf(visibility) {
    var v = normalizeVisibility(visibility);
    if (v === 'public') return { level: v, name: NAMES[v], needs: 'none', label: '누구나 볼 수 있습니다' };
    if (v === 'resident') return { level: v, name: NAMES[v], needs: 'view', label: '입주민 확인(열람용 비밀번호)이 필요합니다' };
    return { level: v, name: NAMES[v], needs: 'edit', label: '관리자 확인(수정용 비밀번호)이 필요합니다' };
  }

  /*
   * 관계(연결)는 상대 기록이 보이지 않으면 연결 자체를 지운다. (사용자 요구, 2026-09-01)
   *
   * 왜 등급만 가리면 안 되는가:
   *   비공개 기록에 「2026년 8월 ○○ 소송 합의」라는 제목이 있다고 하자.
   *   공개 기록에서 그 연결을 "→ 비공개 문서"로만 가려도, 연결이 **있다는 사실**과
   *   대개는 제목까지 새어 나간다. 무엇이 감춰져 있는지 알면 감춘 의미가 없다.
   *   그래서 볼 수 없는 상대와의 연결은 흔적 없이 없앤다.
   *
   * resolveVisibility: 관계의 target id로 그 기록의 등급을 찾는 함수.
   *   찾지 못하면 undefined를 주면 되고, 그 경우 private로 간주해 지운다(fail-closed).
   */
  function filterRelations(relations, role, resolveVisibility) {
    if (!Array.isArray(relations)) return [];
    var lookup = typeof resolveVisibility === 'function' ? resolveVisibility : function () { return undefined; };
    return relations.filter(function (rel) {
      if (!rel) return false;
      return canView(role, lookup(rel.target, rel));
    });
  }

  // 기록 하나를 내보내기 전에 통과시키는 함수. 볼 수 없는 연결을 떼어낸 사본을 준다.
  // 원본을 고치지 않는다 — 관리 화면은 전체를 계속 봐야 하기 때문이다.
  function projectRecord(record, role, resolveVisibility) {
    if (!record || !canView(role, record.visibility)) return null;
    var out = {};
    for (var k in record) if (Object.prototype.hasOwnProperty.call(record, k)) out[k] = record[k];
    if (Array.isArray(record.relations)) out.relations = filterRelations(record.relations, role, resolveVisibility);
    else if (record.relation) {
      out.relation = filterRelations([record.relation], role, resolveVisibility)[0] || null;
    }
    return out;
  }

  function describeRole(role) {
    var r = normalizeRole(role);
    if (r === 'edit') return '관리자';
    if (r === 'view') return '입주민';
    return '비로그인';
  }

  window.SandleAccessControl = {
    LEVELS: LEVELS.slice(),
    normalizeRole: normalizeRole,
    normalizeVisibility: normalizeVisibility,
    allowedLevels: allowedLevels,
    canView: canView,
    canManage: canManage,
    filterVisible: filterVisible,
    filterRelations: filterRelations,
    projectRecord: projectRecord,
    levelName: levelName,
    requirementOf: requirementOf,
    describeRole: describeRole
  };
})();
