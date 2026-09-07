# [WIL]Lesson&Learn

> **WEEK 4 | 2026-08-24 ~ 2026-08-28**  
> 머신러닝을 개별 개념의 모음이 아니라 하나의 연결된 학습 과정으로 보기 시작한 주.

---

## 1. 이번 주 학습 마인드맵

```text
                                      ┌───────────────┐
                                      │  데이터 이해   │
                                      └───────┬───────┘
                                    ↗         │
                          ┌──── EDA ─────┐    ├── 결측치
                          │              │    ├── 중복값
                          │              │    └── 시각화
                          │
                          │
       ┌─────────────── 회귀 ───────────────┐
       │                                     │
       │   Linear Regression                 │
       │        │                            │
       │        ├── Feature X                │
       │        ├── Target y                 │
       │        ├── coef_ / intercept_       │
       │        │                            │
       │        ↓                            │
       │      예측                           │
       │        ↓                            │
       │      오차                           │
       │        ↓                            │
       │      MSE                            │
       │        ↓                            │
       │   Gradient Descent                  │
       │                                     │
       │   과적합 제어                        │
       │     ↙       ↓       ↘               │
       │   Ridge    alpha    Lasso           │
       │                                     │
       │
       │               ╔══════════════════╗
       ├─────────────── ║ MACHINE LEARNING ║ ───────────────┐
       │               ╚══════════════════╝                 │
       │                                                    │
       │                                      ┌────────── 분류 ──────────┐
       │                                      │                          │
       │                                      │ Logistic Regression      │
       │                                      │          │               │
       │                                      │        Logit             │
       │                                      │       ↙    ↘             │
       │                                      │ Sigmoid   Softmax        │
       │                                      │    │         │           │
       │                                      │ 이진분류   다중분류       │
       │                                      │    ↓         ↓           │
       │                                      │  BCE     CCE / SCCE      │
       │                                      │                          │
       │                                      └──────────────────────────┘
       │
       ↓
 ┌── 데이터 처리 ──┐                              ┌──── Deep Learning ────┐
 │                 │                              │                       │
 │ Train / Test    │                              │        DNN            │
 │                 │                              │         │             │
 │ StandardScaler  │                              │    Input Layer        │
 │   ├─ fit        │                              │         ↓             │
 │   ├─ transform  │                              │   Hidden Layer        │
 │   └─ fit_       │                              │      + ReLU           │
 │      transform  │                              │         ↓             │
 │                 │                              │   Output Layer        │
 │ Data Leakage    │                              │                       │
 └─────────────────┘                              │      PyTorch          │
                                                  │         │             │
                                                  │      Forward          │
                                                  │         ↓             │
                                                  │       Loss            │
                                                  │         ↓             │
                                                  │      Backward         │
                                                  │         ↓             │
                                                  │     Gradient          │
                                                  │         ↓             │
                                                  │     Optimizer         │
                                                  │         ↓             │
                                                  │ Weight / Bias Update  │
                                                  └───────────────────────┘
```

### 이번 주 개념을 하나의 흐름으로 보면

**데이터를 이해한다**  
→ 학습에 사용할 **X와 y를 만든다**  
→ 필요한 **전처리**를 한다  
→ 문제에 맞는 **모델**을 선택한다  
→ 모델이 **예측**한다  
→ 정답과 비교해 **Loss**를 구한다  
→ Loss를 줄이도록 **파라미터를 학습**한다  
→ 새로운 데이터에서도 잘 작동하는지 **검증**한다.

이번 주에 배운 여러 용어는 결국 이 흐름의 서로 다른 위치에 있었다.

---

## 2. 이번 주 굵직한 학습 변화

### ① 머신러닝에 대한 생각이 바뀜

**Before**

> 데이터를 넣으면 모델이 알아서 학습한다.

**After**

> `데이터 → 전처리 → 모델 → 예측 → Loss → 파라미터 조정 → 검증`이라는 학습 과정이 있고, 각각의 단계에 필요한 도구가 다르다.

이번 주의 가장 큰 변화다.

### ② 용어를 역할별로 보기 시작함

처음에는 `MSE`, `Ridge`, `Sigmoid`, `StandardScaler` 등이 전부 비슷한 머신러닝 용어처럼 섞여 있었다.

