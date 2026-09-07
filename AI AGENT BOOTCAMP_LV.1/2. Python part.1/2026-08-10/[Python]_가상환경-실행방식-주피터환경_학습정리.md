# [Python] 가상환경 · 실행 방식 · 주피터 환경 학습정리

> Python 3.13 / 1장 전체 정리  
> 범위: 1장 1강 ~ 3강

---

# 1. 오늘 학습 전체 구조

```text
1장 Python 개발환경
│
├─ 1강. uv init을 활용한 모던 프로젝트 시작
│  ├─ 시스템 전역 설치 문제
│  ├─ 가상환경 필요성
│  ├─ uv 설치
│  ├─ uv init
│  ├─ pyproject.toml
│  ├─ .python-version
│  ├─ uv run
│  └─ uv 주요 명령어
│
├─ 2강. 프로젝트 가상환경 활성화와 기본 실행 방식
│  ├─ 가상환경 Activate
│  ├─ REPL
│  ├─ 스크립트 실행
│  ├─ VS Code
│  └─ REPL vs Script
│
└─ 3강. VS Code와 Jupyter Notebook 커널 연결
   ├─ Python / Jupyter Extension
   ├─ ipykernel
   ├─ .ipynb
   ├─ Select Kernel
   ├─ Code Cell / Markdown Cell
   ├─ 실행 번호 In[n]
   └─ Restart / Run All
```

1장의 핵심 흐름:

```text
프로젝트를 만든다
↓
가상환경을 격리한다
↓
필요한 Python/패키지를 연결한다
↓
REPL 또는 .py 파일로 코드를 실행한다
↓
Jupyter Notebook을 프로젝트 가상환경 커널에 연결한다
↓
셀 단위로 실험하고 실행 상태를 관리한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 시스템 전역 | 컴퓨터 전체가 공유하는 공용 Python 환경 |
| 가상환경 | 프로젝트별로 독립된 Python 실행 공간 |
| Dependency Hell | 프로젝트별 패키지 버전 충돌 문제 |
| uv | 프로젝트·Python 버전·패키지 관리를 통합하는 도구 |
| `uv init` | 프로젝트 기본 구조 생성 |
| `pyproject.toml` | 프로젝트 메타데이터와 의존성을 기록하는 표준 명세 |
| `.python-version` | 프로젝트에서 사용할 Python 버전 지정 |
| `uv run` | 프로젝트 환경에서 Python 코드 실행 |
| Activate | 현재 터미널이 가상환경을 사용하도록 전환 |
| REPL | 한 줄씩 즉시 실행하는 대화형 실행 방식 |
| Script | `.py` 파일 전체를 실행하는 방식 |
| Jupyter Notebook | 코드·설명·결과를 셀 단위로 관리하는 `.ipynb` 환경 |
| ipykernel | Jupyter와 Python 인터프리터를 연결하는 커널 엔진 |
| Kernel | Notebook이 실제로 코드를 실행할 Python 환경 |
| In[n] | Notebook 세션에서 실제 실행된 순서 |
| Restart | Notebook 메모리 상태 초기화 |

---

# 3. 1강 — 왜 가상환경이 필요한가?

프로젝트가 하나뿐일 때는 전역 환경을 써도 문제가 없어 보일 수 있다.

하지만 프로젝트가 여러 개가 되면:

```text
프로젝트 A → 최신 패키지 필요
프로젝트 B → 예전 버전 패키지 필요
```

같은 상황이 생길 수 있다.

전역 환경에 패키지를 하나만 설치하면 서로 영향을 줄 수 있다.

이런 문제를 피하기 위해 프로젝트마다 독립된 가상환경을 사용한다.

핵심:

> **가상환경은 프로젝트별 독립 실행 공간이다.**

---

# 4. uv란?

uv는 Python 프로젝트 환경을 빠르고 통합적으로 관리하는 도구다.

교안에서 다루는 역할:

```text
프로젝트 생성
Python 버전 지정
가상환경 구성
패키지 설치
의존성 기록
실행
```

---

# 5. uv 설치 확인

설치 후:

```bash
uv --version
```

정상적으로 버전이 출력되면 uv 사용 준비가 된 것이다.

---

# 6. 프로젝트 생성

```bash
mkdir first-project
cd first-project
uv init
```

`uv init`을 실행하면 프로젝트 기본 파일이 생성된다.

대표 파일:

```text
pyproject.toml
.python-version
main.py
```

중요:

> `uv init` 직후에는 프로젝트 뼈대를 만드는 단계다.

가상환경 `.venv`는 이후 `uv run`, `uv add` 같은 실제 실행/의존성 작업 과정에서 생성될 수 있다.

---

# 7. Python 버전 지정

프로젝트 생성 시:

```bash
uv init --python 3.13
```

이미 만든 프로젝트에서 버전 변경:

```bash
uv python pin 3.12
```

`.python-version` 파일에는 프로젝트가 사용할 Python 버전이 기록된다.

---

# 8. pyproject.toml

예:

```toml
[project]
name = "first-project"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.13"
dependencies = []
```

주요 항목:

```text
name
→ 프로젝트 이름

