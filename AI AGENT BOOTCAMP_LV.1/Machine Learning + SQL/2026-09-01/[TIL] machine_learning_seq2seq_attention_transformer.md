# TIL | 2026-09-01 | Seq2Seq · Attention · Transformer

> **드디어...! 아키텍처가 나왔다...!**

> 개별 함수와 모델을 넘어, 여러 컴포넌트가 연결되어 하나의 아키텍처를 만드는 흐름을 처음으로 구체적으로 이해하기 시작했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- 초기 Seq2Seq의 Encoder–Context Vector–Decoder 구조와 한계
- Attention이 고정 크기 Context Vector의 정보 손실 문제를 보완하는 방식
- Query, Key, Value와 Attention Weight
- Self-Attention, Multi-Head Attention, Masked Self-Attention, Cross Attention
- Transformer Decoder의 흐름과 FFN(Dense Layer)
- ReLU, Dropout, Softmax의 역할 차이
- 컴포넌트와 아키텍처의 차이
- Transformer 구조별 모델: Encoder-only / Decoder-only / Encoder-Decoder

### 핵심 코드

```text
Seq2Seq
→ 고정 Context Vector의 한계
→ Attention
→ Self-Attention
→ Multi-Head Attention
→ Masked Multi-Head Attention
→ Cross Attention
→ FFN / Dense Layer
→ Softmax
→ Transformer 아키텍처
```

### 오늘 수행한 실습

- Seq2Seq부터 Transformer까지 전체 개념 흐름 복습
- Masked Self-Attention과 Cross Attention 비교
- Cross Attention의 Q/K/V 출처 확인
- ReLU / Dropout / Softmax 역할 구분
- 복습 문제 5개 풀이로 이해도 점검

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 초기 Seq2Seq는 입력 문장이 길어져도 모든 정보를 고정 크기의 Context Vector 하나에 압축해야 해서 정보 손실이 발생할 수 있다.
- Attention은 Decoder가 매 시점마다 Encoder의 여러 출력 중 현재 필요한 정보에 더 높은 가중치를 주어 참고할 수 있게 한다.
- Transformer는 RNN처럼 순차적으로만 처리하지 않고 Attention을 중심으로 정보를 연결해 긴 문맥을 효과적으로 다룰 수 있다.
- Masked Self-Attention은 Decoder가 다음 토큰을 예측할 때 미래의 정답을 미리 보는 것을 막는다.
- Cross Attention은 Decoder가 Encoder가 처리한 원문 정보를 다시 참고할 수 있게 한다.

### 내 생각

> 오늘은 개념 하나하나보다 “왜 이 구조가 이전 구조의 문제를 해결하기 위해 생겼는가”를 연결해서 보는 것이 중요했다. Seq2Seq의 한계에서 Attention이 나오고, Attention이 Transformer의 핵심 컴포넌트가 되는 흐름이 보이기 시작했다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 초기 Seq2Seq에서는 Encoder가 입력 시퀀스를 읽고 하나의 고정 크기 Context Vector에 정보를 압축한다.
2. 긴 문장에서는 이 고정된 벡터에 정보를 모두 담기 어려워 정보가 유실될 수 있다.
3. Attention은 Decoder가 현재 필요한 Encoder 출력에 더 높은 가중치를 주어 참고하도록 한다.
4. Query와 Key의 유사도를 계산하고 Softmax를 적용해 합이 1인 Attention Weight를 만든다.
5. 이 가중치를 Value에 적용해 현재 필요한 정보를 가중합한다.
6. Transformer Decoder의 Masked Self-Attention은 지금까지 생성된 토큰만 참고하고 미래 정답은 가린다.
7. Cross Attention에서는 Q는 Decoder에서, K와 V는 Encoder 출력에서 가져온다.
8. Attention 결과는 FFN(Dense Layer)을 거치며 다시 가공되고, 최종 출력 단계에서 Softmax를 통해 다음 토큰 후보의 확률 분포를 만든다.

### 내 말로 설명하기

> Seq2Seq는 긴 문장의 모든 정보를 하나의 고정된 Context Vector에 넣으려다 정보가 손실될 수 있었다. Attention은 그 정보를 한 번에 다 압축하지 않고 Decoder가 필요한 순간마다 Encoder의 여러 정보 중 중요한 부분을 다시 골라 보게 만든다. Transformer는 이 Attention을 중심으로 여러 컴포넌트를 연결한 아키텍처다.

### 오늘 기억할 Q / K / V

```text
Cross Attention
Q → Decoder
K → Encoder
V → Encoder
```

