# TIL | 2026-08-28 | Machine Learning 로지스틱 회귀·교차검증·PyTorch·DNN 기초

> **기존에 애매하게 알고있던 머신러닝은 '가짜'였다.!**

> 머신러닝은 단순히 데이터를 넣으면 알아서 결과가 나오는 것이 아니라, `입력 → 모델 계산 → 확률/예측 → Loss → 파라미터 학습 → 검증`이라는 여러 단계가 연결되어 돌아가는 구조라는 것을 처음으로 구체적으로 보기 시작했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

오늘은 기존에 배운 선형회귀와 규제에서 이어서 **분류 모델인 로지스틱 회귀**, **이진/다중분류**, **활성화 함수**, **손실함수**, **교차검증**을 학습했고, 이후 **PyTorch와 인공신경망의 기본 구조**까지 들어갔다.

전체 흐름은 다음과 같다.

```text
지도학습
│
├─ 회귀
│   └─ 연속적인 숫자 예측
│
└─ 분류
    ├─ 이진분류
    │   └─ Sigmoid
    │
    └─ 다중분류
        └─ Softmax

          ↓

분류 결과와 실제 정답 비교
          ↓
      Loss 계산
          ↓
      모델 학습
```

그리고 신경망으로 넘어가면서:

```text
입력층
↓
은닉층
↓
활성화 함수
↓
출력층
↓
Loss
↓
파라미터 학습
```

이라는 구조가 추가되었다.

### 1-1. 로지스틱 회귀는 이름은 회귀지만 분류 모델

처음에는 `Logistic Regression`이라는 이름 때문에 선형회귀와 같은 회귀 모델이라고 생각하기 쉽다.

하지만 실제 목적은 **분류(Classification)**다.

선형 계산:

```text
z = wX + b
```

을 먼저 수행하고, 이 값으로 바로 클래스를 결정하는 것이 아니라 활성화 함수를 이용한다.

```text
입력 X
↓
wX + b
↓
Logit
↓
활성화 함수
↓
분류에 사용할 값
↓
클래스 결정
```

여기서 `wX+b`로 계산된 활성화 함수 적용 전의 원시 점수를 **Logit**이라고 이해했다.

#### 선형회귀와 로지스틱 회귀

```text
선형회귀
X
↓
wX + b
↓
연속적인 숫자 예측
예: 집값 5억 3천만 원
```

```text
로지스틱 회귀
X
↓
wX + b
↓
Logit
↓
활성화 함수
↓
분류
```

### 1-2. Activation Function — 활성화 함수

오늘 계속 등장해서 가장 헷갈렸던 개념 중 하나였다.

활성화 함수는 모델의 계산 결과를 **다음 단계에서 사용할 수 있도록 변환하는 함수**다.

다만 위치에 따라 역할이 달라진다는 것이 중요했다.

```text
출력층 활성화 함수
→ 최종 결과를 분류 목적에 맞게 변환

은닉층 활성화 함수
→ 비선형성을 추가하여 복잡한 패턴을 학습
```

즉 활성화 함수라는 하나의 종류 안에서도 역할이 다르다.

### 1-3. 이진분류와 Sigmoid

**Binary Classification = 클래스가 두 개인 분류**

예:

```text
정상 / 스팸
0 / 1
음성 / 양성
Versicolor / Virginica
```

이진분류에서는 대표적으로 **Sigmoid** 활성화 함수를 사용한다.

```text
Logit
↓
Sigmoid
↓
0 ~ 1 사이 값
```

Sigmoid는 범위 제한이 없는 Logit을 `0~1` 사이로 압축한다.

보통:

```text
0.5 미만 → 0
0.5 이상 → 1
```

로 분류하지만, `0.5`가 절대적인 기준은 아니고 문제에 따라 Threshold는 변경될 수 있다.

#### Positive / Negative

여기에서 양성/음성은 좋은 것/나쁜 것이라는 뜻이 아니다.

```text
0 → Negative Class
1 → Positive Class
```

라는 분류상의 약속에 가깝다.

### 1-4. 다중분류와 Softmax

**Multiclass Classification = 클래스가 3개 이상인 분류**

Iris 데이터라면:

```text
Iris-setosa
Iris-versicolor
Iris-virginica
```

세 개의 클래스가 있으므로 다중분류 문제다.

다중분류에서는 대표적으로 **Softmax**를 사용한다.

예:

```text
모델의 Logit

Setosa       = 2.1
Versicolor   = 0.8
Virginica    = -1.2

       ↓ Softmax

Setosa       = 0.72
Versicolor   = 0.24
Virginica    = 0.04

총합 = 1
```

가장 높은 확률을 가진 클래스를 최종 예측값으로 선택할 수 있다.

#### Sigmoid vs Softmax

