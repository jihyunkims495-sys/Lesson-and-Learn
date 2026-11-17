# Week 14 — RAG Pipeline Design

> 2026-11-16 시작 · LV.2

외부 자료를 검색해 LLM의 답변 근거로 사용하는 RAG 파이프라인과 벡터·키워드 검색 흐름을 학습하는 주차입니다.

## Learning goals

- RAG와 일반 웹 검색의 차이 이해
- 문서 수집·청킹·임베딩·검색·생성의 연결 구조 이해
- 임베딩 캐시와 벡터 저장소의 역할 구분
- PostgreSQL과 pgvector를 이용한 문서 저장·유사도 검색
- 메타데이터 필터와 출처 기반 증분 인덱싱 이해
- Retriever의 Top-k와 관련도 임계값 구분
- BM25와 벡터 검색을 결합한 Hybrid Search 이해
- 라이브러리 버전과 함수 시그니처를 확인하는 오류 분석 습관

## Daily learning log

| Date | Topic | Records |
|---|---|---|
| 2026-11-16 | RAG 파이프라인, PGVector와 증분 인덱싱 | [Preview](./2026-11-16/01-preview-notes-01-rag-concepts-pipeline.md) · [Practice](./2026-11-16/03-practice-01-rag-pgvector-indexing.md) · [TIL](./2026-11-16/04-til-01-rag-pipeline-pgvector.md) |
| 2026-11-17 | Retriever 임계값, BM25·PGVector·Hybrid Search | [Learning Notes](./2026-11-17/02-learning-notes-01-retriever-hybrid-search.md) · [Practice](./2026-11-17/03-practice-01-bm25-pgvector-hybrid.md) · [TIL](./2026-11-17/04-til-01-retrieval-hybrid-search.md) |

[← Level 2 curriculum](../README.md)
