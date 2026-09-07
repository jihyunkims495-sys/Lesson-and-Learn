# Python 9일차 - 예외 처리와 디버깅 기초

<!-- TOP_SUMMARY_START -->

## 1. 오늘 배운 전체 구조

```text
예외 처리(Exception Handling)
│
├── 오류와 예외 구분
│   ├── SyntaxError
│   ├── IndentationError
│   ├── ValueError
│   ├── TypeError
│   ├── IndexError
│   └── ZeroDivisionError
│
├── 예외 처리 구조
│   ├── try
│   ├── except
│   ├── else
│   └── finally
│
├── 예외 발생
│   ├── raise
│   ├── Exception
│   ├── 사용자 정의 예외
│   └── __str__()
│
└── 예외 객체 받기
    └── except ValueError as e

디버깅(Debugging)
│
├── Traceback
│   ├── 최종 예외 이름 확인
│   ├── 실제 에러 발생 줄 확인
│   └── 호출 경로 역추적
│
├── print 디버깅
│
├── VS Code Debugger
│   ├── Breakpoint
│   ├── Variables
│   ├── Step Over
│   ├── Step Into
│   ├── Step Out
│   └── Continue
│
└── 실행 환경
    ├── Jupyter Notebook Debug Cell
    └── .py 파일 Debugging
```

### 오늘의 핵심 실행 흐름

```text
try
→ 예외가 발생할 수 있는 코드를 실제로 실행

예외 발생
→ try의 남은 코드 중단
→ 맞는 except로 이동

예외 없음
→ else 실행

마지막
→ finally 실행
```

```text
raise
→ 개발자가 예외를 직접 발생
→ 현재 정상 실행 흐름 중단
→ 바깥쪽에서 맞는 except를 찾음
```

```text
Traceback 읽기
→ 맨 아래 예외 이름/메시지
→ 바로 위 실제 문제 코드
→ 그 위 호출 경로
```

---

## 2. 중요 개념 정리

| 개념 | 핵심 의미 | 예시 |
|---|---|---|
| `SyntaxError` | 문법 자체가 잘못된 오류 | 콜론 누락 |
| `IndentationError` | 들여쓰기 구조 오류 | 들여쓰기 불일치 |
| `ValueError` | 자료형은 맞지만 값이 부적절 | `int("abc")` |
| `IndexError` | 존재하지 않는 위치 조회 | `menu[5]` |
| `ZeroDivisionError` | 0으로 나누기 | `10 / 0` |
| `try` | 예외 가능 코드 실행 구간 | `int(input())` |
| `except` | 발생한 예외를 잡고 처리 | `except ValueError:` |
| `else` | 예외가 없을 때 실행 | 정상 처리 |
| `finally` | 성공/실패와 관계없이 마지막 실행 | 종료 메시지 |
| `raise` | 예외를 직접 발생 | `raise ValueError(...)` |
| `Exception` | 대부분의 일반 예외의 부모 클래스 | 사용자 정의 예외 부모 |
| `as e` | 발생한 예외 객체를 변수에 받음 | `except ValueError as e:` |
| Traceback | 예외가 발생한 호출 경로 리포트 | 맨 아래부터 읽기 |
| Breakpoint | 디버거가 멈출 위치 | 코드 왼쪽 빨간 점 |
| Step Over | 현재 줄 실행 후 다음 줄 | 함수 내부는 안 들어감 |
| Step Into | 함수 내부로 들어감 | 함수 내부 점검 |
| Step Out | 현재 함수에서 빠져나옴 | 호출한 쪽으로 복귀 |
| Continue | 다음 Breakpoint까지 실행 | 계속 진행 |

---

## 3. 헷갈렸던 것 리뷰

### 3-1. SyntaxError와 실행 중 예외는 다르다

```text
SyntaxError / IndentationError
→ 코드 구조나 문법 문제
→ 실행 전 발견

ValueError / IndexError / ZeroDivisionError
→ 문법은 맞음
→ 실행 중 특정 값이나 상황 때문에 발생
```

