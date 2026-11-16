# RAG PGVector와 증분 인덱싱 실습

- 학습 날짜: 2026-11-16
- Level: LV.2
- 주차: Week 14
- 과정: RAG 파이프라인 설계
- 범위: 1~2강 전체

## 수행 항목

1. `CacheBackedEmbeddings`와 로컬 저장소를 연결해 동일 문서 임베딩을 재사용했다.
2. Docker Compose로 pgvector PostgreSQL을 준비하고 컨테이너 이름 충돌을 해결했다.
3. `PGVector` 컬렉션을 만들고 텍스트와 고유 ID를 저장했다.
4. 유사도 검색과 점수 포함 검색을 수행했다.
5. `Document` 메타데이터를 저장하고 범주·연도 필터를 적용했다.
6. `SQLRecordManager`와 `index()`를 사용해 출처 기반 증분 인덱싱 코드를 작성했다.

## 핵심 수정

```python
from langchain_classic.embeddings import CacheBackedEmbeddings
from langchain_openai import OpenAIEmbeddings

embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
```

```python
from langchain_classic.indexes import SQLRecordManager, index

record_manager = SQLRecordManager(
    namespace="university_rules",
    db_url=connection_url,
)
record_manager.create_schema()

result = index(
    docs_source=initial_documents,
    record_manager=record_manager,
    vector_store=vector_store,
    source_id_key="source",
    cleanup="incremental",
)
```

## 오류 해결 요약

- 패키지·클래스 이름의 철자 오류를 실제 설치된 import 경로에 맞게 수정했다.
- 누락된 PostgreSQL 연동 패키지를 의존성에 추가했다.
- 불완전한 데이터베이스 접속 설정을 수정했다.
- 기존 PostgreSQL 컨테이너와 새 Compose 컨테이너의 이름 충돌을 해소했다.
- 설치된 LangChain 버전의 함수 시그니처를 확인해 지원되지 않는 `table_name`과 `documents` 인자를 수정했다.

## 확인된 결과와 미확인 항목

- 확인: PostgreSQL의 vector 확장, LangChain PGVector 테이블, `library_rules` 컬렉션.
- 확인: 노트북 코드 셀 정적 컴파일.
- 미확인: 증분 인덱싱 전체 재실행 후 `upsertion_record`와 벡터 데이터의 최종 상태.

## 추가 개념 확인

- PostgreSQL에서 임베딩 벡터 타입과 유사도 검색을 사용하려면 pgvector의 `vector` 확장을 활성화한다.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

- 벡터 검색만 사용하면 의미는 비슷하지만 정확한 키워드·숫자·날짜·식별자가 다른 문서를 가져오거나 필요한 문서를 놓칠 수 있다.
- 정확한 키워드 검색이 필요한 경우 벡터 검색과 키워드 검색을 결합한 하이브리드 검색이나 재정렬을 함께 고려한다.
