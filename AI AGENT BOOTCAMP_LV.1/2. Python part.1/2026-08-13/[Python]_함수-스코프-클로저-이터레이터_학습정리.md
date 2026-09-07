# [Python] 함수 · 스코프 · 클로저 · 이터레이터 학습정리

> Python 3.13 / 5장 전체 정리  
> 범위: 5장 1강 ~ 4강

---

# 1. 오늘 학습 전체 구조

```text
5장 함수
│
├─ 1강. 함수 정의와 매개변수
│  ├─ 함수 정의 / 호출
│  ├─ 매개변수 / 인수
│  ├─ 위치 인수 / 키워드 인수
│  ├─ 기본값 매개변수
│  ├─ *args / **kwargs
│  └─ return
│
├─ 2강. 변수 스코프와 람다
│  ├─ 지역 변수 / 전역 변수
│  ├─ LEGB
│  ├─ global
│  ├─ lambda
│  ├─ map()
│  └─ filter()
│
├─ 3강. 클로저와 데코레이터
│  ├─ 일급 객체
│  ├─ 고차 함수
│  ├─ 중첩 함수
│  ├─ 클로저
│  ├─ 데코레이터
│  ├─ @ 문법
│  └─ wrapper
│
└─ 4강. 이터레이터와 제너레이터
   ├─ Iterable
   ├─ Iterator
   ├─ iter()
   ├─ next()
   ├─ StopIteration
   ├─ yield
   ├─ Generator
   └─ Lazy Evaluation
```

5장의 전체 흐름:

```text
코드를 함수로 묶는다
↓
입력값을 매개변수로 받는다
↓
return으로 결과를 돌려준다
↓
변수의 유효 범위를 이해한다
↓
함수 자체도 값처럼 다룬다
↓
클로저/데코레이터로 함수를 확장한다
↓
이터레이터/제너레이터로 데이터 흐름을 효율적으로 제어한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 함수 | 특정 기능을 재사용 가능한 코드 블록으로 묶은 것 |
| 매개변수 | 함수 정의 시 입력값을 받을 이름 |
| 인수 | 함수 호출 시 실제로 전달하는 값 |
| 위치 인수 | 순서대로 전달 |
| 키워드 인수 | `name=value` 형태로 전달 |
| 기본값 매개변수 | 인수를 생략했을 때 사용할 기본값 |
| `*args` | 여러 위치 인수를 튜플로 수집 |
| `**kwargs` | 여러 키워드 인수를 딕셔너리로 수집 |
| `return` | 결과 반환 + 함수 즉시 종료 |
| Scope | 변수의 유효 범위 |
| LEGB | Local → Enclosing → Global → Built-in 검색 순서 |
| lambda | 한 줄 익명 함수 |
| 일급 객체 | 함수를 변수·인수·반환값으로 다룰 수 있음 |
| 클로저 | 외부 함수의 값을 기억하는 내부 함수 |
| 데코레이터 | 원본 함수를 수정하지 않고 기능을 덧붙이는 구조 |
| Iterable | 반복 가능한 객체 |
| Iterator | 실제로 하나씩 꺼내는 순회 객체 |
| Generator | `yield`로 값을 하나씩 생성하는 함수/객체 |
| Lazy Evaluation | 필요한 시점에만 값을 계산하는 방식 |

---

# 3. 1강 — 함수 정의와 매개변수

## 3.1 함수란?

함수는 특정 목적의 코드를 하나의 이름으로 묶은 재사용 가능한 구조다.

```python
def say_hello():
    print("안녕하세요!")
```

호출:

```python
say_hello()
```

핵심:

```text
def → 함수 정의
함수이름() → 함수 호출
```

함수는 정의만 했다고 실행되지 않는다.

```text
def 식별
↓
함수 객체 등록
↓
호출 대기
↓
함수명() 호출
↓
본문 실행
```

---

## 3.2 매개변수(Parameter)와 인수(Argument)

```python
def welcome(name):
    print(f"{name}님, 환영합니다!")

