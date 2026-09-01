# Sandle Archive v1 — 4.1~4.3a 검증 기록

- 검증·원격 반영 완료: `2026-09-01 15:32:08 KST`
- 캐시 버전: `20260901-152900`
- 구현 커밋: `6bb6e633900e8d6217fcc4a20bd0b8a86b7aa223`
- 범위: 저장소 역할 분리, SourceReference v1, 공개 projection, 관리자 발행 차단
- 운영 루트 변경: 없음
- minutes 원본 변경: 없음

## 검증 결과

- `stage3-source`: 통과
- `stage3-adapter`: 통과
- `stage3-live-data`: 회의 213건 / Fragment 1,125건 통과
- `stage4-source-reference`: 통과
- `stage4-visibility`: 통과
- `stage4-publish-guard`: 통과
- `stage4-admin-integration`: 통과
- Archive 전체 JavaScript 문법 검사: 통과
- `git diff --check`: 통과

## 확인한 보안 경계

- visibility 누락·오류는 `private`로 처리한다.
- `resident`와 `private`는 공개 projection을 만들지 않는다.
- 비공개 외부 `file_id`는 공개 원본 참조에 포함하지 않는다.
- 발행 화면뿐 아니라 `store.publish()`에서도 공개 정책 검사를 강제한다.
- 공개 정책 모듈이 없으면 발행을 허용하지 않는 fail-closed 방식이다.
- 실제 인증이 생기기 전에는 resident/private 자료를 공개 GitHub Pages 산출물에 넣지 않는다.

## 화면 검증 제한

Playwright 패키지는 있었지만 실행 가능한 Chromium이 설치돼 있지 않아 헤드리스 브라우저 클릭 검증은 실행하지 못했다. 이를 완료로 가장하지 않고, 실제 store와 정책 모듈을 함께 불러오는 통합 테스트로 다음 동작을 검증했다.

- public 자료 발행 허용
- resident 자료 발행 차단
- private 자료 발행 차단
- 정책 모듈 누락 시 발행 차단
- 관리자 HTML의 Stage 4 스크립트 로드 순서와 화면 연결

공개 배포 후 사용자가 직접 확인할 경로는 `/archive-v1/admin/#storagePolicy`와 `/archive-v1/admin/#publish`다.

## 아직 확정하지 않은 것

- 입주민 인증 주체와 로그인 방식
- 관리자 인증과 쓰기 권한
- resident 원본 파일 제공 서버·저장소
- 인증 만료·회수·감사 로그

위 항목은 비용·개인정보·실제 접근권한에 영향을 주므로 사용자 결정 전까지 구현하지 않는다.
