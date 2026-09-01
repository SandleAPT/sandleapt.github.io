# Sandle Archive v1 — 회의록 Adapter v1

상태: 3단계 프로토타입
작성: 2026-09-01

## 목적

사용자의 목표는 회의 작성 시스템을 새로 만드는 것이 아니라 **이미 작성·저장된 회의록을 더 보기 쉽고 찾기 쉽게 정리하는 것**이다.

따라서 Archive는 기존 `SandleAPT/minutes`를 원본 시스템으로 유지하고, 원본을 읽어서 Archive용 구조를 만드는 read-only adapter를 둔다.

```text
기존 minutes 회의 작성·저장·PDF
            ↓ 읽기만 함
회의 1건 → Archive Document
안건 N건 → Archive Fragment N건
            ↓
기존 태그·내용 기반 주제 후보 / 의결·후속조치 구조화
            ↓
애매한 안건만 관리자 분류 검토
```

## 원본 데이터

현재 회의록 공개 정적 데이터는 `/minutes/data-index.json`과 `/minutes/data-YYYY.json`으로 연도별 분리되어 있다.

연도별 파일의 각 레코드는 대략 다음 정보를 가진다.

- `id`
- `name`
- `date`
- `updatedAt`
- `json`: 당시 회의 전체 state 문자열

`json` 내부의 주요 구조:

- `meeting`
  - 회의체, 기수, 연도·월, 정기/임시, 날짜, 시간, 장소
  - 참석, 배석, 참관
- `rosters`
- `agendas[]`
  - `id`
  - `title`
  - `summary`
  - `decision`
  - `followup`
  - `votes`
  - `remarks`
  - `tags` 또는 `category`가 있는 경우 기존 분류
- `cloudId`

## Archive 매핑

### 회의 1건 → Document

- `record_class`: `meeting`
- `document_type`: `회의록`
- `title`: 기존 회의명
- `document_date`, `event_date`: 기존 회의 날짜
- `scope`: 입대의 `sale`, 임차 `rental`
- `organizations`: 입주자대표회의 또는 임차인대표회의
- `source.system`: `minutes`
- `source.id`: 기존 cloud/static record id
- `fragment_count`: 안건 수
- 회의체·기수·정기/임시·참석 인원 등은 meeting 메타데이터로 보존

### 안건 1건 → Fragment

- `record_class`: `meeting_agenda`
- `document_type`: `회의·안건`
- `parent_document_id`: 해당 회의 Document
- `sequence`: 안건 순번
- `title`: 안건명
- `summary`: 논의 내용 원문
- `decision`: 의결사항 원문
- `followup`: 후속조치 원문
- `vote`: 찬성/반대/기권 요약
- `actions`
  - 의결사항이 있으면 `decision`
  - 후속조치가 있으면 `follow_up`
- `relations`
  - 회의 Document와의 `part_of` 관계는 구조상 명확하므로 `explicit`

## 주제 분류 원칙

회의록에 저장된 `tags` 또는 `category`가 있으면 **그 값을 먼저 사용**한다.

저장 태그가 없거나 `기타`만 있으면 현재 minutes의 Topic taxonomy 키워드를 사용해 후보를 만든다. 이 경우 확정 사실이 아니라 `inferred` 성격의 **주제 후보**로 표시하고 관리자 검토 대상으로 보낸다.

즉:

```text
기존 저장 태그 → 우선 사용 / 높은 신뢰도
태그 없음 → 키워드 후보 / 검토 필요
```

Archive가 원문을 보고 임의로 사실관계를 새로 만들어 관계를 확정하지 않는다.

## 출력과 원본 보존

Archive는 회의록 PDF/인쇄를 새로 만들지 않는다.

- 회의 작성: 기존 minutes
- 회의록 저장: 기존 minutes
- 회의록 미리보기·PDF·1페이지 운영: 기존 minutes
- 검색·주제별 보기·타임라인·관계 탐색: Archive

따라서 Archive의 화면 구성이 나중에 크게 바뀌어도 기존 회의록 원문이나 출력물을 다시 수정할 필요가 없다.

## 3단계 프로토타입 파일

- `archive-v1/admin/stage3/meeting-source.js`
  - `/minutes/data-index.json`, `/minutes/data-YYYY.json` read-only 로드
- `archive-v1/admin/stage3/meeting-adapter.js`
  - 회의 → Document, 안건 → Fragment 변환
- `archive-v1/admin/views/meeting-import.js`
  - 실제 회의 선택, 원본/변환 비교, 안건 펼쳐보기, 검토함 전송
- `archive-v1/assets/admin-stage3.css`
  - 3단계 화면 전용 스타일

## 아직 하지 않는 것

- minutes 원본 데이터 수정
- 회의 저장 직후 서버에서 자동 Archive 발행
- Archive용 별도 회의 작성 폼
- 실제 Archive 저장소 쓰기
- resident/private 인증

실제 자동 저장·권한·발행 구조는 4단계 저장소/권한 설계와 연결해서 확정한다.
