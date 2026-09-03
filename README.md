# 산들마을 입주민 포털

산들마을 아파트의 공개 서비스들을 **왼쪽 메뉴 하나**로 오가는 첫 화면입니다. → https://sandleapt.github.io/

- 회의: 회의록 미리보기 · 이전 회의록 · 회의 관리(안건·발언 · 회의 설정 · 동대표 명단)
- 검색 · 아카이브: Archive 시험판 · 주제별 보기 · 통합검색 준비 자리
- 기준 · 문서: 관리규약 · 계약·기준문서 · 선거·선관위 · 공고·안내 · 비공개 자료
- 점검 · 관리: 절차 점검 · 관리비 추적 · 하자판결금
- 소식 · 정보: 업무현황 · 꿀팁정리 · 커뮤니티센터 이용 안내

## 주소
- 저장소 이름이 `sandleapt.github.io`라서 루트 주소 **https://sandleapt.github.io/** 로 열립니다(2026-08-23 이름 변경 완료).
- Settings → Pages → Build and deployment: `Deploy from a branch`, Branch `main` / `(root)`.
- 특정 화면으로 바로 가기: `https://sandleapt.github.io/#hajaView`처럼 `#항목id`를 사용합니다. 기존 항목 ID는 유지하며, 문서 하위 탭은 `noticeView`(관리규약) · `noticeContracts` · `noticeElections` · `noticeAnnouncements` · `noticeChecks`로 바로 엽니다.

## 구조 (2026-08-23, 사이드바형)
- 한 파일 `index.html`. 왼쪽 사이드바(데스크탑) / ☰ 서랍 + 하단 바(모바일, 860px 이하).
- 같은 호스트의 앱(회의록·커뮤니티센터)은 **iframe 한 벌씩**만 띄웁니다. 회의록 앱은 끼움 모드 `?embed=1`(회의록 v61~)로 떠서 자기 왼쪽 메뉴를 숨기고, 포털과 `postMessage`로 화면을 맞춥니다. 문서·점검 메뉴는 기존 `noticeView` 화면을 재사용하고 해당 내부 탭만 선택합니다.
  - 포털 → 앱: `{source:"sandle-portal", type:"show", view:"archiveView"}`
  - 앱 → 포털: `{source:"sandle-minutes", type:"ready"|"view", view:"…"}` (같은 origin만 허용)
- 노션(업무현황·자료)은 `X-Frame-Options`/`frame-ancestors`로 끼워 넣기가 막혀 있어, 누르면 **새 창**으로 열리고 포털 안에는 안내 카드가 남습니다.
- 메뉴를 더하려면 `index.html`의 `GROUPS`에 한 줄 추가(같은 호스트 앱이면 `SERVICES`에도).
- 로컬 점검: 주소를 `location.origin` 기준으로 만들므로 `D:\Main`을 `/`, `D:\minutes`를 `/minutes/`로 서빙하는 정적 서버(예: `localhost:8765`)에서 그대로 동작합니다.