`Error`라는 단어가 붙어 있어도 전부 같은 종류는 아니다.

---

### 3-2. `raise`는 예외를 정의하는 게 아니다

잘못 이해하기 쉬운 흐름:

```text
raise
→ 예외 정의
```

실제 의미:

```text
class MyError(Exception)
→ 새로운 예외 종류 정의

raise MyError()
→ 그 예외를 실제로 발생
```

---

### 3-3. `raise`와 `return`의 차이

둘 다 현재 함수의 아래쪽 코드 실행을 멈춘다는 공통점이 있다.

```text
return
→ 정상적으로 함수 종료
→ 결과값 반환 가능

raise
→ 예외를 발생시키면서 정상 흐름 중단
→ 바깥쪽 except로 전달될 수 있음
```

---

### 3-4. `try`는 예외를 시뮬레이션하는 곳이 아니다

`try`는 예외가 발생할지 미리 테스트만 하는 공간이 아니다.

```text
try
→ 실제 코드를 실행
→ 그 실행 중 예외가 발생하면 except가 처리
```

따라서 기준은 "불확실한 변수인가?"가 아니라:

```text
이 코드에서 내가 처리하려는 예외가 발생할 수 있는가?
```

이다.

---

### 3-5. `int(input())`는 왜 try 안에 들어가나?

```python
index = int(input("번호 입력: "))
```

사용자가 `abc`를 입력하면:

```text
input()
→ "abc"

int("abc")
→ 숫자로 변환 실패
→ ValueError
```

따라서 이 예외를 잡고 싶다면 해당 줄이 `try` 안에 있어야 한다.

---

### 3-6. `menu[index]`가 낯설었던 이유

```python
menu = ["김밥", "라면", "떡볶이"]
index = 1

result = menu[index]
```

실제 의미:

```text
index = 1
↓
menu[index]
↓
menu[1]
↓
"라면"
```

인덱스 자리에 숫자를 직접 쓰는 대신 숫자가 저장된 변수를 사용할 뿐이다.

---

### 3-7. `except ValueError as e`에서 `e`는 특별한 문법이 아니다

```python
except ValueError as e:
    print(e)
```

의미:

```text
ValueError 발생
→ 그 예외 객체를 e라는 변수에 받아둠
→ print(e)로 예외 메시지를 확인 가능
```

`e`는 그냥 변수 이름이다.

```python
except ValueError as error:
    print(error)
```

처럼 써도 된다.

---

### 3-8. 변수 역할이 달라 보여도 본질은 모두 변수다

오늘 특히 헷갈렸던 부분:

```text
for i in numbers
→ i는 반복 변수

def add(a, b)
→ a, b는 매개변수

except ValueError as e
→ e는 예외 객체 변수

result = menu[index]
→ result는 결과 저장 변수
```

이름과 역할은 다르지만 핵심 질문은 같다.

```text
이 변수에는 지금 어떤 값이 들어오는가?
```

---

### 3-9. Breakpoint와 현재 실행 위치는 다르다

VS Code에서:

```text
빨간 점
→ Breakpoint
→ 여기서 멈추라고 지정한 위치

노란색 표시
→ 현재 디버거가 실제로 멈춰 있는 실행 위치
```

Breakpoint는 정지 지점이고, 노란색은 현재 실행 상태를 보여준다.

---

### 3-10. Step Over / Into / Out 차이

```text
Step Over
→ 현재 줄 실행 후 다음 줄
→ 함수 호출이 있어도 내부로 안 들어감

Step Into
→ 함수 내부로 들어감
→ 함수 안을 점검할 때 사용

Step Out
→ 이미 함수 안에 들어와 있을 때
→ 남은 함수 실행 후 호출한 바깥 코드로 복귀
```

---

### 3-11. Traceback은 맨 아래부터 읽는다

예시:

