# 산들마을 입주민 포털

산들마을 아파트의 공개 서비스들을 한 장으로 잇는 첫 화면입니다.

- 회의록 앱: https://sandleapt.github.io/minutes/ (저장소 `SandleAPT/minutes`)
- 업무현황 공개용 (Notion)
- 자료 페이지 (Notion)
- 커뮤니티센터 이용 안내: https://sandleapt.github.io/CommunityNotice/
- 하자판결금 수령 현황: 회의록 앱 ④ 탭

## 주소
- 저장소 이름이 `sandleapt.github.io`라서 루트 주소 **https://sandleapt.github.io/** 로 열립니다(2026-08-23 이름 변경 완료).
- (참고) 이름을 다시 바꾸면 주소도 `https://sandleapt.github.io/<저장소명>/`으로 바뀝니다.
- Settings → Pages → Build and deployment: `Deploy from a branch`, Branch `main` / `(root)`.

## 구조
한 화면의 탭 껍데기입니다. 각 탭은 `iframe`으로 하위 서비스를 그 자리에서 열고, 주소 `#탭id`(minutes·archive·topics·haja·work·docs·community)로 기억됩니다. 탭을 더하려면 `index.html`의 `SERVICES` 배열에 한 줄 추가.

## 수정
`index.html` 한 파일입니다. 카드(서비스)를 더하려면 `<a class="card">` 블록을 복사해 주소·제목·설명을 바꾸세요.
