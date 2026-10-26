# TIL | 2026-10-26 | FastAPI와 HTTP 라우팅

> **Uvicorn이 실행한 FastAPI 앱에서 HTTP 요청이 엔드포인트와 도메인 모델로 이어지는 흐름을 학습했다.**

> 서버·IP·포트·HTTP 메서드는 클라이언트 요청이 올바른 프로그램과 함수에 도착하게 만드는 하나의 연결 구조다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- FastAPI는 HTTP 요청을 Python 함수와 연결하는 웹 프레임워크이고, Uvicorn은 애플리케이션을 실행하는 ASGI 서버다.
- `localhost`와 `127.0.0.1`은 현재 컴퓨터를 가리키며 포트 번호가 실행 중인 서버 프로그램을 구분한다.
- REST에서는 URI로 리소스를 식별하고 GET·POST·PUT·PATCH·DELETE로 행동을 표현한다.
- Body, Path, Query는 요청 데이터를 전달하는 위치와 목적이 다르다.
- 도메인 모델은 데이터와 함께 허용 상태와 행동 규칙을 표현한다.
- 비동기는 데이터베이스나 네트워크 같은 I/O 대기 중 다른 요청을 처리하는 데 유리하다.
- 로그 레벨은 DEBUG, INFO, WARNING, ERROR, CRITICAL 순으로 중요도를 구분한다.

### 핵심 코드

```python
import logging
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI()

@app.get("/")
async def hello_world() -> dict:
    logger.info("로깅 연습, hello world!")
    return {"message": "Hello World"}
```

```python
@app.post("/books", status_code=status.HTTP_201_CREATED)
async def create_book(
    title: str = Body(..., description="등록할 책의 이름"),
    author: str = Body(..., description="등록할 책의 저자"),
):
    new_book = Book.create(id_generator, title, author, "AVAILABLE")
    return new_book.to_dict()
```

### 오늘 수행한 실습

- FastAPI Hello World 엔드포인트와 INFO 로그를 작성했다.
- Uvicorn 실행 명령으로 `src/main.py`의 `app` 객체를 불러오는 구조를 확인했다.
- Swagger UI에서 Hello World 엔드포인트가 표시되는 것을 확인했다.
- 도서 등록을 위한 `POST /books` 엔드포인트와 `Book` 도메인 모델을 작성했다.
- 상태 코드 import, 실행 중인 앱과 포트, PowerShell cURL 문법 오류를 분석했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드:
- GET /와 로깅 설정
- POST /books와 요청 Body
- Book 생성, 상태 검증, 대여·반납, 딕셔너리 변환

검증 방법:
- 실행 로그와 Swagger UI 확인
- 최신 소스 정적 확인

확인한 결과:
- Hello World 앱의 Swagger UI 표시
- 대문자 Status import 오류를 소문자 status로 수정
- 잘못 실행된 앱과 포트를 Swagger 문서 내용으로 구분

미완료:
- Book.validate() 정의
- 생성한 도서의 in_memory_db 저장
- POST /books의 실제 201 응답
- 최신 코드의 서버 재실행 검증
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- Uvicorn과 FastAPI의 역할을 구분해야 서버 시작 오류와 라우팅 오류를 다른 단계에서 찾을 수 있다.
- HTTP 메서드와 경로를 일관되게 설계하면 클라이언트와 서버가 요청 의도를 공통으로 이해할 수 있다.
- 도메인 규칙을 라우터와 분리하면 같은 규칙을 다른 API나 저장 방식에서도 재사용할 수 있다.
- 로그와 상태 코드를 사용하면 브라우저 화면만으로 알기 어려운 처리 결과를 추적할 수 있다.

### 내 생각

> `127.0.0.1:8000`은 서버 자체의 이름이 아니라 내 컴퓨터의 8000번 포트에서 기다리는 프로그램으로 가는 주소다. 같은 FastAPI 코드라도 어떤 앱 객체를 어떤 포트로 실행했는지에 따라 Swagger UI에 보이는 API가 달라진다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. Uvicorn이 지정된 모듈에서 FastAPI `app` 객체를 불러온다.
2. 클라이언트가 IP와 포트로 HTTP 요청을 전송한다.
3. FastAPI가 HTTP 메서드와 경로에 맞는 엔드포인트를 찾는다.
4. Path·Query·Body에서 입력을 읽는다.
5. 도메인 모델이 도서 상태와 필수값 같은 업무 규칙을 검사한다.
6. 처리 결과를 상태 코드와 JSON으로 반환한다.

### 내 말로 설명하기

> Uvicorn은 문을 열어 요청을 받아 주는 서버이고, FastAPI는 들어온 요청을 주소와 메서드에 맞는 함수로 안내한다. `Book` 도메인 모델은 그 함수 안에서 도서의 상태와 대출 규칙이 올바른지 판단한다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: 도서 앱을 실행하고 `POST /books`를 테스트하기
- 발생한 문제: FastAPI 앱 import 실패, 이전 앱의 Swagger UI 표시, PowerShell cURL 문법 오류

```text
ImportError: cannot import name 'Status' from 'fastapi'
Did you mean: 'status'?
```

### 문제가 발생한 코드

```python
from fastapi import FastAPI, Body, Status, HTTPException
```

### 문제의 원인

- FastAPI의 상태 코드 모듈 이름은 대문자 `Status`가 아니라 소문자 `status`다.
- 8000번에서는 이전 Hello World 앱이 실행되어 도서 앱 문서와 혼동됐다.
- PowerShell의 `curl`과 Bash의 역슬래시 문법을 그대로 사용해 HTTP 요청 전에 셸 해석 오류가 발생했다.

### 해결한 코드

```python
from fastapi import FastAPI, Body, status, HTTPException
```

```powershell
curl.exe -i -X POST "http://127.0.0.1:8000/books" -H "Content-Type: application/json" -d '{"title":"쉽게 배우는 파이썬 백엔드","author":"스파르타 튜터"}'
```

### 해결 원리

> 오류가 발생한 단계를 셸 명령 해석, 서버의 앱 import, 엔드포인트 실행으로 나누면 원인을 구분할 수 있다. 현재는 import 이름과 실행 앱 구분까지 확인했지만 도서 POST 성공은 아직 검증하지 않았다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 오류 메시지, 실행 명령, Swagger UI를 함께 비교해 어느 단계에서 실패했는지 확인했다.
- 계속 유지할 학습 방법: 새로운 용어를 실제 요청 흐름 안에서 연결해 이해한다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 서버·IP·포트의 관계와 동시에 실행된 여러 FastAPI 앱의 구분
- 반복해서 실수한 부분: Python 식별자의 대소문자와 터미널별 명령 문법
- 아직 설명하기 어려운 부분: `async`·`await`가 실제 비동기 데이터베이스 작업과 연결되는 방식

### Try — 다음에 시도할 것

- `Book.validate()`의 책임을 정리하고 도서 등록 요청을 다시 실행한다.
- 도서를 인메모리 저장소에 넣은 뒤 POST와 GET의 연결을 확인한다.
- 요청 하나를 Method·URL·Body·Status Code 순서로 직접 추적한다.

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

1. `Book.validate()`와 기존 검증 로직의 중복을 정리한다.
2. `in_memory_db` 저장과 도서 조회 엔드포인트를 연결한다.
3. 최신 도서 앱의 Swagger UI와 `POST /books` 201 응답을 실제 확인한다.
