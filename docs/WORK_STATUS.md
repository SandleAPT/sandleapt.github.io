# 공동 작업 현황

마지막 갱신: 2026-09-01 20:48:15 KST

> GPT와 Claude가 번갈아 작업할 때 가장 먼저 확인하는 파일이다. 과거 상세 로그는 Git 커밋 이력에서 확인할 수 있다.

## 활성 작업

### MINUTES-20260901-01 — 입대의 데이터 대기 9건 — `done` (잠금 해제)

- 담당: Claude
- 상태: `done` — 2026-09-01 16:50 KST 잠금 해제
- 결과: 입대의 게시판 1~9페이지 전수 이관 완료. 회의록 클라우드 236건(2016.05~2026.08), 공고 보관함 56건.
- 함께 처리: 주제 흐름 요약 38종 전면 갱신(stale 0), 동대표 임기 회차 계산 버그 수정(minutes v99~v101), 입대의 1~3기 좌석 확정.
- 원본 저장소 `SandleAPT/minutes`에서만 작업했고 이 저장소(포털·Archive)에는 iframe 캐시 키 외 변경 없음.
- **다른 작업자는 이제 입대의 데이터를 참조·분류해도 된다.** Archive 3단계 live-data 검증이 쓰는 `/minutes/data-YYYY.json`이 이 작업으로 2016~2019 샤드까지 늘어났다(아래 위험 항목 참조).

### ARCHIVE-20260901-01 — Sandle Archive v1

- 담당: **Claude** (2026-09-01 17:06 KST 사용자 지시로 GPT → Claude 이관)
- 상태: `in_progress` — 4.1·4.2·4.3a(GPT), 4.3b·4.3d·4.3e·4.3g(Claude) 완료. 남은 것: 4.3c·4.3f·4.4·4.5·4.6
- 마스터 계획: `docs/archive-v1/ROADMAP_V1.md`
- 1단계: `done` — 임시 확정
- 2단계: `review` — 직접 테스트 가능, 실사용 중 보완
- 3단계: `done` — 검증·인계 체크포인트 배포 완료
- 완료: `4.1 저장소 역할 분리`, `4.2 SourceReference v1`, `4.3a 공개 발행 경계`
- 현재: `4.3b 실제 입주민·관리자 인증 결정 대기`
- 마지막 검증 완료: 실제 회의 213건 / 안건 1,125건 전체 변환
- 다음: 공개된 4단계 정책 화면 검토 후 인증 방식은 사용자와 결정
- 공개 미리보기: `https://sandleapt.github.io/archive-v1/`
- 3단계 직접 보기: `https://sandleapt.github.io/archive-v1/admin/#meetingImport`
- 4단계 직접 보기: `https://sandleapt.github.io/archive-v1/admin/#storagePolicy`
- 운영 루트 `index.html` 변경: 없음
- `SandleAPT/minutes` 원본 코드/데이터 변경: 없음
- 검색 A/B 최종 선택: 보류
- 현재 진행: `4.3d 브라우저 검증 러너` — 아래 '검증 환경 제약' 참조

#### 검증 환경 제약 (2026-09-01 17:06 KST, Claude 확인)

인계된 검증 명령이 이 작업 환경에서는 **실행 불가**하다.

- 사용자 PC(Windows)에 **Node.js가 설치돼 있지 않다.** `node -v` 실패.
- `archive-v1/tests/*.test.js`는 `require('node:assert/strict')`, `fs`, `path`, `vm`을 쓰는 CommonJS라 브라우저에서 그대로 못 돌린다.
- 따라서 담당이 Claude인 동안에는 기존 명령으로 `done` 판정을 할 수 없다. VALIDATION_POLICY 3항(자동 검증)을 충족하려면 node 없이도 같은 단언을 돌릴 경로가 필요하다.

임시 확인은 마쳤다. 브라우저 콘솔에서 `stage4-visibility` 단언 7개를 수동 재현해 전부 통과(2026-09-01 17:09 KST, `/archive-v1/admin/#storagePolicy`).
다만 수동 재현은 재현성이 없어 검증 기록으로 삼지 않는다.

