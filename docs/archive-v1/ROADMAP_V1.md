# Sandle Archive v1 — 단계별 작업 계획서

상태: 운영 기준 v1
작성: 2026-09-01

## 0. 운영 규칙

이 문서는 Archive v1 작업의 마스터 순서표다. GPT와 Claude는 작업 시작 시 `AGENTS.md` → `docs/AI_WORKFLOW.md` → `docs/WORK_STATUS.md` → 이 문서 순으로 확인한다.

- 큰 단계는 `1`, `2`, `3`처럼 고정한다.
- 실제 작업은 `1.1`, `1.2`, `1.3`처럼 작은 단위로 기록한다.
- 사용자 피드백 수정도 기존 번호를 덮어쓰지 않고 다음 소번호로 기록한다.
- 큰 단계가 끝나고 다음 단계로 넘어가기 전에는 완료한 것 / 남은 것 / 보류한 결정 / 다음 단계 세부작업을 저장소 체크포인트에 먼저 남긴다.
- 담당 AI가 기능·데이터·호환성 검증과 보완까지 마치면 사용자 중간 컨펌 없이 다음 단계로 진행한다.
- 다만 보안·권한·데이터 모델 변경, 원본 훼손 가능성, 큰 구조변경처럼 되돌리기 어려운 결정은 중간 확인할 수 있다.
- `done`은 코드가 존재하는 시점이 아니라 자동 검증·실제 데이터 검증·인계 기록까지 끝난 상태에 사용한다.
- 사용자가 나중에 피드백을 주면 관련 완료 단계를 새 소번호로 다시 열어 보완하고, 이후 단계의 영향 범위도 재검증한다.
- 소단계 또는 검증 가능한 기능 묶음마다 중간 체크포인트를 커밋한다.
- Archive와 충돌하지 않는 별도 예약 업무는 병행할 수 있다.
- 상태는 `planned / in_progress / review / blocked / done`을 사용한다.
- UI 표시 순서와 데이터 구조는 분리한다. 화면 구성 변경이 데이터 재이관으로 이어지지 않게 한다.

---

# 1. Archive 탐색·검색 화면 방향 확정

현재 상태: `done` — 임시 확정

### 1.1 Golden Sample 주제 화면 — `done`
- `/archive-v1/` 시험판
- 헬스장·GX, 작은도서관 샘플
- 현재 기준 → 흐름 → 관련 기록

### 1.2 Archive 첫 화면 — `done`
- 통합검색 / 최근 기록 / 주제 탐색

### 1.3 긴 데이터·상세 탐색 보완 — `done`
- 기본 미리보기 상한 / 전체보기 / 개별 상세

### 1.4 전체 주제 가나다순 — `done`
### 1.5 전체 주제 텍스트형 버튼 — `done`

### 1.6 검색 결과안 A — `done`
- `현재 기준 → 주요 흐름 → 관련 기록`

### 1.7 검색 결과안 B — `done`
- `현재 기준 → 핵심 요약 → 타임라인 → 자료 전체`
- A/B 전환
- 검색 section 순서·표시량 config 분리

### 1.8 전체 동작 흐름 검토 — `done`
### 1.9 1단계 임시 확정 — `done`

보류 가능:
- A/B 최종 선택
- GA4 관심도 반영
- 대규모 데이터의 기본 표시량

---

# 2. 관리자 입력·검토 흐름 확정

현재 상태: `review` — 실제 사용과 함께 보완

사용자 요청: 2단계는 소단계마다 확인받지 않고 전체를 먼저 연결한 뒤 한 번에 수정한다.

### 2.1 관리자 영역 화면 — `review`
- 공개 Archive와 분리된 `/archive-v1/admin/`
- 좌측 관리 메뉴

### 2.2 AI 새 자료 등록 흐름 — `review` (테스트 가능)
- 제목 / 자료종류 / 날짜 / 적용범위 / 공개등급 / 원본위치 / 메모
- 예시 채우기 → AI 초안 시뮬레이션 → 검토함 이동
- 실제 AI 호출은 아직 없음

### 2.3 공개 등급 — `review` (테스트 가능)
- `public / resident / private`
- resident/private는 UI 숨김으로 보호하지 않음
- 실제 인증 전 공개 GitHub Pages 빌드에 원본·검색본문을 넣지 않음

### 2.4 분류·관계 검토함 + 발행 대기 — `review` (테스트 가능)
- 분류: 주제 / 조직 / 현행상태 / 신뢰도 / 승인·수정·보류
- 관계: 대상 / 관계종류 / `explicit / verified / inferred` / 승인·생략
- 발행 대기: 공개등급 / 미리보기 / 메모리 프로토타입 발행

