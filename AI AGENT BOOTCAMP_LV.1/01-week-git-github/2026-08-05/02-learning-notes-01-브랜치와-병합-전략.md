# Git & GitHub 2장 — 브랜치, 병합, Rebase, Conflict

## 전체 흐름

```text
main에서 기능 브랜치 생성
  ↓
feature 브랜치에서 독립 작업
  ↓
main과 병합(merge)
  ↓
필요하면 rebase로 히스토리 정리
  ↓
충돌(conflict) 발생 시 직접 해결
```

---

# 2장 1강: 브랜치 개념과 생성/전환

## 1. 브랜치란?

브랜치는 **파일 복사본이 아니라 특정 커밋을 가리키는 포인터**다.

```text
A ← B ← C  ← main
                ↑
               HEAD
```

`feature/login` 브랜치를 만들면 새로운 파일 복사본이 생기는 것이 아니라, 같은 커밋 `C`를 가리키는 새로운 포인터가 하나 생긴다.

```text
A ← B ← C  ← main
                ↑
        feature/login
                ↑
               HEAD
```

feature 브랜치에서 새 커밋을 만들면 feature 포인터만 앞으로 이동한다.

```text
A ← B ← C ← D ← E  ← feature/login
             ↑
            main
```

### 한 줄 요약
> 브랜치 = 특정 커밋을 가리키는 가벼운 이름표(포인터)

## 2. HEAD란?

HEAD는 **현재 내가 작업 중인 브랜치 또는 커밋을 가리키는 포인터**다.

브랜치를 전환하면:

1. HEAD가 새 브랜치로 이동
2. 그 브랜치의 최신 커밋이 인덱스에 반영
3. 워킹 디렉터리 파일도 해당 상태로 변경

즉, `git switch feature/login`을 하면 단순히 이름만 바뀌는 것이 아니라 실제 작업 파일 상태도 해당 브랜치 기준으로 바뀐다.

## 3. 주요 명령어

```bash
# 브랜치 목록
 git branch

# 원격 포함 전체 목록
 git branch -a

# 브랜치 생성만
 git branch feature/login

# 브랜치 생성 + 전환
 git switch -c feature/login

# 브랜치 전환
 git switch feature/login

# 병합된 브랜치 삭제
 git branch -d feature/login

# 강제 삭제
 git branch -D feature/login
```

`git checkout`도 브랜치 전환에 쓸 수 있지만, Git 2.23 이후에는 역할이 더 명확한 `git switch` 사용이 권장된다.

## 4. 브랜치 전환 전에 주의할 점

커밋되지 않은 변경사항이 전환 대상 브랜치의 파일과 겹치면 Git은 전환을 막는다.

따라서 브랜치 전환 전에는:

- 작업을 commit하거나
- `git stash`로 임시 저장

하는 것이 안전하다.

## 5. Feature Branch 전략

팀 프로젝트에서는 기능마다 브랜치를 나눠 작업한다.

```text
main
 ├─ feature/login
 ├─ feature/user-profile
 ├─ fix/login-bug
 └─ hotfix/payment-error
```

장점:

- main을 안정적인 상태로 유지
- 여러 기능을 동시에 개발 가능
- 코드 리뷰 후 병합 가능
- 다른 팀원의 작업에 영향 최소화

### 브랜치 네이밍 예시

- `feature/기능명`
- `fix/버그명`
- `hotfix/긴급수정명`
- `release/버전`

### 핵심 정리

- 브랜치는 커밋을 가리키는 포인터다.
- HEAD는 현재 작업 위치를 나타낸다.
- `git switch -c`로 브랜치 생성과 전환을 동시에 할 수 있다.
- 브랜치 전환 시 워킹 디렉터리도 함께 바뀐다.
- 기능별 브랜치를 사용하면 main을 안정적으로 유지할 수 있다.

---

# 2장 2강: 병합 전략 — Fast-forward vs 3-way merge

## 1. Fast-forward Merge

main에서 브랜치를 만든 뒤 main에는 새 커밋이 없고 feature만 앞으로 진행된 경우 발생한다.

```text
A ← B ← C ← D ← E  ← feature
         ↑
        main
```

