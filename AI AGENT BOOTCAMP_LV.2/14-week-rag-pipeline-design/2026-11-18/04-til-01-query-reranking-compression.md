# TIL | 2026-11-18 | 질의 변환·Re-ranking·문맥 압축

> LV.2 / Week 14 · RAG 검색 품질 개선

> **검색 품질은 한 번의 검색으로 끝나는 것이 아니라 질문 변환, 후보 검색, 재정렬, 문맥 압축을 단계별로 검증해야 한다.**

> Query Transformation·Re-ranking·Contextual Compression이 각각 검색 전, 검색 결과, 문서 내부를 개선하는 서로 다른 단계라는 점을 이해했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- Query Rewrite는 구어체와 별칭을 검색에 유리한 핵심 명사 중심 질문으로 바꾼다.
- HyDE는 질문에 대한 가설 문서를 먼저 만든 뒤 그 표현으로 실제 문서를 검색한다.
- Query Routing은 질문에 맞는 벡터 검색, SQL, 웹 검색 등의 경로를 선택한다.
- Cross-Encoder Re-ranking은 질문과 후보 문서를 함께 읽어 1차 검색 순위를 다시 계산한다.
- Contextual Compression은 선택된 문서에서 질문과 관련된 부분만 남겨 LLM에 전달할 문맥을 줄인다.

### 핵심 코드

```python
reranker = CrossEncoderReranker(
    model=cross_encoder_model,
    top_n=2,
)

rerank_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=base_retriever,
)
```

```python
compressor = LLMChainExtractor.from_llm(model)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)
```

### 오늘 수행한 실습

- 구어체 제품 질문을 검색에 적합한 질문으로 재작성했다.
- HyDE 가설 문서를 생성하고, 질문 유형별 검색 경로를 분류했다.
- BM25 후보 3건을 한국어 Cross-Encoder로 다시 평가해 상위 2건을 남겼다.
- 복지 포인트 질의에 대해 BM25 결과와 LLM 기반 문맥 압축 결과를 비교했다.
- 모델 의존성, 노트북 커널, Python 내장 함수 덮어쓰기, API 프로젝트 권한 오류를 구분했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드: Query Rewrite·HyDE·Routing 체인, Cross-Encoder Reranker, LLMChainExtractor 기반 Compression
검증 방법: 저장된 노트북 실행 출력과 오류 traceback 확인
확인한 결과: 질문 변환, 라우팅, 모델 로딩, 재정렬, 문맥 압축 출력 생성
미완료: 5장 6강 별도 실습, 대표 질의 집합의 정량 비교, 이해도 평가
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

사용자의 질문은 문서의 표현과 다를 수 있고, 1차 검색 결과에는 정답과 무관한 문서가 섞일 수 있다. 관련 문서를 찾았더라도 긴 본문 전체를 LLM에 전달하면 불필요한 토큰과 노이즈가 늘어난다.

따라서 검색 전에는 질문 표현을 보완하고, 검색 후에는 후보 순서를 다시 평가하며, 마지막에는 문서 안에서 필요한 근거만 남기는 과정이 필요하다.

### 내 생각

> 처음에는 `ContextualCompressionRetriever`가 모두 같은 압축 작업을 한다고 보기 쉬웠다. 실제로는 `base_compressor`에 Re-ranker를 넣으면 문서 순위를 다시 정하고, `LLMChainExtractor`를 넣으면 문서 내용을 질문에 맞게 줄인다. 클래스 이름보다 압축기로 어떤 객체를 연결했는지를 봐야 실행 목적을 알 수 있다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. Query Rewrite·HyDE·Routing으로 검색 입력이나 검색 대상을 정한다.
2. BM25 또는 벡터 검색기가 넓은 후보 문서를 가져온다.
3. Cross-Encoder가 질문과 후보 문서를 함께 비교해 순위를 다시 계산한다.
4. `top_n`에 따라 최종 후보를 선별한다.
5. LLM 기반 Extractor가 문서에서 질문과 관련된 부분만 남긴다.
6. 정제된 문맥을 최종 답변 생성 단계에 전달한다.

