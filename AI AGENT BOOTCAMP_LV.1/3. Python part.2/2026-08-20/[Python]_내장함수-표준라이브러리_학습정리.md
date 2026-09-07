# [Python] 내장 함수 · 표준 라이브러리 학습정리

> Python 3.13 / 9장 전체 정리  
> 범위: 9장 1강 ~ 2강

---

# 1. 오늘 학습 전체 구조

```text
9장 내장 함수와 표준 라이브러리
│
├─ 1강. 내장 함수
│  ├─ isinstance()
│  ├─ all()
│  ├─ any()
│  ├─ 빈 리스트 주의
│  ├─ len()
│  ├─ sum()
│  ├─ round()
│  ├─ statistics.mean()
│  ├─ statistics.median()
│  ├─ map()
│  ├─ filter()
│  ├─ enumerate()
│  ├─ zip()
│  ├─ sorted()
│  ├─ min()
│  └─ max()
│
└─ 2강. 표준 라이브러리
   ├─ datetime
   ├─ time
   ├─ math
   ├─ json
   ├─ random
   ├─ os
   └─ sys
```

9장의 핵심 흐름:

```text
데이터가 올바른지 확인한다
↓
여러 조건을 한 번에 판단한다
↓
숫자 데이터를 요약한다
↓
목록 데이터를 변환·필터링한다
↓
반복과 정렬을 간단하게 처리한다
↓
필요한 표준 라이브러리를 import해서
시간·수학·JSON·난수·시스템 기능을 사용한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 내장 함수 | import 없이 바로 사용할 수 있는 Python 기본 함수 |
| `isinstance()` | 객체가 특정 자료형인지 검사 |
| `all()` | 모든 요소가 참이면 True |
| `any()` | 하나라도 참이면 True |
| `len()` | 요소 개수 |
| `sum()` | 숫자 합계 |
| `round()` | 반올림 |
| `mean()` | 평균 |
| `median()` | 중앙값 |
| `map()` | 모든 요소에 같은 변환 적용 |
| `filter()` | 조건이 True인 요소만 추출 |
| `enumerate()` | 반복하면서 번호 함께 제공 |
| `zip()` | 여러 데이터 묶음을 같은 위치끼리 결합 |
| `sorted()` | 정렬한 새 리스트 반환 |
| `min()` / `max()` | 최솟값 / 최댓값 |
| 표준 라이브러리 | Python 설치 시 기본 포함된 모듈 집합 |
| `datetime` | 날짜·시간 |
| `time` | 대기·시간 측정 |
| `math` | 수학 함수 |
| `json` | JSON 직렬화/역직렬화 |
| `random` | 난수 |
| `os` | 파일·디렉토리 등 OS 기능 |
| `sys` | Python 실행 환경 정보 |

---

# 3. 1강 — `isinstance()`

객체가 특정 자료형인지 검사한다.

```python
age_1 = 20
age_2 = "스물"

print(isinstance(age_1, int))  # True
print(isinstance(age_2, int))  # False
```

실행 흐름:

```text
객체
↓
특정 타입과 비교
↓
True / False
```

유효성 검증에서 자주 사용한다.

---

# 4. `all()`과 `any()`

## `all()`

모든 값이 참이어야 True.

```python
user_agreements = [True, True, True]
print(all(user_agreements))
```

결과:

```text
True
```

하나라도 False면:

```text
False
```

즉:

```text
all()
→ 전부 참이어야 통과
```

## `any()`

하나라도 참이면 True.

```python
login_status = [False, True, False]
print(any(login_status))
```

결과:

```text
True
```

즉:

```text
any()
→ 하나라도 참이면 통과
```

---

# 5. `all([])`과 `any([])`

빈 리스트는 주의해야 한다.

```python
all([])  # True
any([])  # False
```

이유를 직관적으로 보면:

```text
all([])
→ False가 하나도 없음
→ True

any([])
→ True가 하나도 없음
→ False
```

실무 안전장치:

```python
if user_inputs and all(user_inputs):
    print("검증 통과")
