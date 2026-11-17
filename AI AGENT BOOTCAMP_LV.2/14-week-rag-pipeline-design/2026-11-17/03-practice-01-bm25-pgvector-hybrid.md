# Practice | 2026-11-17 | BM25·PGVector·Hybrid Search

> LV.2 / Week 14 · RAG 검색 실습과 오류 해결

## 실습 목표

1. 규정 예제 문서를 BM25로 검색한다.
2. 같은 문서를 임베딩해 PGVector 검색기를 만든다.
3. 두 검색기를 동일한 가중치로 결합한다.
4. 검색 결과를 LLM 프롬프트 문맥으로 전달한다.

## 실행 흐름

```text
Document 목록
  ├─ 공백 토큰화 → BM25Retriever
  └─ Embedding → PGVector → Vector Retriever
                 ↓
          EnsembleRetriever
                 ↓
           Hybrid 검색 결과
                 ↓
          PromptTemplate → LLM
```

## 확인한 검색 결과

외부 장소에서 회사 시스템에 연결할 때의 VPN 보안 수칙을 묻는 질의에 대해 다음 순서의 문서가 반환됐다.

1. 비밀번호 변경 및 특수문자 규정
2. 재택근무 시 VPN 연결 규정
3. 로그인 실패 시 계정 잠금 규정

질문의 핵심인 VPN 문서가 후보에 포함됐지만 1위는 아니었다. Hybrid Search를 사용했다는 사실만으로 최적 순위가 보장되는 것은 아니며, 토큰화·후보 개수·검색기별 원순위·가중치를 함께 조정해야 한다.

## 오류 1 — BM25Retriever import

### 문제 코드

```python
from langchain_community.retriever import BM25Retriever
```

### 원인

모듈 경로가 단수형 `retriever`가 아니라 복수형 `retrievers`다.

### 수정

```python
from langchain_community.retrievers import BM25Retriever
```

수정 후 프로젝트 환경에서 실제 import 성공을 확인했다.

## 오류 2 — 관련도 임계값 인자

### 문제 코드

```python
retriever = vector_store.as_retriever(
    search_type="similarity_score_threshold",
    search_knargs={"socre_threshold": 0.7},
)
```

### 원인과 수정

- `search_knargs` → `search_kwargs`
- `socre_threshold` → `score_threshold`

```python
retriever = vector_store.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.7},
)
```

## 오류 3 — PGVector 임베딩 인자

### 문제 코드

```python
PGVector.from_documents(
    documents=documents,
    embadding=embaddings,
)
```

### 원인

변수와 인자 이름에 오타가 있었고, `from_documents()`는 필수 인자 `embedding`을 요구한다.

### 수정

```python
embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small"
)

vector_store = PGVector.from_documents(
    documents=documents,
    embedding=embeddings,
    connection=connection_url,
    collection_name="it_regulations_collection",
    use_jsonb=True,
)
```

## 오류 4 — 최종 LLM 호출 권한

검색된 문서를 프롬프트로 전달하는 체인은 구성했지만, 지정한 모델에 대한 프로젝트 접근 권한이 없어 최종 호출이 403으로 거절됐다.

이 오류는 Retriever나 PromptTemplate의 문법 문제가 아니다. 요청이 모델 호출 단계까지 도달한 뒤 권한 검사에서 실패한 것이다.

### 다음 확인 순서

1. 현재 API 프로젝트에서 조회 가능한 모델을 확인한다.
2. 접근 가능한 모델 ID를 사용하거나 필요한 모델 권한을 준비한다.
3. 동일한 검색 문맥으로 최종 답변을 다시 생성한다.
4. 답변 문장마다 검색 근거가 존재하는지 확인한다.

## 검증 결과

```text
BM25 import: 성공
BM25 검색: 실행 결과 확인
PGVector 코드: 필수 인자 수정
Hybrid 검색: 실행 결과 확인
최종 LLM 생성: 미완료
이해도 평가: 미실시
```
