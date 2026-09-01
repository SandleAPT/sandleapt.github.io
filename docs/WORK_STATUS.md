# 공동 작업 현황

마지막 갱신: 2026-09-01 11:15:10 KST

> GPT와 Claude가 번갈아 작업할 때 가장 먼저 확인하는 파일이다.

## 활성 작업

### MINUTES-20260901-01 — 입대의 데이터 대기 9건

- 담당: Claude
- 상태: `blocked` + `reserved`
- 사유: 사용량 제한으로 일시 중단
- 재개 예상: 2026-09-01 14시경
- 범위: 사용자가 설명한 현재 입대의 데이터 9건 후속 작업
- 잠금: 해당 9건과 직접 관련된 데이터/분류 작업
- GPT 원칙: Claude가 완료 또는 담당 해제를 기록하기 전에는 이 9건을 수정하지 않는다.
- 다음 행동: Claude가 재개 시 실제 수정 경로를 확인해 이 항목에 추가하고, 9건 처리를 이어서 완료한다.

### ARCHIVE-20260901-01 — Sandle Archive v1 데이터 구조 설계

- 담당: GPT
- 상태: `review` / Golden Sample UI 및 작성 흐름 사용자 검토 대기
- 범위: 차세대 통합 아카이브의 데이터 모델·분류체계·관계·샘플링/이관·저장 방식·미리보기 UI·지속 업데이트 흐름 설계
- 수정 영역: `docs/archive-v1/`, `archive-v1/`
- 운영 루트 `index.html` 변경: 없음
- 미리보기: `https://sandleapt.github.io/archive-v1/`
- 작성 완료:
  - `docs/archive-v1/README.md`
  - `docs/archive-v1/DATA_MODEL_V1.md`
  - `docs/archive-v1/TAXONOMY_V1.md`
  - `docs/archive-v1/MIGRATION_V1.md`
  - `docs/archive-v1/BATCH_TEMPLATE.md`
  - `docs/archive-v1/STORAGE_V1.md`
  - `docs/archive-v1/AUTHORING_V1.md`
  - `archive-v1/index.html`
  - `archive-v1/assets/archive.css`
  - `archive-v1/data/sample.js`
  - `archive-v1/app.js`
- 핵심 이관 원칙:
  - 전체 10년치 일괄 변환 금지
  - 단일 주제 Golden Sample → 사용자 승인 → 다른 성격의 소수 주제 추가 검증 → 검색 프로토타입 승인 → 본 이관
  - 본 이관은 기본 12 작업 포인트 이하의 작은 배치로 이어달리기식 진행
  - 전체 본 이관은 Gate 3 승인 전 시작하지 않음
- 저장 원칙:
  - GitHub: 코드·메타데이터·검색 텍스트·관계 인덱스 중심
  - Google Drive 등 외부 저장소: 원본 PDF·사진·영상·대용량 파일 중심
  - GitHub Pages 용량 한계를 고려해 원본 바이너리 신규 누적은 기본 금지
- 작성/운영 원칙:
  - `입력은 한 번, 노출은 여러 곳`
  - 기존 `minutes`를 초기 회의 작성 원본으로 유지하고 Archive 변환 adapter를 둔다.
  - 회의 저장 후 Document/Fragment/분류/관계/검색 인덱스를 생성·갱신하는 구조를 목표로 한다.
  - 계약·운영규정·공고 등은 별도 `새 자료 등록` 흐름을 두고 자동 분류 후보를 관리자 검토 후 발행한다.
  - 브라우저 공개 코드에 GitHub PAT/Drive 쓰기 토큰 등 비밀값을 넣지 않는다.
- 다음 행동: 사용자가 `/archive-v1/` Golden Sample의 정보 배치와 `AUTHORING_V1.md`의 작성 흐름을 검토한다. 승인 전 실제 10년치 본 이관은 시작하지 않는다.

## 인계 로그

### 2026-09-01 11:15:10 KST — GPT