```text
Sigmoid
→ 이진분류
→ 하나의 값을 0~1 사이로 변환

Softmax
→ 다중분류
→ 여러 클래스의 값을 확률 분포로 변환
→ 전체 확률 총합 = 1
```

### 1-5. One-Hot Encoding

범주형 데이터를:

```text
1, 2, 3
```

처럼 단순 정수로 바꾸면 숫자 사이에 존재하지 않는 크기 관계를 모델이 학습할 가능성이 있다.

그래서 각 범주에 독립된 자리를 만들어 표현하는 방식이 **One-Hot Encoding**이다.

```text
김민수 → [1, 0, 0]
김영희 → [0, 1, 0]
김철수 → [0, 0, 1]
```

중요한 점:

> One-Hot Encoding은 **활성화 함수가 아니라 전처리 방식**이다.

#### One-Hot Encoding의 한계

범주가 수만 개로 많아지면:

```text
[0, 0, 0, 0, 0, ... 1 ... 0]
```

처럼 대부분이 `0`인 매우 긴 벡터가 생긴다.

따라서:

```text
범주 수 증가
↓
차원 증가
↓
메모리 증가
↓
연산량 증가
```

문제가 생길 수 있다.

### 1-6. CCE와 SCCE

오늘 특히 헷갈렸던 부분:

> **SCCE는 활성화 함수가 아니다.**

SCCE는 **손실함수**다.

#### CCE — Categorical Cross Entropy

다중분류에서 정답이 원핫 형태일 때 사용한다.

```text
정답 클래스 = Versicolor

y = [0, 1, 0]
```

#### SCCE — Sparse Categorical Cross Entropy

원핫 벡터 대신 정수형 레이블을 사용할 수 있다.

```text
Setosa     → 0
Versicolor → 1
Virginica  → 2
```

정답:

```text
y = 1
```

처럼 저장한다.

SCCE는 내부적으로 해당 정답 인덱스에 해당하는 예측 확률을 이용해 Loss를 계산한다.

#### 정리

```text
CCE
→ 다중분류 손실함수
→ One-Hot 정답 사용

SCCE
→ 다중분류 손실함수
→ 정수형 정답 사용
```

### 1-7. Embedding Layer

범주의 개수가 매우 많을 때 One-Hot Encoding 대신 사용할 수 있는 방법이다.

거대한 희소 벡터:

```text
[0, 0, 0, 0, 1, 0, 0, ...]
```

대신 작은 실수형 벡터:

```text
[0.21, -0.38, 0.75, 0.13, ...]
```

로 표현한다.

즉:

> 고차원의 희소한 표현을 더 작은 **Dense Vector** 형태로 표현하는 방법이다.

현재 단계에서는 “범주가 너무 많아 One-Hot이 비효율적일 때 딥러닝에서는 Embedding을 사용할 수 있다” 정도로 이해한다.

### 1-8. Loss Function

Loss Function은 모델이:

> **현재 얼마나 틀렸는가?**

를 숫자로 계산하는 기준이다.

모델의 Weight와 Bias를 수정하려면 현재 예측이 얼마나 나쁜지를 먼저 알아야 한다.

```text
예측
↓
정답과 비교
↓
Loss
↓
학습을 위한 기준 생성
```

### 1-9. MSE와 Cross Entropy

이 부분은 복습 문제에서도 아직 제대로 설명하지 못했다.

#### MSE — Mean Squared Error

대표적인 **회귀용 손실함수**다.

```text
실제값과 예측값 차이
↓
제곱
↓
평균
↓
MSE
```

예측값과 실제값이 많이 다르면 더 큰 벌점을 준다.

#### Cross Entropy

대표적인 **분류용 손실함수**다.

특징은:

> **틀린 답을 강하게 확신할수록 큰 Loss를 준다.**

예:

```text
실제 정답 = 클래스 A

모델:
A = 0.95
→ 잘 맞춤
→ Loss 작음
```

반면:

```text
실제 정답 = 클래스 A

모델:
A = 0.01
B = 0.99
→ 틀린 B를 매우 강하게 확신
→ Loss 매우 큼
```

Cross Entropy에서 정답 클래스의 예측 확률이 0에 가까워질수록 Loss는 매우 크게 증가한다.

### 1-10. BCE / CCE / SCCE

```text
Cross Entropy
│
├─ BCE
│   └─ Binary Cross Entropy
│      → 이진분류
│
├─ CCE
│   └─ Categorical Cross Entropy
│      → 다중분류
│      → One-Hot 정답
│
└─ SCCE
    └─ Sparse Categorical Cross Entropy
       → 다중분류
       → 정수형 정답
```

### 1-11. 손실함수와 규제는 다른 개념

복습 문제에서 다시 혼동했다.

```text
손실함수
├─ MSE
└─ Cross Entropy

규제
├─ Ridge
└─ Lasso
```

