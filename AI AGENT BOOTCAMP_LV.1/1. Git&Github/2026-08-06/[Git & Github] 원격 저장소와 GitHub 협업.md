# Git & GitHub 3장 — 원격 저장소, Issue, PR, GitHub Flow

## 전체 흐름

```text
로컬 저장소
  ↓ remote 연결
원격 저장소(GitHub)
  ↓ push / fetch / pull
코드 동기화
  ↓ Issue로 작업 정의
기능 브랜치에서 작업
  ↓ PR 생성
코드 리뷰
  ↓ merge
main 반영
  ↓
GitHub Flow로 팀 협업 반복
```

---

# 3장 1강: 원격 저장소 연결과 동기화

## 1. 원격 저장소(Remote Repository)

원격 저장소는 GitHub, GitLab, Bitbucket처럼 인터넷이나 네트워크에 존재하는 Git 저장소다.

- 로컬 저장소: 내 컴퓨터
- 원격 저장소: 서버

`origin`은 첫 번째 원격 저장소에 관례적으로 붙이는 기본 별명(alias)이다.

```bash
git remote -v
```

원격 저장소를 등록할 때는 다음처럼 사용한다.

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 한 줄 요약
> origin = 원격 저장소 URL에 붙이는 대표적인 별명

## 2. push / pull / fetch 차이

| 명령어 | 방향 | 의미 |
|---|---|---|
| `git push` | 로컬 → 원격 | 내 로컬 커밋을 GitHub에 올림 |
| `git fetch` | 원격 → 로컬 | 원격 변경을 가져오지만 현재 브랜치에는 자동 반영하지 않음 |
| `git pull` | 원격 → 로컬 | fetch + merge를 한 번에 수행 |

### fetch가 더 안전한 이유

`git fetch`는 원격 상태를 `origin/main` 같은 원격 추적 브랜치에만 반영한다.

```bash
git fetch origin
git log origin/main --oneline
git diff main origin/main
git merge origin/main
```

즉, 먼저 확인한 뒤 직접 합칠 수 있다.

## 3. Upstream(추적 브랜치)

추적 브랜치는 로컬 브랜치가 기본으로 바라보는 원격 브랜치다.

첫 push 때 다음처럼 설정할 수 있다.

```bash
git push -u origin main
```

이후에는 간단하게:

```bash
git push
git pull
```

만 입력해도 연결된 원격 브랜치와 동기화된다.

확인은:

```bash
git branch -vv
```

## 4. pull --rebase

로컬과 원격 양쪽에 새 커밋이 있을 때 기본 `git pull`은 merge commit을 만들 수 있다.

`git pull --rebase`는 원격 커밋을 먼저 반영한 뒤 내 로컬 커밋을 그 위에 다시 쌓아 선형 히스토리를 만든다.

```bash
git pull --rebase origin main
```

### 핵심 정리

- `git remote add origin <URL>`: 원격 등록
- `git push -u origin main`: 첫 push + upstream 설정
- `git fetch`: 원격만 가져오기
- `git pull`: fetch + merge
- `git pull --rebase`: 원격 위에 내 커밋을 재배치

---

# 3장 2강: GitHub 저장소 구성과 Issue 관리

## 1. 협업용 저장소 기본 구성

| 파일/폴더 | 역할 |
|---|---|
| `README.md` | 프로젝트 소개, 설치/실행 방법 |
| `LICENSE` | 라이선스 명시 |
| `.github/` | GitHub 전용 설정 |
| `.github/ISSUE_TEMPLATE/` | Issue 템플릿 |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR 템플릿 |
| `CONTRIBUTING.md` | 협업/기여 규칙 |

README는 새 팀원이 프로젝트를 처음 이해하는 입구 역할을 한다.

## 2. Issue 템플릿

Issue 템플릿은 작성자가 필요한 정보를 빼먹지 않도록 형식을 통일한다.

예시:

```markdown
---
name: 버그 리포트
about: 버그를 발견했을 때 작성해주세요
---

## 버그 설명

## 재현 방법
1. ...
2. ...

## 기대 동작

## 환경
- OS:
- Python:
```

AI 프로젝트라면 Python 버전, 데이터 경로, GPU 사양 같은 정보를 반복적으로 받아야 하므로 템플릿이 특히 유용하다.

## 3. Label / Milestone / Project Board

| 기능 | 목적 | 예시 |
|---|---|---|
| Label | Issue/PR 분류 | bug, feature, docs |
| Milestone | 목표 단위 묶기 | v1.0, Sprint 1 |
| Project Board | 진행 상태 시각화 | Todo → In Progress → Done |

