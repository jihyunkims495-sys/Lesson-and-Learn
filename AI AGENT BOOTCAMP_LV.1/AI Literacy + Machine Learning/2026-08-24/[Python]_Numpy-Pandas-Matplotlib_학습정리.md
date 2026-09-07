# Python 특강 학습정리 — NumPy, Pandas, Matplotlib

## 1. 전체 구조

```text
원본 데이터
↓
NumPy
→ 숫자 배열과 수치 연산

Pandas
→ 표 형태 데이터 조회 / 전처리 / 집계

Matplotlib
→ 데이터 분포와 관계 시각화

↓
머신러닝
→ 정리된 데이터를 이용해 패턴 학습 / 예측
```

오늘 추가 보강수업에서는 Pandas 정밀조회, 결측치 처리, 그룹화 집계, NumPy 변환, Matplotlib 시각화까지 이어서 학습했다.

---

# 2. NumPy

## 2-1. NumPy란?

NumPy는 **숫자 데이터를 배열 형태로 저장하고 빠르게 계산하기 위한 라이브러리**다.

```python
import numpy as np
```

- `import` : 라이브러리를 현재 코드에서 사용할 수 있게 가져오는 것
- `as np` : `numpy`를 `np`라는 별명으로 사용

```python
nums = np.array([10, 20, 30], dtype=np.float64)
```

- `np.array()` : NumPy 배열 생성
- `dtype` : 배열 원소의 자료형
- `float64` : 실수를 64bit 크기로 저장

### bit / byte

```text
1 bit = 0 또는 1 하나
8 bit = 1 byte
64 bit = 8 byte
```

따라서 `int64`, `float64`의 `64`는 데이터 값이 아니라 **원소 하나를 저장하는 자료형의 비트 크기**다.

---

## 2-2. reshape / flatten

### reshape()

값과 원소 개수는 유지하고 배열의 모양만 바꾼다.

```python
arr = np.array([1, 2, 3, 4, 5, 6])
arr.reshape(2, 3)
```

```text
[1, 2, 3, 4, 5, 6]
↓
[[1, 2, 3],
 [4, 5, 6]]
```

```python
arr.reshape(3, -1)
```

`-1`은 NumPy가 나머지 차원의 크기를 자동 계산하라는 뜻이다.

### flatten()

```python
matrix.flatten()
```

다차원 배열을 1차원으로 펼친다.

---

## 2-3. axis

```python
matrix = np.array([
    [1, 2, 3],
    [4, 5, 6]
])
```

```python
matrix.sum(axis=0)
```

```text
1 + 4 = 5
2 + 5 = 7
3 + 6 = 9
→ [5, 7, 9]
```

`axis=0`은 첫 번째 차원을 줄여 계산하므로 **컬럼별 결과**가 나온다.

```python
matrix.sum(axis=1)
```

```text
1 + 2 + 3 = 6
4 + 5 + 6 = 15
→ [6, 15]
```

`axis=1`은 두 번째 차원을 줄여 계산하므로 **행별 결과**가 나온다.

```text
shape = (2, 3)
         ↑  ↑
      axis0 axis1
```

---

## 2-4. Broadcasting

크기가 다른 배열을 연산 가능한 형태로 자동 확장해서 계산한다.

```python
matrix = np.array([
    [1, 2, 3],
    [4, 5, 6]
])
row = np.array([10, 20, 30])

matrix + row
```

결과:

```text
[[11, 22, 33],
 [14, 25, 36]]
```

작은 배열이 실제로 복제되는 것이 아니라, 확장된 것처럼 계산된다.

---

## 2-5. 행렬곱

```python
A @ B
```

- `*` : 같은 위치의 원소끼리 곱함
- `@` : 앞 행렬의 행과 뒤 행렬의 열을 이용한 행렬곱

---

# 3. Pandas

## 3-1. Pandas란?

Pandas는 **행과 열이 있는 표 형태 데이터를 다루기 위한 라이브러리**다.

```python
import pandas as pd
```

```python
df = pd.DataFrame({
    '중간고사': [80, 95, 70],
    '기말고사': [85, 90, 75]
}, index=['김철수', '이영희', '박민수'])
```

```text
        중간고사  기말고사
김철수      80      85
이영희      95      90
박민수      70      75
```

- DataFrame : 2차원 표
- Series : 1차원 데이터
- column : 열 이름
- index : 행에 붙은 이름표

```python
df['기말고사']
```

→ Series

```python
df[['기말고사']]
```

→ 1개 컬럼을 가진 DataFrame

---

