# Sandle Archive v1 — 4.1~4.3a 검증 기록

- 검증·원격 반영 완료: `2026-09-01 15:32:08 KST`
- 캐시 버전: `20260901-152900`
- 구현 커밋: `6bb6e633900e8d6217fcc4a20bd0b8a86b7aa223`
- 범위: 저장소 역할 분리, SourceReference v1, 공개 projection, 관리자 발행 차단
- 운영 루트 변경: 없음
- minutes 원본 변경: 없음

## 검증 결과

- `stage3-source`: 통과
- `stage3-adapter`: 통과
- `stage3-live-data`: 회의 213건 / Fragment 1,125건 통과
- `stage4-source-reference`: 통과
- `stage4-visibility`: 통과
- `stage4-publish-guard`: 통과
- `stage4-admin-integration`: 통과
- Archive 전체 JavaScript 문법 검사: 통과
- `git diff --check`: 통과

## 확인한 보안 경계

- visibility 누락·오류는 `private`로 처리한다.
- `resident`와 `private`는 공개 projection을 만들지 않는다.
- 비공개 외부 `file_id`는 공개 원본 참조에 포함하지 않는다.
- 발행 화면뿐 아니라 `store.publish()`에서도 공개 정책 검사를 강제한다.
- 공개 정책 모듈이 없으면 발행을 허용하지 않는 fail-closed 방식이다.
- 실제 인증이 생기기 전에는 resident/private 자료를 공개 GitHub Pages 산출물에 넣지 않는다.

## 화면 검증 제한

Playwright 패키지는 있었지만 실행 가능한 Chromium이 설치돼 있지 않아 헤드리스 브라우저 클릭 검증은 실행하지 못했다. 이를 완료로 가장하지 않고, 실제 store와 정책 모듈을 함께 불러오는 통합 테스트로 다음 동작을 검증했다.

- public 자료 발행 허용
- resident 자료 발행 차단
- private 자료 발행 차단
- 정책 모듈 누락 시 발행 차단
- 관리자 HTML의 Stage 4 스크립트 로드 순서와 화면 연결

공개 배포 후 사용자가 직접 확인할 경로는 `/archive-v1/admin/#storagePolicy`와 `/archive-v1/admin/#publish`다.

---

# 4.3d 브라우저 검증 러너 (Claude)

- 검증·원격 반영 완료: `2026-09-01 17:34:20 KST`
- 캐시 버전: `20260901-1730`
- 담당: Claude (2026-09-01 17:06 KST 사용자 지시로 ARCHIVE 담당 이관)
- 운영 루트 변경: 없음 / minutes 원본 변경: 없음 / 기존 node 테스트 파일 변경: 없음

## 배경 — 인계된 검증 명령을 실행할 수 없었다

담당이 Claude로 넘어온 작업 환경(사용자 Windows PC)에 **Node.js가 없다**(`node -v` 실패). `archive-v1/tests/*.test.js`는 `node:assert/strict`·`fs`·`path`·`vm`을 쓰는 CommonJS라 브라우저에서 그대로 돌릴 수 없다. 이 상태로는 VALIDATION_POLICY 3항(자동 검증)을 충족할 수 없어 어떤 단계도 정직하게 `done`으로 올릴 수 없었다.

기존 node 테스트는 **수정하지 않았다.** node로 회귀를 확인할 수 없는 환경에서 그 파일을 건드리는 것 자체가 위험하기 때문이다.

## 구현

케이스 정의를 UMD spec 모듈로 분리하고, 같은 spec을 브라우저에서 실행하는 러너를 추가했다.

- `archive-v1/tests/specs/assert.js` — 공용 단언(equal·deepEqual·ok·match·isNull)
- `archive-v1/tests/specs/stage4-source-reference.spec.js`
- `archive-v1/tests/specs/stage4-visibility.spec.js`
- `archive-v1/tests/specs/stage4-publish-guard.spec.js`
- `archive-v1/tests/specs/stage4-admin-integration.spec.js`
- `archive-v1/tests/browser/runner.js` — 실행 엔진(의존 모듈 동적 로드, 직렬 실행)
- `archive-v1/tests/browser/index.html` — 결과 화면
- `archive-v1/assets/test-runner.css` — 스타일 분리