병합하면 새 병합 커밋을 만들지 않고 main 포인터만 앞으로 이동한다.

```text
A ← B ← C ← D ← E
                 ↑
          main, feature
```

### 발생 조건

- main이 feature의 조상 커밋일 것
- 브랜치를 만든 뒤 main에 새 커밋이 없을 것

## 2. 3-way Merge

main과 feature가 분기한 뒤 **양쪽 모두 새 커밋이 생긴 경우** 사용된다.

Git은 다음 3개를 비교한다.

1. 공통 조상(Base)
2. main 최신 커밋
3. feature 최신 커밋

그리고 새로운 병합 커밋을 만든다.

```text
A ← B ← C ← M  ← main
     ↖       ↑
      D ← E ─┘
          ↑
       feature
```

병합 커밋 `M`은 두 부모 커밋을 가진다.

## 3. 주요 merge 옵션

### `--no-ff`

Fast-forward가 가능한 상황에서도 병합 커밋을 강제로 남긴다.

```bash
 git merge --no-ff feature/login
```

장점: 기능 브랜치가 언제 병합됐는지 히스토리에서 명확히 확인 가능.

### `--squash`

feature의 여러 커밋을 하나로 압축해서 스테이징 영역에 올린다.

```bash
 git merge --squash feature/login
 git commit -m "feat: 로그인 기능 추가"
```

## 4. 병합 방식 비교

| 방식 | 특징 |
|---|---|
| Fast-forward | 포인터만 이동, 히스토리가 직선 |
| 3-way merge | 병합 커밋 생성, 분기 흐름 보존 |
| `--no-ff` | FF 가능해도 병합 커밋 강제 |
| `--squash` | 여러 커밋을 하나로 압축 |

GitHub PR에서는 팀 정책에 따라 다음을 선택할 수 있다.

- Merge Commit
- Squash and Merge
- Rebase and Merge

### 핵심 정리

- Fast-forward는 분기가 없을 때 포인터만 이동한다.
- 3-way merge는 양쪽 브랜치 모두 커밋이 생겼을 때 병합 커밋을 만든다.
- `--no-ff`는 브랜치 병합 흔적을 남긴다.
- `--squash`는 여러 커밋을 하나로 합친다.

---

# 2장 3강: Rebase로 선형 이력 만들기

## 1. Rebase란?

Rebase는 말 그대로 **base(기반)를 다시 설정하는 작업**이다.

feature 브랜치의 커밋을 main 최신 커밋 위에 다시 적용한다.

### rebase 전

```text
A ← B ← C  ← main
     ↖
      D ← E  ← feature
```

### `git rebase main` 후

```text
A ← B ← C  ← main
             ↖
              D' ← E'  ← feature
```

`D'`, `E'`는 내용은 같지만 **새로운 커밋 해시를 가진 새 커밋**이다.

## 2. Merge vs Rebase

| 항목 | Merge | Rebase |
|---|---|---|
| 히스토리 | 분기/병합 구조 | 직선 구조 |
| 병합 커밋 | 생성 가능 | 생성 안 됨 |
| 커밋 해시 | 유지 | 변경됨 |
| 공유 브랜치 | 안전 | 위험 |

## 3. 실무 기준

- 개인 feature 브랜치: rebase 가능
- main/develop 같은 공유 브랜치: rebase 금지

### Rebase 황금률

> **공유된 커밋은 rebase하지 않는다.**

이유는 rebase가 기존 커밋을 새 해시로 다시 생성하기 때문이다.

이미 다른 사람이 같은 커밋을 기준으로 작업하고 있다면 히스토리가 서로 달라져 큰 혼란이 생길 수 있다.

이미 원격에 push한 개인 브랜치를 rebase했다면 강제 push가 필요할 수 있다.

```bash
 git push --force-with-lease
```

### 핵심 정리

- rebase는 브랜치의 시작점을 다시 설정한다.
- 커밋이 새로 만들어져 SHA가 바뀐다.
- 히스토리를 직선으로 정리할 수 있다.
- 공유 브랜치에는 사용하면 안 된다.

---

# 2장 4강: 충돌(Conflict) 해결 실전

## 1. Conflict란?

