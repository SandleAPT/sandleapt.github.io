# Archive v1 — 배치 작업 템플릿

배치 하나를 시작하거나 인계할 때 아래 형식을 복사해서 사용한다.

## 기본정보

- 배치 ID:
- 담당:
- 상태: `planned | reserved | in_progress | blocked | review | approved | completed`
- 시작 시각:
- 완료 시각:
- 관련 커밋:

## 작업 범위

- 자료군:
- 대상 연도/기간:
- 대상 원본:
- 예상 작업 포인트:
- 원본 문서 수:
- 예상 Fragment 수:

## 이번 배치에서 할 일

- [ ] 원본 확인
- [ ] Document 생성/수정
- [ ] Fragment 생성/수정
- [ ] Event 연결
- [ ] Entity 연결
- [ ] Relation 생성
- [ ] taxonomy 적합성 확인
- [ ] 자동/수동 검증
- [ ] 결과 요약 작성
- [ ] WORK_STATUS 인계 기록

## 생성 결과

- Document:
- Fragment:
- Event:
- Entity:
- Relation:

## taxonomy 변경

- 추가:
- alias 추가:
- 보류:

## 확인 필요

- `needs_review`:
- 원본 불명확:
- 날짜 불명확:
- 현행 여부 불명확:
- 관계 추론:

## 사용자 확인 필요 여부

- 필요 여부: `yes | no`
- 이유:
- 보여줄 샘플:
- 승인 상태:

## 인계

- 마지막으로 완료한 항목:
- 아직 처리하지 않은 항목:
- 다음 담당자가 가장 먼저 확인할 것:
- 건드리면 안 되는 reserved 영역:

## 품질 체크

- [ ] 원본을 수정하지 않았음
- [ ] 한 배치 12점 상한을 지켰음
- [ ] 원본 8건 / Fragment 30건 / 복잡 문서 2건 상한을 넘지 않았음
- [ ] 새 taxonomy 5개 이하
- [ ] 현재/과거를 추정으로 확정하지 않았음
- [ ] `inferred` 관계를 확정 사실처럼 표시하지 않았음
- [ ] 다른 모델이 이어서 작업할 수 있을 정도로 인계가 구체적임