- Archive가 과거자료 전시용으로 끝나지 않고 앞으로 계속 회의록·계약·규정·공고를 갱신할 수 있어야 한다는 요구를 반영함.
- `docs/archive-v1/AUTHORING_V1.md`를 추가해 `🔒 관리 도구`, 회의 작성 연동, 새 자료 등록, 분류 검토, 관계 연결, 발행 상태를 설계함.
- 가장 중요한 원칙을 `입력은 한 번, 노출은 여러 곳`으로 정리함. 기존 회의록 작성 후 같은 내용을 Archive에 재입력하지 않고 adapter/importer로 변환하는 방향.
- 대용량 원본은 외부 저장소에 두고 Archive에는 메타데이터/검색정보를 연결하는 기존 저장 원칙과 작성 흐름을 연결함.
- 공개 브라우저 코드에 저장소 쓰기 비밀키를 넣지 않는 보안 원칙을 명시함.
- 운영 루트와 Claude 예약 9건은 수정하지 않음.
- 관련 커밋: `3faf6e145beee7a73731ea283f9a0524f6b054d4`, `fccad114cbf69149bb94a7013d879c0112378fc7`

### 2026-09-01 11:11:08 KST — GPT

- 사용자가 실제 화면으로 구조를 확인할 수 있도록 `archive-v1/` Golden Sample UI를 배포함.
- 헬스장·GX, 작은도서관 예시를 넣고 주차·선거는 다음 샘플 후보로 비워 둠.
- 현재 기준 → 과거 흐름 → 관련 기록 순서의 주제 페이지 구조를 시험할 수 있게 함.
- GitHub Pages 용량을 아끼기 위해 원본 PDF·사진·영상은 Google Drive 등 외부 저장소에 두고, GitHub에는 메타데이터·검색 텍스트·관계만 두는 `STORAGE_V1.md`를 작성함.
- 2026-09-01 확인 GitHub API repository size: `SandleAPT/sandleapt.github.io` 약 168KB, `SandleAPT/minutes` 약 6.5MB 수준.
- 운영 루트 `index.html`과 Claude 예약 9건은 수정하지 않음.
- 관련 커밋: `7c355bffaffc6e5d8f35a6166bd91e95cc9974c1`, `6739a218203539db5c029a2a1c4f27c5205c74d0`, `1dc98bee79658e090ad319784e5a00ea37544c41`, `728a28d2c5bb990db678c880d57f43f95540376a`, `53f4620c042d0e91a8c25c5e1b53fbc98f313f20`, `aeb792ccf61886457088fafd4266c53ac99ecf2b`

### 2026-09-01 10:58:52 KST — GPT

- 데이터 양과 모델 사용량 한계를 고려해 일괄 이관을 금지하는 `docs/archive-v1/MIGRATION_V1.md`를 추가함.
- Golden Sample과 Gate 0~3 검증 절차를 정의함.
- 본 이관은 문서 수가 아니라 작업 난이도 포인트로 제한하며 기본 상한을 12점, 원본 8건, Fragment 30건, 복잡 문서 2건으로 설정함.
- 사용자가 구조/아웃풋을 확인하고 수정할 수 있도록 단일 주제 End-to-End 샘플을 먼저 승인받는 절차를 명시함.
- GPT/Claude가 동일한 작은 작업 단위를 이어받도록 `docs/archive-v1/BATCH_TEMPLATE.md`를 추가함.
- 운영 사이트 및 Claude 예약 9건은 수정하지 않음.
- 관련 커밋: `a50064423906b40014ed010d74652fa48462ec80`, `c5e0f4a9923241107283f831c0190032e7c147bd`, `03b21c0a1cf1974284046e991323f9457e33d5e5`

### 2026-09-01 10:52:52 KST — GPT

- Archive v1의 목적·범위·기본 원칙 초안을 작성함.
- Document / Fragment / Event / Entity 4종 객체를 중심으로 공통 데이터 모델 초안을 작성함.
- 자료종류·주제·조직·행위·현행상태·적용범위를 분리한 taxonomy 초안을 작성함.
- 운영 사이트에는 코드 변경을 하지 않음.
- 다음 작업자는 `docs/archive-v1/` 문서를 먼저 읽고 이어서 설계할 것.

### 2026-09-01 10:50:24 KST — GPT

- 모델 간 공통 작업 규칙을 저장소에 두기로 함.
- `AGENTS.md`, `CLAUDE.md`, `docs/AI_WORKFLOW.md`를 추가.
- Claude가 맡은 입대의 데이터 9건은 현재 예약 영역으로 기록하여 GPT 작업과 분리.
- GPT는 운영 사이트를 건드리지 않고 Archive v1 설계 문서만 진행.

## 기록 규칙

완료된 작업도 즉시 삭제하지 말고 아래쪽에 완료 시각과 커밋을 남긴 뒤, 필요할 때 별도 히스토리 파일로 이동한다.
