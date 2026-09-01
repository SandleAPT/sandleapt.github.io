# Sandle Archive v1 — Data Model

상태: 초안 v1

## 1. 설계 목표

모든 자료를 단순 파일 목록이 아니라 다음 질문에 답할 수 있는 구조로 저장한다.

- 이 자료는 무엇인가?
- 언제 작성·논의·시행되었는가?
- 현재도 유효한가?
- 어떤 주제와 조직에 관련되는가?
- 어떤 회의·규정·계약·공고와 연결되는가?
- 이 기록 전후에 무엇이 있었는가?

## 2. 기본 객체

Archive v1은 크게 네 종류의 객체를 사용한다.

### A. Document

원본 문서 자체.

예:
- 2026년 8월 입주자대표회의 회의록
- 공동주택관리규약 2024.10.30 개정본
- 헬스장 운영계약서
- 선거관리위원회 공고
- 보험증권

### B. Fragment

Document 내부에서 독립적으로 검색·연결할 가치가 있는 부분.

예:
- 회의록의 제11안
- 관리규약 제54조의3
- 계약서의 계약기간 조항
- 공고문의 특정 선거 일정

Fragment는 반드시 `parent_document_id`를 가진다.

### C. Event

여러 문서를 하나의 흐름으로 묶는 사건 단위.
Event 자체는 원본 문서가 아니므로 연결된 근거 자료를 반드시 가진다.

예:
- 제6기 동대표 선거
- 헬스장 운영업체 선정
- 관리규약 2024년 개정
- 특정 하자소송

### D. Entity

여러 기록에서 반복해서 등장하는 대상.

예:
- 입주자대표회의
- 선거관리위원회
- 관리사무소
- LH
- 특정 관리업체·용역업체
- 헬스장, 작은도서관, 주차장 같은 시설

## 3. Document 공통 필드

권장 기본 형태:

```json
{
  "id": "doc-meeting-2026-08",
  "record_class": "document",
  "document_type": "meeting_minutes",
  "title": "2026년 8월 입주자대표회의 회의록",
  "summary": "...",

  "dates": {
    "document_date": "2026-08-26",
    "event_date": "2026-08-26",
    "effective_from": null,
    "effective_to": null
  },

  "temporal_status": "historical",
  "scope": ["sale"],

  "primary_topic": "governance.representative_council",
  "topics": [
    "community.gym",
    "community.gx",
    "finance.misc_income"
  ],

  "organizations": [
    "org.representative_council"
  ],

  "actions": [
    "discussion",
    "decision"
  ],

  "source": {
    "kind": "repository",
    "repository": "SandleAPT/minutes",
    "path": null,
    "url": null,
    "page": null
  },

  "provenance": {
    "is_original": true,
    "reviewed": false,
    "imported_at": null,
    "notes": null
  }
}
```

## 4. Fragment 공통 필드

```json
{
  "id": "frag-meeting-2026-08-agenda-11",
  "record_class": "fragment",
  "fragment_type": "agenda_item",
  "parent_document_id": "doc-meeting-2026-08",
  "title": "커뮤니티시설 운영 및 시설 확충",
  "summary": "...",
  "sequence": 11,

  "dates": {
    "event_date": "2026-08-26"
  },

  "primary_topic": "community.facilities",
  "topics": [
    "community.gym",
    "community.gx",
    "finance.misc_income"
  ],

  "organizations": [
    "org.representative_council"
  ],

  "actions": [
    "discussion",
    "decision"
  ]
}
```

Fragment는 원문의 일부이므로 같은 내용을 별도 원본처럼 복제하지 않는다.

## 5. Event 공통 필드

```json
{
  "id": "event-election-term-6",
  "record_class": "event",
  "event_type": "election",
  "title": "제6기 동별대표자 선거",
  "summary": "...",

  "period": {
    "start": "2025-12-01",
    "end": null
  },

  "status": "completed",
  "topics": ["election"],
  "organizations": ["org.election_committee"],

  "source_record_ids": [
    "doc-election-notice-...",
    "doc-election-result-..."
  ]
}
```

Event의 서술은 연결된 원본 자료가 뒷받침하는 범위 안에서만 작성한다.

## 6. 날짜는 하나로 합치지 않는다

공동주택 기록은 작성일과 효력일이 다른 경우가 많으므로 아래를 구분한다.

- `document_date`: 문서 작성·공고일
- `event_date`: 회의·투표·계약체결 등 실제 사건일
- `effective_from`: 규정·계약 등의 적용 시작일
- `effective_to`: 적용 종료일
- 필요 시 `period.start`, `period.end`

