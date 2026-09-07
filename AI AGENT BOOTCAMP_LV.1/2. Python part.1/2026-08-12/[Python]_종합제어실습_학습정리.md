# 4장 3강 종합 제어 실습 학습 정리

## 오늘의 핵심

이번 학습의 핵심은 조건문과 반복문을 따로 외우는 것이 아니라,  
**문제를 보고 어떤 값을 반복하고, 어떤 조건을 검사하고, 어떤 결과를 변수에 저장할지 설계하는 것**이다.

현재는 코드를 보면 실행 흐름은 이해할 수 있지만, 빈 화면에서 처음부터 코드를 작성하는 것은 아직 어렵다.  
따라서 당장은 **문제 → 한국어 실행 순서 → 필요한 문법 → 코드** 순서로 생각하는 연습이 중요하다.

---

## 1. 조건문과 반복문을 같이 쓰는 이유

여러 데이터를 하나씩 확인하면서 특정 조건에 맞는 데이터만 골라내고 싶을 때 사용한다.

```python
numbers = [3, 8, 12, 5]

for number in numbers:
    if number > 10:
        print(number)
```

### 실행 흐름

1. `for`가 리스트의 요소를 하나씩 꺼낸다.
2. 꺼낸 값을 `number`에 저장한다.
3. `if`가 `number > 10`인지 확인한다.
4. 조건이 `True`일 때만 출력한다.
5. 리스트의 모든 요소를 확인하면 `for`문은 자동으로 종료된다.

### 역할 구분

- `for` : 여러 데이터를 하나씩 꺼낼 때
- `if` : 꺼낸 값이 원하는 조건에 맞는지 검사할 때
- `break` : 반복을 중간에 강제로 끝내야 할 때만 사용

---

## 2. 누적 변수와 초기값 0

반복문 안에서 합계나 개수를 계속 저장하려면 반복문이 시작되기 전에 변수를 먼저 만들어야 한다.

```python
total = 0
```

`total += number`는 실제로 다음과 같은 뜻이다.

```python
total = total + number
```

따라서 기존 `total` 값이 먼저 존재해야 한다.

### 왜 0으로 시작할까?

합계나 개수는 아직 아무것도 더하거나 세지 않은 상태가 `0`이기 때문이다.

```python
numbers = [10, 20, 30]
total = 0

for number in numbers:
    total += number
```

실행 흐름:

```text
처음 total = 0

10을 꺼냄 → total = 0 + 10 = 10
20을 꺼냄 → total = 10 + 20 = 30
30을 꺼냄 → total = 30 + 30 = 60
```

---

## 3. `total += number`와 `count += 1`의 차이

둘 다 누적이지만 무엇을 누적하는지가 다르다.

### 합계를 구할 때

```python
total += number
```

현재 숫자 자체를 계속 더한다.

### 개수를 셀 때

```python
count += 1
```

조건을 만족한 횟수를 1씩 더한다.

예시:

```python
numbers = [3, 15, 20, 5]
count = 0

for number in numbers:
    if number > 10:
        count += 1
```

실행 흐름:

```text
count = 0

3  → 조건 False → count = 0
15 → 조건 True  → count = 1
20 → 조건 True  → count = 2
5  → 조건 False → count = 2
```

### 핵심

```python
total += number   # 값의 합계를 누적
count += 1        # 조건을 만족한 개수를 누적
```

---

## 4. `len()`은 언제 쓰는가?

`len()`은 이미 존재하는 리스트나 문자열 등의 **전체 요소 개수**를 알고 싶을 때 사용한다.

```python
numbers = [10, 20, 30]

len(numbers)
```

결과:

```text
3
```

### `len()`과 `count += 1`의 차이

- `len(numbers)` : 리스트 전체 요소의 개수
- `count += 1` : 특정 조건을 만족한 요소의 개수

예를 들어 `[3, 8, 12, 5]`에서 10보다 큰 숫자의 개수를 알고 싶다면 원래 리스트에 `len()`을 바로 쓰면 4가 나온다.

따라서 조건을 만족한 횟수를 직접 세어야 한다.

```python
count = 0

for number in numbers:
    if number > 10:
        count += 1
```

---

## 5. 최댓값과 최솟값은 왜 첫 번째 요소로 시작할까?

```python
student_scores = [85, 92, 78, 60]

highest = student_scores[0]
lowest = student_scores[0]
```

`student_scores[0]`은 실제 데이터의 첫 번째 값이다.

최댓값과 최솟값은 비교를 위한 기준이 필요하기 때문에 실제 데이터 중 하나를 최초 기준값으로 사용한다.

### 최댓값 찾기

```python
numbers = [5, 12, 3]

highest = numbers[0]

for number in numbers:
    if number > highest:
        highest = number
```

실행 흐름:

```text
처음 highest = 5

number = 5
5 > 5 → False
highest는 기존 값 5 유지

number = 12
12 > 5 → True
highest = 12

number = 3
3 > 12 → False
highest = 12 유지
```

### 중요한 점

조건식이 `False`라고 해서 `highest` 값이 없어지는 것이 아니다.

