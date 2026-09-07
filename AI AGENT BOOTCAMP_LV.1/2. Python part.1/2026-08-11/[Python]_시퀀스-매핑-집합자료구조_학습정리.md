# [Python] 시퀀스 · 매핑 · 집합 자료구조 학습정리

> Python 3.13 / 3장 전체 정리  
> 범위: 3장 1강 ~ 2강

---

# 1. 오늘 학습 전체 구조

```text
3장 자료구조
│
├─ 1강. 시퀀스 자료구조
│  ├─ 리스트(List)
│  ├─ 튜플(Tuple)
│  ├─ 가변성 / 불변성
│  ├─ 인덱싱(Indexing)
│  ├─ 슬라이싱(Slicing)
│  ├─ 시퀀스 공통 연산
│  ├─ in / not in
│  └─ 패킹 / 언패킹
│
└─ 2강. 매핑 및 집합 자료구조
   ├─ 딕셔너리(Dictionary)
   ├─ Key / Value
   ├─ keys() / values() / items()
   ├─ get()
   ├─ 집합(Set)
   ├─ 중복 제거
   ├─ 교집합 / 합집합 / 차집합
   └─ list() / tuple() / set() 상호 변환
```

3장의 핵심 흐름은 다음과 같다.

```text
여러 데이터를 묶는다
↓
순서가 중요하면 리스트/튜플
↓
이름표(Key)로 찾고 싶으면 딕셔너리
↓
중복 없이 관리하고 싶으면 집합
↓
필요에 따라 자료구조를 서로 변환한다
```

---

# 2. 중요 개념 정리

| 개념 | 핵심 |
|---|---|
| 리스트 | 순서가 있고 수정 가능한 가변 자료구조 |
| 튜플 | 순서가 있고 수정 불가능한 불변 자료구조 |
| 인덱싱 | 위치 번호로 요소 하나를 꺼내는 것 |
| 슬라이싱 | `[시작:끝:증감폭]`으로 구간을 잘라내는 것 |
| `len()` | 요소 개수 확인 |
| `in`, `not in` | 요소 포함 여부 확인 |
| 패킹 | 여러 값을 하나로 묶는 것 |
| 언패킹 | 묶인 값을 여러 변수로 나누는 것 |
| 딕셔너리 | Key와 Value를 한 쌍으로 관리하는 매핑 자료구조 |
| `get()` | 존재하지 않는 키 조회 시 `KeyError`를 피하는 안전한 조회 방식 |
| 집합 | 중복을 허용하지 않고 순서가 없는 자료구조 |
| 집합 연산 | `&`, `|`, `-`로 교집합·합집합·차집합 계산 |
| 자료구조 변환 | `list()`, `tuple()`, `set()`으로 형태 변환 |

---

# 3. 1강 — 시퀀스 자료구조

## 3.1 리스트(List)

리스트는 여러 데이터를 **순서대로 저장**하며, 생성 후에도 내부 요소를 수정할 수 있는 **가변(Mutable) 자료형**이다.

```python
shopping_list = ["apple", "banana", "cherry"]
shopping_list[1] = "blueberry"

print(shopping_list)
```

결과:

```text
['apple', 'blueberry', 'cherry']
```

핵심:

```text
리스트
= 순서 있음
+ 수정 가능
```

---

## 3.2 튜플(Tuple)

튜플도 여러 데이터를 순서대로 저장하지만, 한 번 생성되면 내부 요소를 수정할 수 없는 **불변(Immutable) 자료형**이다.

```python
coordinate = (37.5665, 126.9780)
```

수정 시도:

```python
coordinate[0] = 38.0
```

결과:

```text
TypeError
```

핵심:

```text
튜플
= 순서 있음
+ 수정 불가
```

튜플은 소괄호를 생략해도 쉼표로 값이 나열되면 튜플로 인식될 수 있다.

```python
data = 1, 2, 3
```

---

## 3.3 리스트와 튜플 비교

| 구분 | 리스트 | 튜플 |
|---|---|---|
| 표기 | `[]` | `()` |
| 순서 | 있음 | 있음 |
| 인덱싱 | 가능 | 가능 |
| 슬라이싱 | 가능 | 가능 |
| 요소 수정 | 가능 | 불가능 |
| 성격 | Mutable | Immutable |
| 적합한 상황 | 데이터가 자주 바뀜 | 데이터가 고정되어야 함 |

---

# 4. 인덱싱(Indexing)

인덱싱은 시퀀스 자료구조에서 **위치 번호를 이용해 요소 하나를 꺼내는 것**이다.

```python
colors = ["red", "green", "blue"]
```

정방향:

```python
colors[0]
```

결과:

```text
red
```

파이썬 인덱스는 0부터 시작한다.

```text
index   0       1        2
value  red    green     blue
```

---

## 4.1 음수 인덱싱

뒤에서부터 접근할 수도 있다.

```python
colors[-1]
```

결과:

```text
blue
```

```text
index   -3      -2       -1
value   red    green     blue
```

핵심:

> 마지막 요소는 `-1`

---

# 5. 슬라이싱(Slicing)

슬라이싱은 시퀀스에서 특정 구간을 잘라내는 문법이다.

```python
[시작:끝:증감폭]
```

예:

```python
numbers = [0, 1, 2, 3, 4, 5]
print(numbers[1:4])
```

결과:

```text
[1, 2, 3]
```

핵심 규칙:

```text
시작 인덱스 → 포함
끝 인덱스 → 포함하지 않음
```

즉:

```python
numbers[1:4]
```

은:

```text
1 이상 4 미만
```

의 인덱스를 가져온다.

---

## 5.1 증감폭(Step)

```python
numbers[::2]
```

결과:

```text
[0, 2, 4]
```

2칸씩 이동한다.

역순:

```python
numbers[::-1]
```

결과:

```text
[5, 4, 3, 2, 1, 0]
```

---

# 6. 시퀀스 공통 연산

## 6.1 결합 `+`

```python
group1 = [1, 2]
group2 = [3, 4]

print(group1 + group2)
```

결과:

```text
[1, 2, 3, 4]
```

같은 종류의 시퀀스를 이어 붙인다.

---

## 6.2 반복 `*`

```python
group1 = [1, 2]
print(group1 * 3)
```

결과:

```text
[1, 2, 1, 2, 1, 2]
```

---

## 6.3 길이 `len()`

```python
user_roles = ["admin", "editor", "member"]
print(len(user_roles))
```

결과:

```text
3
```

즉 `len()`은 요소의 개수를 센다.

---

## 6.4 포함 여부 `in`, `not in`

```python
user_roles = ["admin", "editor", "member"]

print("admin" in user_roles)
print("guest" not in user_roles)
```

결과:

```text
True
True
```

이 연산은 조건문에서 자주 사용된다.

---

# 7. 패킹(Packing)과 언패킹(Unpacking)

## 7.1 패킹

여러 값을 하나의 변수에 묶는다.

```python
packed_data = 1, 2, 3
```

결과적으로 튜플 형태로 묶인다.

```text
(1, 2, 3)
```

---

## 7.2 언패킹

묶여 있는 값을 여러 변수로 나눈다.

```python
a, b, c = packed_data
```

결과:

```text
a = 1
b = 2
c = 3
```

기본 언패킹에서는 요소 개수와 변수 개수가 맞아야 한다.

---

## 7.3 `*`를 이용한 가변 언패킹

```python
first, *others = [10, 20, 30, 40]
```

결과:

```text
first = 10
others = [20, 30, 40]
```

핵심:

> `*변수명`은 남은 요소들을 리스트로 모은다.

---

# 8. 2강 — 매핑 자료구조: 딕셔너리

딕셔너리는 데이터를 순서 번호가 아니라 **Key와 Value의 연결 관계**로 관리한다.

```python
user_info = {
    "name": "Sparta",
    "age": 20
}
```

구조:

```text
"name" → "Sparta"
"age"  → 20
```

---

## 8.1 Key와 Value

- Key → 값을 찾기 위한 식별자
- Value → 실제 저장된 데이터

같은 Key를 다시 사용하면 기존 값이 새 값으로 바뀐다.

```python
user_info["age"] = 21
```

새로운 Key를 사용하면 항목이 추가된다.

```python
user_info["role"] = "admin"
```

딕셔너리는 **가변(Mutable)** 자료형이다.

---

# 9. 딕셔너리 주요 메서드

## 9.1 `keys()`

모든 Key 확인:

```python
menu = {"coffee": 4000, "tea": 4500}

print(menu.keys())
```

---

## 9.2 `values()`

모든 Value 확인:

```python
print(menu.values())
```

---

## 9.3 `items()`

Key와 Value를 함께 확인:

```python
print(menu.items())
```

개념적으로:

```text
("coffee", 4000)
("tea", 4500)
```

처럼 Key와 Value가 쌍으로 묶인다.

---

# 10. 안전한 조회 `get()`

대괄호 조회:

```python
menu["juice"]
```

`juice`라는 Key가 없다면:

```text
KeyError
```

가 발생한다.

`get()` 사용:

```python
price = menu.get("juice", 5000)
```

`juice`가 없다면 기본값 `5000`을 반환한다.

핵심 비교:

```text
dict[key]
→ Key가 없으면 KeyError

dict.get(key)
→ Key가 없으면 None

dict.get(key, 기본값)
→ Key가 없으면 기본값
```

---

# 11. 집합(Set)

집합은 **중복을 허용하지 않고 순서가 없는 자료구조**다.

```python
my_set = set([1, 2, 2, 3, 3, 3])

print(my_set)
```

결과:

```text
{1, 2, 3}
```

중복이 자동으로 제거된다.

---

## 11.1 집합의 특징

