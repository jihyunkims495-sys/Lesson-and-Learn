# TIL | 2026-08-31 | PyTorch DNN·RNN·LSTM

> **세포에서 시작해, 신경망으로 끝났다.**

> 오늘은 입력값이 은닉층을 지나 출력이 되고, Loss를 기준으로 역전파와 옵티마이저가 가중치를 수정하는 딥러닝의 학습 구조를 이해했다. 자연어에서는 Embedding, RNN, LSTM으로 이어지며 ‘순서와 기억’을 다루는 방식까지 연결했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- **DNN(Deep Neural Network)**: 입력과 출력 사이에 여러 은닉층을 두어 복잡한 특징을 학습하는 심층 신경망.
- **CNN(Convolutional Neural Network)**: 이미지의 위치·모양 같은 공간적 특징을 살려 학습하는 신경망.
- **RNN(Recurrent Neural Network)**: 순서가 중요한 데이터를 처리하며 이전 시점의 정보를 Hidden State로 다음 시점에 전달하는 순환 신경망.
- **LSTM(Long Short-Term Memory)**: RNN의 긴 문맥 기억 문제를 보완하며 Hidden State와 Cell State를 이용해 기억을 관리하는 구조.
- **Parameter**: 모델이 학습하면서 바꾸는 값. 대표적으로 Weight와 Bias.
- **Activation Function**: Linear 계산 뒤의 값을 변형해 비선형성을 주는 함수. 대표적으로 ReLU, Sigmoid, tanh가 있다.
- **Loss Function**: 모델의 예측이 정답과 얼마나 다른지 계산하는 함수.
- **Backpropagation**: Loss를 기준으로 각 가중치가 Loss에 얼마나 영향을 줬는지 Gradient를 계산하는 과정.
- **Optimizer**: 역전파로 구한 Gradient와 Learning Rate를 이용해 실제 Weight를 수정하는 역할.
- **Dropout**: 학습 중 일부 뉴런의 출력을 랜덤하게 0으로 만들어 특정 뉴런에 과도하게 의존하는 것을 줄이는 과적합 방지 기법.
- **Mini-batch**: 전체 데이터를 적당한 크기의 묶음으로 나누어 메모리 부담과 학습 효율 사이의 균형을 잡는 방법.
- **Embedding**: One-Hot 벡터의 큰 차원과 의미 관계 표현 한계를 줄이기 위해 단어를 작은 실수형 Dense Vector로 표현하는 방법.

### 핵심 코드

```python
import torch
import torch.nn as nn

from torchvision import datasets
from torchvision.transforms import ToTensor
from torch.utils.data import DataLoader, random_split

# DNN의 기본 예시
model = nn.Sequential(
    nn.Flatten(),
    nn.Linear(28 * 28, 128),
    nn.ReLU(),
    nn.Dropout(0.2),
    nn.Linear(128, 10)
)
```

### 오늘 수행한 실습

- Fashion MNIST 28×28 흑백 이미지가 Tensor로 변환되어 신경망에 들어가는 흐름을 확인했다.
- DNN에서 28×28 이미지를 `Flatten`하여 784개의 입력값으로 만든 뒤 `Linear` 층에 전달하는 이유를 이해했다.
- `Forward → Loss → Backpropagation → Optimizer → Weight Update`의 학습 사이클을 정리했다.
- One-Hot Encoding → Embedding → RNN → LSTM으로 이어지는 자연어 처리의 기본 흐름을 학습했다.

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 선형회귀나 로지스틱회귀처럼 단순한 모델만으로는 이미지·문장과 같은 복잡한 패턴을 충분히 표현하기 어렵다.
- DNN은 은닉층과 비선형 활성화 함수를 통해 더 복잡한 특징을 학습할 수 있다.
- CNN은 이미지를 Flatten했을 때 약해질 수 있는 공간적 관계를 활용하기 위해 필요하다.
- RNN은 문장이나 시계열처럼 ‘순서’ 자체가 의미인 데이터를 처리하기 위해 필요하다.
- LSTM은 RNN에서 오래된 정보가 약해지는 문제를 줄이고 긴 문맥을 더 잘 유지하기 위해 사용한다.

### 내 생각

> 3강까지는 머신러닝 모델이 가중치를 학습한다는 사실을 배웠다면, 오늘은 그 학습이 신경망 안에서 어떻게 더 깊어지는지를 본 느낌이다. 처음에는 은닉층, 활성화 함수, 역전파, 옵티마이저가 전부 따로 노는 개념처럼 보였는데 결국 하나의 학습 사이클 안에 있는 역할들이었다. 이미지에서는 공간, 자연어에서는 순서와 기억이 중요하다는 것도 이제 조금 연결된다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 입력 데이터를 Tensor 형태로 준비한다. Fashion MNIST라면 한 장의 이미지가 `[1, 28, 28]` 형태가 된다.
2. DNN의 `Linear` 층에 넣기 위해 `28×28 → 784`로 Flatten한다.
3. `Linear` 층에서 `Wx + b`를 계산하고 ReLU 같은 활성화 함수를 적용한다.
4. 여러 은닉층을 통과하며 중간 표현을 학습하고 최종 예측값을 만든다.
5. Loss Function으로 예측과 정답의 차이를 계산한다.
6. Backpropagation으로 각 Parameter가 Loss에 미친 영향, 즉 Gradient를 계산한다.
7. Optimizer가 Gradient와 Learning Rate를 이용해 Weight와 Bias를 수정한다.
8. 이 과정을 Mini-batch 단위로 반복하고 전체 학습 데이터를 한 번 모두 보면 1 Epoch가 끝난다.