```python
highest = numbers[0]
```

에서 이미 값이 저장되어 있다.

반복문 안의

```python
highest = number
```

는 더 큰 값을 발견했을 때 기존 값을 **교체하는 코드**다.

---

## 6. 평균은 왜 미리 `average = 0`으로 만들지 않을까?

```python
numbers = [10, 20, 30]

total = 0

for number in numbers:
    total += number

average = total / len(numbers)
```

`total`은 반복문이 돌 때마다 계속 사용되므로 반복문 전에 초기값이 필요하다.

반면 `average`는 반복이 끝난 뒤 한 번만 계산한다.

```text
total = 60
len(numbers) = 3

average = 60 / 3
average = 20
```

따라서 미리 `average = 0`으로 만들 필요가 없다.

### 역할 구분

- `highest`, `lowest` : 비교 기준이 필요 → 첫 번째 요소로 초기화
- `total`, `count` : 누적 시작점이 필요 → 0으로 초기화
- `average` : 반복 종료 후 한 번 계산 → 사전 초기화 불필요

---

## 7. `while True`와 `break`

종료 시점을 미리 알 수 없을 때 `while True`를 사용할 수 있다.

```python
while True:
    number = int(input("숫자 입력: "))

    if number == 0:
        break
```

### 실행 흐름

1. `while True`로 반복 시작
2. 사용자 입력 받기
3. 조건 확인
4. 조건을 만족하지 않으면 다시 반복
5. 조건을 만족하면 `break`
6. 반복문 종료

### `break`의 특징

`break`는 현재 저장된 값을 되돌리는 것이 아니다.  
**그 시점부터 반복만 종료한다.**

```python
count = 0

while True:
    count += 1

    if count == 3:
        break
```

최종 `count`는 `3`이다.

`count`가 먼저 3이 된 뒤 조건을 검사하고 `break`가 실행되기 때문이다.

---

## 8. 무한 루프가 발생하는 이유

```python
count = 1

while count <= 3:
    print(count)
```

이 코드는 `count`의 값이 바뀌지 않기 때문에 계속 다음 조건을 검사한다.

```text
1 <= 3 → True
1 <= 3 → True
1 <= 3 → True
...
```

따라서 무한 루프가 된다.

수정:

```python
count = 1

while count <= 3:
    print(count)
    count += 1
```

실행 흐름:

```text
count = 1
count = 2
count = 3
count = 4 → 조건 False → 종료
```

### 핵심

`while`문은 반복 과정에서 조건에 사용되는 값이 바뀌어 언젠가 `False`가 되거나, 내부에서 `break`가 실행되도록 설계해야 한다.

---

# 9. 가장 헷갈렸던 부분: 문제를 보고 변수 개수 정하기

변수 개수를 먼저 정하려고 하면 헷갈린다.

예를 들어 다음 문제를 보자.

> `[3, 8, 12, 5]`에서 10보다 큰 숫자의 개수를 구하시오.

바로 "변수가 2개인가? 3개인가?"를 생각하지 않는다.

먼저 프로그램이 무엇을 기억해야 하는지 찾는다.

### 1단계: 원본 데이터

```text
numbers
```

### 2단계: 반복하면서 현재 꺼낸 값

```text
number
```

### 3단계: 결과로 기억해야 하는 값

10보다 큰 숫자의 개수:

```text
count
```

그래서 코드가 다음처럼 만들어진다.

```python
numbers = [3, 8, 12, 5]
count = 0

for number in numbers:
    if number > 10:
        count += 1
```

---

## 10. 변수 설계 기준

문제를 받으면 변수 개수를 먼저 세지 말고 다음 질문을 한다.

### 원본 데이터가 있는가?

```text
scores
numbers
users
```

### 반복하면서 하나씩 꺼내야 하는가?

```text
score
number
user
```

이것은 `for`문에서 사용하는 반복 변수다.

### 결과로 무엇을 기억해야 하는가?

합계:

```text
total
```

개수:

```text
count
```

최댓값:

```text
highest
```

최솟값:

```text
lowest
```

평균:

```text
average
```

---

## 예시: 최고 점수와 총합을 둘 다 구하기

문제:

> 학생 점수 `[80, 95, 70]`에서 최고 점수와 총합을 구하시오.

### 결과로 기억해야 할 값

```text
최고 점수 → highest
총합 → total
```

코드:

```python
scores = [80, 95, 70]

highest = scores[0]
total = 0

for score in scores:
    if score > highest:
        highest = score

    total += score
```

### 변수 역할

```text
scores   → 원본 데이터
score    → 현재 반복에서 꺼낸 값
highest  → 지금까지의 최고 점수
total    → 지금까지의 총합
```

여기서 **결과 변수는 2개**지만 코드 전체에서는 원본 데이터와 반복 변수까지 포함되어 변수 4개가 사용된다.

---

# 문제를 코드로 바꾸는 순서

앞으로 문제를 받으면 바로 코드를 작성하려고 하지 않는다.

