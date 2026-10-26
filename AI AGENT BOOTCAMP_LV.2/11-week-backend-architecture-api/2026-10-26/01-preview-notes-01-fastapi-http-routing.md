# Preview Notes | 2026-10-26 | FastAPI와 HTTP 라우팅

## 학습 범위

- 백엔드 아키텍처 & API 설계 1장 전체
- FastAPI 개요 및 환경 설정
- HTTP 메서드와 기본 라우팅

## 학습 목표

- FastAPI, Uvicorn, ASGI가 맡는 역할을 구분한다.
- 동기·비동기 처리와 I/O 대기의 관계를 이해한다.
- `uv` 프로젝트에서 FastAPI 개발 서버를 실행하는 명령을 읽는다.
- 로그 레벨과 서버 로그가 필요한 이유를 이해한다.
- REST 관점에서 URL과 HTTP 메서드의 역할을 구분한다.
- Path·Query·Body 입력을 목적에 맞게 나눈다.
- API 진입점과 도메인 모델의 책임을 구분한다.

## 전체 구조

```text
클라이언트가 HTTP 요청 전송
→ Uvicorn이 네트워크 요청 수신
→ FastAPI가 메서드와 경로에 맞는 함수 선택
→ Path·Query·Body 입력 해석
→ 도메인 모델이 업무 규칙 검증
→ 상태 코드와 JSON 응답 반환
```

## 선행 개념

- Python 함수, 클래스, 딕셔너리
- 함수 호출과 반환값, 예외 처리
- 가상환경과 패키지 의존성
- HTTP 요청·응답, URL, JSON
- CRUD: Create, Read, Update, Delete
- `async`·`await`와 I/O 대기

## 핵심 용어

| 용어 | 의미 |
|---|---|
| FastAPI | HTTP 요청과 Python 함수를 연결하는 웹 프레임워크 |
| Uvicorn | FastAPI 애플리케이션을 실행하는 ASGI 서버 |
| ASGI | 비동기 Python 서버와 애플리케이션 사이의 통신 규격 |
| Endpoint | HTTP 메서드와 경로가 연결된 요청 처리 지점 |
| Routing | 요청을 알맞은 함수로 연결하는 과정 |
| Path | 특정 리소스를 식별하는 URL 경로 값 |
| Query | 검색·필터·정렬 조건을 전달하는 값 |
| Body | 생성·수정할 구조화 데이터를 담는 요청 본문 |
| Domain Model | 업무 데이터와 업무 규칙을 함께 표현한 객체 |

## 예상 난점

- FastAPI와 Uvicorn을 같은 프로그램으로 생각하기 쉽다.
- 비동기 동시성을 CPU 병렬 처리와 혼동할 수 있다.
- `uv`와 `uvicorn`의 역할을 이름 때문에 섞기 쉽다.
- `localhost`, IP, 포트를 하나의 서버 이름으로 생각하기 쉽다.
- HTTP 메서드의 목적과 Path·Query·Body의 입력 위치를 혼동할 수 있다.
- API 입력 검증과 도메인 업무 규칙을 한 계층에 몰아넣기 쉽다.

## 예정 실습

1. FastAPI와 Uvicorn 의존성을 추가한다.
2. `GET /` 엔드포인트와 INFO 로그를 작성한다.
3. 개발 서버를 실행하고 Swagger UI와 JSON 응답을 확인한다.
4. 도서 상태와 대출 규칙을 가진 `Book` 도메인 모델을 작성한다.
5. `POST /books` 엔드포인트에서 요청 본문과 상태 코드를 처리한다.
6. cURL 또는 Swagger UI로 도서 생성 요청을 확인한다.

## 수업에서 확인할 질문

1. FastAPI와 Uvicorn은 요청 처리 과정에서 각각 어디까지 책임지는가?
2. `async def` 안에서 동기 I/O를 실행하면 어떤 문제가 생기는가?
3. 애플리케이션 로그와 Uvicorn 접근 로그는 어떻게 다른가?
4. URL, URI, 엔드포인트는 어떤 관계인가?
5. 입력 형식 검증과 도메인 업무 규칙 검증은 어디에 배치하는가?
