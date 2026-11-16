# TIL | 2026-11-16 | RAG 파이프라인과 PGVector 인덱싱

- Level: LV.2
- 주차: Week 14
- 학습 범위: RAG 파이프라인 설계 1~2강 전체

> **RAG 1~2강을 통해 문서 검색부터 벡터 저장, 증분 인덱싱까지의 흐름을 코드로 연결했다.**

> RAG는 웹 검색 기능 하나가 아니라, 연결된 자료에서 근거를 찾고 그 근거를 LLM의 답변 문맥으로 사용하는 전체 파이프라인이다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- RAG는 Retrieve → Augment → Generate 순서로 외부 지식을 답변에 연결한다.
- 청킹은 긴 문서를 검색 단위로 나누는 과정이며, 청크 크기와 겹침은 검색 품질에 영향을 준다.
- 임베딩은 텍스트 의미를 벡터로 바꾸고, 벡터 저장소는 질문과 가까운 청크를 찾는다.
- PGVector는 PostgreSQL에서 벡터·원문·메타데이터를 함께 관리한다.
- Record Manager는 문서 출처별 상태를 추적해 중복 저장과 변경 문서 갱신을 돕는다.

### 핵심 코드

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

### 오늘 수행한 실습

- 임베딩 결과를 파일 캐시에 저장하고 같은 청크의 임베딩을 재사용했다.
- Docker Compose로 pgvector PostgreSQL 환경을 구성했다.
- 문서 청크를 PGVector에 저장하고 유사도 검색 및 점수 확인을 수행했다.
- 문서 메타데이터를 저장하고 범주·연도 조건으로 검색 결과를 제한했다.
- Record Manager와 PGVector를 연결하는 증분 인덱싱 코드를 작성했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드: 임베딩 캐시, PGVector 저장·검색, 메타데이터 필터, 증분 인덱싱
검증 방법: 저장된 노트북 확인, 코드 셀 정적 컴파일, PostgreSQL 스키마와 컬렉션 조회
확인한 결과: vector 확장과 LangChain PGVector 테이블 및 컬렉션 생성
미완료: 증분 인덱싱 전체 재실행 후 추적 레코드와 벡터 변경 상태 비교
```

---

## 2. Why — 왜 필요한가?

LLM 내부 지식만 사용하면 최신 정보나 비공개 업무 자료를 알기 어렵고, 모르는 내용을 그럴듯하게 만들 수 있다. RAG는 질문에 필요한 근거를 먼저 찾고 답변 입력에 추가해 이런 한계를 줄인다.

문서가 많아지면 매번 전체 문서를 프롬프트에 넣을 수 없다. 청킹과 임베딩 검색을 이용하면 질문과 가까운 부분만 골라 제공할 수 있고, 메타데이터 필터를 함께 사용하면 검색 범위를 더 정확하게 제한할 수 있다.

### 내 생각

처음에는 RAG가 Python으로 웹을 검색하는 기능이라고 생각했지만, 실제로는 웹·로컬 문서·사내 데이터처럼 접근 가능한 여러 자료를 검색 단계에 연결하는 설계라는 점을 알게 됐다. 검색 결과를 얻는 것만으로 끝나는 것이 아니라, 그 결과를 LLM 문맥에 넣고 근거를 지키게 하는 생성 단계까지 포함해야 RAG가 완성된다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 원본 문서를 읽고 검색 가능한 청크로 나눈다.
2. 각 청크를 임베딩 벡터로 변환해 원문·메타데이터와 함께 저장한다.
3. 질문을 임베딩하고 의미가 가까운 청크를 검색한다.
4. 검색된 청크를 질문과 함께 프롬프트 문맥에 넣는다.
5. LLM이 제공된 근거를 사용해 답변을 생성한다.

### 내 말로 설명하기

RAG는 LLM에게 모든 자료를 외우게 하는 대신, 질문이 들어오면 필요한 자료를 찾아서 펼쳐 주는 방식이다. 청킹은 책에 붙이는 작은 색인 단위이고, 임베딩은 질문과 자료가 의미상 얼마나 가까운지 비교하기 위한 숫자 표현이다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- LangChain import에서 `ModuleNotFoundError`가 발생했다.
- PostgreSQL 연결 과정에서 인증 정보가 없다는 `OperationalError`가 발생했다.
- `SQLRecordManager`와 `index()` 호출에서 지원하지 않는 키워드 인자 오류가 발생했다.

### 문제의 원인

- 모듈과 클래스 이름의 철자 오류가 있었다.
- PostgreSQL 연동 패키지와 접속 설정이 완성되지 않았다.
- 현재 설치된 LangChain 버전의 함수 시그니처와 예제 코드가 달랐다.

### 해결한 코드

```python
from langchain_openai import OpenAIEmbeddings

record_manager = SQLRecordManager(
    namespace="university_rules",
    db_url=connection_url,
)

result = index(
    docs_source=initial_documents,
    record_manager=record_manager,
    vector_store=vector_store,
    source_id_key="source",
    cleanup="incremental",
)
```

### 해결 원리

오류 메시지를 그대로 고치기보다 현재 가상환경에 설치된 클래스와 함수의 실제 시그니처를 확인했다. 그 결과 `table_name`은 지원되지 않고 문서 입력 인자명은 `docs_source`라는 것을 확인해 현재 버전에 맞게 수정했다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오류의 마지막 줄만 보지 않고 import, 패키지 설치, 환경 변수, DB 연결, 함수 호출 단계로 나눠 확인한다.
- DBeaver 화면만 보지 않고 실제 데이터베이스 스키마 조회 결과와 함께 판단한다.

### Problem — 개선할 것

- 비슷한 철자의 클래스와 매개변수 이름을 입력할 때 오타가 반복됐다.
- 라이브러리 버전에 따라 예제와 실제 API가 달라질 수 있다는 점을 처음부터 확인하지 못했다.

### Try — 다음에 시도할 것

- 코드를 작성하기 전에 import 가능 여부와 함수 시그니처를 먼저 확인한다.
- 작은 문서 두 개로 incremental cleanup 전후의 레코드 변화를 직접 비교한다.

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

1. `cleanup=None`, `incremental`, `full`의 차이를 실제 레코드 변화로 비교한다.
2. Record Manager의 추적 테이블과 PGVector 임베딩 테이블의 역할을 구분한다.
3. 검색 결과를 프롬프트와 LLM에 연결해 전체 RAG 응답 흐름을 완성한다.