Issue를 단순 메모가 아니라 **작업의 단위**로 관리하는 것이 핵심이다.

좋은 운영 방식:

- Issue 하나 = 작업 하나
- Assignee 지정
- Label / Milestone 설정
- Project Board 상태 이동
- PR과 연결

## 4. Issue ↔ PR ↔ Commit 연결

커밋에서 Issue 참조:

```bash
git commit -m "feat: 로그인 기능 구현 (#12)"
```

PR 본문에서 자동 닫기:

```text
Closes #12
Fixes #15
Resolves #8
```

PR이 merge되면 연결된 Issue가 자동으로 닫힌다.

## 5. GitHub Issues vs Jira vs Redmine

| 도구 | 특징 |
|---|---|
| GitHub Issues | 코드/PR과 바로 연결, 소규모에 편리 |
| Jira | 스프린트/백로그/리포트에 강함 |
| Redmine | 오픈소스, 자체 호스팅 가능 |

### 핵심 정리

- README, LICENSE, `.github/`는 협업 저장소의 기본 요소
- Issue 템플릿으로 입력 형식을 표준화
- Label / Milestone / Project Board로 작업 상태 관리
- `Closes #번호`로 PR과 Issue 자동 연결

---

# 3장 3강: Pull Request 라이프사이클과 코드 리뷰

## 1. PR 라이프사이클

```text
기능 브랜치 생성
  ↓
작업 + commit
  ↓
push
  ↓
PR 생성
  ↓
리뷰
  ↓
수정 commit 추가
  ↓
Approve
  ↓
Merge
  ↓
브랜치 삭제
```

PR은 열려 있는 동안 같은 브랜치에 새 커밋을 push하면 자동으로 갱신된다.

## 2. 좋은 PR 본문

PR 본문에는 최소한 다음 3가지를 포함한다.

- **Why**: 왜 변경하는가
- **What**: 무엇을 바꿨는가
- **How to test**: 어떻게 확인할 수 있는가

예시:

```markdown
## 변경 이유
로그인 세션 만료 오류를 수정합니다.
Closes #23

## 주요 변경사항
- SessionManager 만료 시간 갱신 로직 추가
- 로그인 성공 시 토큰 재발급 처리

## 테스트 방법
1. 로그인
2. 30분 후 재접속
3. 자동 갱신 확인
```

## 3. 코드 리뷰 액션

| 액션 | 의미 |
|---|---|
| Comment | 일반 의견, 질문, 제안 |
| Approve | 변경 승인 |
| Request changes | 머지 전 필수 수정 요청 |

Branch Protection이 설정돼 있으면 Request changes 상태에서 머지를 막을 수 있다.

## 4. 좋은 리뷰 코멘트

좋은 리뷰는 사람보다 코드와 동작에 집중한다.

좋은 기준:

- 구체적으로 설명
- 문제뿐 아니라 대안 제안
- 사람을 비판하지 않기
- 잘된 부분도 명시
- 중요도 표시: `nit:`, `blocking:` 등

예:

```text
blocking: 이 함수가 None을 반환할 수 있는데 호출부에서 처리하지 않아 오류가 날 수 있어요.
None 처리 분기를 추가하는 것이 좋겠습니다.
```

## 5. PR 머지 전략

| 전략 | 히스토리 |
|---|---|
| Merge commit | 분기와 병합 흔적 유지 |
| Squash and merge | PR 전체를 커밋 1개로 압축 |
| Rebase and merge | 각 커밋을 main 위에 선형으로 재배치 |

AI 프로젝트처럼 실험 커밋이 많다면 Squash and merge로 정리하는 경우가 많다.

## 6. 머지 후 브랜치 정리

```bash
git branch -d feature/add-greeting
git remote prune origin
```

Squash and merge 후에는 Git이 로컬 브랜치를 병합된 것으로 인식하지 못할 수 있다.

PR 머지 완료를 확인했다면:

```bash
git branch -D feature/add-greeting
```

으로 강제 삭제할 수 있다.

### 핵심 정리

- PR = 코드 변경을 팀과 검토하는 협업 프로세스
- Why / What / How to test를 본문에 작성
- Comment / Approve / Request changes의 역할 구분
- 머지 전략에 따라 main 히스토리 구조가 달라짐

---

# 3장 4강: GitHub Flow와 팀 협업 룰 설계

## 1. GitHub Flow 6단계

1. main은 항상 배포 가능한 상태 유지
2. 새 작업은 main에서 기능 브랜치 생성
3. feature에서 작업 후 원격에 push
4. 작업 완료 후 PR 생성
5. 리뷰 및 Approve 후 merge
6. merge 후 배포하고 브랜치 삭제