### 내 말로 설명하기

> 1차 검색은 빠르게 후보를 모으는 단계이고, Re-ranking은 그 후보 중 어떤 문서가 질문과 더 가까운지 다시 심사하는 단계다. Contextual Compression은 선택된 문서를 더 짧게 다듬는 단계다. 검색 결과가 존재한다는 사실만 보지 않고 각 단계에서 정답 근거가 남아 있는지 확인해야 한다.

---

## 5. 오늘의 문제 해결

### 문제 1 — Cross-Encoder 패키지 누락

- 증상: Cross-Encoder 초기화 중 `sentence_transformers` 모듈을 찾지 못했다.
- 원인: 노트북이 사용하는 프로젝트 가상환경에 필요한 패키지가 없었다.
- 해결: 패키지를 프로젝트 환경에 설치하고 같은 환경을 커널로 선택한 뒤 모델 가중치 로딩을 확인했다.

### 문제 2 — `print`를 문자열로 덮어씀

```python
# 수정 전
print = "=== BM25 ==="

# 수정 후
print("=== BM25 ===")
```

노트북에는 이전 셀의 변수 상태가 남기 때문에 코드를 고친 뒤에도 `del print` 또는 커널 재시작이 필요했다. Compression 결과 반복문은 `com_docs`를 순회하도록 수정했고 최종 출력을 확인했다.

### 문제 3 — API 모델 접근 권한

- 증상: LLM 호출이 403 권한 오류로 거절됐다.
- 원인: 현재 API 키가 속한 프로젝트에 지정 모델 사용 권한이 없었다.
- 구분: 프롬프트·Retriever·LangChain 연결 문제가 아니라 외부 모델 접근 권한 문제였다.
- 현재 상태: 저장된 최종 노트북에서는 접근 가능한 모델을 사용해 질문 변환·HyDE·Routing 출력을 확인했다.

### 해결 원리

> import → 모델 로딩 → 검색기 생성 → 검색 실행 → 압축 실행 → 외부 API 호출 순서로 단계를 나누었다. 최초로 실패한 단계가 어디인지 확인하면 코드 오타, 환경 누락, 외부 권한 문제를 서로 구분할 수 있다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 노트북 커널의 이름이 아니라 `sys.executable`로 실제 환경을 확인한다.
- Re-ranking과 Compression 전후의 문서를 모두 출력해 차이를 비교한다.
- 오류를 import, 모델 로딩, 검색, 압축, API 호출 단계로 나눈다.

### Problem — 개선할 것

- 활성 가상환경과 uv 프로젝트 환경이 달라 패키지 설치 위치를 혼동했다.
- 내장 함수 이름을 변수명으로 사용해 노트북 상태가 오염됐다.
- 모델 권한을 확인하기 전에 API 호출을 실행했다.

### Try — 다음에 시도할 것

- 같은 질의 집합으로 BM25, Re-ranking, Compression 결과를 표로 비교한다.
- 1차 후보 `k`와 최종 `top_n`을 바꾸며 정답 문서 순위와 누락 여부를 기록한다.
- 질의 유형별 검색 결과 비교 실습을 수행하고 각 전략의 선택 기준을 정리한다.

---

## 8. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [ ] 코드가 실행되는 순서를 설명할 수 있다.
- [ ] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [ ] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

---

## 9. 다음 학습에서 할 일

1. 질의 유형별로 BM25·Re-ranking·Compression 결과를 비교한다.
2. `k`와 `top_n`을 조절해 정답 문서의 순위와 누락 여부를 기록한다.
3. 가설 문서와 압축 결과가 원문 근거를 왜곡하지 않는지 검증한다.

---

## 관련 자료

- [Week 14 학습 목록](../README.md)
- [Learning Notes](./02-learning-notes-01-query-reranking-compression.md)
- [Practice](./03-practice-01-reranking-contextual-compression.md)
