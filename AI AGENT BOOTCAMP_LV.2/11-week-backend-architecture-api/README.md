# Week 11 — Backend Architecture & API Design

> 2026-10-26 시작 · LV.2

FastAPI 실행 환경과 HTTP 요청·응답 구조를 익히고, API 계층과 도메인 모델의 책임을 구분하는 주차입니다.

## Learning goals

- FastAPI, Uvicorn, ASGI의 역할 구분
- 동기·비동기와 I/O 대기의 관계 이해
- HTTP 메서드, URI, URL, 엔드포인트 연결
- Path·Query·Body 입력 위치 구분
- 도메인 모델과 API 계층의 책임 분리
- 로그, 상태 코드, Swagger UI를 활용한 오류 추적

## Daily learning log

| Date | Topic | Records |
|---|---|---|
| 2026-10-26 | FastAPI 실행 환경, HTTP 라우팅과 도메인 모델 | [Preview](./2026-10-26/01-preview-notes-01-fastapi-http-routing.md) · [Learning Notes](./2026-10-26/02-learning-notes-01-fastapi-http-routing.md) · [Practice](./2026-10-26/03-practice-01-fastapi-errors.md) · [TIL](./2026-10-26/04-til-01-fastapi-http-routing.md) |
| 2026-10-27 | Pydantic 모델 검증과 FastAPI 요청 흐름 | [Learning Notes](./2026-10-27/02-learning-notes-01-pydantic-fastapi-api-flow.md) · [Practice](./2026-10-27/03-practice-01-fastapi-pydantic-errors.md) · [TIL](./2026-10-27/04-til-01-pydantic-model-validation.md) |
| 2026-10-28 | Path·Query, Jinja2 렌더링과 APIRouter 구조 | [Preview](./2026-10-28/01-preview-notes-01-fastapi-jinja-router.md) · [Learning Notes](./2026-10-28/02-learning-notes-01-fastapi-jinja-router.md) · [Practice](./2026-10-28/03-practice-01-fastapi-jinja-debugging.md) · [TIL](./2026-10-28/04-til-01-fastapi-jinja-router.md) |
| 2026-10-29 | FastAPI Router, 파일 업로드, CORS·Middleware와 오류 추적 | [Preview](./2026-10-29/01-preview-notes-01-router-middleware-background-streaming.md) · [1029 개념 정리](./2026-10-29/1029개념정리.md) · [TIL](./2026-10-29/04-til-01-fastapi-router-dependency-middleware.md) |

## Evidence boundary

- Hello World 엔드포인트가 Swagger UI에 표시된 것은 확인했습니다.
- 도서 등록 엔드포인트와 도메인 모델은 작성했으며, 최신 코드는 정적으로 확인했습니다.
- 도서 등록의 201 응답, 인메모리 저장과 조회는 아직 실행으로 검증하지 않았습니다.
- 2026-10-28 작성한 FastAPI·Router 파일은 Python 문법 검사를 통과했고 템플릿 경로도 확인했습니다.
- Jinja2 화면과 주문 Router의 최종 HTTP 응답은 서버를 다시 실행해 검증해야 합니다.
- 2026-10-29 점검한 메인 앱과 두 Router 파일은 Python 문법 검사를 통과했습니다.
- 파일 업로드, 브라우저 preflight와 미들웨어 실행 순서는 실제 서버에서 추가 검증이 필요합니다.

[← Level 2 curriculum](../README.md)