spec은 런타임에 의존하지 않는다. 파일 읽기처럼 런타임이 다른 동작은 `ctx.readText`로 위임한다(브라우저 fetch / node fs).

## 검증 결과 — 실제 배포본에서 실행

`https://sandleapt.github.io/archive-v1/tests/browser/`

- `stage4-source-reference`: 통과 (215ms)
- `stage4-visibility`: 통과 (218ms)
- `stage4-publish-guard`: 통과 (222ms)
- `stage4-admin-integration`: 통과 (630ms)
- 합계 4/4 통과, 실패 0

### 러너 자체의 신뢰성 확인

통과만 하는 러너는 검증 도구가 아니므로 회귀 감지 능력을 따로 확인했다.

`SandleVisibilityPolicy.targetFor`를 "미지 등급도 공개"로 되돌려 놓고 같은 spec을 실행했더니 다음과 같이 실패로 잡혔다.

```text
❌ stage4-visibility — resident는 공개 번들 대상 아님 — 기대 false, 실제 true
```

원복 후 다시 통과하는 것까지 확인했다.

## 남은 위험

- 케이스가 spec과 기존 node 테스트 두 곳에 존재한다. 한쪽만 고치면 갈라진다. node가 있는 환경에서 기존 `*.test.js`가 spec을 `require`하도록 통합하는 작업을 남겨 둔다(4.3f).

---

# 4.3e Stage 3 spec 브라우저 이식 (Claude)

- 검증·원격 반영 완료: `2026-09-01 18:22:40 KST`
- 캐시 버전: `20260901-1815`
- 운영 루트 변경: 없음 / minutes 원본 변경: 없음 / 기존 node 테스트 변경: 없음

## 구현

- `archive-v1/tests/specs/stage3-source.spec.js` — 인덱스·연도 로드, 연도 캐시 재사용
- `archive-v1/tests/specs/stage3-adapter.spec.js` — Document/Fragment 변환, 주제 출처(stored/inferred), 표결 요약, draft 중복 방지
- 러너에 **iframe 격리 실행**(`isolate: true`)과 **setup 단계**를 추가했다.
  - 격리: spec이 `fetch`를 스텁으로 바꾸거나 모듈 내부 캐시를 채우면 같은 페이지의 다음 실행이 오염된다. 빈 iframe에 필요한 스크립트만 새로 실어 매번 깨끗한 컨텍스트에서 돌린다.
  - setup: 대상 모듈이 로드 시점에 전역(`TopicTaxonomy` 등)을 참조하므로, deps보다 먼저 스텁을 깔 자리가 필요했다.

## 검증 결과 — 실제 배포본

`https://sandleapt.github.io/archive-v1/tests/browser/` → 6/6 통과, 실패 0

- `stage3-source` 통과 (456ms, 격리)
- `stage3-adapter` 통과 (279ms, 격리)
- `stage4-source-reference` 통과 (5ms)
- `stage4-visibility` 통과 (6ms)
- `stage4-publish-guard` 통과 (3ms)
- `stage4-admin-integration` 통과 (213ms)

### 격리가 실제로 필요한지 확인

같은 spec을 연속 실행해 비교했다.

| 조건 | 1회차 | 2회차 |
|---|---|---|
| `isolate: true` (현재) | 통과 | 통과 |
| `isolate` 강제 해제 | 통과 | **실패** — `r.text is not a function` |

격리를 끄면 spec이 심어 둔 fetch 스텁이 부모 창에 남아 다음 실행의 파일 읽기를 망가뜨린다. 격리 설계가 필요했음이 확인됐다.

---

# 4.3g 실제 데이터 전량 변환 spec 이식 (Claude)

- 검증·원격 반영 완료: `2026-09-01 19:20:05 KST`
- 캐시 버전: `20260901-1915`
- 운영 루트 변경: 없음 / minutes 원본 변경: 없음 (읽기만) / 기존 node 테스트 변경: 없음

## 구현

`archive-v1/tests/specs/stage3-live-data.spec.js` — 같은 origin의 `/minutes/data-index.json`으로 연도를 찾아 모든 샤드를 변환한다. 실제 taxonomy(`/minutes/assets/js/app/topic-defs.js`)를 그대로 실어, minutes의 분류 규칙이 바뀌면 이 spec이 먼저 깨지도록 했다.

