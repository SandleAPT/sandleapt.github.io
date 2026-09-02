'use strict';
// 공개 화면 자료 만들기 — 실제 회의록을 화면이 쓰는 모양으로 바꾼다.
// 모양이 어긋나면 화면이 조용히 비어 버리므로, 여기서 구조를 고정한다.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.SandleSpecs = root.SandleSpecs || {}; root.SandleSpecs['stage4-archive-build'] = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var 분류표 = {
    defs: [
      { key: '주차', kw: ['주차', '차단기'] },
      { key: '하자·소송', kw: ['하자', '소송'] },
      { key: '승강기', kw: ['승강기'] }
    ],
    // 회의록 앱과 같은 규칙: 저장된 태그가 있으면 그것을 쓰고, 옛 이름은 바꾼다.
    resolveStored: function (a, autoTags) {
      var raw = (a.tags && a.tags.length) ? a.tags : [];
      if (!raw.length) return null;
      return raw.map(function (t) { return t === '소송' ? '하자·소송' : t; });
    }
  };
  // 회의록 앱과 같은 규칙: 제목을 먼저 보고, 걸리면 본문은 보지 않는다.
  function 훑기(s) {
    var out = [];
    분류표.defs.forEach(function (d) {
      if (d.kw.some(function (k) { return String(s || '').indexOf(k) >= 0; })) out.push(d.key);
    });
    return out;
  }
  function 자동태그(a) {
    var 제목 = 훑기(a && a.title);
    if (제목.length) return 제목;
    var 본문 = 훑기(((a && a.decision) || '') + ' ' + ((a && a.summary) || ''));
    return 본문.length ? 본문 : ['기타'];
  }

  return {
    name: 'stage4-archive-build',
    title: '공개 화면 자료 만들기',
    deps: ['shared/archive-build.js'],
    run: function (ctx) {
      var assert = ctx.assert, B = ctx.global.SandleArchiveBuild;
      assert.ok(B, 'SandleArchiveBuild 로드');

      var 지금 = new Date('2026-09-02').getTime();
      assert.equal(B.연월('2026-06-24'), '2026.06', '연월 표기');
      assert.equal(B.연월(''), '', '빈 날짜는 빈 값');
      assert.equal(B.상태('2026-06-24', 지금), '최근', '2년 안은 최근');
      assert.equal(B.상태('2016-06-24', 지금), '과거', '2년 넘으면 과거');

      var 회의 = [
        { id: 'm_2026_06_v1', name: '2026년 6월 입주자대표회의', date: '2026-06-24',
          agendas: [
            { id: 'a1', title: '주차 차단기 교체', summary: '교체하기로 함' },
            { id: 'a2', title: '기타 안건', summary: '승강기 점검 논의' },
            { id: 'a3', title: '옛 태그 안건', tags: ['소송'] }
          ] },
        { id: 't_2016_03_v1', name: '2016년 3월 임차인대표회의', date: '2016-03-10',
          agendas: [{ id: 'b1', title: '주차장 도색', summary: '' }] }
      ];

      var r = B.build(회의, 분류표, 자동태그, 지금);

      // 통계
      assert.equal(r.통계.회의, 2, '회의 수');
      assert.equal(r.통계.안건, 4, '안건 수');

      var byLabel = {}; r.topics.forEach(function (t) { byLabel[t.label] = t; });

      // 주제에 안건이 들어간다
      assert.equal(byLabel['주차'].records.length, 2, '주차에 두 건');
      assert.equal(byLabel['승강기'].records.length, 1, '제목에 단서가 없으면 본문으로 — 승강기 한 건');

      /* 저장된 태그가 자동 분류보다 우선하고, 옛 이름은 바뀐다.
         회의록 앱과 다른 답을 내면 사용자가 어느 쪽을 믿을지 알 수 없다. */
      assert.equal(byLabel['하자·소송'].records.length, 1, '옛 태그 소송 → 하자·소송');

      // 기록이 없는 주제도 남긴다 — "없다"도 정보다
      assert.equal(r.topics.some(function (t) { return t.records.length === 0; }), true, '빈 주제도 목록에 남는다');
      var 빈것 = r.topics.filter(function (t) { return t.records.length === 0; })[0];
      assert.equal(/없어/.test(빈것.description), true, '빈 주제는 그렇게 설명한다');

      // 화면이 기대하는 모양
      var 주차 = byLabel['주차'];
      assert.equal(주차.visibility, 'public', '공개 자료만 넣는다');
      assert.equal(주차.id.indexOf('topic-') === 0, true, 'id 형식');
      assert.equal(Array.isArray(주차.records[0]), true, 'records는 배열의 배열');
      assert.equal(주차.records[0].slice(0, 4).length, 4, '앞 네 자리는 [연월, 종류, 제목, 상태]');
      assert.equal(주차.records[0][0], '2026.06', '최신이 먼저');
      assert.equal(주차.records[1][1], '임차 안건', '임차 회의는 그렇게 표시');
      assert.equal(주차.counts['안건'], 2, '건수');

      /* 원문으로 가는 길 — Archive는 회의록을 복제하지 않고 찾아가게 한다.
       * 링크가 빠지면 화면이 "예정이야"만 보여주고 끝난다(2026-09-02 이전 상태). */
      assert.equal(주차.records[0][4], '/minutes/?open=m_2026_06_v1', '원문 주소가 5번째 자리에');
      assert.equal(주차.records[0][5], '2026년 6월 입주자대표회의', '어느 회의인지도 함께');
      assert.equal(주차.records[0].length, 8, '앞 네 자리는 그대로 두고 뒤에 덧붙인다(7 갈래 · 8 안건 전문)');
      assert.equal(주차.timeline[0].원문, '/minutes/?open=m_2026_06_v1', '타임라인에도 원문');
      assert.equal(주차.current[0].원문, '/minutes/?open=m_2026_06_v1', '최근 항목에도 원문');
      // 회의 id가 없으면 링크를 만들지 않는다 — 아무 데도 안 가는 링크는 없느니만 못하다.
      var id없음 = B.build([{ name: 'x', date: '2026-01-01', agendas: [{ id: 'q', title: '주차 건' }] }], 분류표, 자동태그, 지금);
      var 주차2 = id없음.topics.filter(function (t) { return t.label === '주차'; })[0];
      assert.equal(주차2.records[0][4], '', '회의 id가 없으면 빈 링크');

      /* ── 갈래 (5.4) ──
       * 「계약·입찰」 230건처럼 서로 무관한 것이 섞인 주제를 안에서 다시 나누는 축.
       * 새 어휘를 만들지 않고 **이미 걸려 있는 다른 주제**를 쓴다(실측 98%가 걸려 있었다).
       * 여기서 고정하는 것: 자기 자신은 갈래가 아니고, 많은 것이 먼저 온다. */
      var 주차갈래 = 주차.갈래 || [];
      assert.equal(주차갈래.some(function (g) { return g.label === '주차'; }), false, '자기 자신은 갈래가 아니다');
      // a1(주차 차단기 교체)은 '주차'만, b1(주차장 도색)도 '주차'만 → 겹치는 갈래가 없다
      assert.equal(Array.isArray(주차.records[0][6]), true, '7번째 자리는 그 안건이 걸린 다른 주제들');

      // 한 안건이 두 주제에 걸리면 서로의 갈래가 된다
      var 겹침 = B.build([{ id: 'm_z', name: 'z회의', date: '2026-05-05',
        agendas: [{ id: 'g1', title: '승강기 주차 관련 건' }] }], 분류표, 자동태그, 지금);
      var 겹B = {}; 겹침.topics.forEach(function (t) { 겹B[t.label] = t; });
      assert.equal((겹B['주차'].갈래 || []).some(function (g) { return g.label === '승강기'; }), true, '주차의 갈래에 승강기');
      assert.equal((겹B['승강기'].갈래 || []).some(function (g) { return g.label === '주차'; }), true, '승강기의 갈래에 주차');
      assert.equal(겹B['주차'].records[0][6].indexOf('승강기') >= 0, true, '안건도 자기 갈래를 들고 있다');

      /* ── 안건 전문 (5.5b) ──
       * 사용자 요청: 팝업 내용이 잘리고 줄바꿈이 안 먹는다.
       * 팝업을 열었다는 건 읽으려고 연 것이라 자를 이유가 없다. 목록의 한 줄 요지와는 다르다. */
      var 긴글 = '첫째 줄입니다.\n둘째 줄입니다.\n' + '가'.repeat(400);
      var 전문 = B.build([{ id: 'm_f', name: 'f회의', date: '2026-03-03', agendas: [{
        id: 'f1', title: '주차 전문 시험', summary: 긴글, decision: '가결한다.\n조건 있음.',
        followup: '다음 달 보고', remarks: { '202': '비고 줄' }
      }] }], 분류표, 자동태그, 지금);
      var 주차F = 전문.topics.filter(function (t) { return t.label === '주차'; })[0];
      var 칸 = 주차F.records[0][7];
      assert.equal(Array.isArray(칸), true, '8번째 자리는 안건 전문');
      assert.equal(칸.length, 4, '논의·의결·후속조치·비고 — 빈 칸은 넣지 않는다');
      assert.equal(칸[0].이름, '논의', '논의가 먼저');
      assert.equal(칸[1].이름, '의결', '그다음 의결');
      // 자르지 않는다
      assert.equal(칸[0].글.length, 긴글.length, '전문은 길이 그대로 — 자르지 않는다');
      assert.equal(칸[0].글.indexOf('\n') > 0, true, '줄바꿈을 살린다 — 뭉개면 한 덩어리가 된다');
      // 목록용 요지는 반대로 한 줄이어야 한다(목록은 훑는 자리다)
      assert.equal(주차F.timeline[0].note.indexOf('\n'), -1, '목록 미리보기는 한 줄로');
      // 내용이 없는 안건은 빈 상자를 만들지 않는다
      var 빈안건 = B.build([{ id: 'm_g', name: 'g회의', date: '2026-03-03', agendas: [{ id: 'g1', title: '주차 빈 건' }] }], 분류표, 자동태그, 지금);
      assert.equal(빈안건.topics.filter(function (t) { return t.label === '주차'; })[0].records[0][7].length, 0, '내용이 없으면 빈 목록');

      /* 표결·비고는 **실제 자료 모양**을 따른다.
       * 2026-09-02에 `yes/no/abstain` 같은 이름을 짐작으로 썼다가, 실제로 찬성5/반대5인 안건에
       * 「찬성 0 · 반대 0 · 기권 0」을 보여줬다. **틀린 숫자는 안 보여주는 것보다 훨씬 나쁘다.**
       * 실제 모양: votes = {동: 'for'|'against'}, remarks = {동: '글'}. 전체 자료에 기권은 없다. */
      var 칸이름 = function (rec) { return (rec[7] || []).map(function (c) { return c.이름; }); };
      var 찾기 = function (rec, 이름) { return (rec[7] || []).filter(function (c) { return c.이름 === 이름; })[0]; };

      var 표결건 = B.build([{ id: 'm_v', name: 'v회의', date: '2026-03-03', agendas: [{
        id: 'v1', title: '주차 표결 건', decision: '가결',
        votes: { '202': 'for', '204': 'for', '206': 'against' }, remarks: { '202': '', '204': '' }
      }] }], 분류표, 자동태그, 지금).topics.filter(function (t) { return t.label === '주차'; })[0].records[0];
      assert.equal(찾기(표결건, '표결 (동별 기록)').글, '찬성 2 · 반대 1', '반대가 있으면 세어 보여준다');
      /* 칸 이름에 무엇을 센 것인지 밝힌다. 의결문의 「찬성5/반대5」는 안건 안의 개별 사안별
         표결을 사람이 적은 것이고, 이 숫자는 동별 기록이라 서로 다를 수 있다. */
      assert.equal(칸이름(표결건).indexOf('표결 (동별 기록)') >= 0, true, '무엇을 센 숫자인지 이름에 밝힌다');
      assert.equal(칸이름(표결건).indexOf('비고') < 0, true, '비고가 전부 빈 문자열이면 칸을 만들지 않는다');

      /* 만장일치는 보여주지 않는다 (사용자 결정 2026-09-02).
         전체 4,692표 중 4,657표가 찬성이라, 「반대 0」은 거의 모든 안건에 붙으면서
         아무것도 말해주지 않는다. 반대가 나온 35번이 오히려 눈에 띄어야 한다. */
      var 만장일치 = B.build([{ id: 'm_u', name: 'u회의', date: '2026-03-03', agendas: [{
        id: 'u1', title: '주차 만장일치 건', decision: '가결', votes: { '202': 'for', '204': 'for' }
      }] }], 분류표, 자동태그, 지금).topics.filter(function (t) { return t.label === '주차'; })[0].records[0];
      assert.equal(칸이름(만장일치).indexOf('표결 (동별 기록)') < 0, true, '만장일치면 표결 칸을 만들지 않는다');
      assert.equal(칸이름(만장일치).join(','), '의결', '남는 것은 의결뿐');

      var 표없음 = B.build([{ id: 'm_w', name: 'w회의', date: '2026-03-03', agendas: [{
        id: 'w1', title: '주차 표 없는 건', decision: '보류', votes: {}, remarks: {}
      }] }], 분류표, 자동태그, 지금).topics.filter(function (t) { return t.label === '주차'; })[0].records[0];
      assert.equal(칸이름(표없음).indexOf('표결 (동별 기록)') < 0, true, '표가 하나도 없어도 칸을 만들지 않는다');
      assert.equal(칸이름(표없음).join(','), '의결', '남는 것은 의결뿐');

      // 최근 기록
      assert.equal(r.recentRecords.length > 0, true, '최근 기록이 있다');
      assert.equal(r.recentRecords[0].date, '2026.06', '최신순');
      assert.equal(!!r.recentRecords[0].topicId, true, '주제로 이어지는 id를 준다');

      // 제목 없는 안건은 넣지 않는다(빈 줄이 생긴다)
      var 빈제목 = B.build([{ id: 'm_x', name: 'x', date: '2026-01-01', agendas: [{ id: 'z', title: '  ' }] }], 분류표, 자동태그, 지금);
      assert.equal(빈제목.통계.안건, 0, '제목 없는 안건은 뺀다');

      /* 언제까지의 자료인지 (4.6a).
       * 사본은 하루 한 번 만들어지므로 오늘 저장한 것은 아직 없다. 그 사실을 적어야
       * "저장했는데 왜 안 보이지"에서 막히지 않는다. 문구가 비면 아무 말도 안 하게 된다. */
      var 오늘 = new Date(2026, 8, 2, 12, 0, 0).getTime();       // 2026-09-02 정오(현지)
      var 어제 = B.기준문구(new Date(2026, 8, 1, 9, 0, 0).toISOString(), 오늘);
      assert.equal(어제.날짜, '2026년 9월 1일', '날짜를 사람 말로');
      assert.equal(/어제/.test(어제.text), true, '하루 전은 어제');
      assert.equal(어제.stale, false, '하루 늦는 것은 정상 — 사본이 하루 주기다');
      assert.equal(B.기준문구(new Date(2026, 8, 2, 1, 0, 0).toISOString(), 오늘).text.indexOf('오늘') > 0, true, '같은 날은 오늘');
      var 나흘 = B.기준문구(new Date(2026, 7, 29, 9, 0, 0).toISOString(), 오늘);
      assert.equal(나흘.stale, true, '사흘 넘게 밀리면 사본 만들기가 멈춘 것으로 본다');
      assert.equal(/4일 전/.test(나흘.text), true, '며칠 밀렸는지 숫자로');
      // 값이 없거나 깨졌으면 아무 말도 하지 않는다 — 틀린 시각을 적는 것보다 낫다
      assert.equal(B.기준문구('', 오늘).text, '', '값이 없으면 빈 문구');
      assert.equal(B.기준문구('말이 안 되는 값', 오늘).text, '', '못 읽으면 빈 문구');

      // 빈 입력에도 죽지 않는다
      assert.equal(B.build(null, 분류표, 자동태그, 지금).통계.안건, 0, '회의가 없어도 동작');
      assert.equal(B.build([], null, null, 지금).topics.length >= 1, true, '분류표가 없어도 기타는 남는다');
    }
  };
});