welcome("민수")
```

여기서:

```text
name   → 매개변수(Parameter)
"민수" → 인수(Argument)
```

매개변수는 **받는 이름**이고,
인수는 **실제로 넣는 값**이다.

---

# 4. 위치 인수와 키워드 인수

## 4.1 위치 인수

```python
def introduce_self(name, age):
    print(name, age)

introduce_self("홍길동", 30)
```

순서대로 매핑된다.

```text
name ← "홍길동"
age  ← 30
```

순서를 바꾸면 값의 의미도 바뀐다.

---

## 4.2 키워드 인수

```python
introduce_self(age=25, name="이영희")
```

매개변수 이름을 직접 지정하기 때문에 순서를 바꿔도 된다.

핵심:

```text
위치 인수 → 순서 중요
키워드 인수 → 이름 중요
```

위치 인수와 키워드 인수를 함께 사용할 때는 위치 인수를 먼저 작성한다.

---

# 5. 기본값 매개변수

```python
def introduce(name, age=20):
    print(name, age)
```

호출:

```python
introduce("철수")
```

```text
name = "철수"
age = 20
```

인수를 직접 넣으면 기본값 대신 전달된 값이 사용된다.

```python
introduce("지영", 25)
```

주의:

```python
def error_func(age=20, name):
    pass
```

처럼 기본값이 있는 매개변수 뒤에 기본값 없는 매개변수를 둘 수 없다.

---

# 6. `*args`

가변 위치 인수.

```python
def add_all(*numbers):
    print(numbers)
```

호출:

```python
add_all(1, 2, 3)
```

함수 내부:

```text
numbers = (1, 2, 3)
```

즉:

> `*args` 계열은 여러 위치 인수를 **튜플**로 묶는다.

이름이 반드시 `args`일 필요는 없다.

---

# 7. `**kwargs`

가변 키워드 인수.

```python
def user_info(**data):
    print(data)
```

호출:

```python
user_info(name="스파르타", level=5, active=True)
```

함수 내부:

```python
{
    "name": "스파르타",
    "level": 5,
    "active": True
}
```

즉:

> `**kwargs` 계열은 `key=value` 인수들을 **딕셔너리**로 묶는다.

---

# 8. `return`

```python
def add(a, b):
    result = a + b
    return result
```

호출:

```python
number = add(3, 5)
```

실행 순서:

```text
add(3, 5)
↓
a = 3
b = 5
↓
result = 8
↓
return 8
↓
number = 8
```

중요:

> `return`은 값을 함수 밖으로 보내고 함수 실행을 즉시 끝낸다.

---

# 9. 여러 값 반환

```python
def calculate_values(a, b):
    plus = a + b
    minus = a - b
    return plus, minus
```

호출:

```python
res1, res2 = calculate_values(10, 5)
```

실제로 반환되는 구조:

```text
(15, 5)
```

즉 여러 값을 반환하면 튜플로 묶인다.

---

# 10. 2강 — 변수 스코프

## 10.1 Scope란?

변수가 어디까지 사용 가능한지를 나타내는 범위.

## 10.2 전역 변수(Global)

함수 밖에서 선언.

```python
message = "전역 변수"
```

## 10.3 지역 변수(Local)

함수 안에서 선언.

```python
def test():
    message = "지역 변수"
```

함수 내부에서는 지역 변수가 우선 사용된다.

---

# 11. 변수 은닉(Shadowing)

```python
message = "전역"

def test_scope():
    message = "지역"
    print(message)

test_scope()
print(message)
```

결과:

```text
지역
전역
```

전역 변수가 바뀐 것이 아니라 지역 변수가 같은 이름을 가린 것이다.

---

# 12. LEGB 규칙

Python이 변수 이름을 찾는 순서:

```text
L → Local
E → Enclosing
G → Global
B → Built-in
```

즉 현재 함수 안쪽부터 바깥쪽으로 검색한다.

---

# 13. `global`

```python
counter = 0

def increase_counter():
    global counter
    counter += 1