#### Ridge

L2 규제.

가중치가 지나치게 커지지 않도록 **가중치 제곱에 벌점**을 준다.

```text
큰 Weight
↓
큰 벌점
↓
Weight 전체적으로 감소
```

#### Lasso

L1 규제.

가중치 절댓값에 벌점을 주며 일부 Weight가 정확히 `0`이 될 수 있다.

```text
불필요한 Feature
↓
Weight = 0
```

따라서 Lasso도 벌점을 주는 규제이고, **그 결과 일부 Weight가 0이 될 수 있다.**

### 1-12. K-Fold Cross Validation

한 번의 Train/Test 분할만으로 성능을 평가하면 우연히 쉬운 Test 데이터가 선택될 수도 있다.

그래서 Train 데이터를 여러 조각으로 나눠 반복해서 검증한다.

5-Fold 예:

```text
전체 Train 데이터

[1][2][3][4][5]

1회차 → 1번 검증 / 2~5 학습
2회차 → 2번 검증 / 나머지 학습
3회차 → 3번 검증 / 나머지 학습
4회차 → 4번 검증 / 나머지 학습
5회차 → 5번 검증 / 나머지 학습

↓
5번 성능 평균
```

핵심:

> 한 번의 시험 점수만 믿지 않고 여러 번 시험해서 모델 성능을 확인한다.

### 1-13. Train / Validation / Test

```text
Train
→ 모델이 Weight/Bias를 직접 학습

Validation
→ 학습 중 성능 점검
→ 하이퍼파라미터 결정에 활용

Test
→ 모든 학습이 끝난 뒤 최종 평가
```

Test 데이터는 마지막 실전 시험이므로 학습 과정에 사용하지 않는 것이 중요하다.

### 1-14. random_state=42

`42`라는 숫자 자체에 특별한 머신러닝 성능 효과가 있는 것은 아니다.

```python
random_state=42
```

의 핵심은:

> **Reproducibility — 재현성**

이다.

같은 데이터를 같은 방식으로 나누기 위해 랜덤 결과를 고정한다.

수업에서는 모든 수강생이 동일한 결과 화면을 보면서 실습할 수 있다는 목적도 있었다.

### 1-15. stratify

```python
stratify=y
```

는 Train/Test로 데이터를 분리할 때 원래 클래스 비율이 최대한 유지되도록 한다.

예:

```text
전체
0 = 50%
1 = 50%

↓ stratify=y

Train
0 ≈ 50%
1 ≈ 50%

Test
0 ≈ 50%
1 ≈ 50%
```

### 핵심 코드

```python
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

df = pd.read_csv("Iris.csv")

df_binary = df[
    df["Species"].isin([
        "Iris-versicolor",
        "Iris-virginica"
    ])
].copy()

X_binary = df_binary[
    ["SepalLengthCm", "SepalWidthCm"]
]

y_binary = df_binary["Species"].map({
    "Iris-versicolor": 0,
    "Iris-virginica": 1
})

X_train, X_test, y_train, y_test = train_test_split(
    X_binary,
    y_binary,
    test_size=0.2,
    random_state=42,
    stratify=y_binary
)

model = LogisticRegression()
model.fit(X_train, y_train)

preds = model.predict(X_test)

accuracy = accuracy_score(y_test, preds)

print(f"이진 분류 최종 테스트 정확도: {accuracy:.4f}")
```

### 1-16. `fit()` / `transform()` / `fit_transform()`

복습 문제에서 아직 설명하지 못한 내용이다.

#### fit()

> 기준을 학습한다.

StandardScaler라면 Train 데이터의:

```text
평균
표준편차
```

를 계산하여 기억한다.

```python
scaler.fit(X_train)
```

#### transform()

> fit에서 배운 기준을 데이터에 적용한다.

```python
scaler.transform(X_test)
```

#### fit_transform()

```text
fit + transform
```

을 한 번에 수행한다.

```python
X_train_scaled = scaler.fit_transform(X_train)
```

그래서 일반적으로:

```text
Train
→ fit_transform()

Test
→ transform()
```

을 사용한다.

Test 데이터로 다시 `fit()`하면 시험 데이터를 미리 참고하는 **Data Leakage**가 생길 수 있기 때문이다.

### 1-17. PyTorch란?

PyTorch는 **머신러닝·딥러닝 모델을 만들고 학습하기 위한 프레임워크**다.

기존 Scikit-learn에서는:

```python
model.fit(X_train, y_train)
```

한 줄 안에 많은 학습 과정이 숨겨져 있었다.

PyTorch에서는 신경망을 구성하고 학습 과정을 더 직접 다룬다.

```text
모델 구조 정의
↓
Forward
↓
Loss
↓
Backward
↓
Gradient
↓
Optimizer
↓
Weight 업데이트
```