**대응 방침(4.3d):** 기존 node 테스트 파일은 **수정하지 않는다**(node 없는 환경에서 회귀를 확인할 수 없으므로 건드리는 것 자체가 위험). 대신 케이스를 UMD spec 모듈로 새로 분리하고 브라우저 러너를 추가한다. node가 있는 환경(GPT)에서 기존 테스트를 같은 spec 기반으로 통합하는 것은 별도 소번호로 남긴다.

## 사용자 결정 기록

되돌리기 어려운 항목은 AI가 임의로 정하지 않고 사용자에게 물어본다(`VALIDATION_POLICY.md` "사용자 확인이 필요한 예외"). **물어봐서 받은 답은 여기에 시간순으로 남긴다.** 대화창에만 있으면 다음 작업자가 같은 것을 다시 묻거나, 근거 없이 다르게 구현하게 된다.

| 시각(KST) | 항목 | 결정 | 반영 위치 |
|---|---|---|---|
| 2026-09-01 19:45 | **4.3b 입주민·관리자 인증 방식** | 별도 회원제를 만들지 않고 **회의록 앱의 열람용/수정용 비밀번호를 그대로 재사용**한다. `resident` = 열람용 이상, `private` = 수정용만. | `docs/archive-v1/AUTH_V1.md` |
| 2026-09-01 16:30 | 입대의 1~3기 명단 보강 범위 | 동호수가 확인되는 사람만 좌석에 넣고, 근거 없는 인물은 추정하지 않는다("추정 가능한 사람만"). 이후 관리사무소 구성현황 문서로 대부분 확정됨. | `SandleAPT/minutes` `scripts/import/roster_fix_2026-09-01.js` |
| 2026-09-01 17:06 | ARCHIVE 담당 이관 | Archive v1 작업 담당을 GPT → Claude로 옮긴다. | 이 문서 활성 작업 |

### 아직 사용자에게 물어봐야 하는 것

- resident/private **원본 파일을 어디에 두고 어떻게 내려줄지**(외부 저장소 계정·비용과 연결) — `4.1`·`4.3b` 7절
- 공개 범위를 넓히는 변경 일반
- 운영 루트(`sandleapt.github.io`) 전환 시점 — `7.6`

## 작업 원칙

- 담당 AI가 각 단계의 기능·데이터·호환성을 직접 검증하고 보완한 뒤 사용자 중간 컨펌 없이 다음 단계로 진행한다.
- `done`은 코드가 생긴 시점이 아니라 자동 검증·실제 데이터 검증·인계 기록까지 끝난 뒤 사용한다.
- 사용자가 실제로 눌러볼 수 없는 상태를 `구현 완료`라고 과장하지 않는다.
- 사용자 피드백은 담당 AI가 관련 Roadmap 단계와 영향 범위를 판단해 새 소번호로 반영한다.
- 보안·권한·데이터 모델 변경, 원본 훼손 가능성처럼 되돌리기 어려운 결정만 중간 확인한다.
- 소단계 또는 검증 가능한 기능 묶음마다 `WORK_STATUS`·설계·검증 기록을 갱신하고 체크포인트 커밋을 남긴다.
- 다른 AI에게 이어달라고 할 때는 `docs/CONTINUE_ARCHIVE_PROMPT.md`의 프롬프트를 사용한다.
- 전체 10년치 일괄 변환 금지, 본 이관은 작은 배치로 진행한다.
- 입력은 한 번, 노출은 여러 곳.
- UI 구성과 데이터 구조를 분리한다.

## 현재 체크포인트 — 4.3a 공개 발행 경계

- 공개 포털, minutes, 외부 원본 저장소의 역할을 분리함.
- SourceReference v1과 public projection을 구현함.
- 공개등급 화면, 저장·권한 화면, 발행 대기 화면이 같은 정책 모듈을 사용함.
- resident/private는 화면과 `store.publish()` 양쪽에서 공개 발행을 차단함.
- 정책 모듈이 없을 때도 발행을 막는 fail-closed 방식임.
- 캐시 버전: `20260901-152900`
- 검증 문서: `docs/archive-v1/STAGE4_VALIDATION.md`

## 다음 AI가 바로 할 일

1. 최신 main에서 `AGENTS.md`, `docs/AI_WORKFLOW.md`, 이 문서, Roadmap과 Stage 4 검증 문서를 읽는다.
2. 검증을 다시 실행한다. **환경에 따라 경로가 다르다.**
   - node 있음: 기존 `node archive-v1/tests/*.test.js`
   - node 없음: 브라우저로 `/archive-v1/tests/browser/` 접속 → `전체 검증 실행` (**spec 7종 전부**, 실제 데이터 포함)
