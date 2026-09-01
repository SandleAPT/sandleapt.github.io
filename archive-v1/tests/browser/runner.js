'use strict';
// Archive v1 브라우저 검증 러너 (4.3d)
// 목적: Node.js가 없는 작업 환경에서도 `archive-v1/tests/specs/*.spec.js`를 그대로 실행해
//       VALIDATION_POLICY 3항(자동 검증)을 충족시킨다. 케이스 정의는 spec에만 두고 여기엔 두지 않는다.
(function () {
  var ROOT = '../../';               // archive-v1/tests/browser/ 기준 → archive-v1/
  var loaded = {};                   // 같은 소스 모듈을 spec마다 다시 싣지 않는다

  function loadScript(rel) {
    if (loaded[rel]) return loaded[rel];
    loaded[rel] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = ROOT + rel;
      s.onload = function () { resolve(rel); };
      s.onerror = function () { reject(new Error('모듈 로드 실패: ' + rel)); };
      document.head.appendChild(s);
    });
    return loaded[rel];
  }

  function readText(rel) {
    return fetch(ROOT + rel + '?cb=' + Date.now()).then(function (r) {
      if (!r.ok) throw new Error('파일 읽기 실패(' + r.status + '): ' + rel);
      return r.text();
    });
  }

  // 격리 실행: spec이 전역(모듈 내부 캐시, store 상태, fetch 스텁)을 건드리면
  // 같은 페이지에서 두 번 돌릴 때 결과가 달라진다. isolate:true인 spec은 빈 iframe에
  // 필요한 스크립트만 새로 실어 매번 깨끗한 컨텍스트에서 돌린다.
  function loadInto(win, src) {
    return new Promise(function (resolve, reject) {
      var s = win.document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('모듈 로드 실패: ' + src)); };
      win.document.head.appendChild(s);
    });
  }

  async function runInFrame(spec) {
    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = 'about:blank';
    document.body.appendChild(frame);
    try {
      var win = frame.contentWindow;
      // iframe의 상대 경로 기준은 about:blank라 부모의 절대 URL로 바꿔 싣는다.
      var abs = function (rel) { return new URL(rel, location.href).href; };
      await loadInto(win, abs('../specs/assert.js'));
      await loadInto(win, abs('../specs/' + spec.name + '.spec.js'));
      var inner = win.SandleSpecs[spec.name];
      if (!inner) throw new Error('격리 컨텍스트에서 spec을 찾지 못함: ' + spec.name);
      var ctx = { assert: win.SandleSpecs.assert, global: win, readText: readText };
      // setup은 deps보다 먼저 돈다. 대상 모듈이 로드 시점에 전역 스텁을 읽는 경우가 있어서다.
      if (inner.setup) await inner.setup(ctx);
      for (var j = 0; j < (inner.deps || []).length; j++) await loadInto(win, abs(ROOT + inner.deps[j]));
      await inner.run(ctx);
    } finally {
      frame.remove();
    }
  }

  async function runSpec(spec) {
    var started = performance.now();
    var result = { name: spec.name, title: spec.title || spec.name, ok: false, error: null, ms: 0, isolated: !!spec.isolate };
    try {
      if (spec.isolate) {
        await runInFrame(spec);
      } else {
        var ctx = { assert: window.SandleSpecs.assert, global: window, readText: readText };
        if (spec.setup) await spec.setup(ctx);
        for (var i = 0; i < (spec.deps || []).length; i++) await loadScript(spec.deps[i]);
        await spec.run(ctx);
      }
      result.ok = true;
    } catch (e) {
      result.error = (e && e.message) ? e.message : String(e);
    }
    result.ms = Math.round(performance.now() - started);
    return result;
  }

  // specNames 순서대로 직렬 실행한다. store 상태를 건드리는 spec이 있어 병렬로 돌리지 않는다.
  async function runAll(specNames, onProgress) {
    var out = [];
    for (var i = 0; i < specNames.length; i++) {
      var spec = window.SandleSpecs[specNames[i]];
      if (!spec) { out.push({ name: specNames[i], title: specNames[i], ok: false, error: 'spec을 찾을 수 없음', ms: 0 }); }
      else out.push(await runSpec(spec));
      if (onProgress) onProgress(out.slice(), i + 1, specNames.length);
    }
    return out;
  }

  window.SandleTestRunner = { runAll: runAll, runSpec: runSpec, readText: readText, loadScript: loadScript };
})();
