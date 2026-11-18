# Practice | 2026-11-18 | Re-ranking·Contextual Compression

> LV.2 / Week 14 · RAG 검색 후보 정제 실습

## 실습 목표

1. BM25가 찾은 후보를 Cross-Encoder로 다시 평가한다.
2. 1차 후보 수와 Re-ranking 후 최종 문서 수를 구분한다.
3. LLM 기반 문맥 압축 전후의 문서 내용을 비교한다.
4. 노트북 환경·의존성·Python 상태 오류를 단계별로 해결한다.

## 1. Cross-Encoder Re-ranking

### 구성

```python
base_retriever.k = 3

reranker = CrossEncoderReranker(
    model=cross_encoder_model,
    top_n=2,
)

rerank_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=base_retriever,
)
```
### 확인한 결과

로그인 실패와 계정 잠금 처리 방법을 우회적으로 묻는 질의를 사용했다.

```text
BM25 후보
1. 로그인 실패 시 계정 잠금과 해제 절차
2. 신규 입사자 장비 지급 규정
3. 원격 근무와 VPN 접속 규정

Re-ranking 후
1. 로그인 실패 시 계정 잠금과 해제 절차
2. 원격 근무와 VPN 접속 규정
```

정답 문서는 1위를 유지했고, 질문과 관련성이 낮은 장비 지급 문서는 제거됐다. 이 결과는 현재 예제 질의와 문서 집합에서 확인한 것이며, 모든 질의에서 같은 품질을 보장하지는 않는다.

## 2. LLM 기반 Contextual Compression

### 구성

```python
compressor = LLMChainExtractor.from_llm(model)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever,
)
```

### 확인한 결과

잔여 복지 포인트의 다음 해 이월 여부를 묻는 질의를 사용했다.

```text
BM25
1. 복지 포인트의 지급·사용·소멸 규정
2. 회의실 예약과 점심시간 안내

Compression
1. 복지 포인트의 지급·사용·소멸 규정
```

질문과 무관한 근무 환경 문서가 제거됐고, 관련 문서만 남았다. 관련 문서 자체가 짧았기 때문에 본문은 압축 전후에 동일했다.

## 3. 오류 해결

### 오류 1 — Cross-Encoder 의존성 누락

```text
ModuleNotFoundError: No module named 'sentence_transformers'
```

Cross-Encoder 래퍼가 내부에서 `sentence_transformers`를 필요로 하지만 선택된 프로젝트 환경에 패키지가 없었다. 패키지를 프로젝트 가상환경에 설치하고 같은 환경을 노트북 커널로 선택한 뒤 모델 가중치 로딩을 확인했다.

### 오류 2 — `print` 내장 함수 덮어쓰기

```python
print = "=== BM25 ==="
```

문자열을 `print`라는 변수에 대입해 내장 함수를 가렸다. 이후 `print(...)` 호출이 문자열을 함수처럼 호출하면서 오류가 발생했다.

```text
TypeError: 'str' object is not callable
```

변수를 삭제하거나 커널을 재시작하고, 대입문 대신 함수 호출을 사용했다.

```python
del print
print("=== BM25 ===")
```

Compression 결과 반복문도 `bm25_docs`가 아닌 `com_docs`를 순회하도록 수정한 뒤 최종 출력을 확인했다.

### 오류 3 — 모델 프로젝트 권한

질문 재작성 체인은 모델 호출 단계까지 도달했지만 지정 모델에 대한 현재 API 프로젝트 권한이 없어 403으로 거절됐다. 프롬프트나 체인 문법 오류가 아니라 모델 접근 권한 문제였다.

저장된 최종 노트북에서는 접근 가능한 모델로 Query Rewrite·HyDE·Routing 실행 결과를 확인했다. 특정 모델을 사용할 때는 프로젝트별 모델 사용 권한과 현재 커널에 적용된 키를 먼저 확인해야 한다.

## 4. 경고와 남은 확인

- 검색 모듈의 유지보수 종료 예정 경고가 있어 향후 공식 마이그레이션 경로 확인이 필요하다.
- Windows에서 모델 캐시의 심볼릭 링크를 사용하지 못해 캐시는 동작하지만 저장 공간을 더 사용할 수 있다는 경고가 발생했다.
- Notebook 진행률 위젯 경고는 모델 로딩 실패가 아니며, 실제 가중치 로딩은 완료됐다.
- 다양한 질의 집합에 대한 Re-ranking·Compression 품질 비교는 아직 수행하지 않았다.

## 검증 결과

```text
질문 재작성·HyDE·Routing: 저장된 실행 결과 확인
Cross-Encoder 모델 로딩: 성공
BM25 후보 검색: 성공
Re-ranking: 상위 2건 출력 확인
Contextual Compression: 관련 문서 1건 출력 확인
오류 수정 후 최종 셀: 실행 출력 확인
5장 6강 별도 실습: 근거 없음
이해도 평가: 미실시
```