#### torch

PyTorch의 핵심 라이브러리.

- Tensor 연산
- GPU 가속
- 신경망 구축
- 자동 미분 Autograd

등을 제공한다.

#### torchvision

이미지 처리와 관련된 PyTorch 보조 라이브러리다.

대표적으로:

```text
MNIST
Fashion MNIST
CIFAR
```

등 이미지 데이터셋과 이미지 전처리 기능을 제공한다.

### 1-18. 단층 모델에서 다층 모델로

기존 선형 모델은 기본적으로 직선 형태의 관계를 표현한다.

```text
입력
↓
wX + b
↓
출력
```

복잡한 현실 데이터를 표현하기에는 한계가 있다.

그래서 입력층과 출력층 사이에 **Hidden Layer — 은닉층**을 추가한다.

#### 단층

```text
입력층
↓
출력층
```

#### 다층

```text
입력층
↓
은닉층
↓
출력층
```

또는:

```text
입력층
↓
은닉층
↓
은닉층
↓
출력층
```

### 1-19. 은닉층이란?

처음에는 “왜 굳이 입력층과 출력층 사이에 뭔가를 넣는지” 이해하기 어려웠다.

은닉층은:

> 입력 데이터를 여러 방식으로 조합하여 **중간 특징을 만들어내는 계산 공간**

이라고 이해했다.

이미지라면 개념적으로:

```text
픽셀
↓
단순 특징
↓
특징 조합
↓
더 복잡한 형태
↓
최종 클래스
```

처럼 정보를 계속 변환한다.

### 1-20. 뉴런이란?

은닉층 내부의 개별 계산 단위다.

예:

```python
nn.Linear(784, 128)
```

의 의미는:

```text
입력 784개
↓
은닉 뉴런 128개
```

이다.

각 뉴런은 서로 다른 Weight와 Bias를 가지며 입력을 계산한다.

따라서:

> **은닉층에 뉴런 128개를 추가한다**

는 것은 입력 데이터를 서로 다른 방식으로 계산하는 중간 계산 단위 128개를 둔다는 뜻으로 이해했다.

### 1-21. 모델 파라미터

`Model Parameter`라는 말이 처음에는 너무 어렵게 느껴졌다.

현재 단계에서는:

> **모델이 학습하면서 바꾸는 내부 값**

으로 이해한다.

대표적인 파라미터는:

```text
Weight
Bias
```

이다.

즉:

```text
모델 파라미터
= Weight + Bias
```

### 1-22. 단층 모델 파라미터 계산

Fashion MNIST 이미지는:

```text
28 × 28
= 784
```

개의 입력값을 가진다.

클래스는 10개다.

은닉층이 없는 경우:

```text
784 입력
↓
10 출력
```

Weight:

```text
784 × 10
= 7,840
```

Bias:

```text
10
```

따라서:

```text
총 Parameter
= 7,840 + 10
= 7,850개
```

### 1-23. 다층 모델 파라미터 계산

은닉 뉴런 128개를 추가하면:

```text
784
↓
128
↓
10
```

#### 입력 → 은닉

```text
Weight
784 × 128
= 100,352

Bias
= 128

소계
= 100,480
```

#### 은닉 → 출력

```text
Weight
128 × 10
= 1,280

Bias
= 10

소계
= 1,290
```

따라서:

```text
100,480
+
1,290
=
101,770개
```

은닉층 하나를 추가했는데 파라미터가 크게 증가했다.

즉:

```text
뉴런/은닉층 증가
↓
파라미터 증가
↓
더 복잡한 패턴 학습 가능
```

하지만 동시에:

```text
연산량 증가
과적합 위험 증가
학습 시간 증가
```

문제도 발생한다.

### 1-24. 은닉층이 많으면 무조건 좋은가?

아니다.

층을 깊게 만들면 모델의 표현력은 증가하지만 다음 문제가 생길 수 있다.

```text
1. Overfitting
2. 연산 비용 증가
3. Vanishing Gradient
```

결국 중요한 것은:

> **데이터에 맞는 적절한 깊이와 뉴런 수를 찾는 것**

이다.

### 1-25. Overfitting

모델이 Train 데이터의 본질적인 패턴만 배우는 것이 아니라 노이즈나 세부 내용까지 외워버린 상태다.

```text
Train 성능
→ 매우 좋음

새로운 Test 데이터
→ 성능 하락
```

예:

```text
문제집의 문제와 답을 통째로 외움
↓
같은 문제는 100점

처음 보는 문제
↓
성적 하락
```

모델의 목적은 Train 데이터를 외우는 것이 아니라 새로운 데이터에서도 잘 예측하는 **Generalization**이다.

### 1-26. 기울기 소실에서 무엇이 소실되는가?

