# [Python] 변수 · 자료형 · 연산자 · 문자열 형식화 학습정리

> Python 3.13 / 2장 전체 정리  
> 범위: 2장 1강 ~ 4강

---

# 1. 오늘 학습 전체 구조

```text
2장 Python 기초
│
├─ 1강. 변수와 동적 타이핑
│  ├─ 변수 = 객체를 가리키는 이름
│  ├─ 참조(Reference)
│  ├─ 변수 명명 규칙
│  ├─ 동적 타이핑
│  ├─ 재할당
│  ├─ type(), id()
│  └─ Jupyter Notebook 세션
│
├─ 2강. 기본 자료형과 형변환
│  ├─ int
│  ├─ float
│  ├─ str
│  ├─ bool
│  ├─ 명시적 형변환
│  ├─ 묵시적 형변환
│  ├─ ValueError
│  └─ isdigit()
│
├─ 3강. 연산자
│  ├─ 산술 연산자
│  ├─ 복합 대입 연산자
│  ├─ 비교 연산자
│  ├─ 논리 연산자
│  ├─ 단락 평가
│  └─ 연산자 우선순위
│
└─ 4강. 문자열 형식화
   ├─ % 연산자
   ├─ str.format()
   ├─ f-string
   ├─ 정렬 / 너비 / 쉼표
   ├─ 디버깅 조절자 =
   └─ PEP 701
```

2장의 핵심 흐름:

```text
값을 만든다
↓
변수가 그 값을 가리킨다
↓
값마다 자료형이 있다
↓
필요하면 자료형을 바꾼다
↓
연산자로 값을 계산·비교한다
↓
결과를 문자열로 보기 좋게 출력한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 변수 | 값을 담는 상자라기보다 **객체를 가리키는 이름** |
| 객체 | 메모리에 실제로 존재하는 데이터 |
| 참조 | 변수가 객체와 연결되는 관계 |
| 동적 타이핑 | 실행 중 변수가 가리키는 객체에 따라 타입이 결정됨 |
| 재할당 | 변수가 기존 객체가 아닌 새로운 객체를 가리키도록 변경 |
| `type()` | 객체의 자료형 확인 |
| `id()` | 객체를 식별하는 고유값 확인 |
| `int` | 정수 |
| `float` | 실수 |
| `str` | 문자열 |
| `bool` | `True`, `False` |
| 형변환 | 한 자료형을 다른 자료형으로 변환 |
| 산술 연산자 | 숫자를 계산 |
| 비교 연산자 | 두 값을 비교해 `True/False` 반환 |
| 논리 연산자 | 여러 조건을 연결 |
| 단락 평가 | 결과가 이미 결정되면 뒤의 조건을 실행하지 않음 |
| f-string | 변수와 표현식을 문자열 안에 직접 넣는 현대 Python 표준 출력 방식 |

---

# 3. 1강 — 변수와 동적 타이핑

## 3.1 변수란?

파이썬에서 변수는 데이터를 직접 담고 있는 상자라고 보기보다, **메모리에 만들어진 객체를 가리키는 이름**이라고 이해하는 것이 정확하다.

```python
x = 10
```

실행 흐름:

```text
1. 정수 객체 10이 준비된다.
2. x라는 이름이 만들어진다.
3. x가 10 객체를 가리킨다.
```

개념적으로:

```text
x
↓
10
```

## 3.2 참조(Reference)

```python
age = 20
```

```text
age ─────→ 20
```

- `age` → 변수 이름
- `20` → 정수 객체
- 화살표 → 참조 관계

핵심 문장:

> **변수는 객체를 가리키는 이름이다.**

## 3.3 변수 이름 규칙

가능:

```python
user_name = "지현"
age2 = 20
_total = 100
```

불가능:

```python
3rd_step = 3
user name = "지현"
for = 10
```

이유:
- 숫자로 시작할 수 없음
- 공백 사용 불가
- Python 예약어 사용 불가

권장 스타일:

```python
user_name
total_price
student_score
```

## 3.4 동적 타이핑

```python
x = 10
print(type(x))      # int

x = "Hello"
print(type(x))      # str
```

실행 흐름:

```text
x → 10(int)
↓ 재할당
x → "Hello"(str)
```

정확히는 x 자체의 타입이 영구적으로 변한 것이 아니라, x가 다른 타입의 객체를 새롭게 가리키게 된 것이다.

## 3.5 변수 재할당

```python
age = 20
age = 25
```

```text
이전
age → 20

