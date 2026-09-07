# 2026-08-14 TIL — 모듈과 패키지

## 1. 오늘 학습 전체 구조

이번 학습의 핵심은 **코드가 커졌을 때 기능별로 파일을 나누고, 다른 파일의 기능을 불러와 재사용하는 방법**이다.

```text
코드가 커짐
    ↓
기능별로 .py 파일을 나눔
    ↓
각 .py 파일 = 모듈(Module)
    ↓
모듈이 많아지면 폴더로 묶음
    ↓
폴더 구조 = 패키지(Package)
    ↓
필요한 모듈을 import 해서 사용
```

---

## 2. 모듈(Module)

### 개념

모듈은 파이썬 코드가 저장된 **하나의 `.py` 파일**이다.

예를 들어:

```text
calculator.py
```

파일 안에 아래와 같은 코드가 있다면 `calculator.py` 자체가 하나의 모듈이다.

```python
def add(a, b):
    return a + b
```

### 왜 필요한가

프로그램이 커질수록 하나의 파일에 모든 코드를 넣으면 관리가 어려워진다.

기능별로 파일을 나누면:

- 코드의 역할을 구분하기 쉽다.
- 같은 기능을 여러 곳에서 재사용할 수 있다.
- 오류가 발생했을 때 관련 파일만 찾아 수정하기 쉽다.

### 한 줄 정리

> 모듈 = 재사용할 코드를 기능별로 담아 둔 하나의 `.py` 파일

---

## 3. 패키지(Package)

### 개념

패키지는 여러 모듈을 체계적으로 관리하기 위해 묶어 둔 **폴더(디렉터리)** 이다.

예:

```text
project/
│
├── calculator/
│   ├── add.py
│   └── subtract.py
│
└── main.py
```

이 구조에서:

```text
add.py       → 모듈
subtract.py  → 모듈
calculator/  → 패키지
```

### 모듈과 패키지 차이

| 구분 | 의미 |
|---|---|
| 모듈(Module) | 하나의 `.py` 파일 |
| 패키지(Package) | 여러 모듈을 묶어 관리하는 폴더 구조 |

### 한 줄 정리

> 모듈은 파일이고, 패키지는 모듈들을 정리한 폴더이다.

---

## 4. import

다른 모듈의 기능을 현재 코드에서 사용하려면 `import`를 사용한다.

```python
import math
```

위 코드는 `math` 모듈을 현재 코드에서 사용할 수 있도록 불러온다.

이후에는:

```python
math.sqrt(16)
```

처럼 사용한다.

구조는 다음과 같다.

```text
math.sqrt(16)
│    │
│    └─ math 모듈 안의 sqrt 함수
│
└─ math 모듈
```

여기서 `.`은 **앞의 모듈 안에 있는 기능에 접근한다**는 의미로 이해할 수 있다.

---

## 5. from

모듈 전체가 아니라 특정 함수나 클래스만 가져오고 싶을 때 `from`을 사용한다.

```python
from math import sqrt
```

그러면 다음과 같이 모듈 이름 없이 바로 사용할 수 있다.

```python
sqrt(25)
```

비교:

```python
import math
math.sqrt(25)
```

```python
from math import sqrt
sqrt(25)
```

### 차이

- `import math` → `math.sqrt()`처럼 출처를 표시
- `from math import sqrt` → `sqrt()`라고 바로 사용

---

## 6. as

`as`는 불러온 모듈이나 함수에 **별명(Alias)** 을 붙일 때 사용한다.

```python
import calculator as calc
```

이제 `calculator` 대신 `calc`라는 이름을 사용할 수 있다.

```python
calc.add(10, 5)
```

### 예

```python
import datetime as dt
```

여기서 `dt`는 `datetime` 모듈의 별명이다.

### 한 줄 정리

> `as` = 긴 모듈 이름에 짧은 별명을 붙이는 키워드

---