수업 중 가장 중요하게 바로잡은 부분.

처음에는:

> “은닉층을 통과할 때마다 Weight가 작아진다.”

라고 생각했다.

정확히는:

> **Weight 자체가 계속 작아지는 것이 아니라, 역전파되는 Gradient가 지나치게 작아지는 것**

이다.

```text
출력층
↓
Gradient 전달
↓
은닉층
↓
더 앞쪽 은닉층
↓
Gradient가 점점 작아질 수 있음
```

Gradient가 거의 `0`이 되면:

```text
Weight를 얼마나 바꿔야 할지에 대한 신호
≈ 0
```

이 되어 앞쪽 층의 Weight가 제대로 업데이트되지 않는다.

이것이:

> **Vanishing Gradient — 기울기 소실**

이다.

### 1-27. 과거 은닉층에서 사용하던 Sigmoid의 문제

Sigmoid는:

```text
0 ~ 1
```

사이로 값을 압축한다.

출력층에서 이진분류 확률을 만들 때는 유용하지만, 과거 은닉층에서도 Sigmoid를 많이 사용하면서 깊은 신경망에서는 기울기가 매우 작아지는 문제가 나타났다.

그래서 현대 신경망 은닉층에서는 대표적으로 **ReLU**를 사용한다.

### 1-28. ReLU도 활성화 함수인가?

**맞다.**

ReLU는 대표적인 **은닉층 활성화 함수**다.

```text
ReLU(z) = max(0, z)
```

즉:

```text
음수
→ 0

양수
→ 그대로 통과
```

예:

```text
-5 → 0
-1 → 0
 2 → 2
 8 → 8
```

### 1-29. 출력층에도 함수가 필요한데 왜 은닉층에도 필요한가?

이 질문이 오늘 신경망 파트의 핵심이었다.

Linear 연산만 여러 번 연결하면:

```text
Linear
↓
Linear
↓
Linear
```

결국 수학적으로 하나의 Linear 연산으로 합칠 수 있다.

즉 은닉층을 많이 만들어도 활성화 함수가 없으면 복잡한 패턴을 표현하는 효과가 제한된다.

그래서:

```text
Linear
↓
ReLU
↓
Linear
↓
ReLU
```

처럼 은닉층 사이에 **비선형 활성화 함수**를 넣는다.

이것이 신경망이 단순 직선 형태를 넘어 복잡한 패턴을 학습할 수 있게 하는 핵심이다.

### 1-30. 은닉층 활성화 함수도 Softmax인가?

아니다.

현재 수업 기준으로는 다음처럼 구분한다.

```text
은닉층
→ ReLU
→ 비선형성 추가

출력층
→ Sigmoid / Softmax
→ 최종 분류 결과 해석
```

| 위치 | 대표 활성화 함수 | 역할 |
|---|---|---|
| 은닉층 | ReLU | 비선형성 추가 |
| 이진분류 출력층 | Sigmoid | 0~1 사이 값 |
| 다중분류 출력층 | Softmax | 클래스별 확률 분포 |

즉:

> 모두 활성화 함수이지만 **사용 위치와 목적이 다르다.**

### 1-31. 역전파란?

아직 본격적인 신경망 학습 코드는 배우기 전이지만 개념 질문으로 먼저 확인했다.

Forward에서는:

```text
입력
→ 은닉층
→ 출력
→ 예측
```

을 수행한다.

예측 후 Loss가 계산되면:

> 어떤 Weight가 Loss에 얼마나 영향을 줬는지

를 출력층에서 입력층 방향으로 거꾸로 계산한다.

이 과정이:

> **Backpropagation — 역전파**

다.

현재 단계에서:

```text
Backpropagation
→ 각 Parameter의 Gradient를 계산하는 과정
```

으로 기억한다.

### 1-32. Gradient와 Optimizer

이전부터 계속 등장해서 혼동했던 개념.

```text
Loss
↓
Backward
↓
Gradient
↓
Optimizer
↓
Weight 변경
```

#### Gradient

> Loss를 줄이려면 Parameter를 어느 방향으로 얼마나 움직여야 하는지 알려주는 정보

#### Optimizer

> 계산된 Gradient를 이용해 실제 Weight/Bias를 업데이트하는 알고리즘

즉:

```text
Gradient
= 방향 정보

Optimizer
= 실제 수정 담당
```

### 1-33. CNN — 합성곱 신경망

Fashion MNIST는 이미지 데이터다.

일반 MLP에서는:

```text
28 × 28 이미지
↓
Flatten
↓
784개 숫자
```

처럼 이미지를 한 줄로 펼쳐서 처리한다.

그런데 이렇게 하면 이미지 안의 공간적 위치 관계를 충분히 이용하기 어렵다.

CNN은 이미지에서:

```text
선
모서리
무늬
형태
```