### 2.5 사용자 전체 검토 — `review`
- 실제로 써보면서 불편한 부분을 모아 수정하기로 함
- 3단계 진행을 막지 않음

### 2.6 피드백 일괄 반영 및 2단계 확정 — `planned`
- 3단계 이후에도 실제 사용 중 발견되는 문제를 모아 반영 가능

관련 설계: `docs/archive-v1/ADMIN_WORKFLOW_V1.md`

---

# 3. 기존 회의록 데이터와 Archive 연결

현재 상태: `done` — 3.7 검증·인계 체크포인트 배포 완료

사용자 목표 재확인:

> 새 회의 작성 도구를 만드는 것이 아니라 **지금 만들어진 회의록과 기록을 좀 더 보기 편하게 정리하는 것**이 핵심.

따라서 기존 계획의 `3.3 수기 회의 작성 화면 프로토타입`은 만들지 않는다. 현재 `minutes` 작성 화면을 그대로 원본 시스템으로 유지하고, 저장된 회의록을 읽는 adapter 방식으로 조정한다.

### 3.1 현행 회의 구조 확인 — `done`

실제 `SandleAPT/minutes` 구조 확인:
- `/minutes/data-index.json`
- `/minutes/data-YYYY.json`
- 회의 레코드: `id / name / date / updatedAt / json`
- 내부 state: `meeting / rosters / agendas / cloudId`
- 안건: `title / summary / decision / followup / votes / remarks / tags(category)`
- 기존 회의 작성·저장·미리보기·PDF는 수정하지 않음

### 3.2 기존 회의 데이터 → Archive 필드 매핑 — `done`

- 회의 1건 → `Document`
- 안건 1건 → `Fragment`
- 의결사항 → `Action: decision`
- 후속조치 → `Action: follow_up`
- Fragment → 회의 Document: `part_of / explicit`
- 표결 → 찬성/반대/기권 요약
- 기존 저장 태그가 있으면 우선 사용
- 저장 태그가 없거나 `기타`면 현재 minutes taxonomy 기반 주제 **후보** 생성
- 자동 후보는 사실처럼 확정하지 않고 검토 대상으로 구분

관련 설계: `docs/archive-v1/MEETING_ADAPTER_V1.md`

### 3.3 실제 회의록 선택·변환 화면 — `done`

관리 작업대의 `3. 회의록 → Archive`에서 직접 테스트 가능:
- 실제 `/minutes/` 연도별 정적 데이터 읽기
- 연도 선택
- 입대의 / 임차 필터
- 회의명 검색
- 실제 회의 선택
- 기존 안건 목록과 Archive 변환 결과를 좌우 비교
- 안건별 논의 / 의결 / 후속조치 펼쳐보기

구현 파일:
- `archive-v1/admin/stage3/meeting-source.js`
- `archive-v1/admin/stage3/meeting-adapter.js`
- `archive-v1/admin/views/meeting-import.js`
- `archive-v1/assets/admin-stage3.css`

### 3.4 Archive 검토 흐름 연결 — `done`

- 선택한 회의의 안건 Fragment를 `2.4 분류 검토`로 보낼 수 있음
- 일반 자료와 회의 안건이 같은 검토함을 사용
- 회의록 변환 항목임을 별도 표시
- 기존 minutes 주제 taxonomy 전체를 분류 선택지에 포함
- 같은 회의 안건을 반복 전송할 때 stable id로 중복 추가 방지

현재 전송·승인 상태는 브라우저 메모리 프로토타입이며 원본 minutes 데이터에는 쓰지 않는다.

### 3.5 기존 1페이지 회의록 유지 확인 — `done`

- 회의 작성: 기존 minutes
- 회의 저장: 기존 minutes
- 미리보기 / PDF / 1페이지 출력: 기존 minutes
- Archive: 검색·주제·타임라인용 재배치만 담당

따라서 Archive 화면 구성이 나중에 바뀌어도 원본 회의록과 출력물을 다시 수정할 필요가 없도록 분리한다.

### 3.6 담당 AI 전체 검증 — `done`

직접 볼 경로:

`/archive-v1/admin/#meetingImport`

검증한 것:
- 실제 회의록이 바로 보이는가
- 기존 자료 → Document/Fragment 구조가 직관적인가
- 긴 안건을 접어서 보는 방식이 편한가
- 논의 / 의결 / 후속조치 구분이 읽기 쉬운가
- 저장 태그와 자동 주제 후보의 차이가 이해되는가
- 검토함으로 보내는 과정이 과하지 않은가
- ‘기존 회의록을 그대로 두고 Archive만 정리’한다는 구조가 목표에 맞는가

