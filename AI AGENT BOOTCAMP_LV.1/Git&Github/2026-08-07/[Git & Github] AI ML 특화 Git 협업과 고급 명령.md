# Git & GitHub 4장 — AI/ML 특화 협업 이슈와 실전 고급 명령

## 전체 흐름

```text
AI/ML 프로젝트의 특수 문제
  ├─ 대용량 모델/데이터 → Git LFS / Hugging Face Hub / DVC
  ├─ Jupyter Notebook diff 노이즈 → nbstripout
  └─ API Key 유출 → .env + .gitignore + pre-commit

실전 위기 상황
  ├─ 작업 임시 보관 → git stash
  ├─ 특정 커밋만 가져오기 → git cherry-pick
  ├─ 삭제/실수 복구 → git reflog
  └─ 버전 표시 → git tag + GitHub Release
```

---

# 4장 1강: AI/ML 특화 협업 이슈와 도구

## 1. 대용량 파일 관리 — Git LFS

AI/ML 프로젝트에서는 모델 가중치와 데이터셋이 수백 MB~수 GB에 이를 수 있다.

일반 Git에 대용량 파일을 계속 넣으면 저장소가 무거워지고 clone/pull 속도가 느려진다.

### Git LFS의 핵심 원리

Git LFS는 실제 대용량 파일을 별도 스토리지에 저장하고, Git 저장소에는 작은 포인터 파일만 남긴다.

```text
.pth / .h5 / .bin 파일
        ↓
Git LFS가 실제 파일을 별도 스토리지에 저장
        ↓
Git 저장소에는 포인터만 저장
        ↓
clone / pull 시 실제 파일 다운로드
```

### 일반 Git vs Git LFS

| 항목 | 일반 Git | Git LFS |
|---|---|---|
| 실제 파일 저장 위치 | Git 저장소 내부 | LFS 전용 스토리지 |
| 저장소 크기 | 파일 크기만큼 증가 | 포인터만 증가 |
| clone 속도 | 대용량일수록 느려짐 | 상대적으로 가벼움 |
| AI/ML 협업 | 불편 | 모델 파일 관리에 유리 |

### 기본 설정

```bash
git lfs version
git lfs install

git lfs track "*.pth"
git lfs track "*.h5"
git lfs track "*.bin"

git add .gitattributes
git commit -m "chore: configure Git LFS for model files"
```

`.gitattributes` 파일도 반드시 커밋해야 팀원에게 동일한 LFS 규칙이 적용된다.

## 2. Git LFS의 한계와 대안

강의 자료 기준으로 GitHub Free 플랜의 LFS 용량에는 제한이 있고, 수 GB~수십 GB 데이터셋은 LFS만으로 관리하기 어렵다.

이때 대안:

- **Hugging Face Hub**: 모델/데이터셋 저장과 공유에 특화
- **DVC(Data Version Control)**: 실제 파일은 S3/GCS 같은 원격 스토리지에 두고 Git에는 `.dvc` 메타파일만 저장

### 한 줄 요약
> 코드 버전은 Git, 큰 모델/데이터는 LFS·Hub·DVC 같은 전용 방식을 사용한다.

---

## 3. Jupyter Notebook 협업 문제

`.ipynb`는 단순 코드 파일이 아니라 JSON 구조다.

여기에는 다음이 같이 저장된다.

- 코드 셀
- `execution_count`
- 셀 출력(outputs)
- 이미지 데이터

그래서 코드가 같아도 셀을 다시 실행하기만 하면 diff가 크게 생길 수 있다.

문제:

- 의미 없는 diff 증가
- Git log 노이즈 증가
- 출력물 때문에 merge conflict 발생

## 4. nbstripout

`nbstripout`은 Jupyter Notebook을 Git에 저장할 때 셀 출력과 실행 횟수를 제거한다.

핵심 특징:

- 로컬 notebook 출력은 유지
- Git에 올라가는 버전에서는 출력 제거
- 코드 변경만 깔끔하게 추적 가능

```bash
pip install nbstripout
nbstripout --install
nbstripout --status
```

### 협업 원칙

