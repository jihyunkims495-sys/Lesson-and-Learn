# Git & GitHub 학습 정리 — 2026-08-04

> 범위: Git & Github 1장 1강 ~ 5강

## 오늘의 학습 목표

- 버전 관리가 왜 필요한지 설명할 수 있다.
- Git과 GitHub의 차이를 구분할 수 있다.
- Git의 3영역(Working Directory, Staging Area, Repository)을 이해한다.
- Git 사용자 설정과 GitHub 인증 방식을 이해한다.
- `git init`, `git clone`, `.gitignore`의 역할을 구분한다.
- `status → add → commit` 흐름을 설명할 수 있다.
- `git diff`, `git log`, `git show`로 변경 이력을 확인할 수 있다.

---

# 1. Git 동작 원리와 3영역 모델

## 1-1. 버전 관리란?

버전 관리(Version Control)는 파일의 변화를 시간 순서대로 기록하고, 필요할 때 특정 시점으로 돌아갈 수 있게 해주는 시스템이다.

예전처럼 `final.py`, `final_v2.py`, `final_진짜최종.py`처럼 파일 이름으로 버전을 관리하는 대신 Git이 변경 이력을 체계적으로 관리한다.

AI/LLM 개발에서는 프롬프트 한 줄이나 하이퍼파라미터 하나가 결과를 바꿀 수 있기 때문에, 어떤 설정과 코드에서 어떤 결과가 나왔는지 다시 재현하려면 버전 관리가 특히 중요하다.

### 한 줄 요약

> Git은 코드와 실험의 변경 이력을 남겨서 이전 상태를 추적하고 재현할 수 있게 해주는 도구다.

---

## 1-2. Git과 GitHub의 차이

- **Git**: 내 컴퓨터에서 동작하는 버전 관리 도구
- **GitHub**: Git 저장소를 온라인에 보관하고 공유하는 서비스

즉 Git은 GitHub 없이도 사용할 수 있지만, GitHub는 Git 저장소를 기반으로 동작한다.

---

## 1-3. 분산 버전 관리(DVCS)

Git은 분산 버전 관리 시스템(DVCS)이다.

각 개발자가 전체 커밋 이력을 자신의 로컬 컴퓨터에 가지고 있기 때문에 인터넷이 없어도 작업할 수 있고, 중앙 서버에 문제가 생겨도 각자의 로컬에 이력이 남는다.

Git의 커밋 이력은 단순한 직선이 아니라 **DAG(Directed Acyclic Graph, 방향성 비순환 그래프)** 구조다. 각 커밋이 이전 커밋을 가리키고, 브랜치와 병합이 생기면 그래프가 갈라지거나 다시 합쳐진다.

---

## 1-4. Git의 3영역

Git은 파일의 변경을 세 공간에서 관리한다.

| 영역 | 영어 | 역할 |
| --- | --- | --- |
| 작업 디렉터리 | Working Directory | 실제로 파일을 수정하는 공간 |
| 스테이징 영역 | Staging Area / Index | 다음 커밋에 포함할 변경을 골라두는 공간 |
| 저장소 | Repository | 커밋이 영구적으로 저장되는 공간 (`.git`) |

### 흐름

```text
Working Directory
      ↓ git add
Staging Area
      ↓ git commit
Repository
```

`git status`는 이동시키는 명령이 아니라 현재 각 영역의 상태를 확인하는 명령이다.

### 핵심 기억

> `add` = 다음 커밋에 넣을 변경 선택  
> `commit` = 선택한 변경을 저장

---

## 1-5. 스냅샷, HEAD, 브랜치, SHA

Git은 변경된 줄만 단순 기록하는 방식이 아니라, 커밋 시점의 프로젝트 상태를 **스냅샷(snapshot)** 형태로 기록한다.

- **HEAD**: 현재 작업 중인 커밋 또는 브랜치를 가리키는 포인터
- **브랜치 포인터**: 특정 커밋을 가리키는 이름표
- **SHA 해시**: 각 커밋에 부여되는 고유 ID

스테이징 영역이 필요한 이유는 한 번에 바뀐 여러 변경 중에서 **이번 커밋에 넣을 것만 선택하기 위해서**다.

---

# 2. Git 환경 설정과 GitHub 인증

## 2-1. git config 범위

Git 설정은 세 범위로 나뉜다.

| 범위 | 옵션 | 적용 대상 |
| --- | --- | --- |
| 시스템 | `--system` | 컴퓨터 전체 사용자 |
| 전역 | `--global` | 현재 OS 사용자의 모든 저장소 |
| 로컬 | `--local` | 현재 저장소 하나 |

우선순위는 범위가 좁을수록 높아서 `local` 설정이 `global` 설정을 덮어쓴다.

### 기본 설정 예시

```bash
git --version
git config --global user.name "홍길동"
git config --global user.email "hong@example.com"
git config --global core.editor "code --wait"
git config --list
```

---

## 2-2. SSH와 PAT

GitHub 인증 방식에는 대표적으로 SSH 키와 PAT(Personal Access Token)가 있다.

| 항목 | SSH | PAT |
| --- | --- | --- |
| 설정 | 키 생성 및 등록 필요 | 토큰 발급 후 사용 |
| 보안 | 높음 | 토큰 유출 주의 |
| 만료 | 보통 없음 | 만료일 설정 가능 |
| 추천 | 개인 개발 PC | CI/CD, 자동화 환경 |

SSH는 공개키/비공개키 쌍으로 동작한다.

- 비공개키: 내 컴퓨터에 보관
- 공개키: GitHub에 등록

### SSH 키 생성

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 인증 확인

```bash
ssh -T git@github.com
```

---

# 3. 저장소 초기화와 .gitignore

## 3-1. git init vs git clone

