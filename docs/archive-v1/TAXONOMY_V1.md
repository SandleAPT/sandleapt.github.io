# Sandle Archive v1 — Taxonomy

상태: 초안 v1

## 1. 목적

검색 정확도와 장기 유지보수를 위해 모든 것을 하나의 `tag` 배열에 넣지 않는다.
각 정보는 성격에 따라 별도 분류축으로 관리한다.

핵심 축:

- Document Type — 자료가 무엇인가
- Topic — 무엇에 관한 내용인가
- Organization — 누가 관련되는가
- Action — 무엇을 했는가
- Temporal Status — 지금 어떤 상태인가
- Scope — 누구에게 적용되는가

## 2. Topic 구조 원칙

Topic은 계층형으로 관리한다.

권장 필드:

```json
{
  "id": "community.gym",
  "label": "헬스장",
  "parent": "community.facilities",
  "aliases": ["체력단련장", "헬스"],
  "description": "단지 내 헬스장 운영·이용·시설 관련 기록"
}
```

검색어는 `label`과 `aliases`를 모두 사용하되 저장 ID는 하나로 통일한다.

한 레코드는 다음을 가질 수 있다.

- `primary_topic`: 핵심 주제 1개
- `topics`: 관련 주제 여러 개

## 3. 초기 Topic 대분류

### governance — 관리·의사결정

- `governance.representative_council` — 입주자대표회의
- `governance.rental_council` — 임차인대표회의
- `governance.management_office` — 관리사무소/관리주체
- `governance.rules` — 관리규약·제규정
- `governance.disclosure` — 정보공개·열람
- `governance.handover` — 인계·인수

### election — 선거

- `election.committee` — 선거관리위원회
- `election.recruitment` — 위원·후보 모집
- `election.candidate` — 후보 등록
- `election.vote` — 투표
- `election.result` — 당선·결과
- `election.by_election` — 보궐선거
- `election.dismissal` — 해임 관련

### finance — 재정·회계

- `finance.management_fee` — 관리비
- `finance.accounting` — 회계처리
- `finance.audit` — 회계감사
- `finance.misc_income` — 잡수입
- `finance.reserve` — 장기수선충당금
- `finance.budget` — 예산
- `finance.settlement` — 결산
- `finance.operating_expense` — 대표회의·위원회 운영경비

### procurement — 계약·입찰·업체

- `procurement.bid` — 입찰
- `procurement.vendor_selection` — 업체 선정
- `procurement.contract` — 계약
- `procurement.renewal` — 재계약
- `procurement.performance` — 수행평가
- `procurement.termination` — 계약 종료·해지

### community — 주민공동시설·생활시설

- `community.facilities` — 주민공동시설 일반
- `community.gym` — 헬스장
- `community.gx` — GX
- `community.table_tennis` — 탁구장
- `community.library` — 작은도서관
- `community.center` — 커뮤니티센터 일반
- `community.fee` — 시설 이용료
- `community.access` — 출입·회원·이용자 등록
- `community.program` — 프로그램 운영

### parking — 주차

- `parking.rules` — 주차장 운영규정
- `parking.registration` — 차량 등록
- `parking.visitor` — 방문차량
- `parking.fee` — 주차요금
- `parking.enforcement` — 주차위반·견인·제재
- `parking.facility` — 차단기·주차설비

### facility — 시설·유지관리

- `facility.building` — 건축물 일반
- `facility.exterior` — 외벽·도장
- `facility.roof` — 옥상·방수
- `facility.elevator` — 승강기
- `facility.electrical` — 전기
- `facility.mechanical` — 기계설비
- `facility.water` — 급수·저수조
- `facility.heating` — 난방·열교환기
- `facility.fire` — 소방
- `facility.network` — 홈네트워크·통신
- `facility.cctv` — CCTV
- `facility.playground` — 어린이놀이시설
- `facility.landscaping` — 조경
- `facility.cleaning` — 미화·청소
- `facility.security` — 경비

### safety — 안전·보험

- `safety.general` — 안전관리 일반
- `safety.inspection` — 점검·진단
- `safety.accident` — 사고
- `safety.insurance` — 보험
- `safety.disaster` — 재난·재해 대응

### defect_legal — 하자·분쟁·법률

- `defect_legal.defect` — 하자
- `defect_legal.litigation` — 소송
- `defect_legal.judgment` — 판결
- `defect_legal.judgment_fund` — 하자판결금
- `defect_legal.settlement` — 합의·조정
- `defect_legal.claim` — 청구·환수

### residential_life — 공동생활

- `residential_life.noise` — 층간소음
- `residential_life.smoking` — 간접흡연
- `residential_life.pet` — 반려동물
- `residential_life.common_area` — 공용공간 이용
- `residential_life.community_activity` — 공동체 활성화

### external_affairs — 대외 현안

