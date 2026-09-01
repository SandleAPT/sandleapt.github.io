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

  // 화면에 쓸 안내 문구. 등급별로 무엇이 필요한지 사용자에게 알려 준다.
  function requirementOf(visibility) {
    var v = normalizeVisibility(visibility);
    if (v === 'public') return { level: v, needs: 'none', label: '누구나 볼 수 있습니다' };
    if (v === 'resident') return { level: v, needs: 'view', label: '입주민 확인(열람용 비밀번호)이 필요합니다' };
    return { level: v, needs: 'edit', label: '관리자 확인(수정용 비밀번호)이 필요합니다' };
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
    requirementOf: requirementOf,
    describeRole: describeRole
  };
})();