같은 공간적 특징을 포착하는 데 특화된 신경망이다.

그래서 이미지 문제에서는 단순히 Dense 은닉층을 계속 깊게 쌓는 것보다 CNN 구조를 사용하는 것이 더 효과적일 수 있다.

### 오늘 수행한 실습

- Iris 데이터 로드
- Species 클래스 확인
- 이진분류 대상 Species 필터링
- Feature `X`와 Target `y` 구성
- 문자열 Species → `0/1` 변환
- Train/Test 80:20 분할
- `random_state=42`
- `stratify=y`
- LogisticRegression 생성 및 학습
- Test 데이터 예측
- Accuracy 계산
- 소수점 넷째 자리 출력
- 이진/다중분류 결정 영역 시각화 코드 확인
- PyTorch/DNN 교안의 입력층·은닉층·출력층 구조 확인
- Fashion MNIST 기준 단층/다층 모델 파라미터 개수 계산

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

처음에는 머신러닝을:

```text
데이터를 넣는다
↓
AI가 알아서 학습한다
↓
예측한다
```

정도로 애매하게 이해하고 있었다.

하지만 실제로는:

```text
문제 정의
↓
X / y 설정
↓
전처리
↓
모델 선택
↓
예측
↓
Loss
↓
Parameter 학습
↓
검증
↓
Test
```

각 단계가 분리되어 있었다.

특히 분류에서는 모델이 단순 숫자를 계산한 뒤 그것을 바로 답으로 사용하는 것이 아니라:

```text
Logit
↓
Activation Function
↓
분류에 필요한 값
```

이라는 과정까지 필요했다.

신경망에서는 여기에 은닉층이 추가된다.

```text
입력
↓
여러 중간 특징 생성
↓
비선형 활성화
↓
더 복잡한 특징 학습
↓
최종 출력
```

따라서 은닉층과 활성화 함수는 단순히 코드를 복잡하게 만드는 장치가 아니라, 선형 모델로 표현하기 어려운 현실의 복잡한 패턴을 학습하기 위해 필요하다.

### 내 생각

> 머신러닝이라는 말을 너무 쉽게 생각하고 있었던 것 같다. 이전에는 “데이터로 알아서 학습한다” 정도로 알고 있었는데 실제로 들어가 보니 모델, Loss, 활성화 함수, 규제, 전처리, 검증이 전부 다른 역할을 하고 있었다.
>
> 그래서 기존에 애매하게 알고 있던 머신러닝은 정말 ‘가짜’였다는 느낌이 들었다. 특히 내가 자꾸 MSE, Ridge, Sigmoid 같은 단어를 같은 레벨의 개념처럼 섞어서 생각하고 있었다는 걸 알게 됐다.
>
> 앞으로 새로운 용어가 나오면 먼저 **이게 전처리인지, 모델인지, 활성화 함수인지, 손실함수인지, 규제인지, 평가 방법인지**부터 분류해야겠다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

#### 로지스틱 회귀

```text
1. Feature X 입력

2. Weight와 Bias 계산
   z = wX + b

3. Logit 생성

4. 활성화 함수 적용

   이진분류
   → Sigmoid

   다중분류
   → Softmax

5. 클래스 예측

6. 실제 정답과 비교

7. Loss 계산

8. Parameter 학습

9. Validation / Test로 성능 확인
```

#### 신경망

```text
입력층
↓
Linear
↓
은닉층
↓
ReLU
↓
다음 층
↓
출력층
↓
예측
↓
Loss
↓
Backpropagation
↓
Gradient
↓
Optimizer
↓
Weight / Bias 업데이트
```

### 내 말로 설명하기

> 머신러닝 모델이 학습한다는 것은 그냥 데이터를 기억하는 게 아니라 Weight와 Bias 같은 내부 숫자를 계속 조정하는 과정이다.
>
> 로지스틱 회귀에서는 입력값으로 먼저 Logit이라는 원시 점수를 만들고, Sigmoid나 Softmax를 이용해서 분류할 수 있는 형태로 바꾼다.
>
> 그리고 정답과 비교해서 Loss를 만든다. Loss가 작아지는 방향을 찾기 위해 Gradient가 필요하고, 그 Gradient를 이용해 실제 Weight를 바꾸는 역할을 Optimizer가 한다.
>
> 신경망은 이 과정 중간에 은닉층을 추가해서 입력 데이터를 여러 단계로 조합한다. 하지만 Linear만 여러 번 쌓으면 결국 하나의 Linear와 비슷해지기 때문에 ReLU 같은 비선형 활성화 함수를 넣는다.

---

## 4. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: Iris 이진분류에서 Species를 Target으로 변환
- 발생한 문제: `KeyError: 'Species'`
- 오류 메시지:

```text
KeyError: 'Species'
```