날짜를 알 수 없으면 추정값을 넣지 않고 `null`로 둔다.

## 7. 현행과 과거 구분

`temporal_status` 권장값:

- `current`: 현재 적용 중
- `historical`: 과거 기록
- `expired`: 기간 만료
- `superseded`: 후속 규정·문서로 대체
- `repealed`: 폐지
- `scheduled`: 시행 예정
- `draft`: 초안
- `unknown`: 확인 필요

현행 여부는 단순히 최신 날짜라는 이유만으로 자동 확정하지 않는다.

## 8. 적용 범위

분양·임차 자료가 함께 존재하므로 `scope`를 별도 필드로 둔다.

권장값:

- `sale`: 분양 세대/입주자 체계
- `rental`: 임차인 체계
- `mixed`: 혼합단지 공통
- `all_residents`: 전체 입주민 대상 생활·시설 정보
- `external`: 단지 외 대외 현안

## 9. 관계는 별도 데이터로 관리

Document 내부에 관계를 중복 저장하기보다 관계 파일을 별도 관리하는 것을 기본으로 한다.

```json
{
  "id": "rel-000001",
  "from": "frag-meeting-2026-08-agenda-11",
  "type": "based_on",
  "to": "frag-rule-management-54-3",
  "evidence": "explicit",
  "note": null
}
```

### 초기 관계 유형

- `part_of`: 상위 문서/사건의 일부
- `discussed_in`: 해당 회의에서 논의됨
- `decided_in`: 해당 회의에서 결정됨
- `based_on`: 규정·법령·기준에 근거함
- `amends`: 기존 규정·문서를 개정함
- `supersedes`: 이전 문서를 대체함
- `implements`: 결정·규정을 실제 시행함
- `result_of`: 이전 절차의 결과
- `follow_up_to`: 후속 조치
- `contract_for`: 특정 사업·시설의 계약
- `selected_through`: 선정 절차와 연결
- `evidence_for`: 사실 확인 근거
- `related_to`: 의미는 있으나 더 구체적 관계를 확정하기 어려움

가능하면 `related_to`보다 구체적인 관계를 우선한다.

## 10. 관계의 확실성

관계 연결도 근거 수준을 남긴다.

- `explicit`: 원문에 직접 연결이 명시됨
- `verified`: 여러 자료를 대조해 확인됨
- `inferred`: 맥락상 연관 가능성이 있으나 명시적이지 않음

`inferred`는 검색 보조에는 쓸 수 있지만 확정 사실처럼 표시하지 않는다.

## 11. 문서 종류와 주제를 혼합하지 않는다

예:

`회의록`은 document type이고 `헬스장`은 topic이다.

잘못된 단일 태그 방식:

```text
회의록 / 헬스장 / 2026 / 입대의 / 계약 / 잡수입
```

권장 구조:

```text
document_type: meeting_minutes
topics: community.gym, finance.misc_income
organizations: org.representative_council
actions: discussion, decision
dates.event_date: 2026-08-26
```

## 12. 원본과 파생 정보

`source`와 `provenance`를 반드시 둔다.

원본에서 확인된 사실과 시스템이 만든 요약·분류·관계는 구분되어야 한다.

향후 권장 필드:

- `reviewed`: 사람이 확인했는지
- `reviewed_at`
- `reviewed_by`
- `generated_fields`: 자동 생성된 필드 목록
- `notes`: 확인 필요 사항

## 13. 식별자 규칙

ID는 표시 제목이 바뀌어도 유지되는 안정적인 값을 사용한다.

권장 예:

```text
doc-meeting-2026-08
frag-meeting-2026-08-agenda-11
doc-rule-management-2024-10-30
frag-rule-management-2024-10-30-54-3
event-election-term-6
entity-org-election-committee
```

파일명이나 화면 제목 자체를 ID로 쓰지 않는다.

## 14. v1에서 아직 확정하지 않는 것

아래는 실제 자료 샘플 변환 후 확정한다.

- 사람 이름을 독립 Entity로 관리할 범위
- 계약 금액·회계 숫자의 세부 정규화 방식
- 규약 조문의 세항/호 단위 Fragment 수준
- 검색 인덱스에 저장할 전문(full text) 범위
- 중복 문서 판별 기준
- 외부 법령을 아카이브 내부 레코드로 둘지 링크 참조만 할지

이 항목들은 설계 단계에서 성급히 고정하지 않는다.
