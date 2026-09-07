# Lesson & Learn — Repository Instructions

사용자의 명시적인 요청이 이 문서의 일반 지침보다 우선합니다.

## 저장소 목적

이 저장소는 누구나 읽을 수 있는 공개 학습 아카이브입니다. AI Agent Bootcamp에서 수행한 예습, 수업 정리, 실습, TIL, 주간 회고를 탐색 가능하고 재사용 가능한 형태로 보존합니다.

## 공개 범위

- 이 저장소는 `public` 상태를 유지합니다.
- 개인정보, 인증정보, API 키, 토큰, 비공개 링크, 내부 운영 지침은 커밋하지 않습니다.
- 개인 agent의 프롬프트, 사용자 프로필, 오케스트레이션 규칙은 비공개 `Blast-Forge-Lab` 저장소에서 관리합니다.
- 공개 여부가 불확실한 원문이나 자료는 추가하지 말고 사용자에게 확인합니다.

## 디렉터리 구조

```text
AI AGENT BOOTCAMP_LV.N/
├── README.md
├── NN-week-topic/
│   ├── README.md
│   ├── YYYY-MM-DD/
│   │   ├── 01-preview-notes-NN-topic.md
│   │   ├── 02-learning-notes-NN-topic.md
│   │   ├── 03-practice-NN-topic.md
│   │   └── 04-til-NN-topic.md
│   └── weekly-retrospective.md
└── templates/
```

## 이름 규칙

- 주차 폴더: `NN-week-topic`
- 날짜 폴더: `YYYY-MM-DD`
- 예습: `01-preview-notes-NN-topic.md`
- 수업 및 개념 정리: `02-learning-notes-NN-topic.md`
- 실습 및 문제 해결: `03-practice-NN-topic.md`
- 일일 회고: `04-til-NN-topic.md`
- 주간 회고: `weekly-retrospective.md`
- 경로에는 공백과 불필요한 특수문자를 피하고 소문자 kebab-case를 사용합니다.
- 같은 유형의 문서가 여러 개면 `01`, `02`처럼 두 자리 순번을 붙입니다.

## 문서 역할

- Preview Notes는 수업 전 조사 내용과 질문을 기록합니다.
- Learning Notes는 강의에서 배운 개념과 예제를 기록합니다.
- Practice는 직접 수행한 코드, 복습, 오류와 해결 과정을 기록합니다.
- TIL은 원문 복제가 아니라 사용자가 실제로 이해한 내용과 다음 학습 계획을 기록합니다.
- Weekly Retrospective는 한 주의 성과, 취약점, 개선 방향을 연결합니다.

## 보존 원칙

- 기존 학습 문서의 본문을 임의로 축약하거나 삭제하지 않습니다.
- 파일을 이동하거나 이름을 바꿀 때 내용 보존 여부를 확인합니다.
- Learning Notes와 TIL은 내용이 일부 겹쳐도 역할이 다르므로 임의로 합치지 않습니다.
- 원본과 사용자의 생각, 실행 결과와 예상 결과, 사실과 추론을 구분합니다.
- 날짜나 주제가 불확실하면 추측하여 저장하지 않습니다.

## README 관리

- 새 날짜나 문서가 추가되면 해당 주차 README의 일자별 표를 갱신합니다.
- 새 주차가 추가되면 Level README의 Curriculum 표를 갱신합니다.
- 새 Level이 시작되면 저장소 최상위 README의 Learning archives를 갱신합니다.
- README 링크는 실제 상대경로를 사용하고, 이동 후 깨진 링크가 없는지 검사합니다.

## 작업 흐름

```text
요청과 학습 결과 확인
→ 올바른 Level·Week·Date 결정
→ 문서 역할과 파일명 결정
→ 원본을 보존하며 작성 또는 이동
→ 주차 및 Level README 갱신
→ 민감정보 검사
→ Markdown 링크 검사
→ Git diff 검토
→ 커밋 및 원격 반영
```

## 검증 기준

- `git diff --check`가 통과해야 합니다.
- 모든 Markdown 상대 링크가 실제 파일 또는 디렉터리를 가리켜야 합니다.
- 오래된 폴더명과 이동 전 경로가 문서에 남지 않아야 합니다.
- 날짜 폴더가 비어 있지 않아야 합니다.
- 이동한 문서는 Git에서 가능한 한 rename으로 인식되어야 합니다.
- 커밋 전 변경 범위에 민감정보가 없는지 확인합니다.

## Git 운영

- 기본 브랜치는 `main`입니다.
- 하나의 커밋에는 하나의 논리적 변경 목적을 담습니다.
- 커밋 메시지는 수행한 결과를 명확하게 설명합니다.
- 사용자가 커밋과 푸시를 포함한 변경 작업을 요청한 경우 검증 후 끝까지 수행합니다.
- 강제 푸시, 기록 재작성, 광범위 삭제는 사용자의 명시적인 요청 없이 수행하지 않습니다.