### 문제가 발생한 코드

```python
X_binary = df_binary[
    ["PetalLengthCm", "PetalWidthCm"]
]

y_binary = X_binary["Species"].map({
    "Iris-setosa": 0,
    "Iris-versicolor": 1
})
```

### 문제의 원인

`X_binary`를 만들 때:

```python
["PetalLengthCm", "PetalWidthCm"]
```

두 컬럼만 선택했다.

따라서 현재 `X_binary`에는:

```text
PetalLengthCm
PetalWidthCm
```

만 존재한다.

그런데:

```python
X_binary["Species"]
```

를 요청했기 때문에 존재하지 않는 컬럼을 찾으면서 `KeyError`가 발생했다.

처음에는 Pandas를 import하지 않은 문제라고 생각했지만, 실제로는 **현재 DataFrame에 Species 컬럼이 존재하지 않는 것이 원인**이었다.

### 해결한 코드

```python
y_binary = df_binary["Species"].map({
    "Iris-setosa": 0,
    "Iris-versicolor": 1
})
```

### 해결 원리

> DataFrame에서 일부 컬럼만 선택해서 새로운 변수에 저장하면 그 변수에는 선택한 컬럼만 존재한다.
>
> 따라서 `KeyError`가 발생하면 먼저 “내가 지금 접근하는 객체 안에 해당 컬럼이 실제로 존재하는가?”를 확인해야 한다.

### 추가 문제 — 문제 요구사항과 기존 코드가 달랐던 경우

문제에서는:

```text
Species
→ Iris-versicolor
→ Iris-virginica

Feature
→ SepalLengthCm
→ SepalWidthCm
```

를 요구했다.

하지만 이전 실습 코드를 그대로 가져오면서:

```text
Iris-setosa
Iris-versicolor

PetalLengthCm
PetalWidthCm
```

을 사용했다.

#### 해결

```python
df_binary = df[
    df["Species"].isin([
        "Iris-versicolor",
        "Iris-virginica"
    ])
].copy()

X_binary = df_binary[
    ["SepalLengthCm", "SepalWidthCm"]
]
```

#### 새롭게 확인한 것

```text
Sepal
= 꽃받침

Petal
= 꽃잎
```

문제의 요구조건을 코드 작성 전에 먼저:

```text
입력 X
정답 y
사용할 클래스
출력 형식
```

으로 분리해서 확인할 필요가 있다.

---

## 5. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점:
  - 새로운 용어가 나오면 바로 질문해서 기존 개념과 연결하려고 했다.
  - `Sigmoid`, `Softmax`, `SCCE`, `ReLU`가 전부 같은 종류가 아니라는 점을 계속 확인했다.
  - 코드 오류가 났을 때 수업 흐름을 완전히 놓치지 않도록 필요한 부분부터 수정했다.

- 계속 유지할 학습 방법:
  - 개념을 단어 하나로 외우지 않고 전체 흐름에서 위치를 찾는다.
  - 헷갈리는 용어는 다음 구조로 분류한다.

```text
전처리
→ Scaling
→ One-Hot Encoding

모델
→ Linear Regression
→ Logistic Regression
→ Ridge
→ Lasso

활성화 함수
→ Sigmoid
→ Softmax
→ ReLU

손실함수
→ MSE
→ BCE
→ CCE
→ SCCE

검증/평가
→ Accuracy
→ Train/Test Split
→ K-Fold

신경망 구조
→ Input Layer
→ Hidden Layer
→ Output Layer

학습
→ Loss
→ Backpropagation
→ Gradient
→ Optimizer
→ Parameter Update
```

### Problem — 개선할 것

- 이해하기 어려웠던 부분:
  - `Logit → Sigmoid → 분류` 흐름을 아직 혼자 설명하기 어렵다.
  - MSE와 Cross Entropy의 차이를 복습 문제에서 설명하지 못했다.
  - `fit()`, `transform()`, `fit_transform()`을 아직 혼자 설명하지 못했다.
  - PyTorch/DNN은 용어가 갑자기 많아지면서 입력층·은닉층·뉴런·파라미터가 서로 어떻게 연결되는지 계속 질문이 필요했다.
  - Backpropagation / Gradient / Optimizer의 역할 구분이 아직 완전히 익숙하지 않다.

- 반복해서 실수한 부분:
  - 현재 DataFrame에 어떤 컬럼이 남아 있는지 추적하지 못해 `KeyError`가 발생했다.
  - 기존 실습 코드를 다음 문제에 가져오면서 문제에서 요구하는 Species와 Feature를 바꾸지 않았다.
  - MSE / Cross Entropy와 Ridge / Lasso처럼 **서로 다른 레벨의 개념을 같은 종류로 연결하려는 경향**이 있었다.

