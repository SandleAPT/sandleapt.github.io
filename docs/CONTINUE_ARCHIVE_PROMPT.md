# 다른 AI에게 Archive v1 작업 이어달라고 할 때

아래 프롬프트를 새 대화의 GPT, Claude 등에게 그대로 붙여 넣는다.

## 기본 이어하기 프롬프트

```text
SandleAPT의 GitHub 프로젝트 작업을 이어서 진행해줘.

저장소:
- 포털·Archive: https://github.com/SandleAPT/sandleapt.github.io
- 회의록 원본: https://github.com/SandleAPT/minutes

반드시 최신 main을 기준으로 다음 문서를 순서대로 전부 읽어:
1. AGENTS.md
2. docs/AI_WORKFLOW.md
3. docs/WORK_STATUS.md
4. docs/archive-v1/ROADMAP_V1.md
5. docs/archive-v1/VALIDATION_POLICY.md
6. 현재 단계에 연결된 설계·검증 문서

docs/WORK_STATUS.md의 현재 번호와 잠금·reserved 작업을 최우선으로 지켜. 다른 AI가 reserved 또는 in_progress로 잡은 영역은 건드리지 마.

Archive 작업은 소단계마다 내 확인을 기다리지 말고, 네가 기능·데이터·호환성·화면 흐름을 직접 검증하고 보완하면서 다음 단계로 진행해. 다만 공개 범위 확대, resident/private 실제 권한, 원본 삭제·덮어쓰기, 운영 루트 전환처럼 되돌리기 어려운 결정만 나에게 물어봐.

한 파일에 기능이나 데이터를 몰지 말고 기능·데이터·스타일·테스트·문서를 가능한 한 작은 모듈로 나눠. 기존 운영 루트와 minutes 원본은 별도 지시가 없으면 수정하지 마.

긴 작업은 끝까지 기다리지 말고, 소단계나 검증 가능한 기능 묶음이 끝날 때마다:
- docs/WORK_STATUS.md 갱신
- 관련 설계·검증 문서 갱신
- 버전 또는 캐시 키 증가
- 완료 시각을 YYYY-MM-DD HH:mm:ss KST로 기록
- 검증 명령과 결과 기록
- 안전한 체크포인트 커밋·배포
를 먼저 해.

사용자가 나중에 수정 요청을 하면 어느 Roadmap 단계의 보완인지 네가 판단하고 기존 완료 기록을 지우지 않은 채 새 소번호를 추가해.

지금은 먼저 최신 WORK_STATUS를 읽고, 마지막 검증된 체크포인트 다음 작업부터 이어서 진행해. 시작 전에 네가 이해한 현재 단계·잠금 영역·첫 작업을 짧게 알려줘.
```

## “일단 상태만 확인” 프롬프트

```text
https://github.com/SandleAPT/sandleapt.github.io 최신 main의 AGENTS.md와 docs/AI_WORKFLOW.md, docs/WORK_STATUS.md, docs/archive-v1/ROADMAP_V1.md를 읽고 현재 작업 위치, 마지막 검증 완료 범위, reserved 영역, 다음 행동만 정리해줘. 아직 파일은 수정하지 마.
```

## 인계 확인 기준

새 AI의 설명이 다음과 다르면 작업을 시작시키기 전에 다시 최신 파일을 읽게 한다.

- 대화 내용보다 저장소 최신 main과 `WORK_STATUS.md`가 우선
- Archive는 번호제 Roadmap으로 진행
- 기능 묶음마다 중간 체크포인트 저장
- 한 파일에 몰지 않고 모듈 분리
- 버전·완료 시각 KST 기록
- 다른 AI의 reserved 영역 보호
- 기존 minutes 원본과 운영 루트는 별도 승인 없이 변경하지 않음
