# 공동 작업 현황

마지막 갱신: 2026-09-01 14:22:30 KST

> GPT와 Claude가 번갈아 작업할 때 가장 먼저 확인하는 파일이다. 과거 상세 로그는 Git 커밋 이력에서 확인할 수 있다.

## 활성 작업

### MINUTES-20260901-01 — 입대의 데이터 대기 9건

- 담당: Claude
- 상태: `blocked` + `reserved`
- 재개 예상: 2026-09-01 14시경
- 범위: 현재 입대의 데이터 9건 후속 작업
- 잠금: 해당 9건과 직접 관련된 데이터/분류 작업
- GPT 원칙: Claude가 완료 또는 담당 해제를 기록하기 전에는 이 9건을 수정하지 않는다.

### ARCHIVE-20260901-01 — Sandle Archive v1

- 담당: GPT
- 상태: `review`
- 마스터 계획: `docs/archive-v1/ROADMAP_V1.md`
- 1단계: `done` — 임시 확정
- 2단계: `review` — 직접 테스트 가능, 실사용 중 보완
- 현재: `3.6 사용자 전체 검토`
- 다음: `3.7 피드백 반영 및 3단계 확정`
- 공개 미리보기: `https://sandleapt.github.io/archive-v1/`
- 3단계 직접 보기: `https://sandleapt.github.io/archive-v1/admin/#meetingImport`
- 운영 루트 `index.html` 변경: 없음
- `SandleAPT/minutes` 원본 코드/데이터 변경: 없음
- 검색 A/B 최종 선택: 보류

## 작업 원칙

- 사용자가 큰 단계 전체 진행을 승인하면 소단계마다 컨펌을 요구하지 않고 다음 사용자 검토 지점까지 이어서 구현한다.
- `done`은 코드가 생긴 시점이 아니라 사용자가 확인한 뒤 사용한다.
- 사용자가 실제로 눌러볼 수 없는 상태를 `구현 완료`라고 과장하지 않는다.
- 앞 단계가 review여도 사용자가 실제 사용하며 보완하기로 하고 다음 단계 진행을 승인하면 다음 단계로 갈 수 있다.
- 보안·권한·데이터 모델 변경, 원본 훼손 가능성처럼 되돌리기 어려운 결정만 중간 확인한다.
- 전체 10년치 일괄 변환 금지, 본 이관은 작은 배치로 진행한다.
- 입력은 한 번, 노출은 여러 곳.
- UI 구성과 데이터 구조를 분리한다.

## 현재 체크포인트 — 3.6 전체 검토

사용자 목표는 **현재 만들어진 회의록을 다시 작성하는 것이 아니라 더 보기 편하게 정리하는 것**으로 잡았다.

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

수정:
- `archive-v1/admin/index.html`
- `archive-v1/admin/app.js`
- `archive-v1/admin/store.js`
- `archive-v1/admin/views/dashboard.js`
- `archive-v1/admin/views/classification.js`
- `archive-v1/admin/views/meeting.js`
- `archive-v1/index.html`
- `docs/archive-v1/ROADMAP_V1.md`

## 최근 인계

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
