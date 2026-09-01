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
          요지: String(a.summary || a.decision || '').replace(/\s+/g, ' ').slice(0, 160),
          상태: 상태(날짜, 지금), 주제들: tags
        };
        tags.forEach(function (t) {
          if (!주제별[t]) 주제별[t] = [];
          주제별[t].push(항목);
        });
        최근.push(항목);
      });
    });

    최근.sort(function (a, b) { return String(b.날짜).localeCompare(String(a.날짜)); });

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
          return { kind: x.ym, title: x.제목, note: x.회의 + (x.요지 ? ' — ' + x.요지 : ''), tags: ['history'] };
        }),
        timeline: 목록.slice(0, 40).map(function (x) {
          return { date: x.ym, title: x.제목, note: x.회의 + (x.요지 ? ' — ' + x.요지 : '') };
        }),
        records: 목록.map(function (x) {
          return [x.ym, x.회의체 === '임차' ? '임차 안건' : '입대의 안건', x.제목, x.상태];
        })
      };
    }).sort(function (a, b) { return b.records.length - a.records.length; });

    var byLabel = {};
    topics.forEach(function (t) { byLabel[t.label] = t.id; });

    return {
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

  return { build: build, 연월: 연월, 아이디: 아이디, 상태: 상태 };
});
