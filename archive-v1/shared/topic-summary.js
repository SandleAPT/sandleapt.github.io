/*
 * topic-summary.js — 사람이 쓴 「주제 흐름 요약」을 읽어 온다 (5.5a)
 *
 * ── 왜 만드는가 ────────────────────────────────────────────────
 * 사용자 지적(2026-09-02): *"왜 기존 「주제별 모아보기」가 더 보기가 좋을까. 배치의 문제인가?"*
 * 배치가 아니었다. 회의록 앱은 주제를 열면 **답을 먼저** 준다 —
 *   「승강기 / 현재 상태: 신규 업체 관리 체제, 반복 고장 호기 원인 보고 대기.」
 * Archive는 요약이라며 「29건 · 2016.06 ~ 2026.08」을 내놓았다. **숫자는 정보가 아니다.**
 *
 * 그 요약은 **이미 있었다.** 회의록 앱의 `topic_summaries`에 주제마다 사람이 써 둔 것이다.
 * Archive는 그것을 '시스템 레코드'라며 걸러내기만 했다(`freshness.js` 회의인가).
 * 건수 세기에서 빼는 것은 맞지만 **내용까지 버린 것이 잘못**이었다.
 *
 * ── 어디서 읽는가 ──────────────────────────────────────────────
 * `/minutes/system-backup.json` — 같은 origin의 공개 정적 파일이라 새 통신이 필요 없다.
 * 다만 **565KB**로 작지 않다. 첫 화면을 붙잡지 않도록 **주제를 처음 열 때** 받고 그 뒤로는 재사용한다.
 *
 * 이 파일은 원래 백업용이라 `minutes/scripts/build-data.mjs`에 "앱은 읽지 않는다"고 적혀 있었다.
 * 이제 Archive가 읽으므로 그 주석도 함께 고쳤다. **형식을 바꾸면 이 화면이 조용히 빈다.**
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleTopicSummary = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /*
   * 요약 글 한 편을 화면이 쓸 모양으로 나눈다.
   *
   * 글의 생김새(회의록 앱이 쓰는 그대로):
   *   ## 요점
   *   - 24년: …
   *   ## 시간 흐름
   *   - 26.06 정기: …
   *   - 현재 상태: …          ← 어디에 있든 뽑아 맨 위로 올린다
   *
   * 「현재 상태」가 이 화면의 핵심이다. 없으면 없는 대로 둔다 — 지어내지 않는다.
   */
  function 파싱(text) {
    var s = String(text || '');
    if (!s.trim()) return null;

    var 현재상태 = '';
    var m = s.match(/^[-*]\s*현재\s*상태\s*[:：]\s*(.+)$/m);
    if (m) 현재상태 = m[1].trim();

    var 구역 = function (제목) {
      // '## 요점' 부터 다음 '##' 직전까지
      var re = new RegExp('^##\\s*' + 제목 + '\\s*$([\\s\\S]*?)(?=^##\\s|\\s*$(?![\\s\\S]))', 'm');
      var x = s.match(re);
      return x ? x[1] : '';
    };
    var 줄뽑기 = function (덩어리) {
      return String(덩어리 || '').split('\n')
        .map(function (l) { return l.replace(/^[-*]\s*/, '').trim(); })
        .filter(function (l) { return l && !/^현재\s*상태\s*[:：]/.test(l); });
    };

    var 요점 = 줄뽑기(구역('요점'));
    var 흐름 = 줄뽑기(구역('시간 흐름'));

    // 아무것도 못 건졌으면 없는 것으로 본다. 빈 상자를 보여주지 않는다.
    if (!현재상태 && !요점.length && !흐름.length) return null;
    return { 현재상태: 현재상태, 요점: 요점, 흐름: 흐름 };
  }

  /*
   * 백업 파일의 레코드 목록에서 요약을 조립한다.
   * 요약은 45,000자씩 조각나 `topic_summaries_v1_p1 … _p8`로 저장돼 있다.
   * **번호순으로 이어 붙여야** 한다 — 문자열 정렬로 하면 p10이 p2보다 앞에 온다.
   */
  function 조립(items) {
    var 조각 = (items || []).filter(function (it) {
      return /^topic_summaries_v1_p\d+$/.test(String(it && it.id));
    }).sort(function (a, b) {
      return Number(String(a.id).split('_p')[1]) - Number(String(b.id).split('_p')[1]);
    });
    if (!조각.length) return null;
    var 글 =조각.map(function (it) { return String(it.json || ''); }).join('');
    var obj;
    try { obj = JSON.parse(글); } catch (e) { return null; }   // 조각이 빠지면 깨진다 — 조용히 포기
    return (obj && obj.topics) ? obj.topics : null;
  }

  // 네트워크는 주입받는다(검사에서 실제 요청 없이 돌리기 위함).
  var 캐시 = null;
  function 불러오기(fetchFn) {
    if (캐시) return 캐시;
    캐시 = fetchFn('/minutes/system-backup.json', { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j ? 조립(j.items) : null; })
      .catch(function () { return null; });   // 못 읽으면 요약 없이 그냥 돈다
    return 캐시;
  }

  return { 파싱: 파싱, 조립: 조립, 불러오기: 불러오기 };
});
