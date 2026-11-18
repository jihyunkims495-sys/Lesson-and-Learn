# Learning Notes | 2026-11-18 | 질의 변환·Re-ranking·문맥 압축

> LV.2 / Week 14 · RAG 검색 품질 개선

## 1. 검색 전후의 품질 개선 단계

RAG 검색 품질은 하나의 검색기만으로 결정되지 않는다. 질문을 검색하기 좋은 형태로 바꾸고, 넓게 찾은 후보의 순위를 다시 계산하고, 최종 문서에서 질문과 관련된 부분만 남기는 단계가 서로 다른 문제를 해결한다.

```text
사용자 질문
  → Query Transformation
  → 1차 Retriever
  → Cross-Encoder Re-ranking
  → Contextual Compression
  → 정제된 문맥
  → LLM 답변 생성
```

## 2. Query Transformation

### Query Rewrite

사용자의 구어체·별칭·생략된 표현을 검색 문서에 가까운 명확한 질문으로 바꾼다. 원래 질문의 의도는 유지하면서 핵심 명사를 드러내는 것이 중요하다.

```python
rewrite_prompt = PromptTemplate.from_template(
    "사용자의 질문을 검색 시스템이 문서를 탐색하기 유리하도록 "
    "핵심 명사 중심의 명확한 문장으로 다시 작성하세요.\n"
    "사용자 질문: {question}\n"
    "변환된 질문:"
)

rewrite_chain = rewrite_prompt | model
```

저장된 실행 결과에서는 제품 별칭과 짧은 구어체 질문이 제품 종류와 배터리 사용 시간을 명시한 질문으로 바뀌었다.

### HyDE

HyDE는 질문에서 바로 문서를 찾는 대신, 질문에 답할 법한 가상의 문서를 먼저 생성하고 그 문서를 검색 표현으로 사용한다.

```text
짧거나 모호한 질문
  → 가설 답변 생성
  → 가설 답변을 임베딩
  → 실제 문서와 의미 유사도 검색
```

가설 문서는 검색을 돕는 중간 표현일 뿐 사실 검증이 끝난 최종 답변이 아니다. 따라서 가설의 내용을 사용자에게 그대로 정답으로 전달하면 안 된다.

### Query Routing

질문의 종류에 따라 적절한 검색 대상으로 보낸다.

- 사내 규정 질문 → 규정 문서 검색
- 매출 통계 질문 → SQL 데이터 조회
- 최신 동향 질문 → 웹 검색

Routing은 답을 생성하는 단계가 아니라, 어떤 저장소와 도구를 사용할지 결정하는 단계다.

## 3. Cross-Encoder Re-ranking

1차 검색기는 빠르게 후보를 넓게 찾고, Cross-Encoder는 질문과 각 후보 문서를 한 쌍으로 읽어 관련성 점수를 다시 계산한다.

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

### Bi-Encoder와 Cross-Encoder의 차이

```text
Bi-Encoder
질문과 문서를 각각 벡터화 → 빠른 대규모 후보 검색

Cross-Encoder
질문과 문서를 함께 입력 → 더 정밀한 관련성 계산
```

Cross-Encoder는 후보마다 모델 추론이 필요하므로 전체 문서에 적용하기보다 1차 검색의 상위 후보에 적용한다. `k`는 1차 후보 수이고 `top_n`은 재정렬 후 남길 최종 문서 수다.

## 4. Contextual Compression

Re-ranking이 문서의 순서를 바꾸는 작업이라면, Contextual Compression은 선택된 문서에서 질문과 관련된 부분만 추출하는 작업이다.

```python
compressor = LLMChainExtractor.from_llm(model)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)
```

```text
질문
  → BM25 후보 문서 검색
  → 각 문서에서 질문 관련 문장 추출
  → 짧아진 문맥을 최종 생성 단계에 전달
```

문맥 압축은 무관한 토큰을 줄일 수 있지만, 압축 모델이 필요한 정보를 제거하지 않는지 원문과 비교해야 한다. 문서가 이미 짧고 핵심 내용만 있다면 압축 전후가 같을 수도 있다.

## 5. Re-ranking과 Compression 비교

| 구분 | Re-ranking | Contextual Compression |
|---|---|---|
| 목적 | 관련 문서를 위로 올림 | 문서 안의 관련 부분만 남김 |
| 입력 | 질문과 후보 문서 목록 | 질문과 검색된 문서 |
| 출력 | 재정렬·선별된 문서 | 압축된 문서 내용 |
| 주요 설정 | 후보 `k`, 최종 `top_n` | 추출 프롬프트와 압축 모델 |
| 검증 | 정답 문서의 순위 | 필요한 근거가 보존됐는지 |

## 6. 오늘 확인한 실행 상태

- Query Rewrite: 실행 결과 확인
- HyDE 가설 문서 생성: 실행 결과 확인
- 세 가지 질의의 Query Routing: 실행 결과 확인
- 한국어 Cross-Encoder 모델 로딩: 실행 확인
- BM25 후보 3건을 Re-ranking 후 2건으로 선별: 실행 결과 확인
- BM25 후보와 LLM 기반 Compression 결과 비교: 실행 결과 확인
- 질의 유형별 검색 전략의 정량 비교: 미수행
- 별도의 이해도 평가: 미실시