### Masked Self-Attention

```text
현재 번역: 나는 너를 [ ? ]

볼 수 있음  → 나는 / 너를
볼 수 없음  → 사랑해

예측 자체를 막는 것 ❌
미래 정답을 미리 보는 것을 막는 것 ✅
```

### ReLU / Dropout / Softmax

```text
ReLU
→ 음수는 0, 양수는 그대로 통과시키는 활성화 함수

Dropout
→ 학습 중 일부 뉴런을 랜덤하게 비활성화해 과적합을 줄이는 기법

Softmax
→ 여러 점수를 합이 1인 확률 분포로 정규화
→ Attention에서는 정보에 얼마나 집중할지를 나타내는 가중치 생성
```

### 컴포넌트와 아키텍처

```text
컴포넌트
→ 특정 역할을 담당하는 개별 부품

아키텍처
→ 컴포넌트들의 구성 방식 + 연결 관계를 포함한 전체 설계 구조
```

### Transformer 구조별 대표 모델

```text
Encoder-only
→ BERT, RoBERTa
→ 입력 이해 / 분류 / 검색

Decoder-only
→ GPT, Llama
→ 다음 토큰 생성 / 대화 / 코드 생성

Encoder-Decoder
→ T5, BART
→ 번역 / 요약 / 입력을 다른 출력 시퀀스로 변환
```

---

## 4. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: Masked Self-Attention과 Cross Attention의 역할을 구분해 Transformer Decoder의 흐름 이해하기
- 발생한 문제: Masked Attention이 “예측을 못 하게 하는 것”인지, Cross Attention이 “미래 단어를 참고하는 것”인지 혼동함

### 문제의 원인

- Masked Attention의 “가린다”는 표현을 예측 자체를 막는 것으로 해석했다.
- Cross Attention이 참고하는 정보와 최종적으로 예측해야 하는 토큰을 혼동했다.

### 해결 원리

> Masked Self-Attention은 다음 토큰 예측을 막는 것이 아니라, 예측해야 할 미래 정답을 미리 보지 못하게 한다. Cross Attention은 미래 정답을 보는 것이 아니라 Encoder가 처리한 원문 정보를 참고한다.

---

## 5. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 이해되지 않는 표현을 그대로 넘기지 않고 “왜 미래를 가리는가?”, “컴포넌트와 아키텍처는 무엇이 다른가?”처럼 구조를 다시 질문했다.
- 계속 유지할 학습 방법: 개념을 외우기보다 이전 구조의 문제 → 새 구조가 해결한 방식 순서로 연결해서 이해하기

### Problem — 개선할 것

- 이해하기 어려웠던 부분: Attention이 기존 Context Vector 문제를 정확히 어떻게 해결하는지
- 반복해서 실수한 부분: Masked Attention에서 “미래를 못 본다”와 “예측을 못 한다”를 혼동함
- 아직 설명하기 어려운 부분: Self-Attention부터 Multi-Head Attention, Masked Attention, Cross Attention까지 전체 실행 순서

### Try — 다음에 시도할 것

- 다시 공부할 내용: Seq2Seq → Attention → Transformer로 발전한 이유
- 예제를 보지 않고 작성해볼 코드: 오늘은 코드보다 구조 중심 학습이므로 Q/K/V와 Attention 흐름을 직접 그려보기
- 다음 학습에서 바꿔볼 방법: Transformer 전체 그림에서 각 컴포넌트가 어느 위치에 있는지 하나씩 짚으면서 학습하기

---

## 6. 이해도 점검

- [x] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [x] 주요 컴포넌트의 실행 흐름을 부분적으로 설명할 수 있다.
- [x] 오늘 헷갈렸던 개념의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [x] ⭐⭐⭐ 설명을 보면 이해하지만 전체 구조를 혼자 연결하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

---

## 7. 다음 학습에서 할 일

1. Seq2Seq의 고정 Context Vector 문제와 Attention의 해결 방식을 다시 연결해서 설명해보기
2. Masked Self-Attention과 Cross Attention을 하나의 Decoder 흐름 안에서 비교하기
3. Transformer Encoder / Decoder 전체 구조를 그림으로 보고 각 컴포넌트의 역할 다시 확인하기

---

## 관련 자료

- 수업 노트: 6장 1강 Transformer
- 복습 범위: Seq2Seq → Attention → Transformer
- 참고 키워드: Context Vector, Q/K/V, Attention Weight, Masked Self-Attention, Cross Attention, FFN, Softmax