version
→ 프로젝트 버전

requires-python
→ 필요한 Python 버전 조건

dependencies
→ 프로젝트 외부 라이브러리 목록
```

핵심:

> **pyproject.toml은 프로젝트 환경과 의존성을 기록하는 표준 명세서다.**

---

# 9. uv run

```bash
uv run main.py
```

의미:

```text
현재 프로젝트 설정 확인
↓
필요한 Python/환경 준비
↓
프로젝트 가상환경에서 main.py 실행
```

---

# 10. 주요 uv 명령어

| 명령어 | 역할 |
|---|---|
| `uv init` | 프로젝트 생성 |
| `uv run` | 프로젝트 환경에서 실행 |
| `uv venv` | 가상환경 생성 |
| `uv sync` | 명세와 환경 동기화 |
| `uv add` | 패키지 추가 |
| `uv remove` | 패키지 제거 |
| `uv lock` | 의존성 잠금 |
| `uv tree` | 의존성 구조 확인 |
| `uv python list` | Python 목록 확인 |
| `uv python install` | Python 설치 |
| `uv python pin` | 프로젝트 Python 버전 고정 |

---

# 11. 2강 — 가상환경 활성화

Windows PowerShell:

```powershell
.venv\Scripts\activate
```

macOS / Linux:

```bash
source .venv/bin/activate
```

활성화되면 터미널 프롬프트 앞에 가상환경 이름이 표시된다.

핵심:

```text
가상환경 생성
≠
가상환경 활성화
```

생성은 방을 만드는 것이고,
활성화는 그 방 안으로 들어가는 것이다.

---

# 12. REPL

REPL:

```text
Read
Eval
Print
Loop
```

실행:

```bash
python
```

프롬프트:

```text
>>>
```

예:

```python
>>> 1 + 1
2

>>> 10 * 5
50
```

종료:

```python
exit()
```

장점:

```text
빠른 테스트
즉시 결과 확인
```

단점:

```text
코드가 파일로 저장되지 않음
세션 종료 시 입력 내용이 남지 않음
```

---

# 13. 스크립트 방식

`.py` 파일에 코드를 저장한다.

예:

```python
print("Hello World")
```

실행:

```bash
python hello.py
```

핵심:

```text
REPL
→ 한 줄씩 즉시 실행

Script
→ 파일 전체를 위에서 아래로 실행
```

---

# 14. REPL vs Script

| 구분 | REPL | Script |
|---|---|---|
| 실행 단위 | 한 줄 | 파일 전체 |
| 저장 | 안 됨 | 파일로 저장 |
| 목적 | 빠른 테스트 | 실제 프로그램 |
| 영속성 | 낮음 | 높음 |

---

# 15. VS Code 터미널

VS Code 내부에서 터미널 열기:

```text
Terminal → New Terminal
```

단축키:

```text
Ctrl + `
```

---

# 16. 3강 — Jupyter Notebook

Jupyter Notebook은:

```text
REPL의 즉각적인 실행
+
Script의 저장
```

을 결합한 환경으로 이해하면 쉽다.

파일 확장자:

```text
.ipynb
```

---

# 17. VS Code 확장

필요한 확장:

```text
Python
Jupyter
```

둘 다 Microsoft 공식 확장을 사용한다.

---

# 18. ipykernel

Jupyter가 프로젝트의 Python 인터프리터와 통신하려면 `ipykernel`이 필요하다.

설치:

```bash
uv add ipykernel
```

흐름:

```text
Jupyter UI
↓
ipykernel
↓
프로젝트 .venv Python
```