```

핵심:

> `all()`을 사용할 때 빈 데이터 자체가 유효한지 먼저 확인해야 한다.

---

# 6. `len()`

요소 개수를 센다.

```python
scores = [85, 90, 95, 80]
print(len(scores))
```

결과:

```text
4
```

문자열:

```python
len("Hello")
```

결과:

```text
5
```

---

# 7. `sum()`

숫자 요소를 모두 더한다.

```python
scores = [85, 90, 95, 80]
print(sum(scores))
```

결과:

```text
350
```

주의:

> 문자열 리스트를 이어 붙이는 함수가 아니다.

---

# 8. `round()`

반올림한다.

```python
average_score = 87.666666
print(round(average_score, 2))
```

결과:

```text
87.67
```

두 번째 인수는 소수점 자리 수다.

---

# 9. 평균 직접 계산

```python
scores = [80, 90, 100]

average = sum(scores) / len(scores)
```

실행 흐름:

```text
sum(scores)
↓
270
↓
len(scores)
↓
3
↓
270 / 3
↓
90.0
```

---

# 10. `statistics.mean()`과 `median()`

```python
import statistics
```

평균:

```python
statistics.mean(data)
```

중앙값:

```python
statistics.median(data)
```

예:

```python
assets = [10, 20, 15, 30, 1000000000]
```

평균은 이상치의 영향을 크게 받는다.

중앙값은 정렬 후 가운데 값을 사용하므로 극단값의 영향을 덜 받는다.

---

# 11. `map()`

모든 요소에 같은 함수를 적용한다.

```python
prices = [1000, 2000, 3000]

discounted = list(
    map(lambda x: x * 0.9, prices)
)
```

결과:

```text
[900.0, 1800.0, 2700.0]
```

핵심:

```text
map()
→ 변환
```

---

# 12. `filter()`

조건이 True인 요소만 남긴다.

```python
scores = [45, 80, 55, 90, 30]

passing_scores = list(
    filter(lambda x: x >= 60, scores)
)
```

결과:

```text
[80, 90]
```

핵심:

```text
filter()
→ 선별
```

---

# 13. `enumerate()`

반복할 때 인덱스 번호와 값을 함께 제공한다.

```python
student_list = ["김철수", "이영희", "박민수"]

for idx, name in enumerate(student_list, start=1):
    print(idx, name)
```

결과:

```text
1 김철수
2 이영희
3 박민수
```

핵심:

> `start=1`을 지정하면 번호를 1부터 시작할 수 있다.

---

# 14. `zip()`

여러 데이터 묶음에서 같은 위치끼리 짝을 만든다.

```python
names = ["김철수", "이영희"]
emails = ["a@test.com", "b@test.com"]

for name, email in zip(names, emails):
    print(name, email)
```

개념:

```text
names[0]  + emails[0]
names[1]  + emails[1]
```

길이가 다르면 기본 `zip()`은 짧은 쪽이 끝나는 시점에서 멈춘다.

---

# 15. `sorted()`

정렬된 새 리스트를 만든다.

```python
scores = [85, 95, 90, 78]

print(sorted(scores))
```

결과:

```text
[78, 85, 90, 95]
```

내림차순:

```python
sorted(scores, reverse=True)
```

---

# 16. `min()`과 `max()`

```python
min(scores)
max(scores)
```

결과:

```text
78
95
```

---

# 17. 2강 — 표준 라이브러리란?

Python 설치 시 기본 포함되어 있는 모듈 집합이다.

별도 패키지 설치 없이:

```python
import 모듈명
```

으로 사용할 수 있다.

대표:

```text
datetime
time
math
json
random
os
sys
```

---

# 18. `datetime`

현재 날짜와 시간을 다룬다.

```python
import datetime

now = datetime.datetime.now()
```

현재 날짜만:

```python
datetime.date.today()
```

시간 간격:

```python
datetime.timedelta()
```

---

# 19. `strftime()`

날짜/시간 객체를 문자열 형식으로 바꾼다.

대표 포맷:

| 코드 | 의미 |
|---|---|
| `%Y` | 4자리 연도 |
| `%m` | 월 |
| `%d` | 일 |
| `%H` | 시 |
| `%M` | 분 |
| `%S` | 초 |
| `%A` | 요일 이름 |

예:

```python
now.strftime("%Y-%m-%d %H:%M:%S")
```

---

# 20. `time`

```python
import time
```

잠시 멈춤:

```python
time.sleep(0.5)
```

실행 시간 측정:

```python
start = time.perf_counter()

# 작업

end = time.perf_counter()