3. `4.3b` 인증 방식은 **결정·구현 완료**(비밀번호 재사용). 남은 인증 과제는 `4.3c`(시도 제한·감사 로그)와 resident/private 원본 전달 서버(저장소 결정 필요 — 사용자 확인 항목).
4. 안전한 범위의 다음 후보: `4.4` 로그인 UI·등급별 화면 연결, `4.6a` 데이터 신선도 표시, `4.3f` node 테스트 spec 통합.
5. `MINUTES-20260901-01`은 `done`으로 해제됨 — 입대의 데이터를 참조·분류해도 된다.

```bash
# node가 있는 환경
node archive-v1/tests/stage3-source.test.js
node archive-v1/tests/stage3-adapter.test.js
SANDLE_MINUTES_ROOT=/path/to/minutes node archive-v1/tests/stage3-live-data.test.js
for test in archive-v1/tests/stage4-*.test.js; do node "$test" || exit 1; done
```

```text
# node가 없는 환경 (Stage 4)
https://sandleapt.github.io/archive-v1/tests/browser/  →  [전체 검증 실행]
결과: window.__sandleTestResult = {at, rows, failed}
```

### 주의 — Archive가 보는 데이터는 클라우드보다 뒤처진다 (2026-09-01 실측)

Archive Stage 3은 `/minutes/data-YYYY.json` **정적 샤드**를 읽는다. 이 파일은 minutes 봇이 주기적으로 클라우드에서 다시 만들기 때문에 항상 한 주기 뒤처질 수 있다.

- 2026-09-01 19:20 KST 실측: 클라우드 회의록 **224건** / 정적 샤드 **213건**
- 샤드 생성 시각 `2026-09-01 07:18 KST`, 차이 11건은 그 이후 적재된 입대의 1기(`m_2016_*`·`m_2017_02·04·05·05s`·`m_2018_04`)
- **데이터 손실이 아니라 재발행 지연이다.** 다음 재발행 후 `stage3-live-data`가 224건으로 늘어난 채 통과하는 것이 정상이며, 건수 변화를 회귀로 오판하지 말 것.
- 후속 검토는 `4.6 Archive 데이터 신선도`로 등록됨.

## 이전 체크포인트 참고 — 3.7 검증 보완·인계

사용자 목표는 **현재 만들어진 회의록을 다시 작성하는 것이 아니라 더 보기 편하게 정리하는 것**으로 잡았다.

사용자는 단계마다 직접 확인하는 방식 대신 담당 AI가 스스로 검증·보완하며 진행하고, 나중에 결과를 본 뒤 수정 요청을 하면 관련 단계를 찾아 반영하는 방식으로 변경했다. 긴 작업이 중간에 끊겨도 다른 AI가 이어갈 수 있도록 기능 묶음마다 체크포인트를 먼저 남긴다.

### 이번 체크포인트에서 검증된 것

- fixture source 로드와 연도 캐시
- 회의 → Document / 안건 → Fragment 변환
- 표결, 의결, 후속조치, 분류 검토 Draft 생성
- 실제 공개 회의 213건 / 안건 1,125건 전체 변환
- JSON 파싱 오류 0건
- Fragment ID 중복 0건
- 기존 minutes 원본 변경 없음

### 검증 중 발견해 보완한 것

- 과거 분류명 `미화` → `청소·미화`
- 과거 분류명 `소송` → `하자·소송`
- `저수조·청소`, `기타`는 최신 taxonomy 키워드로 다시 후보 생성
- 자동 보완된 주제는 확정 저장 태그가 아닌 `inferred`로 표시

### 3단계에서 직접 테스트 가능한 것

`관리 도구 → 3. 회의록 → Archive`

- 실제 `/minutes/data-index.json` 및 `/minutes/data-YYYY.json` 읽기
- 연도 선택
- 입주자대표회의 / 임차인대표회의 필터
- 회의명 검색
- 실제 저장된 회의 선택
- 기존 회의 안건과 Archive 변환 결과 비교
- 회의 1건 → `Document`
- 안건별 → `Fragment`
- 논의 내용 / 의결사항 / 후속조치 분리
- 표결 찬성/반대/기권 요약
- 기존 저장 태그 우선 사용
- 태그가 없거나 `기타`인 경우 현재 minutes taxonomy로 주제 후보 표시
- 자동 주제는 확정 사실이 아니라 후보로 표시
- 안건 Fragment를 2.4 분류 검토함으로 전송
- 같은 안건 반복 전송 시 중복 방지

