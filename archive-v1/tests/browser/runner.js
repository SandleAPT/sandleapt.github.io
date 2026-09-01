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

  async function runSpec(spec) {
    var started = performance.now();
    var result = { name: spec.name, title: spec.title || spec.name, ok: false, error: null, ms: 0 };
    try {
      for (var i = 0; i < (spec.deps || []).length; i++) await loadScript(spec.deps[i]);
      await spec.run({
        assert: window.SandleSpecs.assert,
        global: window,
        readText: readText
      });
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
