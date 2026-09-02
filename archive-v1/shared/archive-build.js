/*
 * archive-build.js — 실제 회의록에서 공개 화면용 자료를 만든다
 *
 * 지금까지 공개 화면은 손으로 쓴 샘플 2~3개로 돌았다. 그래서 "이게 뭐가 좋아지는지"를
 * 볼 수가 없었다. 이 모듈이 회의록 224건·안건 1,212건을 같은 모양으로 바꿔 준다.
 *
 * 만드는 모양은 기존 샘플과 **같다**(app.js를 고치지 않으려고):
 *   { topics:[{id,label,visibility,aliases,description,counts,current,timeline,records}],
 *     recentRecords:[{date,kind,title,status,topicId}] }
 *
 * 원칙
 *  - **공개 자료만 넣는다.** 회의록은 이미 공개 게시판에 올라간 것이라 전부 public이다.
 *    나중에 등급이 다른 자료가 들어오면 여기서 걸러야 한다.
 *  - 주제는 회의록 앱의 분류표를 그대로 쓴다. 태그도 같은 규칙(수동 우선)으로 읽는다.
 *    두 앱이 다른 답을 내면 사용자가 어느 쪽을 믿어야 할지 알 수 없다.
 *  - 안건이 하나도 없는 주제는 빼지 않고 남긴다. "이 주제는 기록이 없다"도 정보다.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SandleArchiveBuild = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function 연월(d) {
    var s = String(d || '');
    var m = s.match(/^(\d{4})-(\d{2})/);
    if (m) return m[1] + '.' + m[2];
    var dt = new Date(s);
    if (isNaN(dt)) return '';
    return dt.getFullYear() + '.' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  // 주제 이름을 화면 id로. 한글을 그대로 쓰면 주소가 지저분해지지만 안정적이다.
  function 아이디(label) { return 'topic-' + String(label).replace(/[\s·]/g, '_'); }

  /*
   * 안건 하나가 지금 유효한 기준인지, 지나간 기록인지.
   * 규약·운영규정처럼 '현재 기준'을 담는 자료는 회의록에 섞여 있어 구분이 어렵다.
   * 지금은 **최근 2년 안이면 '최근', 그 전이면 '과거'**로만 나눈다.
   * 억지로 '현행'이라고 하면 이미 바뀐 규정을 현행으로 보여주게 된다.
   */
  function 상태(date, 기준시각) {
    var d = new Date(date);
    if (isNaN(d)) return '기록';
    var 이년 = 2 * 365 * 24 * 60 * 60 * 1000;
    return (기준시각 - d.getTime()) <= 이년 ? '최근' : '과거';
  }

  function 회의체(id) { return String(id || '').indexOf('t_') === 0 ? '임차' : '입대의'; }

  /*
   * 원문으로 가는 주소. 회의록 앱의 해당 회의를 연다.
   * Archive는 회의록을 다시 쓰지 않고 "찾아가게" 하는 것이 목적이므로,
   * 원문은 언제나 회의록 앱이 보여준다. 여기서 본문을 복제하지 않는다.
   */
  function 원문주소(x) {
    return x.회의id ? '/minutes/?open=' + encodeURIComponent(x.회의id) : '';
  }

  /*
   * meetings: [{id, name, date, agendas:[{id,title,summary,decision,tags}]}]
   * taxonomy: window.TopicTaxonomy (defs + resolveStored)
   * autoTags: 태그가 없을 때 쓸 자동 분류 함수 (a) -> [주제]
   */
  function build(meetings, taxonomy, autoTags, 지금) {
    지금 = 지금 || 0;
    var defs = (taxonomy && taxonomy.defs) || [];
    var 주제별 = {};
    defs.forEach(function (d) { 주제별[d.key] = []; });
    주제별['기타'] = [];

    var 최근 = [];

    (meetings || []).forEach(function (m) {
      var 날짜 = m.date || '';
      var ym = 연월(날짜);
      (m.agendas || []).forEach(function (a) {
        if (!a || !String(a.title || '').trim()) return;
        var tags;
        if (taxonomy && taxonomy.resolveStored) tags = taxonomy.resolveStored(a, autoTags);
        if (!tags || !tags.length) tags = autoTags ? autoTags(a) : ['기타'];
        var 항목 = {
          날짜: 날짜, ym: ym, 제목: String(a.title).trim(),
          회의: m.name || '', 회의id: m.id, 회의체: 회의체(m.id),
          /* 목록에 한 줄로 스쳐 보여줄 것. 여기서는 줄여도 된다 — 목록은 훑는 자리다. */
          요지: String(a.summary || a.decision || '').replace(/\s+/g, ' ').slice(0, 160),
          // 「왜 이 주제에 걸렸나」를 찾을 때 뒤진다(자르지 않은 본문이라야 한다).
          본문전체: String(a.summary || '') + ' ' + String(a.decision || '') + ' ' + String(a.followup || ''),
          /*
           * 팝업에서 보여줄 안건 전문 (5.5b, 사용자 요청 2026-09-02).
           *
           * 지적: *"내용이 어느정도 보여주다 잘리더라고. 회의록 내용 길어봤자인데 그냥 해당
           * 안건내용 다 적어줬음 싶고. 줄바꿈 이런것도 먹혀야 읽기 편할거 같아."*
           *
           * 맞다. 팝업까지 열었으면 그건 **읽으려고 연 것**이다. 거기서 자를 이유가 없다.
           * 그리고 요지는 `\s+ → ' '`로 줄바꿈을 뭉개고 있었다. 회의록 본문은 항목이 줄로 나뉜
           * 글이라 줄바꿈을 없애면 한 덩어리가 되어 읽기가 나빠진다. 여기서는 **원문 그대로** 둔다.
           *
           * 논의·의결·후속조치·표결을 뭉치지 않고 나눠서 넘긴다. 회의록에서 뜻이 다른 칸이고,
           * 「무엇을 논의했나」와 「무엇을 정했나」는 읽는 사람에게 특히 다르다.
           */
          본문: (function () {
            var 칸 = [];
            var 넣기 = function (이름, v) {
              var s = String(v == null ? '' : v).replace(/\r\n/g, '\n').trim();
              if (s) 칸.push({ 이름: 이름, 글: s });
            };
            넣기('논의', a.summary);
            넣기('의결', a.decision);
            넣기('후속조치', a.followup);
            /*
             * 표결. **실제 자료 모양을 확인하고 맞췄다** — 처음엔 `yes/no/abstain` 같은 이름을
             * 짐작으로 썼다가 실제 찬성5/반대5인 안건에 「찬성 0 · 반대 0 · 기권 0」을 보여줬다.
             * 없는 것을 보여주느니 안 보여주는 게 낫고, **틀린 숫자를 보여주는 건 그보다 훨씬 나쁘다.**
             *
             * 실제 모양: `{ "202": "for", "204": "against", … }` — 동(또는 참석자)별 한 표씩.
             * 전체 자료에 나오는 값은 `for`(4,692)와 `against`(35) **둘뿐**이다. 기권은 없다 —
             * 그래서 기권 칸도 만들지 않는다.
             *
             * **반대표가 있을 때만 보여준다** (사용자 결정 2026-09-02).
             * 4,692표 중 4,657표가 찬성이라 「찬성 10 · 반대 0」은 거의 모든 안건에 붙으면서
             * 아무것도 말해주지 않는다. 반대가 나온 35번이 오히려 눈에 띄어야 한다.
             *
             * 또 하나 — 이 숫자를 의결문의 표결과 헷갈리면 안 된다. 의결문에 「찬성5/반대5 부결」처럼
             * 적힌 것은 **한 안건 안의 개별 사안별** 표결을 사람이 적은 것이고, 여기 숫자는
             * 회의록 앱이 동별로 남긴 기록이다. 한 안건에 여러 사안을 몰아넣으면 둘이 어긋난다.
             * 그래서 칸 이름에 무엇을 센 것인지 밝힌다.
             */
            넣기('표결 (동별 기록)', (function () {
              if (!a.votes || typeof a.votes !== 'object') return '';
              var 찬 = 0, 반 = 0;
              Object.keys(a.votes).forEach(function (k) {
                var v = String(a.votes[k] || '');
                if (v === 'for') 찬++; else if (v === 'against') 반++;
              });
              if (!반) return '';        // 만장일치는 말할 것이 없다
              return '찬성 ' + 찬 + ' · 반대 ' + 반;
            })());
            /*
             * 비고도 `{ "202": "…" }` 꼴의 객체다. 1,212건 중 **내용이 있는 것은 7건**뿐이고
             * 나머지는 빈 객체다. 그대로 넣으면 전부 「[object Object]」가 된다.
             */
            넣기('비고', (function () {
              if (!a.remarks || typeof a.remarks !== 'object') return a.remarks;
              return Object.keys(a.remarks)
                .map(function (k) { return String(a.remarks[k] || '').trim(); })
                .filter(Boolean).join('\n');
            })());
            return 칸;
          })(),
          상태: 상태(날짜, 지금), 주제들: tags
        };
        항목.짚음 = 짚을것(a, 항목);
        tags.forEach(function (t) {
          if (!주제별[t]) 주제별[t] = [];
          주제별[t].push(항목);
        });
        최근.push(항목);
      });
    });

    최근.sort(function (a, b) { return String(b.날짜).localeCompare(String(a.날짜)); });

    /*
     * 굵직한 것 짚기 (5.5e, 사용자 요청 2026-09-02: *"굵직한 사건은 따로 앞에 표기를 하거나"*)
     *
     * 무엇이 '굵직한' 것인지 **짐작하지 않고 실제 자료 1,212건으로 쟀다.** 대부분의 후보가 탈락했다.
     *   의결 있음 1,204건(99.3%) · 표결 기록 666건(55%) → 거의 전부라 아무것도 구분해 주지 못한다
     *   후속조치 1건 → 사실상 안 쓰는 칸
     * 남은 것은 드물어서 의미가 있는 넷이다.
     *   반대표 있음 12건 · 제목에 재심의 23건 · 제목에 교체/해지 19건 · 본문 600자 초과 30건
     *
     * 그리고 「중요」라고 뭉뚱그리지 않는다. **왜 짚었는지**를 그대로 적는다.
     * 무엇이 중요한지는 사람마다 다르고 내가 정할 일이 아니다. 「의견 갈림」·「재심의」는 사실이다.
     */
    function 짚을것(a, 항목) {
      var out = [];
      var 제목 = String(항목.제목 || '');
      if (a.votes && typeof a.votes === 'object' &&
          Object.keys(a.votes).some(function (k) { return a.votes[k] === 'against'; })) out.push('의견 갈림');
      if (/재심의|부결/.test(제목)) out.push('재심의');
      if (/교체|해지/.test(제목)) out.push('바뀜');
      if (String(항목.본문전체 || '').length > 600) out.push('길게 논의');
      return out.slice(0, 2);   // 세 개 넘게 붙으면 그것대로 눈에 안 들어온다
    }

    /*
     * 왜 이 안건이 이 주제에 걸렸는가 (5.4 ④)
     *
     * 「기타 안건」이라는 제목이 목록을 채우는데, 미리보기 본문은 엉뚱한 데서 시작한다.
     * 하자·소송의 2026.05 「기타 안건」은 미리보기가 **커뮤니티센터 위탁업체** 이야기였다.
     * 방문자는 "이게 왜 하자·소송이지?" 한다. 제목을 고쳐 쓸 수는 없다 — 회의록에 그렇게 적혀 있다.
     * 대신 **어느 대목 때문에 걸렸는지**를 보여준다. 그러면 「기타 안건」도 읽힌다.
     *
     * 제목에서 걸렸으면 이미 보이므로 아무것도 만들지 않는다. 본문에서 걸렸을 때만 그 언저리를 오린다.
     */
    function 걸린대목(항목, label) {
      var def = defs.filter(function (d) { return d.key === label; })[0];
      var kws = (def && def.kw) || [];
      if (!kws.length) return '';
      var 제목 = String(항목.제목 || '');
      for (var i = 0; i < kws.length; i++) if (제목.indexOf(kws[i]) >= 0) return '';   // 제목에 이미 보인다
      var 본문 = String(항목.본문전체 || '');
      for (var j = 0; j < kws.length; j++) {
        var at = 본문.indexOf(kws[j]);
        if (at < 0) continue;
        var 앞 = Math.max(0, at - 45);
        var 조각 = 본문.slice(앞, at + kws[j].length + 75).replace(/\s+/g, ' ').trim();
        return (앞 > 0 ? '…' : '') + 조각 + '…';
      }
      return '';
    }

    var topics = Object.keys(주제별).map(function (label) {
      var 목록 = 주제별[label].slice().sort(function (a, b) { return String(b.날짜).localeCompare(String(a.날짜)); });
      var def = defs.filter(function (d) { return d.key === label; })[0];
      var 입대의 = 목록.filter(function (x) { return x.회의체 === '입대의'; }).length;
      var 임차 = 목록.length - 입대의;
      return {
        id: 아이디(label),
        label: label,
        visibility: 'public',
        aliases: (def && def.kw) ? def.kw.slice(0, 8) : [],
        description: 목록.length
          ? 목록.length + '건 · ' + (목록[목록.length - 1].ym || '') + ' ~ ' + (목록[0].ym || '')
          : '아직 이 주제로 분류된 기록이 없어',
        counts: (function () {
          var c = {};
          c['안건'] = 목록.length;
          if (입대의) c['입주자대표회의'] = 입대의;
          if (임차) c['임차인대표회의'] = 임차;
          return c;
        })(),
        // '현재 기준'은 회의록만으로 판단할 수 없다. 규약·계약 자료가 들어오기 전까지는
        // 가장 최근 기록 몇 건을 '최근 움직임'으로 보여주고, 현행이라고 단정하지 않는다.
        current: 목록.slice(0, 2).map(function (x) {
          var 걸림0 = 걸린대목(x, label);
          return { kind: x.ym, title: x.제목, note: x.회의 + (걸림0 ? ' — ' + 걸림0 : (x.요지 ? ' — ' + x.요지 : '')), tags: ['history'], 원문: 원문주소(x), 회의: x.회의, 본문: x.본문 };
        }),
        /* 타임라인은 **전부** 넘긴다(예전엔 40건에서 잘랐다).
         * 화면이 연도별로 접어 보여주므로(5.5d) 여기서 미리 자르면 옛 연도가 통째로 사라진다.
         * 계약·입찰 230건이 가장 많고 한 건이 200자 남짓이라 양은 문제가 되지 않는다. */
        timeline: 목록.map(function (x) {
          /* 미리보기는 **걸린 대목**을 먼저 쓴다. 없으면(=제목에서 걸렸으면) 본문 첫머리를 쓴다.
             제목이 「기타 안건」인데 첫머리가 딴 이야기면 왜 여기 있는지 알 수 없다. */
          var 걸림 = 걸린대목(x, label);
          return {
            date: x.ym, title: x.제목,
            note: x.회의 + (걸림 ? ' — ' + 걸림 : (x.요지 ? ' — ' + x.요지 : '')),
            걸림: 걸림, 회의체: x.회의체, 짚음: x.짚음 || [],
            원문: 원문주소(x), 회의: x.회의, 본문: x.본문
          };
        }),
        /*
         * 갈래 — 이 주제 안을 다시 나누는 축 (5.4)
         *
         * 「계약·입찰」 230건을 열면 전기안전·커뮤니티센터·승강기·소독 계약이 **날짜순으로 섞여** 나온다.
         * "우리 승강기 유지관리 누가 하지?"라고 묻는 사람에게 11년치 모든 계약을 보여주는 셈이다.
         *
         * 처음에는 제목에서 대상을 뽑아 새 축을 만들려 했다. 실측하니 95%는 뽑혔지만
         * **서로 다른 대상이 90개**로 갈라졌다 — 「승강기 유지관리」와 「승강기 유지보수」가 따로 놀았다.
         * 새 어휘를 만들면 관리할 것이 하나 더 늘고, 해가 지나면 또 어긋난다.
         *
         * 다시 재보니 **계약·입찰 230건 중 225건(98%)이 이미 다른 주제에도 걸려 있었다.**
         * 청소·미화 34 · 전기·설비 23 · 승강기 22 · 화재·소방 21 …
         * 즉 **'무엇에 대한 것인가'는 이미 기존 분류 안에 있었다.** 새 축을 만들지 않는다.
         * 덕분에 데이터 모델에 차원을 더하지 않고 끝난다(5.6 동결에 영향 없음).
         */
        갈래: (function () {
          var 셈 = {};
          목록.forEach(function (x) {
            (x.주제들 || []).forEach(function (l) { if (l !== label) 셈[l] = (셈[l] || 0) + 1; });
          });
          return Object.keys(셈).map(function (l) { return { label: l, count: 셈[l] }; })
            .sort(function (a, b) { return b.count - a.count || String(a.label).localeCompare(String(b.label)); });
        })(),
        // records는 화면이 배열로 읽는다(자리를 바꾸면 화면이 깨진다).
        // 뒤에만 덧붙인다 — 앞 네 자리 [연월, 종류, 제목, 상태]는 그대로 둔다.
        // 5번째 원문 주소, 6번째 회의명, 7번째 이 안건이 걸린 다른 주제들(갈래로 좁힐 때 쓴다).
        records: 목록.map(function (x) {
          return [x.ym, x.회의체 === '임차' ? '임차 안건' : '입대의 안건', x.제목, x.상태, 원문주소(x), x.회의,
                  (x.주제들 || []).filter(function (l) { return l !== label; }), x.본문];
        })
      };
    }).sort(function (a, b) { return b.records.length - a.records.length; });

    var byLabel = {};
    topics.forEach(function (t) { byLabel[t.label] = t.id; });

    return {
      /* 화면의 「지금 적용되는 기준 / 현재 기준」을 그대로 쓰면 거짓말이 된다.
       * 회의록만으로는 무엇이 지금도 유효한 기준인지 알 수 없다. 규약·계약 자료가
       * 들어오기 전까지는 **최근 기록**이라고만 말한다. */
      currentHeading: '가장 최근 기록',
      currentLabel: '최근',
      currentNote: '규약·계약 자료를 붙이기 전이라 지금은 최근 안건만 보여준다',
      topics: topics,
      recentRecords: 최근.slice(0, 12).map(function (x) {
        return {
          date: x.ym, kind: x.회의체 === '임차' ? '임차 안건' : '입대의 안건',
          title: x.제목, status: x.상태, topicId: byLabel[x.주제들[0]] || ''
        };
      }),
      통계: { 회의: (meetings || []).length, 안건: 최근.length, 주제: topics.length }
    };
  }

  /*
   * 이 화면이 언제까지의 자료인지 (4.6a)
   *
   * 공개 화면은 클라우드를 직접 부르지 않고 하루 한 번 만들어지는 정적 사본을 읽는다.
   * 그래서 **오늘 저장한 회의록은 여기 없다.** 그 사실을 안 적어두면 사용자는
   * "저장했는데 왜 안 보이지"에서 막힌다. 실제로 이 프로젝트에서 여러 번 겪은 일이다.
   *
   * 무엇을 기준으로 삼는가: **가장 마지막으로 저장된 회의록의 시각**.
   * 사본을 만든 시각(generatedAt)이 아니다. 만들기는 매일 돌지만 바뀐 게 없으면
   * 파일을 새로 쓰지 않으므로, 그 값은 "언제 확인했는지"를 말해주지 못한다.
   * 마지막 저장 시각을 쓰면 사본 만들기가 며칠 멈춰도 숫자가 자라지 않아 바로 티가 난다.
   *
   * 오래됨(stale) 판정을 3일로 둔 이유: 하루 주기이므로 이틀까지는 흔히 있는 일이고,
   * 사흘이 넘으면 사본 만들기가 멈췄다고 보는 편이 맞다.
   */
  function 기준문구(iso, 지금) {
    var d = new Date(iso || '');
    if (!iso || isNaN(d)) return { text: '', stale: false, 날짜: '' };
    var n = new Date(지금 || Date.now());
    var 날 = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    var 지난날 = Math.round((날(n) - 날(d)) / 86400000);
    var 날짜 = d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    var 언제 = 지난날 <= 0 ? '오늘' : 지난날 === 1 ? '어제' : 지난날 + '일 전';
    return {
      날짜: 날짜,
      지난날: 지난날,
      stale: 지난날 >= 3,
      text: 날짜 + '(' + 언제 + ') 저장분까지'
    };
  }

  return { build: build, 연월: 연월, 아이디: 아이디, 상태: 상태, 기준문구: 기준문구 };
});
