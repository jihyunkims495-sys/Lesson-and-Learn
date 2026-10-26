# Learning Notes | 2026-10-26 | FastAPI와 HTTP 라우팅

## 1. 백엔드 요청 처리 흐름

```text
브라우저 또는 API 클라이언트
→ IP와 포트로 서버에 접속
→ Uvicorn이 HTTP 요청을 수신
→ FastAPI가 메서드와 경로에 맞는 함수 선택
→ Path·Query·Body 입력 해석
→ 도메인 모델이 업무 규칙 검증
→ 상태 코드와 JSON 응답 반환
```

- FastAPI: 경로·HTTP 메서드와 Python 함수를 연결하는 웹 프레임워크
- Uvicorn: 네트워크 요청을 받아 FastAPI 애플리케이션을 실행하는 ASGI 서버
- ASGI: 서버와 비동기 Python 웹 애플리케이션 사이의 통신 규격

## 2. Uvicorn 실행 명령

```powershell
uv run uvicorn main:app --app-dir src --reload
```

| 부분 | 의미 |
|---|---|
| `uv run` | 프로젝트 가상환경에서 명령 실행 |
| `uvicorn` | ASGI 서버 실행 |
| `main:app` | `main.py`의 `app` 객체 사용 |
| `--app-dir src` | 모듈을 찾을 기준 폴더 지정 |
| `--reload` | 파일 변경 시 개발 서버 자동 재시작 |

## 3. 서버, IP, 포트

- 서버: 요청을 기다렸다가 기능과 데이터를 응답하는 프로그램
- IP: 네트워크에서 컴퓨터를 찾기 위한 주소
- `localhost`와 `127.0.0.1`: 현재 컴퓨터를 가리키는 이름과 주소
- 포트: 같은 컴퓨터 안에서 접속할 프로그램을 구분하는 번호

```text
127.0.0.1:8000 → 8000번에서 대기하는 서버
127.0.0.1:8001 → 8001번에서 대기하는 다른 서버
localhost:3000  → 3000번에서 대기하는 프론트엔드 개발 서버
```

## 4. 동기·비동기와 I/O 바운드

I/O 바운드는 CPU 계산보다 데이터베이스, 파일, 네트워크 응답을 기다리는 시간이 더 큰 작업이다.

```text
요청 A가 DB 응답을 기다림
→ await에서 제어권 반환
→ 이벤트 루프가 요청 B 처리
→ 요청 A의 결과가 도착하면 다시 실행
```

비동기는 대기 시간을 활용해 여러 요청을 번갈아 처리하는 동시성에 유리하다. CPU가 계속 계산하는 작업을 `async`만으로 빠르게 만들지는 못한다.

## 5. 로깅

| 레벨 | 의미 |
|---|---|
| DEBUG | 상세한 디버깅 정보 |
| INFO | 정상적인 주요 처리 흐름 |
| WARNING | 실패는 아니지만 점검이 필요한 상황 |
| ERROR | 일부 요청이나 기능의 실패 |
| CRITICAL | 서비스 운영이 어려운 심각한 장애 |

```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")
logger.info("요청 처리 시작")
```

## 6. HTTP 메서드와 REST

| 메서드 | 대표 목적 | 요청 Body |
|---|---|---|
| GET | 조회 | 일반적으로 사용하지 않음 |
| POST | 생성 | 주로 사용 |
| PUT | 전체 교체 | 주로 사용 |
| PATCH | 부분 수정 | 주로 사용 |
| DELETE | 삭제 | 일반적으로 사용하지 않음 |

DELETE는 GET의 일종이 아니다. REST는 리소스를 URI로 식별하고 HTTP 메서드로 행동을 표현하는 아키텍처 스타일이다.

```text
GET    /books       → 목록 조회
POST   /books       → 도서 생성
GET    /books/1     → 1번 도서 조회
PUT    /books/1     → 전체 교체
PATCH  /books/1     → 일부 수정
DELETE /books/1     → 삭제
```

FastAPI가 곧 REST인 것은 아니며, FastAPI를 사용해 REST 방식의 API를 구현할 수 있다.

## 7. URI, URL, 엔드포인트와 입력 위치

- URI: 리소스를 식별하는 표현
- URL: 리소스의 위치와 접근 방법까지 나타내는 URI
- API 엔드포인트: HTTP 메서드와 경로가 연결된 요청 처리 지점

| 입력 | 예시 | 목적 |
|---|---|---|
| Path | `/books/1` | 특정 리소스 식별 |
| Query | `/books?status=AVAILABLE` | 검색·필터·정렬 |
| Body | `{"title":"Python"}` | 생성·수정 데이터 |

`Body(...)`는 값을 요청 본문에서 읽도록 표시하고, `Content-Type: application/json`은 본문 형식을 알린다.

## 8. 도메인 모델과 아키텍처

```text
API 계층 → HTTP 요청·응답과 상태 코드
도메인 계층 → 도서 상태와 대출·반납 규칙
저장 계층 → 데이터 저장과 조회
```

순수 도메인 모델은 FastAPI나 데이터베이스 라이브러리에 직접 의존하지 않고 업무 규칙을 표현한다. `@classmethod`를 사용한 `Book.create(...)`는 유효성 검사와 객체 생성 절차를 클래스에 묶을 수 있다.

## 9. 함께 구분한 도구

- Jinja2: 서버 데이터를 HTML 템플릿에 넣어 렌더링하는 템플릿 엔진
- SQLAlchemy: Python 코드와 관계형 데이터베이스를 연결하는 SQL 툴킷·ORM

```text
Uvicorn → 애플리케이션 실행
FastAPI → HTTP 요청 처리
SQLAlchemy → 데이터베이스 저장·조회
Jinja2 → HTML 렌더링
```

## 10. 구현 상태

- Hello World 앱이 Swagger UI에 표시된 것은 확인했다.
- 도서 앱에는 `POST /books`와 `Book` 도메인 모델을 작성했다.
- 도서 앱의 정상 시작과 POST 201 응답은 아직 재실행으로 확인하지 않았다.
- `Book.validate()`와 `in_memory_db` 저장 연결은 미완료다.

## 한 문장 정리

> Uvicorn이 요청을 받아 FastAPI에 전달하면 라우터가 메서드와 경로로 함수를 선택하고, 도메인 모델이 업무 규칙을 검사한 뒤 상태 코드와 JSON으로 응답한다.