- 아직 설명하기 어려운 부분:
  - Logit
  - Cross Entropy
  - Optimizer
  - Backpropagation
  - 기울기 소실
  - 은닉층이 실제로 어떤 특징을 만들어내는지
  - ReLU가 왜 비선형성을 만든다는 것인지

### Try — 다음에 시도할 것

- 다시 공부할 내용:
  1. `Logit → Sigmoid → 확률 → 이진분류`
  2. `Softmax → 다중분류`
  3. `MSE / BCE / CCE / SCCE`
  4. `Loss → Gradient → Optimizer → Weight`
  5. `입력층 → 은닉층 → ReLU → 출력층`

- 예제를 보지 않고 작성해볼 코드:
  - Iris 데이터에서 원하는 Species만 필터링
  - X/y 분리
  - `train_test_split`
  - `LogisticRegression`
  - `fit`
  - `predict`
  - `accuracy_score`

- 다음 학습에서 바꿔볼 방법:
  - 새로운 개념이 나오면 바로 다음 질문을 한다.

```text
1. 이건 어느 단계인가?
2. 입력은 무엇인가?
3. 출력은 무엇인가?
4. 왜 필요한가?
5. 앞에서 배운 개념과 어떻게 연결되는가?
```

---

## 6. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [x] 코드가 실행되는 전체적인 순서를 보면 어느 정도 따라갈 수 있다.
- [x] 오늘 발생한 `KeyError`의 실제 원인을 복습 후 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [x] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

### 오늘 복습 문제에서 확인한 상태

확실히 이해한 것:

```text
회귀 vs 분류
Sigmoid = 활성화 함수
CCE vs SCCE의 기본 차이
Ridge / Lasso의 규제 목적
```

다시 복습이 필요한 것:

```text
Logit → Sigmoid 전체 흐름
MSE
Cross Entropy
fit / transform / fit_transform
KeyError 발생 원인 추적
train_test_split 옵션
Optimizer
```

아직 본격 학습 전이라 보류할 것:

```text
PyTorch 신경망 학습 코드 전체
Backpropagation 세부 계산
Optimizer 종류
DNN 학습 루프
```

---

## 7. 다음 학습에서 할 일

1. `Logit → Sigmoid → 분류` 흐름을 예시 없이 직접 설명해본다.
2. `MSE / Cross Entropy / Ridge / Lasso`를 각각 **손실함수 / 규제**로 분류해본다.
3. `fit / transform / fit_transform`을 StandardScaler 예제로 다시 복습한다.
4. PyTorch에서 `입력층 → 은닉층 → ReLU → 출력층` 코드를 실제로 확인한다.
5. `Loss → Backpropagation → Gradient → Optimizer → Weight Update` 흐름을 PyTorch 코드와 연결한다.

---

## 관련 자료

- 수업 노트: 3장 2강 로지스틱 회귀와 교차 검증
- 예습 파일: `[MACHINE_LEARNING]_다중회귀-규제-로지스틱회귀-교차검증_예습정리.md`
- 수업 노트: 4장 1강 파이토치 기초 및 심층 신경망
- 실습 데이터: `Iris.csv`
- 실습 환경: VS Code / Jupyter Notebook / PyTorch / Scikit-learn

---

## STAR 문제 해결 기록

### Situation — 상황

Iris 데이터를 이용한 이진분류 실습 중 `Species`를 0/1로 변환하려고 했지만 `KeyError: 'Species'`가 발생했다.

### Task — 해결 과제

`Species` 컬럼이 원본 데이터에는 존재하는데 왜 코드에서는 찾을 수 없는지 원인을 파악하고 올바른 Target 데이터를 생성해야 했다.

### Action — 실행한 행동

1. `df_binary`와 `X_binary`가 같은 DataFrame인지 확인했다.
2. `X_binary`를 만들 때 어떤 컬럼을 선택했는지 확인했다.
3. `X_binary`에는 `PetalLengthCm`, `PetalWidthCm`만 존재한다는 것을 확인했다.
4. Species는 원본 필터 데이터인 `df_binary`에서 가져오도록 수정했다.

### Result — 결과

- 해결 결과:

```python
y_binary = df_binary["Species"].map({
    "Iris-setosa": 0,
    "Iris-versicolor": 1
})
```

로 수정하여 Target을 정상적으로 생성할 수 있었다.

- 새롭게 이해한 점:

> 변수 이름이 DataFrame이라고 해서 항상 원본의 모든 컬럼을 가지고 있는 것이 아니다. 컬럼을 선택하여 새 DataFrame을 만들면 현재 변수에는 선택한 컬럼만 존재한다.

- 다음에 같은 문제가 생겼을 때 확인할 것:

```text
KeyError 발생
↓
현재 객체 확인
↓
columns 확인
↓
찾는 컬럼이 실제로 존재하는지 확인
```
