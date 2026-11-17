# Learning Notes | 2026-11-17 | Retriever와 Hybrid Search

> LV.2 / Week 14 · RAG 파이프라인 설계

## 1. 검색 단계에서 품질 기준이 필요한 이유

Retriever에서 `k`만 지정하면 가장 가까운 문서를 정해진 개수만큼 반환한다. 저장소에 질문과 충분히 관련된 문서가 없어도 결과가 나올 수 있으므로, 반환 개수와 최소 품질 기준을 분리해야 한다.

```python
retriever = vector_store.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={
        "k": 3,
        "score_threshold": 0.7,
    },
)
```

- `k`: 최대 몇 개를 가져올 것인가
- `score_threshold`: 어느 정도 관련된 문서부터 허용할 것인가

벡터 저장소나 검색 메서드에 따라 값이 거리인지 관련도인지 먼저 확인해야 한다. 거리는 작을수록 가깝지만, 관련도는 클수록 관련성이 높다. 임계값 이름과 비교 방향을 혼동하면 관련 문서를 제거하거나 무관한 문서를 통과시킬 수 있다.

## 2. BM25 키워드 검색

BM25는 문서에 등장하는 단어의 빈도, 단어의 희소성, 문서 길이를 이용해 관련성을 계산한다. 다음과 같은 질문에 강하다.

- 정확한 시스템 이름
- 오류 코드와 규정 번호
- 약어와 고유명사
- 문서에 실제로 존재하는 특정 표현

```python
from langchain_community.retrievers import BM25Retriever


def custom_tokenizer(text: str) -> list[str]:
    return text.split()


bm25_retriever = BM25Retriever.from_documents(
    documents=documents,
    preprocess_func=custom_tokenizer,
)
bm25_retriever.k = 2
```

공백 분리 방식은 간단하지만 한국어 조사·어미와 띄어쓰기 변형에 취약하다. 실제 서비스에서는 형태소 분석, 정규화, 사용자 질의 표현을 함께 검토해야 한다.

## 3. 벡터 검색과 PGVector

벡터 검색은 문장 표현이 달라도 의미가 가까운 문서를 찾는다. 텍스트를 임베딩으로 변환한 뒤 PostgreSQL과 pgvector에 저장하고 유사도를 비교할 수 있다.

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

vector_retriever = vector_store.as_retriever(
    search_kwargs={"k": 2}
)
```

`PGVector.from_documents()`는 `embedding` 단수형 인자를 사용한다. `PGVector(...)` 생성자의 `embeddings`와 이름이 다르므로 현재 호출 방식의 시그니처를 확인해야 한다.

## 4. Hybrid Search

키워드 검색은 정확한 문자열에 강하고 벡터 검색은 의미적 표현에 강하다. 두 결과를 결합하면 한 방식의 검색 실패를 다른 방식이 보완할 수 있다.

```python
from langchain_classic.retrievers import EnsembleRetriever


hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.5, 0.5],
)

retrieved_docs = hybrid_retriever.invoke(query)
```

가중치 0.5:0.5는 출발점일 뿐이다. 고유명사형 질문은 BM25 비중을 높이고, 의미 탐색형 질문은 벡터 검색 비중을 높여 비교할 수 있다. 실제 선택은 대표 질의와 정답 문서를 준비해 평가해야 한다.

## 5. 검색과 생성은 별도로 검증한다

```text
질문
  → BM25 / Vector 검색
  → 결과 결합과 순위 조정
  → 관련 문서 선택
  → 프롬프트 문맥 구성
  → LLM 답변 생성
```

검색 결과가 적절해도 모델 권한·프롬프트·API 호출에서 생성이 실패할 수 있다. 반대로 LLM이 자연스러운 답변을 만들더라도 검색 문서에 없는 내용을 추가할 수 있다. 따라서 다음을 분리해서 확인해야 한다.

1. 정답 문서가 후보에 포함됐는가?
2. 관련 문서의 순위가 충분히 높은가?
3. LLM에 전달한 문맥이 질문과 관련 있는가?
4. 최종 답변의 각 문장이 제공된 근거에 존재하는가?

## 6. 오늘의 확인 상태

- BM25 검색기 구성: 실행 확인
- PGVector 구성과 Hybrid 검색: 저장된 실행 결과 확인
- Hybrid 검색 결과를 프롬프트 문맥으로 결합: 코드 작성
- 최종 LLM 답변 생성: 모델 접근 권한 문제로 미완료
- RRF·Re-ranking·맥락 압축·질의 라우팅: 이후 실행·검증 필요