```text
문제
↓
무엇을 해야 하는지 한국어로 순서 작성
↓
어떤 값을 기억해야 하는지 확인
↓
필요한 변수 결정
↓
반복이 필요한지 판단
↓
조건 검사가 필요한지 판단
↓
코드 작성
```

예시:

> 활성 회원의 수를 구한다.

한국어 실행 순서:

```text
1. 회원 데이터가 있다.
2. 회원을 한 명씩 확인한다.
3. active가 True인지 확인한다.
4. True이면 개수를 1 증가시킨다.
```

코드로 변환:

```python
active_user_count = 0

for user in user_database:
    if user["active"]:
        active_user_count += 1
```

---

# 오늘 반드시 기억할 것

1. `for`는 여러 데이터를 하나씩 꺼낼 때 사용한다.
2. `if`는 꺼낸 값이 조건에 맞는지 검사한다.
3. `total = 0`은 합계를 누적하기 위한 시작값이다.
4. `count = 0`은 개수를 누적하기 위한 시작값이다.
5. `total += number`는 숫자 값을 누적한다.
6. `count += 1`은 조건을 만족한 횟수를 누적한다.
7. `highest`와 `lowest`는 비교 기준이 필요하므로 실제 데이터의 첫 번째 요소를 기준으로 잡는다.
8. `average`는 반복이 끝난 결과를 가지고 마지막에 한 번 계산하므로 미리 초기화할 필요가 없다.
9. `while True`는 종료 시점을 모를 때 사용할 수 있고 `break`로 종료한다.
10. 변수 개수를 먼저 정하지 말고 **프로그램이 무엇을 기억해야 하는지를 먼저 찾는다.**

---

# 한 줄 요약

> **문제를 보고 바로 코드를 쓰지 말고, 반복할 것·검사할 것·기억할 값을 먼저 찾으면 필요한 변수와 코드 구조가 보이기 시작한다.**

---

## 현재 이해 상태

- 조건문과 반복문이 언제 필요한지는 이해함
- 작성된 코드를 보면 실행 흐름을 따라갈 수 있음
- 누적 변수와 초기값의 역할을 이해함
- `len()`과 `count += 1`의 차이를 이해함
- 최댓값·최솟값의 초기 기준값을 이해함
- `while True`와 `break`의 역할을 이해함
- 아직 빈 화면에서 문제를 처음부터 코드로 작성하는 것은 어려움
- 다음 학습 목표: **문제를 한국어 실행 순서로 나눈 뒤 필요한 변수를 직접 골라내는 연습**

---

# 학습 중 실제로 헷갈렸던 지점

## 1. `highest = numbers[0]` 이후 첫 비교가 False인데 왜 값이 남아 있는가?

```python
numbers = [5, 12, 3]
highest = numbers[0]

for number in numbers:
    if number > highest:
        highest = number
```

첫 반복에서는 `number = 5`, `highest = 5`이므로 `5 > 5`는 `False`다.  
따라서 `highest = number`는 실행되지 않는다.

하지만 `highest`는 반복문 전에 이미 `5`로 저장되어 있으므로 사라지지 않고 기존 값 `5`를 유지한다.

> `highest = numbers[0]`은 최초 기준값 설정, `highest = number`는 더 큰 값을 찾았을 때 기준값을 갱신하는 코드다.

## 2. 평균은 왜 `average = 0`으로 초기화하지 않는가?

`total`은 반복 중 계속 사용되므로 `total = 0`이라는 시작값이 필요하다.  
반면 `average`는 반복이 모두 끝난 뒤 `total / len(numbers)`로 한 번 계산하여 새로 저장하므로 사전 초기화가 필요하지 않다.

## 3. 10보다 큰 수의 개수를 세는데 왜 `+=`가 필요한가?

숫자 자체를 더하는 것이 아니라 **조건을 만족한 횟수**를 누적하기 때문이다.

```python
count = 0

for number in numbers:
    if number > 10:
        count += 1
```

`count += 1`은 조건을 만족한 값을 하나 찾을 때마다 `0 → 1 → 2 → ...`처럼 발견 횟수를 누적한다.

## 4. `len()`과 `count += 1`은 언제 구분해서 쓰는가?

- `len(numbers)` : 이미 존재하는 전체 묶음의 요소 개수
- `count += 1` : 반복하면서 특정 조건을 만족한 요소의 개수

## 5. 문제를 보고 변수 개수를 어떻게 정하는가?

변수 개수를 먼저 정하지 않는다.  
대신 프로그램이 실행되는 동안 **무엇을 기억해야 하는지**부터 찾는다.

예:

> `[80, 95, 70]`에서 최고 점수와 총합을 구한다.

결과로 기억할 값:
- 최고 점수 → `highest`
- 총합 → `total`

반복을 위해 추가되는 값:
- 원본 데이터 → `scores`
- 현재 꺼낸 값 → `score`

따라서 결과 변수는 2개지만 코드 전체에서는 4개의 변수가 사용될 수 있다.

> 문제 → 한국어 실행 순서 → 기억할 값 → 필요한 변수 → 반복/조건 구조 → 코드 작성