```bash
git checkout main
git pull origin main
git checkout -b feature/user-auth
# 작업
git push -u origin feature/user-auth
```

## 2. GitHub Flow / Git Flow / Trunk-based 비교

| 방식 | 구조 | 적합한 상황 |
|---|---|---|
| GitHub Flow | main + feature | 소규모, 빠른 배포 |
| Git Flow | main + develop + feature + release + hotfix | 버전 관리가 중요한 중대형 팀 |
| Trunk-based | main/trunk 중심 | CI/CD가 성숙한 팀 |

강의에서는 AI 엔지니어 팀처럼 빠른 실험과 배포가 필요한 경우 GitHub Flow가 실용적이라고 설명한다.

## 3. 팀 협업 룰

### 브랜치 네이밍

- `feature/{설명}`
- `fix/{설명}`
- `docs/{설명}`
- `exp/{설명}`

예:

```text
feature/data-pipeline
fix/null-pointer-error
docs/update-readme
exp/gpt4-prompt-test
```

### PR 크기 가이드

- PR 하나 = 하나의 기능 또는 수정
- 변경 파일 10개 이내 권장
- 변경 라인 400줄 이내 권장

### 리뷰어 규칙

- 최소 1명 리뷰어 지정
- 본인 코드 본인 단독 머지 금지
- 긴급 hotfix는 팀 규칙에 따라 예외 허용 가능

## 4. Branch Protection Rules

main을 시스템적으로 보호하는 기능이다.

주요 설정:

- Require a pull request before merging
- Require approvals
- Require status checks to pass
- Require linear history
- Include administrators

효과:

- main 직접 push 차단
- 리뷰 없는 머지 차단
- CI 실패 시 머지 차단

## 5. AI 프로젝트 협업 예시

| 역할 | 담당 | 브랜치 예시 |
|---|---|---|
| 데이터 엔지니어 | 수집/전처리 | `feature/data-crawling` |
| 모델 엔지니어 | 학습/평가 | `exp/gpt-finetuning` |
| 서빙 엔지니어 | API/배포 | `feature/fastapi-endpoint` |
| 프로젝트 리더 | 리뷰/머지 | main 관리 |

AI 실험 브랜치는 `exp/`로 분리해 미완성 실험 코드가 main에 바로 들어가지 않도록 관리한다.

### 핵심 정리

- GitHub Flow는 main 중심의 단순한 협업 방식
- 새 작업은 feature 브랜치에서 수행
- PR과 리뷰를 거쳐 main에 merge
- 팀 시작 전에 브랜치/PR/리뷰/머지 규칙을 문서화
- Branch Protection으로 main 보호

---

# 3장 전체 연결해서 이해하기

```text
[로컬 작업]
   ↓
git remote로 GitHub 연결
   ↓
push / fetch / pull
   ↓
[GitHub 저장소]
   ↓
Issue = 해야 할 일 정의
   ↓
feature 브랜치 생성
   ↓
작업 + commit + push
   ↓
PR = 변경 검토 요청
   ↓
코드 리뷰
   ↓
Approve
   ↓
Merge
   ↓
Issue 종료 + 브랜치 삭제
   ↓
다음 작업 반복
```

## 꼭 기억할 명령어

```bash
# 원격 저장소 확인
git remote -v

# 원격 저장소 등록
git remote add origin <URL>

# 첫 push + upstream 설정
git push -u origin main

# 원격 변경만 가져오기
git fetch origin

# 원격 변경 반영
git pull

# rebase 방식 pull
git pull --rebase origin main

# 기능 브랜치 생성
git switch -c feature/login

# 원격 feature 브랜치 최초 push
git push -u origin feature/login

# 브랜치 삭제
git branch -d feature/login

# 원격에서 사라진 브랜치 정리
git remote prune origin
```

## 오늘 반드시 설명할 수 있어야 하는 것

1. `origin`은 원격 저장소 URL에 붙이는 별명이다.
2. `push`, `pull`, `fetch`의 차이를 설명할 수 있다.
3. upstream은 로컬 브랜치가 기본으로 연결된 원격 브랜치다.
4. Issue는 단순 메모가 아니라 작업 단위로 사용할 수 있다.
5. PR은 코드 변경을 리뷰하고 main에 반영하는 협업 절차다.
6. Squash / Rebase / Merge commit의 차이를 설명할 수 있다.
7. GitHub Flow는 **feature → PR → review → merge**의 반복 구조다.
8. Branch Protection은 main 직접 push나 리뷰 없는 merge를 시스템적으로 막는다.