## 3-2. DataFrame 상태 확인

### shape

```python
df.shape
```

```text
(행 개수, 열 개수)
```

예:

```text
(3, 2)
→ 3행 2열
```

Series는 `shape = (3,)`처럼 1차원으로 표시된다.

### dtypes

```python
df.dtypes
```

각 컬럼의 자료형을 확인한다.

### info()

```python
df.info()
```

DataFrame의 전체 구조를 확인한다.

대표적으로:

- 행 개수
- 컬럼 개수
- 컬럼 이름
- 각 컬럼의 dtype
- Non-Null Count
- 메모리 사용량

`Non-Null Count`는 **결측치 개수가 아니라 값이 정상적으로 들어 있는 개수**다.

### describe()

```python
df.describe()
```

숫자 컬럼의 통계 요약을 보여준다.

- count
- mean
- std
- min
- 25%
- 50% (중앙값)
- 75%
- max

---

# 4. Pandas 정밀조회

## 4-1. loc / iloc

둘 다 원하는 행/열을 조회한다.

```text
loc  → label(이름) 기준
iloc → integer position(위치 번호) 기준
```

예:

```python
df = pd.DataFrame({
    '나이': [25, 30, 35, 40],
    '점수': [80, 95, 70, 85],
    '등급': ['B', 'A', 'C', 'B']
}, index=['user1', 'user2', 'user3', 'user4'])
```

```python
df.loc['user1']
```

→ `user1`이라는 index 이름의 행 조회

```python
df.iloc[0]
```

→ 0번째 위치의 행 조회

둘 다 같은 첫 번째 행을 가리키지만 **조회 기준이 다르다.**

행과 열을 함께 지정할 수도 있다.

```python
df.loc['user1', '점수']
df.iloc[0, 1]
```

둘 다 `80`을 조회한다.

---

## 4-2. 불리언 인덱싱

조건식의 결과가 `True`인 행만 가져오는 방식이다.

```python
df['점수'] >= 80
```

```text
user1     True
user2     True
user3    False
user4     True
```

이 조건을 DataFrame에 넣으면:

```python
df[df['점수'] >= 80]
```

`True`인 행만 필터링된다.

핵심 흐름:

```text
컬럼 선택
↓
조건식 작성
↓
True / False 판별
↓
True 행만 조회
```

---

## 4-3. query()

`query()`는 조건식을 문자열로 작성해서 행을 필터링하는 메서드다.

```python
df.query('점수 >= 80')
```

불리언 인덱싱과 같은 목적이지만 표현 방식이 다르다.

```text
df[df['점수'] >= 80]
→ 불리언 인덱싱

df.query('점수 >= 80')
→ query()
```

문자열 비교:

```python
df.query("등급 == 'B'")
```

`query()`는 조건식을 문자열로 받기 때문에 바깥쪽 따옴표가 필요하다.

---

# 5. Pandas 데이터 전처리 전체 흐름

오늘 배운 여러 메서드를 따로 외우기보다 **Pandas 전처리 파이프라인**으로 묶어서 이해하면 훨씬 쉽다.

```text
원본 데이터
↓
조회
loc / iloc / 불리언 인덱싱 / query()

↓
상태 확인
info() / isna() / isnull()

↓
결측치 처리
dropna() / fillna() / ffill() / bfill() / interpolate()

↓
이상값 정리
replace()

↓
자료형 변환
pd.to_numeric() / astype()

↓
결측 여부 정보 보존
Missing Indicator
```

즉 지금 배우는 것은 단순한 메서드 모음이 아니라:

> **원본 데이터를 확인하고 → 필요한 값을 조회하고 → 결측치와 이상값을 정리하고 → 분석 가능한 형태로 만드는 데이터 전처리 과정**이다.

---

# 6. 결측치

## 6-1. 결측치란?

값이 비어 있거나 누락된 데이터다.

대표적인 표현:

```text
np.nan → NumPy의 결측값
pd.NA  → Pandas의 결측값
None   → Python의 값 없음
```

Pandas에서는 셋 모두 결측치로 탐지할 수 있다.

```python
raw_df = pd.DataFrame({
    'A': [1, np.nan, 3],
    'B': [pd.NA, 5, 6],
    'C': [7, 8, 9]
})
```

결측치는 A 1개, B 1개, 총 2개다.

---

## 6-2. isna() / isnull()

둘 다 결측치인지 확인한다.

```python
df.isna()
df.isnull()
```

```text
결측치다     → True
결측치 아니다 → False
```

Python/Pandas에서 계산할 때:

```text
True  = 1
False = 0
```

따라서:

```python
df.isna().sum()
```

은 컬럼별 결측치 개수를 계산하는 효과가 있다.

전체 결측치 수:

```python
df.isna().sum().sum()
```

---

## 6-3. 결측치 삭제 — dropna()

```python
raw_df.dropna()
```

기본은 결측치가 포함된 **행 삭제**다.

```python
raw_df.dropna(axis=1)
```

결측치가 포함된 **열 삭제**다.

```text
axis=0 → 행 기준
axis=1 → 열 기준
```

---

## 6-4. 통계적 대푯값 대치 — Imputation

결측치를 삭제하지 않고 평균, 중앙값, 최빈값 같은 대표값으로 채우는 방법이다.

```python
df['점수'] = df['점수'].fillna(df['점수'].mean())
```

중앙값 대치:

```python
df['나이'] = df['나이'].fillna(df['나이'].median())
```

예:

```python
df_age = pd.DataFrame({'나이': [20, 25, None, 30, 95]})
```

결측치를 제외한 값은:

```text
20, 25, 30, 95
```

짝수 개이므로 가운데 두 값의 평균:

```text
(25 + 30) / 2 = 27.5
```

따라서 중앙값은 `27.5`다.

---

## 6-5. Forward / Backward Fill

### ffill()

결측치를 **바로 앞의 값**으로 채운다.

```text
20, NaN, 24
↓
20, 20, 24
```

### bfill()

결측치를 **바로 뒤의 값**으로 채운다.

```text
20, NaN, 24
↓
20, 24, 24
```

시간 순서가 중요한 시계열 데이터에서 자주 쓴다.

---

## 6-6. 선형 보간법 — interpolate()

앞뒤 실제 값을 이용해 사이 값을 직선적으로 추정해서 결측치를 채운다.

```text
20, NaN, 24
↓
20, 22, 24
```

```python
speed_df['속도'] = speed_df['속도'].interpolate(method='linear')
```

- `interpolate()` : 보간 메서드
- `method='linear'` : 선형 보간 방식 지정

`linear`는 기본값이므로 생략해도 같은 결과가 나올 수 있지만, 코드에서 보간 방식을 명확히 보여주기 위해 적기도 한다.

---

# 7. Replace & Type Casting

원본 데이터에 이상 기호나 문자열 숫자가 섞여 있으면 바로 계산하기 어렵다.

예:

```python
speed_df = pd.DataFrame({
    '속도': ['60', '70', '-', '90']
})
```

## 7-1. replace()

이상 기호를 결측값 등으로 바꾼다.

```python
speed_df['속도'] = speed_df['속도'].replace('-', pd.NA)
```

```text
'60', '70', '-', '90'
↓
'60', '70', <NA>, '90'
```

## 7-2. pd.to_numeric()

문자열 숫자를 실제 숫자형으로 바꾼다.

```python
speed_df['속도'] = pd.to_numeric(
    speed_df['속도'],
    errors='coerce'
)
```

`errors='coerce'`는 숫자로 변환할 수 없는 값을 에러 대신 `NaN`으로 바꾸라는 뜻이다.

```text
replace()
→ 이상 기호 정리

pd.to_numeric()
→ 숫자형 변환

errors='coerce'
→ 변환 실패값은 NaN 처리
```

---

# 8. Missing Indicator

결측치를 채우기 전에 **원래 결측치였는지 여부를 별도 컬럼으로 남기는 방법**이다.

```python
df['점수_결측'] = df['점수'].isna()
```

```text
점수   점수_결측
80     False
NaN    True
70     False
```

0/1로 만들고 싶다면:

```python
df['점수_결측'] = df['점수'].isna().astype(int)
```

```text
False → 0
True  → 1
```

Missing Indicator 자체가 메서드 이름은 아니고, `isna()`와 필요하면 `astype(int)`를 조합해 만든다.

---

# 9. groupby()와 .to_numpy()

## 9-1. groupby()

같은 기준끼리 데이터를 묶어서 평균, 합계, 개수 등의 집계를 수행한다.

```python
df = pd.DataFrame({
    '등급': ['A', 'B', 'A', 'B'],
    '점수': [90, 80, 95, 85]
})

df.groupby('등급')['점수'].mean()
```

결과:

```text
A    92.5
B    82.5
```

```python
group_df = sales_df.groupby('지점').mean(numeric_only=True)
```

`numeric_only=True`는 숫자형 컬럼만 평균 계산에 포함하라는 옵션이다.