### 원본 보존 원칙

- 기존 minutes 회의 작성 UI 변경 없음
- 기존 cloud 저장 구조 변경 없음
- 기존 회의록 미리보기 / PDF / 1페이지 출력 변경 없음
- Archive는 기존 회의록을 읽기만 하고 검색·주제·타임라인에 맞게 재배치하는 역할
- 회의 작성 화면에 Archive용 필드를 추가해 이중 입력시키지 않음

### 2단계와 연결

- 일반 자료와 회의 안건이 같은 분류 검토함을 사용
- 회의록에서 가져온 항목은 `회의록 변환`으로 표시
- minutes의 현재 Topic taxonomy를 분류 선택지에 함께 사용
- 현재 검토/발행 상태는 브라우저 메모리 프로토타입이며 실제 공개/저장은 하지 않음

### 의도적으로 아직 하지 않은 것

- 실제 Archive 저장소 쓰기
- 회의 저장 직후 서버 측 자동 변환/발행
- 실제 관리자 인증
- resident 인증
- private 자료 전달
- 실제 검색 인덱스에 변환 결과 반영

이 항목들은 4단계 저장소·권한 구조와 연결해서 결정한다.

## 변경 파일

새 파일:
- `archive-v1/admin/stage3/meeting-source.js`
- `archive-v1/admin/stage3/meeting-adapter.js`
- `archive-v1/admin/views/meeting-import.js`
- `archive-v1/assets/admin-stage3.css`
- `archive-v1/progress-3-6.js`
- `docs/archive-v1/MEETING_ADAPTER_V1.md`
- `archive-v1/tests/fixtures/stage3-meetings.json`
- `archive-v1/tests/stage3-source.test.js`
- `archive-v1/tests/stage3-adapter.test.js`
- `archive-v1/tests/stage3-live-data.test.js`
- `archive-v1/progress-3-7.js`
- `docs/archive-v1/VALIDATION_POLICY.md`
- `docs/archive-v1/STAGE3_VALIDATION.md`
- `docs/CONTINUE_ARCHIVE_PROMPT.md`

수정:
- `archive-v1/admin/index.html`
- `archive-v1/admin/app.js`
- `archive-v1/admin/store.js`
- `archive-v1/admin/views/dashboard.js`
- `archive-v1/admin/views/classification.js`
- `archive-v1/admin/views/meeting.js`
- `archive-v1/index.html`
- `docs/archive-v1/ROADMAP_V1.md`
- `AGENTS.md`
- `docs/AI_WORKFLOW.md`

## 3단계 당시 다음 작업 기록 — 완료됨

1. 최신 main에서 이 문서와 `docs/CONTINUE_ARCHIVE_PROMPT.md`를 읽는다.
2. 아래 검증을 다시 실행해 3단계 체크포인트가 유지되는지 확인한다.
3. 3.7 상태가 `done`인지 확인하고, 완료돼 있으면 4.1 저장소 역할 분리 설계부터 시작한다.
4. `MINUTES-20260901-01` 예약 9건은 담당 해제 전까지 수정하지 않는다.

```bash
node archive-v1/tests/stage3-source.test.js
node archive-v1/tests/stage3-adapter.test.js
SANDLE_MINUTES_ROOT=/path/to/minutes node archive-v1/tests/stage3-live-data.test.js
```

## 최근 인계

### 2026-09-01 20:48:15 KST — Claude — 4.3b 인증·접근 판정 체크포인트

