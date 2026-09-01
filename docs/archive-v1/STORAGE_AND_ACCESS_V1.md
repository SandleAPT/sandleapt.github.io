# Sandle Archive v1 — 저장소·원본·권한 구조 v1

상태: 4.1~4.2 검증 완료
작성: 2026-09-01

## 1. 목표

공개 GitHub Pages에 코드를 올리는 것과 원본 파일을 보관하는 일을 분리한다. 화면에서 숨기는 것을 권한 처리로 착각하지 않고, 공개할 수 없는 자료는 공개 빌드 파일 자체에 넣지 않는다.

## 2. 저장 위치별 역할

### GitHub `SandleAPT/sandleapt.github.io`

- Archive 화면 HTML/CSS/JS
- 공개 가능한 메타데이터
- 공개 검색 인덱스
- taxonomy와 Relation
- 공개 가능한 요약·본문
- 공개 원본으로 이동하기 위한 안전한 참조
- 작업지침·검증·인계 기록

### GitHub `SandleAPT/minutes`

- 기존 회의 작성·저장 구조
- 연도별 공개 회의 데이터
- 기존 회의록 미리보기·PDF·인쇄 기능
- Archive가 읽기만 하는 공개 원본 시스템

### 외부 원본 저장소

Google Drive 등 외부 저장소는 다음을 맡는다.

- PDF, HWP/DOCX/XLSX
- 사진·영상·음성
- 대용량 스캔
- resident/private 원본
- 공개 GitHub에 둘 필요가 없는 원본 파일

특정 서비스에 종속되지 않도록 Archive에는 공통 `SourceReference`만 저장한다.

## 3. SourceReference v1

```json
{
  "ref_id": "src-rule-2024-10-30",
  "provider": "google_drive",
  "label": "산들마을 공동주택관리규약 2024.10.30",
  "original_type": "pdf",
  "visibility": "resident",
  "access": "authenticated",
  "locator": {
    "file_id": "외부 저장소 내부 식별자",
    "url": ""
  },
  "checksum": ""
}
```

provider 초기값:

- `repository`
- `minutes`
- `google_drive`
- `external_url`
- `library`
- `local_archive`

access 초기값:

- `public`
- `authenticated`
- `restricted`

## 4. 공개 번들 규칙

### public

- 공개 메타데이터·검색·본문에 포함 가능
- 원본 참조도 실제로 공개 접근 가능한 경우에만 포함
- 공개 원본 참조에는 `visibility: public`, `access: public`이 모두 필요

### resident

- 공개 메타데이터·검색·본문·원본 참조에서 전부 제외
- 향후 입주민 인증 서버가 생기기 전에는 공개 GitHub Pages에 어떤 형태로도 싣지 않음

### private

- 공개 및 입주민 번들 모두 제외
- 관리자 내부 저장소에서만 유지

visibility가 없거나 잘못된 값은 공개로 추정하지 않고 `private`로 취급한다.

## 5. 공개 Projection

공개 번들은 내부 레코드를 그대로 복사하지 않는다. 허용된 공개 필드만 새 객체로 만든다.

제외 예:

- `private_notes`
- `admin_notes`
- `raw_content`
- `resident_content`
- `internal_source`
- `reviewer_identity`
- resident/private 외부 저장소 `file_id`

## 6. 구현·검증 파일

- `archive-v1/admin/stage4/source-reference.js`
- `archive-v1/admin/stage4/visibility-policy.js`
- `archive-v1/admin/stage4/publish-guard.js`
- `archive-v1/admin/views/storage-policy.js`
- `archive-v1/admin/views/publish-stage4.js`
- `archive-v1/assets/admin-stage4.css`
- `archive-v1/tests/stage4-source-reference.test.js`
- `archive-v1/tests/stage4-visibility.test.js`
- `archive-v1/tests/stage4-publish-guard.test.js`
- `archive-v1/tests/stage4-admin-integration.test.js`
- 검증 기록: `docs/archive-v1/STAGE4_VALIDATION.md`

## 7. 4.3 진행 상태

4.3a 공개 projection과 공개 발행 차단은 관리자 화면과 store에 연결해 검증했다.

4.3b에서 사용자와 결정할 것:

- 실제 입주민 인증 주체와 인증 수단
- resident 자료를 제공할 서버·저장소
- 관리자 인증과 쓰기 권한
- 인증 만료·회수·감사 로그

이 결정 전까지 resident/private는 공개 빌드에서 제외하는 정책만 적용한다.