```

`global counter`는 함수 내부에서 전역 변수를 직접 수정하겠다는 의미다.

남용하면 코드 추적이 어려워질 수 있으므로 가능하면 다음 흐름이 더 안전하다.

```text
인수로 받기
↓
함수 내부 처리
↓
return
```

---

# 14. lambda

일반 함수:

```python
def add_five(x):
    return x + 5
```

lambda:

```python
lambda x: x + 5
```

핵심 문법:

```text
lambda 매개변수: 표현식
```

간단한 한 줄 변환에 적합하다.

---

# 15. `map()`과 `filter()`

## `map()`

```python
numbers = [1, 2, 3, 4, 5]
result = list(map(lambda x: x + 10, numbers))
```

결과:

```text
[11, 12, 13, 14, 15]
```

각 요소를 함수에 통과시켜 변환한다.

## `filter()`

```python
result = list(filter(lambda x: x % 2 == 0, numbers))
```

결과:

```text
[2, 4]
```

조건이 True인 요소만 남긴다.

---

# 16. 3강 — 함수는 일급 객체

Python 함수는 값처럼 다룰 수 있다.

가능한 것:

```text
함수를 변수에 저장
함수를 다른 함수에 전달
함수를 return으로 반환
```

예:

```python
def greet(name):
    return f"안녕하세요, {name}님!"

my_func = greet
print(my_func("코딩"))
```

---

# 17. 고차 함수

다른 함수를 인수로 받거나 함수를 반환하는 함수.

```python
def call_function(func, user_name):
    return func(user_name)
```

---

# 18. 클로저(Closure)

```python
def make_multiplier(n):
    def multiply(x):
        return x * n
    return multiply
```

호출:

```python
times_three = make_multiplier(3)
```

실행 흐름:

```text
make_multiplier(3)
↓
n = 3
↓
multiply 함수 생성
↓
multiply 반환
↓
times_three가 multiply를 가리킴
↓
multiply는 n=3을 기억
```

핵심:

> 클로저는 내부 함수가 외부 함수의 상태를 기억하는 구조다.

---

# 19. 데코레이터(Decorator)

원본 함수 코드를 직접 바꾸지 않고 기능을 앞뒤에 덧붙이는 구조.

```python
def display_decorator(original_function):
    def wrapper():
        print("시작")
        original_function()
        print("종료")
    return wrapper
```

실행 흐름:

```text
wrapper 시작
↓
부가 기능
↓
원본 함수 실행
↓
부가 기능
```

---

# 20. `@` 데코레이터 문법

```python
@display_decorator
def simple_task():
    print("업무 처리")
```

개념적으로:

```python
simple_task = display_decorator(simple_task)
```

와 같은 연결이다.

---

# 21. wrapper와 `*args`, `**kwargs`

```python
def timer(original_func):
    def wrapper(*args, **kwargs):
        result = original_func(*args, **kwargs)
        return result
    return wrapper
```

wrapper가 인수를 대신 받고 원본 함수에 그대로 전달한다.

---

# 22. 4강 — Iterable과 Iterator

## Iterable

반복 가능한 객체.

예:

```text
list
tuple
str
dict
```

## Iterator

실제로 요소를 하나씩 순서대로 꺼내는 객체.

```python
fruits = ["사과", "바나나", "체리"]
fruits_iterator = iter(fruits)
```

---

# 23. `iter()`와 `next()`

```python
print(next(fruits_iterator))
print(next(fruits_iterator))
print(next(fruits_iterator))
```

결과:

```text
사과
바나나
체리
```

더 이상 값이 없는데 다시 호출하면 `StopIteration`이 발생한다.

---

# 24. `for` 반복문과 Iterator 연결

```python
for fruit in fruits:
    print(fruit)
```

뒤에서는 개념적으로:

```text
iter(fruits)
↓
next()
↓
next()
↓
next()
↓
StopIteration
↓
반복 종료
```

와 비슷한 흐름이 일어난다.

---

# 25. Generator와 `yield`

일반 함수의 `return`:

```text
값 반환
↓
함수 종료
```

제너레이터의 `yield`:

```text
값 반환
+
실행 위치 기억
+
일시 정지
```

예:

```python
def infinite_number_generator():
    number = 1
    while True:
        yield number
        number += 1