- 사용자가 인증 방식을 결정함(회의록 비밀번호 재사용). 결정 내용은 「사용자 결정 기록」 표와 `docs/archive-v1/AUTH_V1.md`에 남김.
- 세션 모듈(`shared/auth-session.js`)과 판정 모듈(`shared/access-control.js`)을 분리해 구현. 판정 규칙은 한 곳에만 둠.
- 검증 spec 2종 추가, 배포본에서 **9/9 통과**(Stage 3 3종 + Stage 4 6종, 실제 데이터 213회의/1,125안건).
- **검증이 결함을 잡음**: `currentRole()`이 캐시된 role을 무기한 믿어, 비밀번호를 회수해도 그 브라우저가 24시간 통과하는 상태였음. 재확인 주기 5분을 도입해 회수 반영을 최대 5분으로 줄임.
- `stage4-auth-session`은 인증 키를 조작하므로(같은 origin이라 회의록 로그인까지 영향) 원래 값을 백업·복구하도록 만들고, 실행 후 상태가 보존되는 것을 확인함.
- 새 파일: `archive-v1/shared/auth-session.js`, `access-control.js`, `tests/specs/stage4-access-control.spec.js`, `stage4-auth-session.spec.js`, `docs/archive-v1/AUTH_V1.md`
- 수정: `archive-v1/tests/browser/index.html`, `docs/AI_WORKFLOW.md`(13절 결정 기록 규칙), `ROADMAP_V1.md`, `STAGE4_VALIDATION.md`, 이 문서
- 운영 루트·minutes 원본·공개 범위 변경 없음. 정적 번들에는 여전히 `public`만 들어간다.
- 커밋: `70a1deb`(설계·결정 기록), `cf78d5d`(구현·spec), `b9ddf42`(캐시 결함 수정)

### 2026-09-01 19:20:05 KST — Claude — 4.3g 실제 데이터 전량 검증 체크포인트

- `stage3-live-data` spec을 브라우저로 이식해 **7/7 통과**(회의 213건 · Fragment 1,125건 · 안건수 불일치 0 · ID 중복 0).
- 건수를 고정하지 않고 구조 불변조건만 검사하도록 바꿈. 회의록이 계속 늘어나기 때문.
- **발견: Archive가 읽는 정적 샤드가 클라우드보다 뒤처진다.** 클라우드 224건 / 정적 샤드 213건이며 차이 11건은 전부 07:18 KST 이후 적재된 입대의 1기 회의록이다. 손실이 아니라 봇 재발행 지연 — 다음 재발행 후 224건으로 늘어난 채 통과하는 것이 정상이다. 후속 검토를 `4.6`으로 등록함.
- 러너 보완 2건: 격리 iframe의 경로 해석(`ctx.origin` 제공), 격리 로드 캐시 무효화(옛 spec 재사용으로 수정이 반영되지 않던 문제).
- 새 파일: `archive-v1/tests/specs/stage3-live-data.spec.js`
- 수정: `archive-v1/tests/browser/runner.js`, `index.html`, `docs/archive-v1/ROADMAP_V1.md`, `STAGE4_VALIDATION.md`, `docs/WORK_STATUS.md`
- 운영 루트·minutes 원본·기존 node 테스트 변경 없음. 공개 범위 변경 없음.
- 커밋: `94b26d4`(spec), `096c18a`(경로 해석), `9a06ea2`(캐시 무효화), 문서는 이 인계와 함께 반영.

### 2026-09-01 18:22:40 KST — Claude — 4.3e Stage 3 spec 이식 체크포인트

- `stage3-source`, `stage3-adapter` spec을 추가해 브라우저 러너에서 **6/6 통과**(실패 0).
- 러너에 **iframe 격리 실행**과 **setup 단계**를 추가함. spec이 fetch 스텁·모듈 내부 캐시·전역 스텁을 건드려도 서로 오염되지 않는다.
- 격리 필요성을 실증함: 격리를 끄고 같은 spec을 두 번 돌리면 2회차가 `r.text is not a function`으로 실패한다.
- **사고 있었음** — 러너 페이지 캐시 버전을 PowerShell로 바꾸다 한글이 전부 깨진 채 커밋·푸시됨(`4badffe`). `git checkout`으로 복구 후 편집 도구로 다시 수정해 `459240f`로 정상화함. 재발 방지 규칙을 `docs/AI_WORKFLOW.md` 12절에 추가함.
- 새 파일: `archive-v1/tests/specs/stage3-source.spec.js`, `stage3-adapter.spec.js`
- 수정: `archive-v1/tests/browser/runner.js`, `archive-v1/tests/browser/index.html`, `docs/AI_WORKFLOW.md`, `docs/archive-v1/ROADMAP_V1.md`, `docs/archive-v1/STAGE4_VALIDATION.md`
- 운영 루트·minutes 원본·기존 node 테스트 변경 없음. 공개 범위 변경 없음.
- 남은 위험: `stage3-live-data` 미이식(4.3g), 케이스 이중 관리(4.3f).
- 커밋: `4badffe`(spec 추가, 인코딩 손상), `459240f`(복구·등록), 문서는 이 인계와 함께 반영.