## 7. 사용자 정의 모듈

직접 만든 `.py` 파일도 다른 파일에서 불러와 사용할 수 있다.

### calculator.py

```python
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b
```

### 실행 파일 또는 Notebook

```python
import calculator as calc

res_add = calc.add(10, 5)
res_sub = calc.subtract(10, 5)

print(f"사용자 정의 모듈 더하기 결과값: {res_add}")
print(f"사용자 정의 모듈 빼기 결과값: {res_sub}")
```

### 실행 흐름

```text
import calculator as calc
        ↓
calculator.py 모듈을 찾음
        ↓
calc라는 별명으로 사용할 수 있게 됨
        ↓
calc.add(10, 5)
        ↓
calculator.py 안의 add 함수 실행
        ↓
a = 10, b = 5
        ↓
return a + b
        ↓
15 반환
        ↓
res_add = 15
```

중요한 점은 `res_add`가 함수 자체를 저장하는 것이 아니라, **함수 실행 후 반환된 결과값 15를 저장한다**는 것이다.

---

## 8. 표준 라이브러리(Standard Library)

파이썬을 설치할 때 함께 제공되는 기본 모듈과 패키지 모음이다.

별도 설치 없이 바로 `import`해서 사용할 수 있다.

대표적인 예:

| 모듈 | 역할 |
|---|---|
| `random` | 무작위 숫자와 데이터 처리 |
| `datetime` | 날짜와 시간 처리 |
| `sys` | 파이썬 실행 환경과 시스템 관련 기능 |

---

## 9. random 모듈

```python
import random

lucky_number = random.randint(1, 45)
print(lucky_number)
```

실행 흐름:

```text
random 모듈
    ↓
randint 함수 실행
    ↓
1~45 사이의 정수 하나 반환
    ↓
lucky_number 변수에 저장
```

예를 들어 결과가 17이라면:

```python
lucky_number = 17
```

이 된다.

### 함수와 메서드 구분에서 헷갈린 점

`random.randint()`의 `randint`는 **random 모듈 안의 함수**이다.

클래스 안에 정의되어 인스턴스를 통해 사용하는 것은 메서드이고, 모듈 안에 있는 함수라고 해서 자동으로 메서드가 되는 것은 아니다.

---

## 10. datetime 모듈

```python
import datetime

current_time = datetime.datetime.now()
print(current_time)
```

구조:

```text
datetime.datetime.now()
    │        │      │
    │        │      └─ now 메서드
    │        └─ datetime 클래스
    └─ datetime 모듈
```

현재 시간을 문자열 형식으로 바꾸려면:

```python
formatted_time = current_time.strftime("%Y-%m-%d %H:%M:%S")
```

`strftime()`은 날짜/시간 객체를 원하는 형식의 문자열로 바꾸는 메서드이다.

---

## 11. 함수와 메서드 구분

수업 중 가장 헷갈렸던 부분.

### 함수

클래스 밖에 독립적으로 정의된 함수:

```python
def add(a, b):
    return a + b
```

`add`는 함수다.

### 메서드

클래스 안에 정의된 함수:

```python
class Dog:
    def move(self):
        print("움직인다")
```

`move`는 `Dog` 클래스의 메서드다.

### 인스턴스와 메서드 호출

```python
class Cat:
    def sound(self):
        print("야옹")

cat = Cat()
cat.sound()
```

구분:

- `Cat` → 클래스 이름
- `Cat()` → `Cat` 클래스의 인스턴스를 생성
- `cat` → 생성된 인스턴스를 가리키는 변수
- `sound` → `Cat` 클래스의 인스턴스 메서드
- `cat.sound()` → 인스턴스 메서드 호출

실행 흐름:

```text
Cat()
 ↓
Cat 인스턴스 생성
 ↓
cat 변수에 저장
 ↓
cat.sound()
 ↓
cat이 가리키는 인스턴스의 sound 메서드 실행
 ↓
"야옹" 출력
```