이후
age → 25
```

더 이상 참조되지 않는 객체는 Python의 자동 메모리 관리 대상이 될 수 있다.

### 가비지 컬렉터

초보 단계에서는 다음만 기억하면 충분하다.

> **Python은 사용하지 않는 객체의 메모리를 자동으로 관리한다.**

## 3.6 `type()`과 `id()`

```python
x = 10
print(type(x))
print(id(x))
```

- `type()` → 자료형 확인
- `id()` → 객체 identity를 나타내는 식별값 확인

`id()`를 단순히 메모리 주소라고 외우기보다, **객체를 구별하는 식별값**이라고 이해하는 편이 정확하다.

## 3.7 Jupyter Notebook의 변수 상태

Jupyter Notebook에서는 실행된 셀들이 같은 Kernel의 메모리를 공유한다.

```python
# 셀 1
score = 100
```

```python
# 셀 2
score += 20
```

```python
# 셀 3
score
```

결과:

```text
120
```

핵심:

> 셀의 위아래 위치보다 **실행 순서**가 중요하다.

---

# 4. 2강 — 기본 자료형과 형변환

## 4.1 기본 자료형

### `int`

```python
age = 25
count = -5
zero = 0
```

소수점이 없는 정수.

### `float`

```python
height = 175.5
pi = 3.14
```

소수점을 포함하는 실수.

### `str`

```python
name = "Sparta"
grade = 'A'
```

문자열은 따옴표로 감싼다.

```python
name = Sparta
```

처럼 따옴표가 없으면 Python은 `Sparta`를 변수 이름으로 찾는다.

### `bool`

```python
is_login = True
is_admin = False
```

첫 글자를 대문자로 작성한다.

## 4.2 Truthy / Falsy

대표 Falsy:

```python
0
0.0
""
[]
None
False
```

대표 Truthy:

```python
1
-1
"hello"
[1, 2]
True
```

지금은 "비어 있거나 0에 가까운 값은 False로 평가되는 경우가 많다" 정도로 이해하면 충분하다.

## 4.3 명시적 형변환

```python
int()
float()
str()
bool()
```

문자열 → 정수:

```python
num_str = "100"
num = int(num_str)
```

숫자 → 문자열:

```python
age = 20
message = "내 나이는 " + str(age) + "살입니다."
```

실수 → 정수:

```python
pi = 3.99
print(int(pi))  # 3
```

`int()`는 반올림이 아니라 소수 부분을 제거한다.

## 4.4 묵시적 형변환

```python
result = 10 + 3.5
print(result)  # 13.5
```

```text
10(int) + 3.5(float)
↓
13.5(float)
```

## 4.5 `input()`과 형변환

```python
age = input("나이를 입력하세요: ")
```

사용자가 `20`을 입력해도 결과는 문자열 `"20"`이다.

숫자 연산이 필요하면:

```python
age = int(input("나이를 입력하세요: "))
```

## 4.6 `ValueError`

```python
int("20세")
```

→ `ValueError`

```python
int("3.14")
```

도 바로 변환할 수 없다.

가능한 방법:

```python
int(float("3.14"))
```

```text
"3.14"
↓ float()
3.14
↓ int()
3
```

## 4.7 `isdigit()`

```python
user_input = "25"

if user_input.isdigit():
    age = int(user_input)
```

주의:

```python
"3.14".isdigit()
```

은 `False`다. `.`이 포함되어 있기 때문이다.

---

# 5. 3강 — 연산자

## 5.1 산술 연산자

| 연산자 | 의미 | 예시 | 결과 |
|---|---|---|---|
| `+` | 더하기 | `7 + 3` | `10` |
| `-` | 빼기 | `7 - 3` | `4` |
| `*` | 곱하기 | `7 * 3` | `21` |
| `/` | 나누기 | `4 / 2` | `2.0` |
| `//` | 몫 | `7 // 3` | `2` |
| `%` | 나머지 | `7 % 3` | `1` |
| `**` | 거듭제곱 | `2 ** 3` | `8` |

## 5.2 `%` 활용

```python
number = 10
number % 2 == 0
```

```text
10 % 2
↓
0
↓
0 == 0
↓
True
```

즉 2로 나눈 나머지가 0이면 짝수.

## 5.3 복합 대입 연산자

```python
score = 100
score += 50
```

은:

```python
score = score + 50
```

과 같다.

대표 형태:

```python
+=
-=
*=
/=
//=
%=
```

## 5.4 비교 연산자

```python
10 == 10  # True
10 != 5   # True
10 > 5    # True
10 <= 5   # False
```

- `=` → 대입
- `==` → 비교

## 5.5 논리 연산자

### `and`

모든 조건이 True여야 True.

### `or`

하나라도 True면 True.

### `not`

참/거짓을 뒤집는다.

```python
is_adult = True
has_ticket = False

print(is_adult and has_ticket)  # False
print(is_adult or has_ticket)   # True
print(not is_adult)             # False
```

## 5.6 단락 평가

```python
False and (10 / 0 > 1)
```

왼쪽이 False이므로 오른쪽은 실행되지 않는다.

```python
True or (10 / 0 > 1)
```

왼쪽이 True이므로 오른쪽은 실행되지 않는다.

핵심:

```text
and → False를 만나면 멈출 수 있음
or  → True를 만나면 멈출 수 있음
```

## 5.7 연산자 우선순위

```text
()
↓
**
↓
*, /, //, %
↓
+, -
↓
비교 연산
↓
not
↓
and
↓
or
```

예:

```python
result = 10 + 2 * 5 > 25
```

```text
2 * 5
↓
10 + 10
↓
20 > 25
↓
False
```

복잡할수록 괄호 사용을 권장한다.

---

# 6. 4강 — 문자열 형식화

## 6.1 문자열 형식화란?