### 2026-09-01 17:34:20 KST — Claude — 4.3d 브라우저 검증 러너 체크포인트

- 사용자 지시로 ARCHIVE-20260901-01 담당이 GPT → Claude로 넘어옴. `MINUTES-20260901-01` 예약 9건은 완료 처리하고 잠금 해제함.
- **인계된 검증 명령이 이 환경에서 실행 불가**임을 확인함: 사용자 PC에 Node.js 없음. 이 상태로는 자동 검증 없이 `done` 판정을 할 수 없어 먼저 검증 경로를 만듦.
- 케이스를 UMD spec 모듈로 분리하고 브라우저 러너를 추가함. 기능·스타일·테스트·문서를 각각 다른 파일로 나눔.
- **기존 node 테스트 파일은 수정하지 않음.** node로 회귀 확인이 불가능한 환경에서 건드리면 위험하다고 판단함.
- 검증: 실제 배포본 `/archive-v1/tests/browser/`에서 Stage 4 spec 4종 전부 통과(4/4, 실패 0).
- 러너 신뢰성도 별도 확인함 — 정책을 일부러 되돌려 회귀를 만들었을 때 실패로 잡히고, 원복 후 다시 통과함.
- 새 파일: `archive-v1/tests/specs/assert.js`, `stage4-source-reference.spec.js`, `stage4-visibility.spec.js`, `stage4-publish-guard.spec.js`, `stage4-admin-integration.spec.js`, `archive-v1/tests/browser/runner.js`, `archive-v1/tests/browser/index.html`, `archive-v1/assets/test-runner.css`
- 수정: `docs/archive-v1/ROADMAP_V1.md`, `docs/archive-v1/STAGE4_VALIDATION.md`, `docs/WORK_STATUS.md`
- 운영 루트·minutes 원본·기존 node 테스트 변경 없음. 공개 범위 변경 없음.
- 남은 위험: Stage 3 spec 미이식(4.3e), 케이스가 spec과 node 테스트 두 곳에 존재(4.3f).
- 체크포인트 커밋: `6374951`(러너), 문서 커밋은 이 인계와 함께 반영.

### 2026-09-01 15:32:08 KST — GPT — 4.3a 공개 projection·발행 차단 체크포인트

- 별도 `stage4/` 정책 모듈과 별도 Stage 4 화면·스타일·테스트 파일로 나눠 구현함.
- 공개 포털·minutes·외부 원본 저장소의 역할을 관리 화면에서 확인할 수 있게 함.
- public 자료는 허용 필드 projection을 만들고 resident/private는 공개 발행을 차단함.
- 발행 화면뿐 아니라 store에서도 같은 정책을 강제하고 모듈 누락 시 fail-closed 처리함.
- 공개 Archive 진행판을 4.3으로 갱신하고 캐시 버전을 `20260901-152900`으로 올림.
- 자동 검증: Stage 3 회귀 213회의/1,125안건, Stage 4 테스트 4개, 전체 JS 문법, diff 검사 통과.
- 헤드리스 Chromium 부재로 브라우저 클릭 자동화는 실행하지 못했으며 이 제한을 `STAGE4_VALIDATION.md`에 기록함.
- 기존 운영 루트, minutes 원본, Claude 예약 9건 변경 없음.
- 실제 resident/admin 인증은 사용자 결정이 필요하므로 4.3b로 남김.
- 구현·원격 반영 커밋: `6bb6e633900e8d6217fcc4a20bd0b8a86b7aa223`
- 원격 반영 완료: `2026-09-01 15:32:08 KST`

### 2026-09-01 15:20:28 KST — GPT — 4.1~4.2 저장소·원본 참조 체크포인트