```text
중복 없음
순서 없음
인덱싱 불가
슬라이싱 불가
```

따라서:

```python
my_set[0]
```

같은 방식으로 요소를 꺼낼 수 없다.

---

# 12. 집합 연산

```python
set_a = {1, 2, 3}
set_b = {3, 4, 5}
```

## 교집합 `&`

```python
set_a & set_b
```

결과:

```text
{3}
```

## 합집합 `|`

```python
set_a | set_b
```

결과:

```text
{1, 2, 3, 4, 5}
```

## 차집합 `-`

```python
set_a - set_b
```

결과:

```text
{1, 2}
```

---

# 13. 자료구조 상호 변환

파이썬에서는 자료구조를 서로 변환할 수 있다.

```python
list()
tuple()
set()
```

예:

```python
raw_emails = [
    "a@sparta.com",
    "b@sparta.com",
    "a@sparta.com"
]
```

중복 제거:

```python
unique_set = set(raw_emails)
```

다시 리스트:

```python
refined_emails = list(unique_set)
```

흐름:

```text
리스트
↓ set()
집합
↓ 중복 제거
↓ list()
리스트
```

중요:

> `set()`으로 바꾸면 중복은 제거되지만 기존 순서는 보장되지 않는다.

---

# 14. 3장 전체 비교

| 자료구조 | 순서 | 중복 | 수정 | 접근 방식 |
|---|---|---|---|---|
| 리스트 | 있음 | 허용 | 가능 | 인덱스 |
| 튜플 | 있음 | 허용 | 불가 | 인덱스 |
| 딕셔너리 | Key-Value 구조 | Key 중복 불가 | 가능 | Key |
| 집합 | 없음 | 불가 | 가능 | 포함 여부 / 집합 연산 |

상황별 선택:

```text
순서 + 수정 필요
→ 리스트

순서 + 수정 금지
→ 튜플

이름표(Key)로 값 조회
→ 딕셔너리

중복 제거 / 집합 비교
→ 집합
```

---

# 15. 헷갈리기 쉬운 개념 리뷰

## 15.1 리스트와 튜플

둘 다 순서가 있다.

차이는:

```text
리스트 → 수정 가능
튜플 → 수정 불가
```

---

## 15.2 인덱싱과 슬라이싱

```python
data[1]
```

→ 값 하나

```python
data[1:4]
```

→ 구간

---

## 15.3 슬라이싱 끝 번호

```python
data[1:4]
```

에서 `4`번 인덱스는 포함되지 않는다.

```text
1, 2, 3
```

까지만 가져온다.

---

## 15.4 딕셔너리와 리스트의 접근 방식

리스트:

```python
data[0]
```

→ 위치로 접근

딕셔너리:

```python
data["name"]
```

→ Key로 접근

---

## 15.5 `get()`과 `[]`

```python
menu["juice"]
```

→ 없으면 `KeyError`

```python
menu.get("juice")
```

→ 없으면 `None`

---

## 15.6 집합은 인덱싱할 수 없다

집합은 순서가 없기 때문에:

```python
my_set[0]
```

같은 위치 기반 접근을 사용할 수 없다.

---

## 15.7 `set()`으로 중복 제거하면 순서가 사라질 수 있다

```python
list → set → list
```

은 중복 제거에는 유용하지만 기존 순서를 보존하는 용도로 사용하면 안 된다.

---

# 16. 지금 반드시 알아야 하는 내용

## 반드시 이해

- 리스트와 튜플의 차이
- Mutable / Immutable
- 인덱스는 0부터 시작
- `-1`은 마지막 요소
- 슬라이싱 `[시작:끝]`
- 끝 인덱스는 포함하지 않음
- `len()`
- `in`, `not in`
- 패킹 / 언패킹
- `*` 가변 언패킹
- 딕셔너리 Key / Value
- 딕셔너리 값 추가 / 수정
- `keys()`, `values()`, `items()`
- `get()`
- 집합의 중복 제거
- 집합은 순서가 없음
- `&`, `|`, `-`
- `list()`, `tuple()`, `set()` 변환

## 나중에 더 깊게 봐도 되는 내용

- 리스트 메모리 확장 내부 구조
- 튜플 메모리 최적화 세부 구현
- 해시 테이블 내부 구조
- 해시 함수 동작 원리
- 자료구조별 시간복잡도
- 다차원 리스트 심화

---

# 17. 3장 핵심 한 줄 요약

> **여러 데이터를 다룰 때는 순서와 수정 여부에 따라 리스트·튜플을, Key로 찾고 싶다면 딕셔너리를, 중복 제거와 집합 연산이 필요하면 집합을 선택한다.**

---

# 18. 수업 후 확인 문제

```python
data = [10, 20, 20, 30]
```

이 데이터에서 **중복을 제거한 뒤 다시 리스트 형태로 만들고 싶다면**, 어떤 자료구조를 중간에 거쳐야 하며 왜 그런가?