---

## 12. 상대 경로와 패키지 접근

패키지 내부에서는 현재 위치를 기준으로 상대 경로를 사용할 수 있다.

- `.` → 현재 패키지
- `..` → 상위 패키지

예:

```python
from . import module
```

```python
from ..parent import module
```

다만 상대 경로는 패키지 구조 안에서 실행될 때 정상적으로 동작한다.

터미널에서는 다음과 같은 방식으로 실행할 수 있다.

```bash
python -m 패키지명.모듈명
```

또는 uv를 사용한다면:

```bash
uv run python -m 패키지명.모듈명
```

### 현재 학습 우선순위

상대 경로와 `python -m`은 지금 완전히 암기하기보다, 실제 패키지 구조를 만들 때 다시 학습해도 된다.

---

## 13. 반드시 알아야 할 내용

이번 단계에서 우선 이해해야 할 내용:

1. 모듈 = `.py` 파일
2. 패키지 = 모듈을 묶은 폴더
3. `import` = 모듈 가져오기
4. `from` = 특정 기능 가져오기
5. `as` = 별명 지정
6. 모듈에서 함수를 호출하면 반환된 값이 다음 변수에 저장되는 실행 흐름
7. 함수와 메서드의 차이

---

## 14. 나중에 다시 봐도 되는 내용

현재 단계에서 완벽히 암기하지 않아도 되는 내용:

- 상대 경로 `.`
- 상대 경로 `..`
- `python -m`
- 복잡한 패키지 계층 구조

실제 프로젝트 구조를 만들 때 다시 확인하면 된다.

---

## 15. 핵심 실행 흐름 복습

```python
import calculator as calc

number = calc.add(3, 5)
```

실행 순서:

```text
1. calculator 모듈을 불러온다.
2. calculator라는 이름 대신 calc라는 별명을 사용한다.
3. calc.add(3, 5)를 실행한다.
4. calculator.py의 add 함수가 실행된다.
5. a에는 3, b에는 5가 들어간다.
6. return a + b가 실행된다.
7. 8이 반환된다.
8. 반환된 8이 number 변수에 저장된다.
```

최종 결과:

```python
number = 8
```

---

## 16. 오늘의 핵심 한 줄 요약

> 모듈은 재사용할 코드를 담은 `.py` 파일이고, 패키지는 이런 모듈을 묶은 폴더이며, `import`를 사용해 다른 모듈의 기능을 현재 코드에서 불러와 사용할 수 있다.

---

## 17. 헷갈렸던 것 리뷰

### 1) `calc`

```python
import calculator as calc
```

`calc`는 `calculator` **모듈의 별명**이다.

### 2) `add`

```python
def add(a, b):
    return a + b
```

클래스 밖에 정의되었으므로 **함수**이다.

### 3) `number`

```python
number = calc.add(3, 5)
```

`number`는 변수이고, `calc.add(3, 5)`가 반환한 결과값 `8`이 저장된다.

### 4) `random.randint`

```python
import random as r
num = r.randint(1, 10)
```

- `r` → `random` 모듈의 별명
- `randint` → random 모듈 안의 함수
- `num` → 반환된 난수를 저장하는 변수

### 5) 클래스 안의 함수

```python
class Dog:
    def move(self):
        print("움직인다")
```

`move`는 클래스 안에 정의되어 있으므로 **메서드**이다.

---

## 18. 최종 키워드

```text
Module      = 하나의 .py 파일
Package     = 모듈을 묶는 폴더
import      = 모듈 전체 가져오기
from        = 모듈에서 특정 기능 가져오기
as          = 별명 지정
Standard Library = 파이썬 기본 제공 모듈/패키지 모음
Function    = 독립적으로 정의된 함수
Method      = 클래스 안에 정의된 함수
Instance    = 클래스로 실제 생성된 객체
```