건수는 **고정하지 않는다.** 회의록이 계속 늘어나므로 구조 불변조건만 본다.

- 안건 수 == Fragment 수 (누락·중복 없음)
- Fragment ID 중복 0건
- 회의 1건 이상

## 검증 결과 — 실제 배포본

`https://sandleapt.github.io/archive-v1/tests/browser/` → **7/7 통과, 실패 0**

- `stage3-source` 880ms · `stage3-adapter` 494ms · `stage3-live-data` 3,523ms
- `stage4-source-reference` 6ms · `stage4-visibility` 4ms · `stage4-publish-guard` 4ms · `stage4-admin-integration` 218ms
- 실제 데이터: **11개 연도 · 회의 213건 · Fragment 1,125건** (안건 수 불일치 0, ID 중복 0)

## 발견 — Archive가 읽는 정적 샤드는 클라우드보다 뒤처진다

검증 중 클라우드 회의록(224건)과 정적 샤드(213건)의 **11건 차이**를 확인했다.

- 정적 샤드 생성 시각: `2026-08-31T22:18:45Z` = `2026-09-01 07:18 KST`
- 누락된 11건: `m_2016_05·06·07·10·11·12`, `m_2017_02·04·05·05s`, `m_2018_04`
- 전부 그 시각 **이후**에 적재된 입대의 제1기(2016~2018) 회의록이다.

즉 데이터 손실이 아니라 **재발행 지연**이다. Archive Stage 3은 `/minutes/data-YYYY.json` 정적 샤드를 읽고, 이 파일들은 minutes 저장소의 봇이 주기적으로 클라우드에서 다시 만든다. 따라서 Archive가 보는 회의록은 항상 클라우드보다 한 주기 뒤처질 수 있다.

이 성질을 모르면 나중에 "Archive에 최근 회의가 안 보인다"를 버그로 오진하기 쉽다. 다음 재발행 이후 `stage3-live-data`를 다시 돌리면 **224건으로 늘어난 채 통과하는 것이 정상**이다.

후속 검토 항목은 `4.6`으로 남겼다.

## 러너 보완 두 가지

- **격리 컨텍스트의 경로 해석**: iframe의 `location`은 `about:blank`라 `new URL(rel, location.href)`가 `Invalid base URL`로 실패했다. 러너가 `ctx.origin`·`ctx.resolve`를 넘기도록 고쳤다.
- **격리 로드의 캐시 무효화**: 부모 페이지는 `?v=…`로 최신 파일을 받는데 iframe은 쿼리 없이 로드해 브라우저 캐시의 옛 spec을 재사용했다. 수정이 반영되지 않아 같은 실패가 반복됐다. iframe 로드에도 캐시 무효화 쿼리를 붙였다.

## 작업 중 발생한 사고 — 파일 인코딩 손상

러너 페이지의 캐시 버전을 바꾸려고 PowerShell `(Get-Content -Raw) | Set-Content -Encoding utf8`을 썼다가 **한글이 전부 깨진 채로 커밋·푸시**됐다(커밋 `4badffe`). Windows PowerShell 5.1의 `Get-Content`가 UTF-8 파일을 ANSI로 읽어 깨진 문자열을 다시 저장했기 때문이다.

`git checkout <직전 커밋> -- <파일>`로 복구한 뒤 편집 도구로 다시 수정해 `459240f`로 정상화했다. 한글이 들어간 파일은 PowerShell 텍스트 파이프라인으로 수정하지 않는다(`docs/AI_WORKFLOW.md` 12절에 규칙으로 추가).

## 다른 AI가 재현하는 방법

```text
브라우저: https://sandleapt.github.io/archive-v1/tests/browser/ → [전체 검증 실행]
결과는 window.__sandleTestResult 에도 남는다({at, rows, failed}).
node 환경: 기존 node archive-v1/tests/*.test.js 를 그대로 사용(케이스 동일).
```

## 아직 확정하지 않은 것

- 입주민 인증 주체와 로그인 방식
- 관리자 인증과 쓰기 권한
- resident 원본 파일 제공 서버·저장소
- 인증 만료·회수·감사 로그

위 항목은 비용·개인정보·실제 접근권한에 영향을 주므로 사용자 결정 전까지 구현하지 않는다.