elapsed = end - start
```

---

# 21. `math`

```python
import math
```

대표 함수:

| 함수 | 의미 |
|---|---|
| `math.ceil(x)` | 올림 |
| `math.floor(x)` | 내림 |
| `math.trunc(x)` | 소수 부분 제거 |
| `math.fabs(x)` | 절대값 |
| `math.sqrt(x)` | 제곱근 |
| `math.pi` | 원주율 |

---

# 22. `json`

Python 데이터와 JSON 문자열/파일을 변환한다.

```python
import json
```

Python 객체 → JSON 문자열:

```python
json.dumps(obj)
```

JSON 문자열 → Python 객체:

```python
json.loads(text)
```

Python 객체 → JSON 파일:

```python
json.dump(obj, file)
```

JSON 파일 → Python 객체:

```python
json.load(file)
```

---

# 23. 직렬화와 역직렬화

## 직렬화

```text
Python 객체
↓
JSON 문자열/파일
```

## 역직렬화

```text
JSON 문자열/파일
↓
Python 객체
```

---

# 24. `random`

난수를 다룬다.

```python
import random
```

대표 함수:

| 함수 | 의미 |
|---|---|
| `random.randint(a, b)` | a 이상 b 이하 정수 |
| `random.random()` | 0.0 이상 1.0 미만 실수 |
| `random.choice(seq)` | 요소 하나 선택 |
| `random.shuffle(seq)` | 리스트 원본 순서 섞기 |
| `random.sample(seq, k)` | 중복 없이 k개 추출 |

---

# 25. 로또 예제

```python
lotto_numbers = []

while len(lotto_numbers) < 6:
    num = random.randint(1, 45)

    if num not in lotto_numbers:
        lotto_numbers.append(num)
```

핵심 흐름:

```text
난수 생성
↓
이미 있는 값인지 확인
↓
없으면 추가
↓
6개 될 때까지 반복
```

---

# 26. `os`

운영체제와 파일 경로 관련 기능을 다룬다.

```python
import os
```

대표:

```python
os.getcwd()
os.listdir(path)
os.path.exists(path)
os.path.join(p1, p2)
```

---

# 27. `sys`

현재 Python 실행 환경을 다룬다.

```python
import sys
```

대표:

```python
sys.version
sys.argv
sys.exit()
```

---

# 28. 9장 전체 연결 구조

```text
입력 데이터
↓
isinstance()
↓
all() / any()
↓
len() / sum() / round()
↓
mean() / median()
↓
map() / filter()
↓
enumerate() / zip()
↓
sorted() / min() / max()
↓
필요한 표준 라이브러리 import
↓
datetime / time / math / json / random / os / sys
```

---

# 29. 헷갈리기 쉬운 개념 리뷰

## `all()` vs `any()`

```text
all()
→ 모두 True

any()
→ 하나라도 True
```

## 빈 리스트

```text
all([]) → True
any([]) → False
```

## `map()` vs `filter()`

```text
map()
→ 값을 변환

filter()
→ 조건에 맞는 값만 남김
```

## `enumerate()` vs `zip()`

```text
enumerate()
→ 번호 + 값

zip()
→ 값 + 값
```

## `round()` vs `ceil()` vs `floor()`

```text
round()
→ 반올림

ceil()
→ 올림

floor()
→ 내림
```

## 내장 함수 vs 표준 라이브러리

```text
내장 함수
→ 바로 사용
→ len(), sum(), all()

표준 라이브러리
→ import 필요
→ datetime, math, json
```

---

# 30. 지금 반드시 알아야 하는 내용

## 반드시 이해

- `isinstance()`
- `all()` / `any()`
- `all([])` / `any([])`
- `len()` / `sum()` / `round()`
- 평균과 중앙값 차이
- `map()` / `filter()`
- `enumerate()` / `zip()`
- `sorted()` / `min()` / `max()`
- 표준 라이브러리란 무엇인지
- `import`
- `datetime.datetime.now()`
- `strftime()`
- `time.sleep()`
- `time.perf_counter()`
- `math.ceil()` / `math.floor()`
- `json.dumps()` / `json.loads()`
- `random.randint()` / `choice()` / `shuffle()`
- `os.getcwd()`
- `sys.version`

## 나중에 더 깊게 봐도 되는 내용

- statistics 모듈의 고급 통계 함수
- `zip_longest()`
- 정렬 `key` 함수 심화
- datetime timezone
- random seed
- pathlib
- sys.path
- 운영체제별 파일 경로 차이

---

# 31. 9장 핵심 한 줄 요약

> **내장 함수로 검증·계산·변환·반복을 간결하게 처리하고, 표준 라이브러리를 import해 시간·수학·JSON·난수·시스템 기능까지 확장한다.**