- 운영 루트 변경 없이 Archive 전용 저장·권한 구조 작업을 시작함.
- GitHub 포털, minutes 원본, 외부 원본 저장소의 역할을 분리해 문서화함.
- provider에 종속되지 않는 `SourceReference v1`을 구현함.
- 공개 번들은 허용 필드만 새로 만드는 projection 방식으로 구현함.
- resident/private 자료와 외부 `file_id`가 공개 번들에 들어가지 않도록 기본 정책을 구현함.
- visibility 누락·오류는 public이 아닌 `private`로 처리함.
- 자동검증: `stage4-source-reference`, `stage4-visibility` 통과.
- 새 파일: `archive-v1/admin/stage4/source-reference.js`, `visibility-policy.js`, Stage 4 테스트 2개, `STORAGE_AND_ACCESS_V1.md`.
- 기존 운영 루트, minutes 원본, Claude 예약 9건 변경 없음.
- 다음: 4.3 정책을 관리자 공개등급·발행 흐름에 연결.

### 2026-09-01 14:37:11 KST — GPT — 3단계 자율 검증 체크포인트

- 단계별 사용자 승인 대기 대신 담당 AI 자율 검증·보완 후 진행하는 규칙으로 전환함.
- 긴 작업 중단에 대비해 기능 묶음마다 중간 체크포인트를 남기는 규칙을 추가함.
- 다른 AI용 이어하기 프롬프트를 `docs/CONTINUE_ARCHIVE_PROMPT.md`에 추가함.
- 실제 회의 213건, 안건 1,125건 전체 변환을 검증함.
- 과거 분류명과 `기타` 정규화 문제를 보완함.
- 자동 검증 fixture와 3개 검증 스크립트를 별도 파일로 추가함.
- 기존 minutes 원본, 운영 루트, Claude 예약 9건은 수정하지 않음.
- 코드·규칙 체크포인트 커밋: `bba7a5d40f53eab88833184cbf0b9d0f6e2f66d6`
- UI·진행상태 체크포인트는 이 인계 직후 main에 반영함.
- 3단계 완료 시각: `2026-09-01 15:15:51 KST`
- 다음: 4.1 저장소 역할 분리 설계.

### 2026-09-01 14:22:30 KST — GPT — 3.1~3.5 프로토타입 구현 / 3.6 사용자 검토 대기

- 사용자가 3단계 전체 진행을 승인함.
- 기존 minutes를 수정하지 않고 read-only adapter 방식으로 연결함.
- 실제 연도별 회의 데이터를 선택해서 Document/Fragment 변환 결과를 볼 수 있게 함.
- 기존 태그와 자동 주제 후보를 구분하고, 의결·후속조치·표결을 구조화함.
- 변환된 안건을 기존 관리자 분류 검토 흐름으로 보낼 수 있게 연결함.
- 기존 1페이지 회의록 출력은 minutes에 그대로 남김.
- 공개 Archive의 진행상황도 3.6 검토로 변경함.
- Claude 예약 9건과 운영 루트는 수정하지 않음.
- 관련 커밋: `0ef9e97ef93393a37183b2a67b16a283e2c63fc5`, `0becb5e588f44acc359df93a3e4a289b644b442f`, `b2497833d1862840f3de670e4d9324b25b9af1bf`, `cb5e7df13c9079fe874006738bb0c10ab058fec4`, `f09752dd729a3e336def4555f38e30e731b043f4`, `909eaea85b947d2544d5825a4f17943e88ebad53`, `552de47e850c75fa52ec410b8a03207c020a4fda`, `ec509bbac713d3af56b3a7506cb855d9f2cde628`, `cffb298ef32d83da9f0bb6b2399f926ee1385a90`, `96d1f387ae38a0f0ed9da068b9fdc6b45606472f`, `863c6f240401844404df0164cfc0495817e4bdc0`, `e34b096fdd90816d9d3526033406e4c7666ac9ef`, `d7b34327b99474f6f4cd6b80ca0a16c633fcfa40`, `e8e574590c11837aafc3ef82a460db25d80552e5`, `ab59c804c4ab2591748465217f8b60ef10cbe8c6`.

### 2026-09-01 14:02:45 KST — GPT — 2단계 테스트 가능 상태 보강

- 2.2 / 2.3 / 2.4를 번호별로 직접 테스트할 수 있게 보강함.
- 2단계는 실제 사용 중 추가 수정할 수 있도록 `review` 상태로 유지함.

## 기록 규칙

작업 종료 시 현재 번호, 완료 번호, 다음 번호, 변경 파일, 주의사항, 완료 시각 `YYYY-MM-DD HH:mm:ss KST`, 관련 커밋을 남긴다.