지금은 적어도 다음처럼 **어디에 속하는 개념인지 구분하기 시작했다.**

| 역할 | 이번 주 배운 개념 |
|---|---|
| 데이터 확인 | EDA |
| 전처리 | StandardScaler, One-Hot |
| 모델 | Linear Regression, Logistic Regression |
| 활성화 함수 | Sigmoid, Softmax, ReLU |
| Loss | MSE, BCE, CCE, SCCE |
| 규제 | Ridge, Lasso |
| 검증 | Train/Test, K-Fold |
| 파라미터 학습 | Gradient, Backpropagation, Optimizer |

### ③ 코드를 보는 방식이 달라짐

함수 이름 자체를 이해하려고 하기보다,

**현재 데이터는 무엇인가?**  
→ **이 코드의 입력은 무엇인가?**  
→ **무엇을 학습하는가?**  
→ **결과로 무엇이 나오는가?**

순서로 실행 흐름을 확인하는 방식이 조금씩 자리 잡기 시작했다.

특히 오류가 났을 때도 `KeyError` 자체만 보는 것이 아니라 **현재 DataFrame에 어떤 컬럼이 남아 있는지 확인해야 한다**는 경험을 했다.

### ④ 이해는 넓어졌지만 아직 연결이 약한 부분도 생김

이번 주 후반에 개념이 급격히 많아졌다.

특히

`Logit → Sigmoid → 확률`  
`Cross Entropy`  
`Backpropagation → Gradient → Optimizer`

부분은 각각의 단어를 접한 상태에서 **전체 학습 과정으로 연결하는 연습이 더 필요하다.**

따라서 현재 단계는 **"설명과 코드를 보면 흐름을 따라갈 수 있지만 처음부터 혼자 구성하기는 아직 어려운 단계"**에 가깝다.

---

## 3. 차주에 예습하면 좋을 것

이번 주에 헷갈린 내용을 전부 다시 공부하기보다 **다음 학습을 이해하는 데 필요한 연결고리부터** 잡는다.

### Priority 1. 신경망은 실제로 어떻게 학습하는가?

이번 주 마지막에 배운 내용을 하나의 사이클로 연결한다.

```text
입력 데이터
    ↓
  Model
    ↓
 Forward
    ↓
 Prediction
    ↓
   Loss
    ↓
 Backward
    ↓
 Gradient
    ↓
 Optimizer
    ↓
Weight / Bias 수정
    ↺
```

예습 목표는 코드를 작성하는 것이 아니라,

> **"Optimizer가 왜 필요한가?"**

까지 설명할 수 있는 정도면 충분하다.

### Priority 2. 활성화 함수와 Loss를 분리해서 보기

다음 네 가지를 우선 구분한다.

```text
회귀
└─ MSE

이진분류
├─ Sigmoid
└─ BCE

다중분류
├─ Softmax
└─ CCE / SCCE

은닉층
└─ ReLU
```

특히 **Sigmoid/Softmax/ReLU는 활성화 함수**, **MSE/BCE/CCE/SCCE는 Loss**라는 역할 구분을 먼저 확실히 한다.

### Priority 3. Train 데이터와 Test 데이터의 역할

다음 흐름을 다시 확인한다.

```text
전체 데이터
      │
      ├──── Train
      │       │
      │       ├─ scaler.fit()
      │       ├─ transform()
      │       └─ model.fit()
      │
      └──── Test
              │
              ├─ transform()
              ├─ predict()
              └─ evaluate
```

여기서 가장 중요한 질문은 하나다.

> **왜 Test 데이터에는 `fit()`하면 안 되는가?**

이 질문에 답할 수 있으면 `fit()`, `transform()`, `fit_transform()`과 Data Leakage가 함께 정리된다.

---

## Lesson & Learn

**이번 주 Lesson**

> 머신러닝은 모델 하나를 배우는 것이 아니라, 데이터가 들어와 학습되고 검증되기까지의 전체 구조를 이해하는 과정이었다.

**이번 주 Learn**

> 아직 모든 개념을 혼자 사용할 수 있는 것은 아니지만, 새로운 개념이 등장했을 때 무작정 외우기보다 **"전체 머신러닝 흐름에서 얘는 어디에 들어가는가?"**를 먼저 찾는 것이 중요하다는 것을 알게 되었다.