---

# 19. Kernel 연결

Notebook 우측 상단:

```text
Select Kernel
```

에서:

```text
Python Environments
↓
프로젝트 .venv
```

를 선택한다.

핵심:

> **Notebook이 어느 Python 환경에서 실행될지를 지정하는 것이 Kernel 선택이다.**

---

# 20. 코드 셀과 마크다운 셀

## Code Cell

실제 Python 코드를 실행하는 셀.

## Markdown Cell

설명, 제목, 메모 등을 작성하는 문서 셀.

---

# 21. 주요 Jupyter 단축키

명령 모드 기준:

| 키 | 기능 |
|---|---|
| `A` | 위에 셀 생성 |
| `B` | 아래에 셀 생성 |
| `M` | Markdown Cell |
| `Y` | Code Cell |
| `Shift + Enter` | 실행 후 다음 셀 이동 |
| `Ctrl + Enter` | 현재 셀만 실행 |

---

# 22. 실행 번호 In[n]

예:

```text
In [1]
In [2]
In [3]
```

이 숫자는 화면상 셀 위치가 아니다.

> **실제로 실행된 순서**를 의미한다.

따라서 아래쪽 셀을 먼저 실행하면 그 셀이 `In [1]`이 될 수 있다.

---

# 23. Jupyter 실행 순서가 중요한 이유

Notebook의 셀들은 같은 Kernel 메모리를 공유한다.

예:

```python
# 셀 A
score = 100
```

```python
# 셀 B
score += 50
```

실행 순서에 따라 현재 메모리 상태가 달라질 수 있다.

핵심:

```text
화면 위아래 순서
≠
실제 실행 순서
```

---

# 24. 실행 상태가 꼬였을 때

권장 해결 순서:

```text
Restart
↓
메모리 초기화
↓
Run All
↓
위에서 아래로 다시 실행
```

Jupyter에서 오류가 이상하게 보일 때 가장 먼저 확인해야 하는 것 중 하나다.

---

# 25. 1장 전체 연결 구조

```text
uv 설치
↓
uv init
↓
pyproject.toml / .python-version
↓
프로젝트 환경 준비
↓
uv run 또는 Activate
↓
REPL / .py Script
↓
VS Code
↓
Jupyter + ipykernel
↓
Select Kernel
↓
Cell 단위 실행
↓
실행 순서와 메모리 상태 관리
```

---

# 26. 헷갈리기 쉬운 개념 리뷰

## 가상환경 생성 vs 활성화

```text
생성 → 독립 환경을 만든다
활성화 → 현재 터미널이 그 환경을 사용하게 한다
```

## `uv init` vs `uv run`

```text
uv init
→ 프로젝트 뼈대 생성

uv run
→ 프로젝트 환경에서 코드 실행
```

## REPL vs Script

```text
REPL → 즉시 실행, 저장 안 됨
Script → 파일 저장, 전체 실행
```

## Python Interpreter vs Kernel

```text
Interpreter
→ Python 코드를 실제로 실행

Kernel
→ Jupyter가 특정 Interpreter를 사용하도록 연결된 실행 엔진
```

## Cell 위치 vs 실행 순서

```text
화면 위치
≠
실제 실행 순서
```

`In[n]`을 확인해야 한다.

---

# 27. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 가상환경이 필요한 이유
- 시스템 전역과 프로젝트 환경 차이
- `uv init`
- `pyproject.toml`
- `.python-version`
- `uv run`
- 가상환경 Activate
- REPL
- Script
- `.py`
- `.ipynb`
- Python / Jupyter Extension
- `ipykernel`
- Kernel
- Code Cell / Markdown Cell
- `Shift + Enter`
- `In[n]`
- Restart / Run All

## 나중에 더 깊게 봐도 되는 내용

- uv 내부 의존성 해석 방식
- lock 파일 세부 구조
- PEP 621 세부 사양
- PATH 환경 변수 내부 동작
- Kernel 프로세스 구조
- Jupyter 메시징 프로토콜
- 다중 Kernel 운영

---

# 28. 1장 핵심 한 줄 요약

> **Python 프로젝트는 가상환경으로 격리하고, uv로 환경을 관리하며, REPL·스크립트·Jupyter 중 목적에 맞는 실행 방식을 선택하고, Notebook에서는 올바른 Kernel과 실행 순서를 관리해야 한다.**