```python
def calculate_share(total_price, num_people):
    share_per_person = total_price / num_people
    return share_per_person


def start_settlement():
    participants = 0
    result = calculate_share(50000, participants)
    print(result)

start_settlement()
```

실행 흐름:

```text
start_settlement()
↓
participants = 0
↓
calculate_share(50000, 0)
↓
50000 / 0
↓
ZeroDivisionError
```

Traceback 확인 순서:

```text
1. 맨 아래
ZeroDivisionError: division by zero

2. 바로 위
share_per_person = total_price / num_people

3. 더 위
calculate_share()를 호출한 start_settlement() 위치
```

<!-- TOP_SUMMARY_END -->

---

# 1. 예외 처리란?

프로그램을 작성하다 보면 문법은 맞지만 실행 중 예상하지 못한 값이나 상황 때문에 문제가 발생할 수 있다.

예를 들어:

```python
number = int("abc")
```

이 코드는 파이썬 문법상 틀린 코드는 아니다.

하지만 실행하면 `"abc"`를 정수로 바꿀 수 없기 때문에 `ValueError`가 발생한다.

이처럼 **문법은 맞지만 실행 중 발생하는 문제를 예외(Exception)**라고 한다.

예외 처리는 이런 상황이 발생했을 때 프로그램이 바로 종료되지 않고 적절히 대응하도록 만드는 구조다.

---

# 2. 구문 오류와 실행 중 예외

## 2.1 구문 오류

### SyntaxError

```python
if True
    print("hello")
```

콜론이 없기 때문에 코드 문법 자체가 잘못되었다.

### IndentationError

```python
def hello():
    print("hello")
  print("end")
```

들여쓰기 수준이 일치하지 않아 발생한다.

`IndentationError`는 `SyntaxError` 계열 오류다.

---

## 2.2 실행 중 예외

### ValueError

```python
int("abc")
```

### TypeError

```python
"10" + 5
```

### IndexError

```python
numbers = [1, 2, 3]
print(numbers[5])
```

### ZeroDivisionError

```python
10 / 0
```

이런 코드는 문법상 문제가 없기 때문에 실행은 시작된다.

하지만 특정 코드 줄에서 문제가 발생하면 해당 예외가 발생한다.

---

# 3. Exception 클래스

파이썬의 대부분의 일반적인 예외는 `Exception` 클래스를 기준으로 상속 구조를 가진다.

```text
Exception
├── ValueError
├── TypeError
├── IndexError
├── ZeroDivisionError
└── 기타 일반 예외들
```

따라서 다음처럼 작성하면 대부분의 일반 예외를 한 번에 잡을 수 있다.

```python
try:
    ...
except Exception:
    ...
```

하지만 실제 코드에서는 가능한 경우 구체적인 예외 종류를 명시하는 것이 좋다.

```python
except ValueError:
    ...

except IndexError:
    ...
```

이렇게 해야 어떤 문제가 발생했는지 구분할 수 있기 때문이다.

---

# 4. try / except / else / finally

## 4.1 try

예외가 발생할 가능성이 있는 코드를 실제로 실행하는 구간이다.

```python
try:
    number = int(input("숫자 입력: "))
```

---

## 4.2 except

`try`에서 발생한 예외를 잡고 처리한다.

```python
try:
    number = int(input("숫자 입력: "))
except ValueError:
    print("숫자를 입력해야 합니다.")
```

---

## 4.3 여러 except

예외 종류별로 다른 처리를 할 수 있다.

```python
menu = ["김밥", "라면", "떡볶이"]

try:
    index = int(input("조회할 인덱스 번호를 입력하세요: "))
    result = menu[index]

except ValueError:
    print("숫자만 입력할 수 있습니다.")

except IndexError:
    print("존재하지 않는 위치의 데이터")
```

실행 흐름:

```text
abc 입력
→ int("abc")
→ ValueError
→ except ValueError
```

```text
5 입력
→ menu[5]
→ IndexError
→ except IndexError
```

---