반드시 항상 써야 하는 것은 아니지만 문자열 컬럼이 섞여 있을 때 계산 대상을 명확하게 제한할 수 있다.

## 9-2. .to_numpy()

Pandas Series / DataFrame을 NumPy 배열로 변환한다.

```python
df['점수'].to_numpy()
```

```text
Pandas Series
↓
.to_numpy()
↓
NumPy ndarray
```

즉 Pandas로 데이터를 구조화하고 정리한 뒤, 필요하면 NumPy 배열로 넘겨 수치 계산에 활용할 수 있다.

---

# 10. Matplotlib

## 10-1. Matplotlib이란?

Matplotlib은 **데이터를 그래프로 시각화하는 Python 라이브러리**다.

```python
import matplotlib.pyplot as plt
```

```text
NumPy
→ 숫자 계산

Pandas
→ 데이터 조회 / 전처리 / 집계

Matplotlib
→ 정리된 데이터를 그래프로 시각화
```

---

## 10-2. Figure와 Axes

```python
fig, ax = plt.subplots()
```

- `fig` : 전체 그림판(Figure)
- `ax` : 실제 그래프가 그려지는 영역(Axes)

```python
fig, (ax1, ax2) = plt.subplots(1, 2)
```

```text
Figure 전체 캔버스
┌────────────┬────────────┐
│    ax1     │    ax2     │
└────────────┴────────────┘
```

`ax1`, `ax2`는 특별한 키워드가 아니라 여러 Axes에 붙인 변수 이름이다.

```python
ax1.bar(...)
ax2.plot(...)
```

- `ax.bar()` : 막대그래프
- `ax.plot()` : 선 그래프
- `ax.scatter()` : 산점도
- `ax.hist()` : 히스토그램
- `ax.boxplot()` : 박스플롯

---

## 10-3. 캔버스 생성과 figsize

```python
plt.figure(figsize=(8, 5))
```

`figsize=(가로, 세로)`는 전체 캔버스 크기를 인치 단위로 지정한다.

```text
figsize=(8, 5)
→ 가로 8인치 × 세로 5인치
```

여러 그래프:

```python
fig, axes = plt.subplots(2, 2, figsize=(10, 8))
```

```text
2행 × 2열 그래프 영역
전체 Figure 크기 10 × 8 inch
```

---

## 10-4. tight_layout()

```python
plt.tight_layout()
```

그래프 제목, 축 라벨, 여러 subplot이 겹치지 않도록 간격을 자동 조정한다.

그래프 내용 자체를 바꾸는 것이 아니라 **배치만 정리**한다.

---

# 11. 히스토그램

```python
ax.hist(scores, bins=4)
```

`bins`는 데이터를 몇 개 구간으로 나눌지 정하는 값이다.

예:

```text
60~67
68~75
76~83
84~90
```

```text
bins 작음
→ 구간이 넓어짐
→ 전체 패턴을 단순하게 봄

bins 큼
→ 구간이 잘게 나뉨
→ 더 세밀한 분포 확인
```

`bins`는 박스플롯이 아니라 주로 히스토그램에서 사용하는 옵션이다.

---

# 12. 박스플롯

박스플롯(Box Plot)은 **데이터의 중심, 퍼짐, 비대칭, 이상치를 한 번에 보는 그래프**다.

핵심 구성:

```text
Q1 = 25% 지점
Q2 = 50% 지점 = 중앙값
Q3 = 75% 지점
IQR = Q3 - Q1
```

상자 안에는 데이터의 가운데 50%가 들어 있다.

### 수염(Whisker)

일반적으로:

```text
아래 경계 = Q1 - 1.5 × IQR
위 경계   = Q3 + 1.5 × IQR
```

이 범위를 벗어난 값은 이상치 점으로 표시될 수 있다.

박스플롯에서 보는 것:

```text
1. 중앙값
→ 데이터 중심

2. IQR
→ 데이터 퍼짐

3. 수염 길이와 비대칭
→ 어느 방향으로 더 퍼지는지

4. 점
→ 이상치 여부
```

---

# 13. 유저 분석 관점에서 시각화 읽기

오늘 시각화 파트는 단순히 그래프 메서드를 외우는 것보다 **유저 분석에서 어떤 질문에 답하는지**로 이해하는 것이 중요하다.

```text
유저 데이터
↓
Pandas로 전처리
↓
Matplotlib으로 시각화
↓
그래프별로 다른 질문에 답함
```

예시로 사용할 수 있는 유저 지표:

```text
구매금액
구매횟수
방문횟수
평균 주문금액
재구매 주기
체류시간
클릭 수
장바구니 상품 수
```

## 13-1. 히스토그램

질문:

> 유저들이 어느 구간에 많이 몰려 있는가?

예를 들어 구매금액 히스토그램을 보면:

- 대부분의 유저가 어느 금액 구간에 있는지
- 분포가 한쪽으로 치우쳐 있는지
- 특정 구간에 유저가 몰려 있는지

를 확인할 수 있다.

## 13-2. 박스플롯

질문:

> 대부분의 유저는 어느 범위에 있고, 유독 튀는 유저가 있는가?

유저별 구매금액을 박스플롯으로 보면:

- 중앙값
- 유저 간 편차
- 일반적인 구매금액 범위
- 이상치처럼 튀는 고액 구매 유저

를 빠르게 확인할 수 있다.

중요한 점:

> 박스플롯에서 이상치로 잡혔다고 해서 바로 잘못된 데이터라고 판단하면 안 된다.

예:

```text
구매금액 이상치
→ 입력 오류일 수도 있음
→ VIP / 고액 구매 고객일 수도 있음

방문횟수 이상치
→ 봇일 수도 있음
→ 충성 고객일 수도 있음
```

즉 이상치는 **삭제 대상이 아니라 추가 분석이 필요한 신호**다.

## 13-3. 산점도

산점도는 **두 숫자 변수의 관계**를 보는 그래프다.

예:

```text
x축 = 방문횟수
y축 = 누적구매금액
점 하나 = 유저 한 명
```

산점도를 통해:

- 방문이 많을수록 구매금액도 커지는 경향이 있는지
- 두 변수의 관계가 약한지 강한지
- 다른 유저와 많이 떨어진 특이 유저가 있는지

를 탐색할 수 있다.

---

# 14. 박스플롯 / 산점도 / 유사도 차이

```text
박스플롯
→ 한 지표의 전체 분포를 본다
→ "우리 유저의 구매금액은 대체로 어떤 모습인가?"

산점도
→ 두 숫자 지표의 관계를 본다
→ "방문횟수와 구매금액은 관계가 있나?"

유사도
→ 두 대상의 행동 패턴이 얼마나 닮았는지 본다
→ "A 유저와 B 유저는 얼마나 비슷한가?"
```

즉:

```text
분포
→ 집단 전체의 모양

관계
→ 두 변수 사이 패턴

유사도
→ 개별 대상끼리 닮은 정도
```

---

# 15. LTV 분석 전 EDA 연결

박스플롯이나 산점도는 LTV 자체를 예측하는 도구가 아니라, **LTV 분석이나 머신러닝 전에 유저 데이터 상태를 이해하는 EDA(탐색적 데이터 분석) 단계**에서 사용할 수 있다.

예를 들어 LTV와 관련 있을 수 있는 유저 지표:

```text
누적 구매금액
구매 횟수
평균 주문금액
재구매 간격
방문 빈도
가입 후 활동 기간
```

전체 흐름:

```text
원본 유저 데이터
↓
Pandas로 전처리
↓
Matplotlib으로 유저 분포 확인
↓
이상치 / 왜도 / 고가치 유저 확인
↓
산점도로 변수 간 관계 확인
↓
feature 설계
↓
LTV 계산 또는 예측 모델링
```

즉 박스플롯은:

> **LTV를 보기 전에 우리 유저들이 애초에 어떤 분포를 가지고 있는지 확인하는 도구**

로 이해할 수 있다.

---

# 16. 오늘 배운 핵심 흐름

```text
NumPy
→ 숫자 배열을 계산하기 좋은 형태로 다룸

Pandas
→ 데이터를 표 형태로 구조화
→ loc / iloc / 조건 검색으로 필요한 데이터 조회
→ 결측치 / 이상값 / 자료형을 정리해 전처리
→ groupby로 그룹별 집계
→ 필요하면 .to_numpy()로 NumPy 배열 변환

Matplotlib
→ 정리된 데이터를 시각화
→ 히스토그램으로 분포 확인
→ 박스플롯으로 중심 / 퍼짐 / 이상치 확인
→ 산점도로 두 변수의 관계 확인

Machine Learning 전
→ EDA를 통해 데이터 구조와 패턴을 이해
→ feature 설계와 모델링으로 연결
```

## 한 줄 정리

> **NumPy로 숫자를 계산하고, Pandas로 데이터를 전처리하고, Matplotlib으로 그 데이터의 분포와 관계를 눈으로 확인한 뒤 머신러닝으로 넘어간다.**