| 명령어 | 언제 사용? | 동작 |
| --- | --- | --- |
| `git init` | 새 프로젝트 시작 | 현재 폴더에 `.git` 생성 |
| `git clone` | 기존 원격 저장소 가져오기 | 커밋 이력과 브랜치까지 전체 복사 |

```bash
git init
git clone https://github.com/user/repo.git
```

---

## 3-2. .gitignore

`.gitignore`는 Git이 추적하지 않을 파일이나 폴더를 지정하는 파일이다.

AI/ML 프로젝트에서는 특히 다음 항목을 제외할 필요가 있다.

```text
.env
__pycache__/
*.pkl
*.h5
.ipynb_checkpoints/
```

### 주요 패턴

| 패턴 | 의미 |
| --- | --- |
| `*.log` | 모든 `.log` 파일 제외 |
| `build/` | build 폴더 전체 제외 |
| `!important.log` | 제외 대상에서 다시 포함 |
| `**/*.pyc` | 모든 하위 폴더의 `.pyc` 제외 |

이미 Git이 추적 중인 파일은 `.gitignore`에 추가하는 것만으로는 추적이 중단되지 않는다.

```bash
git rm --cached .env
git rm --cached -r __pycache__/
```

`--cached`는 Git 인덱스에서만 제거하므로 로컬 파일은 그대로 남는다.

### 매우 중요

이미 GitHub에 올라간 API Key나 토큰은 `.gitignore`로 해결되지 않는다. 노출된 키는 즉시 폐기하고 재발급해야 한다.

---

# 4. 스테이징과 커밋 기본 워크플로우

## 4-1. 기본 흐름

```bash
git status
git diff
git add .
git diff --staged
git commit -m "feat: add data preprocessing module"
```

- `git status`: 현재 파일 상태 확인
- `git diff`: 아직 스테이징하지 않은 변경 확인
- `git add`: 변경을 스테이징 영역에 올림
- `git diff --staged`: 커밋 예정 변경 확인
- `git commit`: 스테이징된 변경을 저장

### 좋은 습관

> add 전에는 `git diff`, commit 전에는 `git diff --staged`

---

## 4-2. 부분 스테이징

```bash
git add -p filename.py
```

한 파일 안에 서로 다른 목적의 수정이 섞여 있을 때 변경 덩어리(hunk) 단위로 골라서 스테이징할 수 있다.

- `y`: 포함
- `n`: 제외
- `s`: 더 작게 나누기
- `q`: 종료

---

## 4-3. Conventional Commits

커밋 메시지를 일정한 형식으로 작성하기 위한 규칙이다.

| 타입 | 의미 | 예시 |
| --- | --- | --- |
| `feat` | 새 기능 | `feat: add login button` |
| `fix` | 버그 수정 | `fix: resolve login error` |
| `docs` | 문서 변경 | `docs: update README` |
| `refactor` | 리팩터링 | `refactor: extract validation logic` |
| `chore` | 설정/빌드 | `chore: update .gitignore` |
| `test` | 테스트 | `test: add auth tests` |

기본 형식:

```text
<type>(<scope>): <subject>
```

### 가장 중요한 원칙

> 한 커밋에는 한 가지 의도만 담는다.

기능 추가와 버그 수정을 한 커밋에 섞지 않는 것이 좋다.

---

# 5. 변경 추적: diff와 log

## 5-1. git diff

| 명령어 | 비교 대상 |
| --- | --- |
| `git diff` | Working Directory ↔ Staging Area |
| `git diff --staged` | Staging Area ↔ HEAD |
| `git diff HEAD` | Working Directory ↔ HEAD |
| `git diff <SHA1> <SHA2>` | 두 커밋 사이 |

추가로 자주 쓰는 명령어:

```bash
git diff --stat
git diff --name-only
```

- `--stat`: 어떤 파일이 얼마나 바뀌었는지 요약
- `--name-only`: 변경된 파일 이름만 확인

---

## 5-2. git log

```bash
git log --oneline --graph --all --decorate
```

자주 쓰는 옵션:

| 옵션 | 의미 |
| --- | --- |
| `--oneline` | 한 줄 요약 |
| `--graph` | 브랜치 흐름을 그래프로 표시 |
| `--all` | 모든 브랜치 표시 |
| `--decorate` | 브랜치/태그 이름 표시 |
| `--author="이름"` | 작성자 필터 |
| `--since="날짜"` | 특정 날짜 이후 |
| `-p` | 커밋별 diff 포함 |
| `-n 5` | 최근 5개만 표시 |

특정 커밋의 상세 변경은 다음처럼 확인한다.

```bash
git show <SHA>
```

---

# 오늘 꼭 기억할 것

1. **Git은 버전 관리 도구, GitHub는 원격 저장 서비스다.**
2. **Git은 Working Directory → Staging Area → Repository의 3영역으로 관리한다.**
3. **`git add`는 스테이징, `git commit`은 저장이다.**
4. **`git init`은 새 저장소, `git clone`은 기존 저장소 복제다.**
5. **`.gitignore`는 추적하지 않을 파일을 정한다.**
6. **커밋 전에는 `git diff`와 `git diff --staged`로 확인한다.**
7. **한 커밋에는 한 가지 의도만 담는다.**
8. **`git log`와 `git show`로 과거 이력을 추적한다.**

---

## 흐름으로 한 번에 외우기

```text
파일 수정
  ↓
git status
  ↓
git diff
  ↓
git add
  ↓
git diff --staged
  ↓
git commit
  ↓
git log
```

> Git은 결국 **"무엇을 바꿨는지 확인하고 → 이번에 저장할 것을 고르고 → 의미 있는 단위로 기록하는 도구"**라고 이해하면 된다.