## 4.4 else

예외가 발생하지 않았을 때 실행한다.

```python
else:
    print(f"선택한 메뉴는 {result}입니다.")
```

정상 흐름:

```text
try
→ 예외 없음
→ else
```

---

## 4.5 finally

예외 발생 여부와 상관없이 마지막에 실행한다.

```python
finally:
    print("메뉴 조회를 종료합니다.")
```

전체 흐름:

```text
정상
try → else → finally

ValueError
try → except ValueError → finally

IndexError
try → except IndexError → finally
```

---

# 5. raise

`raise`는 개발자가 원하는 조건에서 직접 예외를 발생시키는 키워드다.

예:

```python
def set_order(count):
    if count <= 0:
        raise ValueError("주문 수량은 1개 이상이어야 합니다.")

    print(f"주문 수량이 {count}개로 설정되었습니다.")
```

실행 흐름:

```text
set_order(-3)
↓
count <= 0
↓
raise ValueError(...)
↓
함수의 정상 실행 흐름 중단
```

바깥에서 처리:

```python
try:
    set_order(-3)
except ValueError as e:
    print(f"시스템 경고: {e}")
```

실행 흐름:

```text
set_order(-3)
↓
raise ValueError("주문 수량은 1개 이상이어야 합니다.")
↓
함수 아래쪽 코드 중단
↓
바깥쪽 except ValueError 찾음
↓
예외 객체를 e에 저장
↓
print(e)
```

---

# 6. 사용자 정의 예외

기본 예외만으로 의미 전달이 부족할 경우 개발자가 새로운 예외 클래스를 만들 수 있다.

```python
class UserIdMismatchError(Exception):
    pass
```

이 클래스는 `Exception`을 상속받았기 때문에 예외로 사용할 수 있다.

```python
raise UserIdMismatchError()
```

---

## 6.1 `__str__()`

예외 객체가 문자열로 표현될 때 보여줄 메시지를 직접 정할 수 있다.

```python
class UserIdMismatchError(Exception):
    def __str__(self):
        return "아이디가 일치하지 않습니다."
```

중요:

```text
__str__()
→ 예외 메시지 표현

raise
→ 실제 예외 발생
```

`__str__()` 자체가 예외를 발생시키는 것은 아니다.

---

# 7. except ValueError as e

```python
except ValueError as e:
    print(e)
```

`e`는 특별한 키워드가 아니라 변수다.

발생한 예외 객체를 잠깐 받아두는 역할을 한다.

예:

```python
raise ValueError("주문 수량은 1개 이상이어야 합니다.")
```

바깥에서:

```python
except ValueError as e:
    print(e)
```

출력:

```text
주문 수량은 1개 이상이어야 합니다.
```

---

# 8. 디버깅이란?

디버깅(Debugging)은 프로그램이 예상대로 동작하지 않을 때 **문제가 발생한 위치와 원인을 추적하는 과정**이다.

단순히 에러 메시지를 보는 것만이 아니라:

```text
어디서 문제가 생겼는가?
↓
그 순간 변수 값은 무엇이었는가?
↓
어떤 실행 경로를 거쳤는가?
```

를 확인한다.

---

# 9. Traceback

Traceback은 예외가 발생했을 때 파이썬이 보여주는 호출 경로 리포트다.

가장 중요한 읽기 순서:

```text
1. 맨 아래 예외 이름과 메시지
2. 바로 위 실제 문제 코드
3. 그 위 호출 경로
```

예:

```text
ZeroDivisionError: division by zero
```

를 먼저 확인한다.

그 다음:

```python
share_per_person = total_price / num_people
```

에서 실제 문제가 발생했음을 찾는다.

---

# 10. print 디버깅

코드 중간중간 `print()`를 넣어 변수 값을 확인하는 방법이다.

```python
print("현재 total:", total)
```

장점:

- 간단하고 빠르다.
- 초보자가 실행 흐름을 확인하기 쉽다.

단점:

- 코드가 길어지면 출력이 너무 많아진다.
- 나중에 불필요한 `print()`를 제거해야 한다.
- 특정 순간의 실행 상태를 정밀하게 멈춰서 보기 어렵다.

---

# 11. VS Code Debugger

VS Code Debugger를 사용하면 코드를 특정 줄에서 멈추고 변수 값을 확인할 수 있다.

Python Tutor와 비슷하게 실행 흐름을 볼 수 있지만, 실제 `.py` 파일과 프로젝트 코드에서 사용할 수 있는 실무형 도구다.

---

# 12. Breakpoint

Breakpoint는 디버거에게 "이 줄에서 멈춰라"라고 지정하는 위치다.

VS Code에서 코드 왼쪽에 빨간 점으로 표시된다.

예:

```python
final_score += score
```

이 줄에 Breakpoint를 걸면 반복문이 해당 줄에 도달할 때마다 멈출 수 있다.

---

# 13. Variables 패널

Breakpoint에서 코드가 멈추면 Variables 패널에서 현재 변수 상태를 확인할 수 있다.

예:

```text
final_score = 50
score = 10
```

이 상태에서 Step Over를 실행하면:

```text
final_score = 50 + 10
→ 60
```

처럼 값 변화를 확인할 수 있다.

---

# 14. Step Over

현재 줄을 실행한 뒤 다음 줄로 이동한다.

```text
현재 줄 실행
→ 다음 줄로 이동
```

함수 호출이 있어도 내부로 들어가지 않고 결과만 받아서 진행한다.

---

# 15. Step Into

현재 줄에서 함수가 호출된다면 그 함수 내부로 들어간다.

```text
함수 안을 한 줄씩 확인하고 싶다
→ Step Into
```

---

# 16. Step Out

이미 함수 내부에 들어와 있을 때 사용한다.

현재 함수의 남은 코드를 실행하고 함수를 호출했던 바깥쪽 코드로 돌아간다.

```text
함수 내부 확인 완료
→ Step Out
→ 호출한 쪽으로 복귀
```

---

# 17. Continue

현재 위치에서 다시 실행을 이어간다.

다음 Breakpoint가 있다면 거기까지 계속 실행한다.

```text
현재 위치
→ Continue
→ 다음 Breakpoint까지 실행
```

---

# 18. Jupyter Notebook과 .py 디버깅

## Jupyter Notebook

셀 단위로 실행하고 `Debug Cell`을 사용할 수 있다.

## `.py` 파일

파일 전체를 디버깅 모드로 실행한다.

```text
Run and Debug
→ Breakpoint에서 멈춤
→ Variables 확인
→ Step Over / Into / Out 사용
```

핵심 원리는 같다.

---

# 19. 오늘 실습 1 — 메뉴 인덱스 조회

```python
menu = ["김밥", "라면", "떡볶이"]

try:
    index = int(input("조회할 인덱스 번호를 입력하세요: "))
    result = menu[index]
except ValueError:
    print("숫자만 입력할 수 있습니다.")
except IndexError:
    print("존재하지 않는 위치의 데이터")
else:
    print(f"선택한 메뉴는 {result}입니다.")
finally:
    print("메뉴 조회를 종료합니다.")
```

핵심:

```text
abc 입력
→ ValueError

5 입력
→ IndexError

1 입력
→ "라면"
```

---

# 20. 오늘 실습 2 — 주문 수량 검증

```python
def set_order(count):
    if count <= 0:
        raise ValueError("주문 수량은 1개 이상이어야 합니다.")

    print(f"주문 수량이 {count}개로 설정되었습니다.")


try:
    set_order(-3)
except ValueError as e:
    print(f"시스템 경고: {e}")
```

핵심:

```text
raise
→ 예외 직접 발생

except ValueError as e
→ 그 예외 객체를 e에 받음
```

---

# 21. 오늘 실습 3 — Traceback 읽기