```text
저장소 = 코드 중심
결과 출력 = 로컬 실행
중요 결과 = HTML / PDF 등 별도 공유
```

---

## 5. API Key 보안

AI/ML 프로젝트에서는 OpenAI, Hugging Face, AWS 등 외부 서비스 키를 자주 사용한다.

가장 중요한 원칙:

> **API Key를 코드에 직접 쓰지 않는다.**

그리고 `.env`는 반드시 `.gitignore`로 추적에서 제외한다.

### 위험 흐름

```text
코드에 API Key 작성
  ↓
GitHub에 push
  ↓
자동 스캐너가 키 탐지
  ↓
키 악용
  ↓
비용 발생 / 데이터 노출
```

## 6. pre-commit과 Secret Scanner

`pre-commit`은 commit 직전에 자동 검사를 실행하는 도구다.

예시 설정:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: detect-private-key
  - repo: https://github.com/awslabs/git-secrets
    rev: master
    hooks:
      - id: git-secrets
```

설치:

```bash
pip install pre-commit
pre-commit install
```

강의에서는 AI/LLM 프로젝트처럼 다양한 토큰을 다루는 경우 `git-secrets`만으로는 범위가 부족할 수 있어 `gitleaks` 또는 `detect-secrets` 같은 범용 secret scanner도 권장한다.

예:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

## 7. .env 보호

```bash
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

echo "OPENAI_API_KEY=your_actual_key_here" > .env

git status
```

`.env`가 Git 상태 목록에 나타나지 않으면 정상이다.

### 4장 1강 핵심 정리

- Git LFS: 큰 파일을 포인터 방식으로 관리
- Hugging Face Hub / DVC: 더 큰 모델·데이터에 적합
- nbstripout: Notebook 출력 제거로 diff 정리
- pre-commit + secret scanner: 커밋 전 민감정보 차단
- `.env` + `.gitignore`: API Key 분리 및 추적 제외

---

# 4장 2강: 실전 고급 명령과 다음 단계

## 1. git stash — 미완성 작업 임시 보관

작업 중 갑자기 다른 브랜치로 이동해야 하는데 아직 commit하기 애매할 때 사용한다.

`git stash`는 현재 워킹 디렉터리와 스테이징 영역의 변경사항을 임시 스택에 저장하고, 워킹 트리를 마지막 commit 상태로 되돌린다.

```bash
git stash
git stash list
git stash pop
```

### pop vs apply

- `git stash pop`: 복원 + stash 목록에서 제거
- `git stash apply`: 복원하지만 stash는 유지

### 사용할 때

- 긴급 hotfix로 이동
- pull 전에 작업 잠시 치우기
- 실험 코드를 임시 보관

---

## 2. git cherry-pick — 특정 commit만 가져오기

다른 브랜치 전체를 merge하지 않고 특정 commit 하나만 현재 브랜치에 적용하고 싶을 때 사용한다.

```bash
git log develop --oneline
git cherry-pick abc1234
```

### 비교

| 상황 | 명령 |
|---|---|
| 브랜치 전체를 합치기 | merge / rebase |
| 특정 commit 하나만 가져오기 | cherry-pick |
| 여러 commit 범위 가져오기 | `git cherry-pick A..B` |

cherry-pick은 변경 내용을 복사해 새로운 SHA의 commit을 만든다.

따라서 같은 변경이 나중에 다른 방식으로 다시 들어오면 conflict가 날 수 있어 응급 상황이나 소수 commit 선택에 사용하는 것이 좋다.

---

## 3. git reflog — 잃어버린 commit 복구

브랜치를 잘못 삭제하거나 `git reset --hard`로 commit을 날렸을 때 복구에 사용할 수 있다.

Git은 HEAD가 움직인 기록을 reflog에 남긴다.

```bash
git reflog
```

예:

```text
HEAD@{0}: reset: moving to HEAD~1
HEAD@{1}: commit: Add evaluation metrics
HEAD@{2}: commit: Add training script
```

복구:

```bash
git checkout -b recover-branch HEAD@{1}
```

또는:

```bash
git reset --hard HEAD@{1}
```

### 핵심
> 브랜치 이름이 사라져도 commit 객체가 즉시 없어지는 것은 아니다. reflog를 통해 다시 찾을 수 있다.

---

## 4. git tag와 GitHub Release

AI/ML 프로젝트에서는 특정 모델 checkpoint나 기준 성능 버전에 이름을 붙여 관리하는 것이 유용하다.

### git tag

특정 commit에 사람이 읽을 수 있는 버전 이름을 붙인다.

```bash
git tag v1.0.0
git tag -a v1.0.0 -m "Baseline model: 85% accuracy on test set"
```

원격으로 push:

```bash
git push origin v1.0.0
git push origin --tags
```

### GitHub Release

Git tag를 기준으로:

- 릴리스 노트
- 평가 결과
- 배포 파일
- 모델 관련 자료

등을 묶어 공유하는 GitHub 기능이다.

---

## 5. 다음 단계 — CI/CD 자동화

강의에서는 이후 단계로 다음 도구를 연결한다.

- **GitHub Actions**: push/PR 시 테스트·평가·배포 자동화
- **GitHub Copilot**: 코드 자동완성, commit 메시지, PR 작업 지원
- **Claude Code**: 터미널에서 코드베이스를 이해하고 수정하는 AI 코딩 에이전트

즉 지금까지 배운 Git 협업 구조 위에 자동화를 얹는 단계다.

---

# 실전 명령어 묶어서 보기

## stash

```bash
git stash
git stash list
git stash pop
```

## cherry-pick

```bash
git log --oneline
git cherry-pick <commit-hash>
```

## reflog

```bash
git reflog
git checkout -b recover-branch HEAD@{N}
```

## tag

```bash
git tag -a v1.0.0 -m "version message"
git push origin v1.0.0
```

---

# AI/ML 프로젝트 Git 협업 체크리스트

## 브랜치 전략

- [ ] main 직접 push 금지
- [ ] 기능별 `feature/이름` 브랜치 사용
- [ ] PR + 코드 리뷰 후 merge

## 커밋 메시지

- [ ] `feat` / `fix` / `chore` / `docs` 등 prefix 사용
- [ ] 팀에서 합의한 언어와 형식 유지

## 보안

- [ ] `.env`가 `.gitignore`에 포함됐는지 확인
- [ ] API Key 하드코딩 금지
- [ ] pre-commit hook 설치
- [ ] secret scanner 적용

## AI/ML 특화

- [ ] 모델 가중치는 Git LFS / Hugging Face Hub 등으로 관리
- [ ] 대규모 데이터는 DVC 등 검토
- [ ] Notebook에는 nbstripout 적용
- [ ] 의미 있는 모델 버전은 git tag로 관리

---

# 4장 전체 연결해서 이해하기

```text
일반 Git 협업
   ↓