두 브랜치가 **같은 파일의 같은 부분을 서로 다르게 수정**해 Git이 자동으로 어느 쪽을 선택할지 결정할 수 없는 상태다.

충돌은 오류라기보다:

> "이 부분은 사람이 직접 판단해 주세요."

라는 Git의 신호다.

## 2. 충돌 마커 읽기

```text
<<<<<<< HEAD
현재 브랜치 내용
=======
병합하려는 브랜치 내용
>>>>>>> feature/login
```

의미:

- `<<<<<<< HEAD` ~ `=======` : 현재 브랜치 내용
- `=======` ~ `>>>>>>> feature/login` : 병합 대상 브랜치 내용

둘 중 하나를 선택하거나 두 내용을 합친 뒤 **충돌 마커를 전부 삭제**해야 한다.

## 3. Merge 충돌 해결 순서

```bash
# 1. 충돌 파일 확인
 git status

# 2. 파일을 열고 충돌 마커 직접 수정

# 3. 해결된 파일 스테이징
 git add README.md

# 4. 병합 커밋 생성
 git commit
```

정리하면:

```text
Conflict 발생
  ↓
git status
  ↓
충돌 파일 직접 수정
  ↓
<<<<<<< ======= >>>>>>> 제거
  ↓
git add
  ↓
git commit
```

## 4. Rebase 중 충돌

rebase는 커밋을 하나씩 다시 적용하므로 충돌이 여러 번 발생할 수 있다.

```bash
# 충돌 해결 후
 git add <파일>
 git rebase --continue

# 현재 커밋 건너뛰기
 git rebase --skip

# rebase 전체 취소
 git rebase --abort
```

| 명령어 | 의미 |
|---|---|
| `--continue` | 해결 후 계속 |
| `--skip` | 현재 커밋 건너뜀 |
| `--abort` | rebase 시작 전으로 복구 |

merge 중 충돌이 너무 복잡하면:

```bash
 git merge --abort
```

## 5. 충돌 예방 습관

- 작은 단위로 자주 커밋
- 오래 묵히지 말고 자주 병합
- 기능별 파일/역할 분리
- main 변경사항을 자주 반영
- PR과 코드 리뷰 활용
- 누가 어느 파일을 담당하는지 명확히 정하기

### 핵심 정리

- 충돌은 Git이 자동으로 선택할 수 없을 때 발생한다.
- 충돌 마커를 직접 수정하고 제거해야 한다.
- merge 충돌: 수정 → `git add` → `git commit`
- rebase 충돌: 수정 → `git add` → `git rebase --continue`
- 너무 복잡하면 `--abort`로 되돌릴 수 있다.

---

# 2장 전체 연결해서 이해하기

```text
1. main에서 feature 브랜치 생성
       ↓
2. feature에서 독립 작업
       ↓
3. main 변경사항과 합칠 필요가 생김
       ↓
   ┌───────────────┐
   │ merge         │ → 분기 이력 보존
   │ rebase        │ → 선형 이력 정리
   └───────────────┘
       ↓
4. 같은 부분 수정 시 Conflict
       ↓
5. 사람이 직접 최종 코드 결정
```

## 꼭 기억할 명령어

```bash
# 브랜치 생성 + 이동
 git switch -c feature/login

# 브랜치 목록
 git branch

# main으로 이동
 git switch main

# 병합
 git merge feature/login

# rebase
 git rebase main

# 히스토리 확인
 git log --oneline --graph --all

# 충돌 상태 확인
 git status

# merge 취소
 git merge --abort

# rebase 계속 / 취소
 git rebase --continue
 git rebase --abort
```

## 오늘 반드시 설명할 수 있어야 하는 것

1. 브랜치는 파일 복사본이 아니라 **커밋을 가리키는 포인터**다.
2. HEAD는 **현재 내가 작업 중인 위치**를 가리킨다.
3. Fast-forward는 **포인터 이동**, 3-way는 **병합 커밋 생성**이다.
4. rebase는 **커밋의 base를 바꾸며 새 SHA를 만든다.**
5. 공유된 커밋에는 rebase하지 않는다.
6. Conflict는 실패가 아니라 **Git이 사람의 판단을 요구하는 정상 과정**이다.