```python
def calculate_share(total_price, num_people):
    share_per_person = total_price / num_people
    return share_per_person


def start_settlement():
    participants = 0
    result = calculate_share(50000, participants)
    print(result)

start_settlement()
```

실행 결과:

```text
ZeroDivisionError: division by zero
```

확인 순서:

```text
ZeroDivisionError 확인
↓
나누기 연산 줄 확인
↓
calculate_share 호출 위치 확인
↓
start_settlement 호출 위치 확인
```

---

# 22. 오늘 실습 4 — 반복문 디버깅

예시 구조:

```python
def sum_scores():
    final_score = 50
    bonus_scores = [10, 20, 30]

    for score in bonus_scores:
        final_score += score

    return final_score
```

`final_score += score`에 Breakpoint를 걸면:

```text
1회차
score = 10
final_score = 50

Step Over
→ final_score = 60

2회차
score = 20
→ final_score = 80

3회차
score = 30
→ final_score = 110
```

반복문 안에 Breakpoint가 있으면 반복할 때마다 같은 줄에서 여러 번 멈출 수 있다.

이것은 VS Code가 멈춘 것이 아니라 정상적인 디버거 동작이다.

---

# 23. 오늘 어려웠던 내용

## 23.1 변수 역할 구분

오늘 가장 반복해서 헷갈린 부분 중 하나는 변수의 역할이었다.

```text
i
→ 반복 변수

a, b
→ 매개변수

result
→ 결과 저장 변수

e
→ 예외 객체 변수

index
→ 사용자 입력값 저장 변수
```

역할은 다르지만 전부 변수다.

앞으로 변수는 이름보다 다음 질문으로 이해하는 것이 좋다.

```text
이 변수에는 어디서 값이 들어오는가?
현재 어떤 값이 들어 있는가?
이 값을 어디에서 사용하는가?
```

---

## 23.2 예외 이름과 실제 발생 위치 연결

예외 이름만 외우면 헷갈렸다.

다음처럼 연결할 때 이해가 더 잘 되었다.

```text
int(input(...))
→ 숫자로 바꿀 수 없는 입력
→ ValueError

menu[index]
→ 없는 위치 조회
→ IndexError

50000 / 0
→ 0으로 나누기
→ ZeroDivisionError
```

---

## 23.3 자연어 문제를 코드 구조로 바꾸기

문제 설명을 읽었을 때:

```text
어떤 변수가 필요한가?
어떤 줄을 try 안에 넣어야 하는가?
어떤 except가 필요한가?
```

를 처음부터 정하는 단계가 아직 어렵다.

따라서 앞으로는 먼저 자연어로:

```text
입력
→ 처리
→ 예외 가능 위치
→ 성공 경로
→ 마지막 처리
```

를 적고 코드로 옮기는 연습이 필요하다.

---

# 24. 오늘 학습에서 개선된 점

- `try / except / else / finally`를 단순 암기보다 실행 흐름으로 이해하기 시작했다.
- `raise`를 예외 정의가 아니라 예외 발생으로 구분했다.
- `menu[index]`처럼 변수로 인덱싱하는 구조를 이해했다.
- `except ValueError as e`에서 `e`가 예외 객체를 받는 변수라는 점을 이해했다.
- Traceback을 맨 아래부터 읽는 방법을 실제 실습으로 확인했다.
- Breakpoint, Variables, Step Over / Into / Out을 실제 VS Code 화면과 연결했다.
- 디버거를 Python Tutor와 비슷한 실행 흐름 관찰 도구로 연결해 이해했다.

---

# 25. 다음 복습 우선순위

1. `raise → except` 예외 전달 흐름
2. 변수 역할을 `값이 어디서 들어오는가` 기준으로 구분
3. 자연어 문제에서 필요한 변수 먼저 설계하기
4. 예외 이름보다 실제 발생 코드 줄과 원인을 연결하기
5. Traceback 맨 아래부터 역추적하기
6. Step Over / Into / Out 상황별 선택 연습