### 내 말로 설명하기

> 입력 데이터를 모델에 넣어서 예측을 만든다. 틀린 정도는 Loss로 계산한다. 역전파는 그 Loss를 기준으로 어떤 가중치를 어느 방향으로 바꿔야 할지 Gradient를 계산하고, 옵티마이저가 실제로 가중치를 수정한다. 이 과정을 계속 반복하면서 모델이 학습한다. RNN에서는 이전 정보를 Hidden State로 다음 순서에 전달하고, LSTM은 무엇을 버리고 기억할지를 조절해서 더 긴 문맥을 다룬다.

---

## 4. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: PyTorch의 `DataLoader`와 데이터 분할 함수를 import하기
- 발생한 문제: `random_split` 함수를 불러오지 못함
- 오류 메시지:

```text
ImportError: cannot import name 'randam_split' from 'torch.utils.data'
```

### 문제가 발생한 코드

```python
from torch.utils.data import DataLoader, randam_split
```

### 문제의 원인

- 함수 이름을 `randam_split`으로 잘못 작성했다.
- `torch.utils.data`에는 `random_split`이라는 함수가 존재한다.

### 해결한 코드

```python
from torch.utils.data import DataLoader, random_split
```

### 해결 원리

> ImportError가 발생했다고 해서 PyTorch 자체가 설치되지 않은 것은 아니었다. 모듈은 찾았지만 그 안에 내가 작성한 이름의 함수가 존재하지 않았고, 함수명의 철자를 정확하게 수정하니 해결되었다.

---

## 5. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 이해가 안 되는 용어를 그냥 넘기지 않고 `텐서 → Flatten → Linear → 은닉층 → 활성화 함수`처럼 앞뒤 개념을 계속 연결해서 질문했다.
- 계속 유지할 학습 방법: 개념을 외우기보다 “왜 필요한가?”를 반복해서 확인하고 내 말로 다시 설명해보기.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: Backpropagation과 Optimizer의 역할 차이, Parameter와 중간 계산값의 차이, RNN과 LSTM의 기억 구조.
- 반복해서 실수한 부분: 역전파가 Loss를 찾는 과정이라고 생각했던 점. 실제로 Loss는 먼저 계산되고, 역전파는 Gradient를 계산한다.
- 아직 설명하기 어려운 부분: Context Vector와 Hidden State의 관계, LSTM의 Forget/Input/Output Gate 세부 작동 방식.

### Try — 다음에 시도할 것

- 다시 공부할 내용: `Forward → Loss → Backpropagation → Optimizer` 흐름을 코드와 연결해서 다시 보기.
- 예제를 보지 않고 작성해볼 코드: `nn.Sequential`, `nn.Linear`, `nn.ReLU`, `nn.Dropout`을 사용한 간단한 DNN.
- 다음 학습에서 바꿔볼 방법: 새 신경망이 등장할 때마다 “무슨 데이터를 위해 등장했는가?”를 먼저 정리하기.

---

## 6. 이해도 점검

- [x] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [x] 코드가 실행되는 순서를 설명할 수 있다.
- [x] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [x] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

---

## 7. 다음 학습에서 할 일

1. RNN의 Hidden State와 LSTM의 Cell State를 그림으로 다시 정리한다.
2. Backpropagation과 Optimizer가 실제 PyTorch 코드에서 각각 어느 줄인지 찾아본다.
3. One-Hot Encoding과 Embedding의 차이를 작은 예제로 직접 확인한다.

---

## 관련 자료

- 수업 노트: 머신러닝 4장 1강 PyTorch·DNN / 4장 2강 RNN·LSTM
- 실습 파일: Fashion MNIST DNN 실습
- 참고 자료: `TIL/WEEK 5/[MACHINE_LEARNING]_파이토치-DNN-역전파-임베딩-RNN-LSTM_예습정리.md`

---

## STAR 문제 해결 기록

### Situation — 상황

> PyTorch 데이터 로더 실습 중 `random_split`을 import하는 단계에서 ImportError가 발생했다.

### Task — 해결 과제

> 라이브러리 설치 문제인지 함수 사용 문제인지 원인을 확인하고 코드를 정상 실행해야 했다.

### Action — 실행한 행동

1. 오류 메시지의 `cannot import name` 부분을 확인했다.
2. 작성한 함수 이름과 실제 PyTorch 함수 이름을 비교했다.
3. `randam_split`을 `random_split`으로 수정했다.

### Result — 결과

- 해결 결과: import가 정상 동작하도록 수정했다.
- 새롭게 이해한 점: `ImportError: cannot import name`은 모듈 내부에 해당 이름이 없을 때도 발생할 수 있다.
- 다음에 같은 문제가 생겼을 때 확인할 것: 함수·클래스 이름의 철자와 공식 이름을 먼저 확인한다.