- `external_affairs.transport` — 교통·철도
- `external_affairs.public_project` — 공공사업
- `external_affairs.local_government` — 성남시·행정기관 관련
- `external_affairs.lh` — LH 관련
- `external_affairs.civil_complaint` — 대외 민원·질의

초기 목록은 고정 완성본이 아니다. 실제 10년치 데이터에서 반복되는 패턴을 보고 추가·병합한다.

## 4. Document Type

초기 권장값:

- `meeting_minutes` — 회의록
- `meeting_notice` — 회의 개최 공고
- `agenda` — 의안/안건 문서
- `decision_notice` — 의결·결과 공고
- `election_notice` — 선거 관련 공고
- `rule` — 관리규약
- `operating_rule` — 운영규정
- `contract` — 계약서
- `agreement` — 협약서
- `bid_notice` — 입찰·선정 공고
- `official_letter` — 공문
- `civil_complaint` — 민원·질의
- `official_reply` — 공식 회신
- `insurance_policy` — 보험증권
- `accounting_record` — 회계·지출자료
- `audit_report` — 감사보고서
- `judgment` — 판결문
- `settlement_record` — 조정·합의 문서
- `report` — 보고서
- `guide` — 이용안내
- `other_source` — 아직 별도 종류를 만들기 어려운 원본

`other_source`가 늘어나면 반드시 새로운 문서종류가 필요한지 검토한다.

## 5. Organization

조직은 Topic과 별도다.

초기 권장 ID:

- `org.representative_council` — 입주자대표회의
- `org.rental_council` — 임차인대표회의
- `org.election_committee` — 선거관리위원회
- `org.management_office` — 관리사무소
- `org.management_company` — 위탁관리업체
- `org.lh` — 한국토지주택공사
- `org.seongnam` — 성남시
- `org.vendor.*` — 개별 계약·용역업체
- `org.community_group.*` — 공동체 활성화 단체 등

업체명은 표시명과 안정적인 ID를 분리한다.
회사명이 변경되더라도 과거 기록을 잃지 않도록 별칭을 지원한다.

## 6. Action

자료에 기록된 행위를 별도 분류한다.

- `proposal` — 제안
- `discussion` — 논의
- `decision` — 의결·결정
- `approval` — 승인
- `rejection` — 부결·거절
- `notice` — 공고
- `recruitment` — 모집
- `vote` — 투표
- `selection` — 선정
- `contract` — 계약 체결
- `renewal` — 갱신·재계약
- `payment` — 지급
- `collection` — 환수·회수
- `inspection` — 점검
- `repair` — 보수
- `amendment` — 개정
- `repeal` — 폐지
- `inquiry` — 질의
- `reply` — 회신
- `lawsuit` — 소송
- `judgment` — 판결
- `settlement` — 조정·합의
- `implementation` — 시행
- `handover` — 인계

## 7. Temporal Status

`DATA_MODEL_V1.md`의 값을 사용한다.

- `current`
- `historical`
- `expired`
- `superseded`
- `repealed`
- `scheduled`
- `draft`
- `unknown`

## 8. Scope

- `sale` — 분양 체계
- `rental` — 임차 체계
- `mixed` — 혼합단지 공통
- `all_residents` — 전체 입주민 생활/시설
- `external` — 대외 현안

## 9. 세부 키워드는 Taxonomy와 구분

모든 검색어를 정식 Topic으로 만들 필요는 없다.

예:

- `러닝머신`
- `천국의계단`
- `안면인식`
- `블라인드`
- 특정 공사 공법

이런 단어는 자유 키워드 또는 원문 검색으로 찾을 수 있다.
반복적으로 중요한 개념이 되면 이후 Topic으로 승격한다.

즉:

- Topic = 장기적으로 관리할 통제된 개념
- Keyword = 원문에서 등장하는 세부어

## 10. 분류 추가 기준

새 Topic을 추가하기 전 다음을 확인한다.

1. 기존 Topic의 별칭으로 처리할 수 없는가?
2. 상위·하위 관계가 명확한가?
3. 여러 기록에서 반복해서 사용할 가능성이 있는가?
4. 검색 필터로 노출할 가치가 있는가?
5. 특정 사건 하나만을 위한 임시 카테고리는 아닌가?

특정 사건은 Topic이 아니라 Event로 관리하는 것을 우선한다.

## 11. v1 검증 방법

분류체계를 책상 위에서 완성하지 않는다.

다음 대표 주제로 실제 데이터를 넣어보고 수정한다.

- 주차
- 헬스장/GX
- 선거·선관위
- 잡수입·운영경비
- 하자판결금
- 도서관
- 계약·입찰

이 주제들이 과거 기록→결정→현재 기준→계약/비용까지 자연스럽게 연결되는지 확인한 뒤 taxonomy v1을 확정한다.
