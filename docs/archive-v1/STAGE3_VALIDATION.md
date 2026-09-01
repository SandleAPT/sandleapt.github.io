# Archive v1 — 3단계 검증 기록

검증일: 2026-09-01  
대상: 기존 회의록 데이터 → Archive Document/Fragment 변환

## 검증 범위

- 회의 데이터 index·연도 파일 로드
- 회의 레코드 JSON 파싱
- 회의 1건 → Document 변환
- 안건 N건 → Fragment N건 변환
- 표결, 의결사항, 후속조치 구조화
- 기존 분류명 정규화와 자동 주제 후보 구분
- 분류 검토 Draft 생성
- Fragment·Draft 식별자 중복 여부

## 자동 검증 파일

- `archive-v1/tests/stage3-source.test.js`
- `archive-v1/tests/stage3-adapter.test.js`
- `archive-v1/tests/stage3-live-data.test.js`
- `archive-v1/tests/fixtures/stage3-meetings.json`

## 실행

```bash
node archive-v1/tests/stage3-source.test.js
node archive-v1/tests/stage3-adapter.test.js
SANDLE_MINUTES_ROOT=/path/to/minutes node archive-v1/tests/stage3-live-data.test.js
```

## 2026-09-01 검증 결과

- fixture source 로드·캐시: 통과
- fixture 변환·표결·Draft: 통과
- 실제 공개 회의 데이터: 213건 통과
- 실제 안건 Fragment: 1,125건 통과
- JSON 파싱 오류: 0건
- Fragment ID 중복: 0건
- 기존 minutes 원본 변경: 없음

## 발견 후 보완

기존 안건에 남아 있던 과거 분류명 `미화`, `소송`, `저수조·청소`와 `기타`를 Adapter가 최신 minutes taxonomy와 같은 규칙으로 정규화하도록 수정했다.

- `미화` → `청소·미화`
- `소송` → `하자·소송`
- `저수조·청소`, `기타` → 본문 키워드로 최신 세부 주제 후보 생성
- 자동 보완된 주제는 저장 태그로 과장하지 않고 `inferred` 후보로 유지

## 남은 위험

- 현재 검토함 상태는 브라우저 메모리이므로 새로고침하면 초기화된다.
- 실제 저장과 resident/private 인증은 4단계에서 분리 설계한다.
- 사용자 피드백이 들어오면 3단계 다음 소번호로 다시 열어 보완한다.