AI/ML 프로젝트로 확장
   ↓
대용량 모델/데이터 문제
   → Git LFS / Hub / DVC

Notebook 충돌 문제
   → nbstripout

API Key 유출 문제
   → .env / .gitignore / pre-commit

실전 작업 중 위기
   ├─ 잠시 치우기 → stash
   ├─ 특정 commit만 가져오기 → cherry-pick
   ├─ 실수 복구 → reflog
   └─ 모델/코드 버전 표시 → tag / Release
```

## 오늘 반드시 설명할 수 있어야 하는 것

1. Git LFS는 대용량 파일의 실제 내용을 별도 저장하고 Git에는 포인터를 남긴다.
2. Jupyter Notebook은 출력과 실행 횟수 때문에 diff가 커질 수 있다.
3. nbstripout은 Git에 저장되는 Notebook 출력물을 제거한다.
4. API Key는 코드에 직접 쓰지 않고 `.env`로 분리한다.
5. pre-commit은 commit 전에 자동 검사를 실행한다.
6. `git stash`는 미완성 작업을 임시 보관한다.
7. `git cherry-pick`은 특정 commit만 현재 브랜치에 적용한다.
8. `git reflog`는 HEAD 이동 기록을 이용해 잃어버린 commit을 복구할 수 있다.
9. `git tag`와 GitHub Release는 특정 버전을 식별하고 배포 정보를 관리하는 데 사용한다.