변수 값을 고정된 문자열 틀 안에 넣어 보기 좋게 출력하는 기술.

## 6.2 1세대 — `%` 방식

```python
name = "홍길동"
age = 20

print("이름: %s, 나이: %d" % (name, age))
```

대표 기호:

```text
%s → 문자열
%d → 정수
%f → 실수
```

현재 새 코드에서는 우선순위가 낮지만 레거시 코드 해석을 위해 알아둘 필요가 있다.

## 6.3 2세대 — `str.format()`

```python
print("이름: {}, 나이: {}".format(name, age))
```

인덱스:

```python
"{0} / {1}".format(name, age)
```

이름:

```python
"{name} / {age}".format(name=name, age=age)
```

## 6.4 3세대 — f-string

현재 가장 중요하다.

```python
name = "지현"
age = 20

print(f"이름: {name}, 나이: {age}")
```

표현식도 가능:

```python
price = 5000
qty = 2

print(f"총 금액: {price * qty}원")
```

## 6.5 정렬

왼쪽 정렬:

```python
f"{name:<12}"
```

오른쪽 정렬:

```python
f"{price:>10}"
```

## 6.6 천 단위 쉼표

```python
price = 15000
print(f"{price:,}")
```

결과:

```text
15,000
```

## 6.7 소수점 표현

```python
pi = 3.14159
print(f"{pi:.2f}")
```

결과:

```text
3.14
```

## 6.8 디버깅 조절자 `=`

```python
score = 95
print(f"{score=}")
```

결과:

```text
score=95
```

## 6.9 PEP 701

Python 3.12 이후 f-string 문법이 더 유연해졌다.

PEP 번호와 세부 규칙은 지금 외울 필요 없다.

핵심:

> Python 3.13에서는 새 문자열 출력 코드를 작성할 때 f-string을 우선 사용하면 된다.

---

# 7. 2장 전체 연결 예제

```python
name = input("이름: ")
price = int(input("상품 가격: "))
qty = int(input("수량: "))

total = price * qty
is_expensive = total >= 10000

print(f"{name}님의 결제 금액은 {total:,}원입니다.")
print(f"{is_expensive=}")
```

## 실행 순서

```text
input()
↓
문자열 입력
↓
int()로 숫자 변환
↓
price * qty 계산
↓
>= 비교
↓
bool 결과 생성
↓
f-string으로 출력
```

즉:

```text
변수
→ 자료형
→ 형변환
→ 연산자
→ bool
→ f-string
```

2장의 모든 핵심 개념이 연결된다.

---

# 8. 헷갈리기 쉬운 개념 리뷰

## 8.1 변수는 값 그 자체가 아니다

```python
x = 10
```

초보 표현:
> x에 10을 저장했다.

정확한 표현:
> x가 10 객체를 가리킨다.

## 8.2 재할당은 기존 객체가 변하는 것과 다르다

```python
x = 10
x = "hello"
```

`10`이 `"hello"`로 바뀐 것이 아니라 x의 참조 대상이 바뀐 것이다.

## 8.3 `=`와 `==`

```python
x = 10
```

대입.

```python
x == 10
```

비교.

## 8.4 `int(3.99)`는 반올림이 아니다

```python
int(3.99)
```

→ `3`

## 8.5 `input()`의 결과는 문자열

```python
age = input()
```

숫자를 입력해도 `str`.

## 8.6 단락 평가

```text
and → 왼쪽이 False면 뒤를 볼 필요가 없음
or  → 왼쪽이 True면 뒤를 볼 필요가 없음
```

## 8.7 f-string `{}`에는 표현식도 가능

```python
f"{price * qty}"
```

먼저 계산한 뒤 결과가 문자열 안에 들어간다.

---

# 9. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 변수는 객체를 가리키는 이름
- `=`는 대입
- 동적 타이핑
- 재할당
- `type()`
- `int`, `float`, `str`, `bool`
- `input()` 결과는 문자열
- `int()`, `float()`, `str()`
- `ValueError`
- `+ - * / // % **`
- `+=` 같은 복합 대입
- `==`, `!=`, `>`, `<`, `>=`, `<=`
- `and`, `or`, `not`
- 연산 결과와 실행 순서
- f-string 기본 사용

## 나중에 더 깊게 봐도 되는 내용

- Garbage Collector 내부 동작
- `id()`와 CPython 메모리 구현 세부사항
- Truthy/Falsy의 모든 예외
- 문자열 Unicode 비교 내부 구조
- 단락 평가 내부 구현
- `%` 방식의 모든 포맷 옵션
- `str.format()` 고급 옵션
- PEP 701 세부 사양

---

# 10. 2장 핵심 한 줄 요약

> **Python에서는 변수가 객체를 가리키고, 객체마다 자료형이 있으며, 필요하면 형변환한 뒤 연산자로 처리하고 f-string으로 결과를 표현한다.**

---

# 11. 수업 후 확인 문제

```python
price = "5000"
qty = 2
```

`price * qty`를 이용해 숫자 `10000`을 만들고 싶다면, 왜 현재 코드 그대로는 원하는 숫자 연산이 되지 않으며 무엇을 먼저 해야 할까?