자동·실제 데이터 검증 결과는 `docs/archive-v1/STAGE3_VALIDATION.md`에 기록한다.

### 3.7 검증 보완·인계 및 3단계 확정 — `done`

- 과거 분류명과 `기타`를 최신 taxonomy 규칙으로 정규화
- 자동 검증 파일 분리
- 실제 회의 213건 / 안건 1,125건 전체 변환 확인
- 자율 검증·중간 체크포인트·다른 AI 인계 규칙 반영
- 체크포인트 배포 완료: 2026-09-01 15:15:51 KST

---

# 4. 저장소·원본·권한 구조 확정

상태: `in_progress` — 4.1~4.3a 완료, 실제 인증 결정 대기

### 4.1 GitHub / Google Drive 역할 분리 — `done`
- GitHub: HTML/CSS/JS, 메타데이터, 검색 텍스트, taxonomy, relation, 검색 인덱스
- 외부 저장소: PDF, HWP/DOCX/XLSX, 사진, 영상·음성, 대용량 스캔

### 4.2 외부 원본 참조 형식 — `done`

- provider에 종속되지 않는 `SourceReference v1`
- public 원본만 공개 참조로 투영
- resident/private 외부 `file_id`는 공개 번들에서 제거
- 설계: `docs/archive-v1/STORAGE_AND_ACCESS_V1.md`

### 4.3 public / resident / private 실제 권한 처리 — `in_progress`

- 4.3a `done` — 공개 projection과 resident/private 발행 차단을 관리자 화면·저장 함수에 연결
- 4.3b `decision_needed` — 실제 입주민·관리자 인증 주체와 방식
- 4.3c `planned` — 인증 만료·회수·감사 로그
- 검증: `docs/archive-v1/STAGE4_VALIDATION.md`
### 4.4 사용자 검토
### 4.5 피드백 반영 및 4단계 확정

---

# 5. 다른 성격의 주제로 구조 재검증

상태: `planned`

### 5.1 검증 주제 2개 선택
후보: 선거·선관위 / 주차 / 잡수입·운영경비 / 하자판결금 / 도서관

### 5.2 첫 번째 주제 샘플
### 5.3 두 번째 주제 샘플
### 5.4 taxonomy / Relation 보정
### 5.5 사용자 검토
### 5.6 데이터 모델 v1 동결

---

# 6. 실제 데이터 소규모 이관

상태: `planned`

기본 상한은 `MIGRATION_V1.md`를 따른다.

### 6.1 첫 Pilot 배치
- 최대 12 작업 포인트
- 원본 최대 8건
- Fragment 최대 30건
- 복잡 문서 최대 2건

### 6.2 Pilot 사용자 검토
### 6.3 Pilot 규칙 보정
### 6.4~ 실제 배치

배치마다 번호를 늘리고 구조변경 또는 일정 배치 누적 시 중간검수 번호를 추가한다.

---

# 7. 기존 포털 기능 통합 및 최종 전환

상태: `planned`

### 7.1 기존 기능 연결
회의록 / 관리비 추적 / 하자판결금 / 업무현황 / 커뮤니티 안내 / 기타 유지 기능

### 7.2 현행 포털에서 Archive 시험판 연결
### 7.3 PC·모바일·검색·관리자·권한·원본 열람 검수
### 7.4 기존 포털 Legacy 보존
### 7.5 최종 사용자 승인
### 7.6 `sandleapt.github.io` 루트 전환

---

# 현재 위치

2026-09-01 기준:

- 1단계: `done` — 임시 확정
- 2단계: `review` — 직접 테스트 가능, 실사용과 함께 보완
- 3단계: `done` — 검증·인계 체크포인트 배포 완료
- 완료: `4.1 저장소 역할 분리`, `4.2 SourceReference v1`, `4.3a 공개 발행 경계`
- 현재: `4.3b 실제 입주민·관리자 인증 결정 대기`
- 다음: 사용자 결정 전까지 resident/private 공개 제외 유지, 4.4에서 현재 정책 화면 검토
- 검색 A/B 최종 선택은 보류
- Claude 예약 업무는 별도 작업으로 유지하며 수정하지 않음

작업 종료 시 `WORK_STATUS.md`에 현재 번호, 완료 번호, 다음 번호, 변경 파일, 완료 시각과 관련 커밋을 남긴다.