```

---

# 26. 제너레이터 실행 흐름

```python
num_gen = infinite_number_generator()
```

첫 번째 `next(num_gen)`:

```text
number = 1
↓
yield 1
↓
1 반환
↓
정지
```

두 번째 `next(num_gen)`:

```text
이전 위치에서 재개
↓
number += 1
↓
number = 2
↓
yield 2
```

---

# 27. Lazy Evaluation

필요할 때만 계산하는 방식.

리스트 컴프리헨션:

```python
[num ** 2 for num in range(100000)]
```

모든 결과를 미리 만든다.

제너레이터 표현식:

```python
(num ** 2 for num in range(100000))
```

필요할 때 하나씩 만든다.

```text
[ ... ] → 리스트
( ... ) → 제너레이터 표현식
```

---

# 28. 5장 전체 연결 구조

```text
함수
↓
입력값 처리
↓
return
↓
Scope
↓
함수를 값처럼 사용
↓
고차 함수
↓
클로저
↓
데코레이터
↓
이터레이터
↓
제너레이터
```

5장은 단순히 함수 문법만 배우는 장이 아니다.

> **Python에서 코드와 데이터의 실행 흐름을 어떻게 재사용하고, 전달하고, 기억하고, 지연시킬 것인가를 배우는 장**이다.

---

# 29. 헷갈리기 쉬운 개념 리뷰

## 매개변수 vs 인수

```python
def add(a, b):
```

`a`, `b` → 매개변수

```python
add(3, 5)
```

`3`, `5` → 인수

## `return`은 출력이 아니다

`return`은 값을 함수 밖으로 돌려주고, `print()`는 화면에 출력한다.

## `*args`와 `**kwargs`

```text
*args → 튜플
**kwargs → 딕셔너리
```

## Local과 Global

같은 이름이어도 서로 다른 스코프에 존재할 수 있다.

## lambda

```python
lambda x: x + 1
```

표현식 결과가 자동 반환된다.

## 클로저

핵심은 내부 함수가 외부 함수의 변수를 기억하고 사용하는가이다.

## Iterable vs Iterator

```text
Iterable → 반복 가능한 데이터
Iterator → 실제로 하나씩 꺼내는 객체
```

## return vs yield

```text
return → 반환 후 종료
yield → 반환 후 일시 정지, 상태 유지
```

---

# 30. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 함수 정의와 호출
- 매개변수 / 인수
- 위치 인수 / 키워드 인수
- 기본값 매개변수
- `*args` / `**kwargs`
- `return`
- 지역 변수 / 전역 변수
- LEGB
- lambda 기본 문법
- `map()` / `filter()`
- 함수가 일급 객체라는 의미
- 클로저의 기본 구조
- 데코레이터의 wrapper 흐름
- `@decorator`
- Iterable / Iterator 차이
- `iter()` / `next()`
- `StopIteration`
- `yield`
- Generator
- Lazy Evaluation

## 나중에 더 깊게 봐도 되는 내용

- 클로저 내부 메모리 구현
- `nonlocal` 심화
- 복수 데코레이터 실행 순서
- `functools.wraps`
- 사용자 정의 Iterator 클래스
- Generator의 `send()`
- Coroutine
- 비동기 프로그래밍과의 연결
- 메모리 최적화 정량 분석

---

# 31. 5장 핵심 한 줄 요약

> **함수는 코드를 재사용하는 기본 단위이고, 스코프는 변수의 범위를 정하며, 클로저와 데코레이터는 함수의 동작을 확장하고, 이터레이터와 제너레이터는 데이터 흐름을 효율적으로 제어한다.**

---

# 32. 수업 후 확인 문제

```python
def add(a, b=10):
    return a + b

result = add(5)
```

1. `a`, `b`는 무엇인가?  
2. `5`는 무엇인가?  
3. `b`에는 어떤 값이 들어가는가?  
4. `result`에는 최종적으로 무엇이 저장되는가?
