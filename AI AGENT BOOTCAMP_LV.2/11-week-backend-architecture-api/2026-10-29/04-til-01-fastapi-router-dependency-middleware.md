# TIL | 2026-10-29 | FastAPI 요청 흐름, 파일 업로드와 CORS

> LV.2 · Week 11

> **FastAPI 요청은 정적 자원·Form 인코딩·CORS·미들웨어·라우터·검증 계층을 거치므로 각 단계의 책임을 구분해야 오류 위치를 찾을 수 있다.**

> 오늘은 URL만 보던 관점에서 벗어나 정적 파일, multipart Body, Origin, Pydantic 검증과 서버 내부 실행 흐름을 함께 추적했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- FastAPI는 Python으로 Web API를 구현하는 프레임워크이고, REST는 리소스와 HTTP 규칙을 중심으로 API를 설계하는 방식이다.
- endpoint는 URL 하나가 아니라 `HTTP Method + Path`의 조합으로 구분된다.
- `APIRouter`는 관련 endpoint를 기능별로 묶고, `app.include_router()`가 이를 메인 애플리케이션에 등록한다.
- Router-level Dependency는 해당 router 전체에 공통 검사를 적용하고, 매개변수 Dependency는 특정 endpoint에서 실행 결과를 주입한다.
- Middleware는 요청 전처리와 응답 후처리를 감싸며, 마지막에 추가한 사용자 미들웨어가 요청에서 가장 먼저 실행된다.
- `TrustedHostMiddleware`는 접속자의 IP가 아니라 HTTP `Host` 헤더를 검사한다.
- FastAPI의 자동 문서는 `/openapi.json`을 기반으로 `/docs`와 `/redoc`에서 API 계약을 보여준다.
- Next.js의 `public`과 FastAPI의 `StaticFiles`는 이미지·CSS 같은 정적 자원을 URL로 제공한다.
- 파일 업로드 Form은 `multipart/form-data`로 텍스트 필드와 파일 bytes를 서로 다른 part에 담는다.
- `python-multipart`는 FastAPI가 이 multipart Body를 해석할 때 사용하고, `UploadFile`은 파일 데이터와 메타데이터를 제공한다.
- 표현 계층은 HTTP 요청·응답을 애플리케이션 로직과 연결하는 경계이며 router와 Schema가 여기에 포함될 수 있다.
- Pydantic은 선언된 타입과 제약조건을 검증하지만 주문 상태 전이·소유권 같은 업무 규칙을 자동으로 판단하지 않는다.
- CORS의 Origin은 프로토콜·도메인·포트 조합이고, preflight는 필요한 교차 출처 요청에서 `OPTIONS`로 허용 여부를 먼저 확인한다.
- VPN은 네트워크 트래픽의 경로와 외부에 보이는 IP를 바꾸는 기술이며 CORS나 애플리케이션 인증과는 다른 계층이다.

### 핵심 코드

```python
from fastapi import APIRouter, Depends, Header, HTTPException


def verify_request(x_token: str | None = Header(None)):
    if x_token is None:
        raise HTTPException(status_code=403, detail="요청을 확인할 수 없습니다.")


router = APIRouter(
    prefix="/v1/order",
    tags=["주문"],
    dependencies=[Depends(verify_request)],
)


def load_context() -> str:
    return "order-context"


@router.get("")
async def get_orders(context: str = Depends(load_context)):
    return {"context": context, "orders": []}
```

```python
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.post("/file")
async def upload_file(file: UploadFile):
    content = await file.read()
    return {"filename": file.filename, "size": len(content)}
```

```html
<form action="/file" method="post" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">업로드</button>
</form>
```

### 오늘 수행한 실습

- 주문과 게시판 기능을 각각 APIRouter로 분리하고 메인 FastAPI 앱에 등록하는 구조를 확인했다.
- Router-level Dependency와 endpoint 매개변수 Dependency의 실행 범위와 반환값 사용 차이를 비교했다.
- 커스텀 미들웨어 두 개의 요청·응답 로그 순서를 코드에서 추적했다.
- Jinja2 템플릿 오류, route 오타, HTTP Method 불일치와 빈 응답의 원인을 구분했다.
- 메인 앱과 router 코드의 Python 문법을 정적으로 검사했다.
- Next.js `public`과 Jinja2에서 사용하는 static 자원의 제공 경로를 비교했다.
- `multipart/form-data`, `python-multipart`, `UploadFile`이 연결되는 파일 업로드 흐름을 정리했다.
- CORS Origin, 단순 요청, preflight와 VPN의 역할 차이를 구분했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드: 주문·게시판 APIRouter, Header Dependency, custom middleware, TrustedHost 설정, 파일 Form 구조
검증 방법: 코드 흐름 추적, Python AST 문법 검사, 공식 동작과 설정 비교
확인한 결과: 점검한 메인 앱과 두 router 파일의 문법 검사 통과
미완료: 실제 파일 업로드, 브라우저 OPTIONS 요청, FastAPI 앱 import, Uvicorn 실행과 미들웨어 로그 확인
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 기능이 많아질수록 모든 endpoint를 하나의 파일에 두면 경로, 검증과 처리 책임을 찾기 어렵다.
- 인증이나 공통 Header 검사를 endpoint마다 반복하면 누락과 중복이 생기기 쉽다.
- Middleware의 실행 순서를 모르면 요청 전처리와 응답 후처리 로그가 예상과 다를 때 원인을 찾기 어렵다.
- Path가 맞는지만 보면 404와 405를 구분할 수 없으므로 HTTP Method도 함께 확인해야 한다.
- 문법 검사 통과는 서버 실행과 HTTP 응답 성공을 보장하지 않으므로 검증 수준을 분리해야 한다.
- 정적 파일과 업로드 파일을 같은 저장 개념으로 보면 공개 자원과 영구 저장 데이터의 경계가 흐려진다.
- CORS와 VPN을 구분해야 브라우저 정책 문제와 네트워크 경로 문제를 잘못 연결하지 않는다.
- Pydantic 입력 검증과 서비스의 업무 규칙 검증을 나누면 각 계층의 책임이 명확해진다.

### 내 생각

> 처음에는 router의 prefix를 하나의 endpoint처럼 생각했지만, 실제 endpoint는 prefix와 decorator path, HTTP Method가 결합되어 만들어진다는 구조가 더 분명해졌다. 파일 업로드와 CORS도 하나의 기능 이름으로 외우기보다 Body 인코딩, 브라우저 정책과 서버 설정으로 나누어 보니 요청이 어느 단계에서 막히는지 추적하기 쉬워졌다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 클라이언트가 Method, URL, Header와 필요한 Body를 담아 요청한다.
2. 가장 바깥쪽 미들웨어가 요청을 검사하거나 기록한다.
3. FastAPI가 Method와 Path가 일치하는 route를 찾는다.
4. Router-level Dependency가 공통 검사를 수행한다.
5. endpoint에 선언된 Dependency가 필요한 값을 만들고 매개변수에 주입한다.
6. endpoint가 비즈니스 로직을 수행하고 응답 데이터를 반환한다.
7. 응답은 미들웨어를 요청의 반대 순서로 통과해 클라이언트에 전달된다.
8. 정적 자원 요청은 mount된 경로에서 파일을 그대로 응답하고, 업로드 요청은 multipart part를 해석해 endpoint에 전달한다.
9. 교차 출처 요청은 브라우저가 CORS 응답 Header를 확인하며, 필요한 경우 실제 요청 전에 OPTIONS preflight를 보낸다.

### 내 말로 설명하기

> APIRouter는 주문이나 게시판처럼 관련 API를 담는 묶음이고, Dependency는 요청을 처리하기 전에 공통 검사를 하거나 필요한 값을 준비한다. Middleware는 이보다 더 바깥에서 전체 요청과 응답을 감싼다. 파일 업로드는 Body를 여러 part로 나눠 보내고, CORS는 다른 Origin의 응답을 브라우저 코드가 읽어도 되는지 결정한다. 오류가 나면 브라우저 정책, 미들웨어, route 선택, Dependency, endpoint, 응답 생성 순서로 확인하면 된다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- Uvicorn 명령이 옵션을 추가 인수로 해석했다.
- 등록된 Path와 요청 URL이 달라 404가 발생했다.
- POST 전용 URL을 브라우저 주소창에서 GET으로 열어 405가 발생했다.
- endpoint가 `pass`로 끝나 Swagger UI 응답에 `null`이 표시되었다.
- 템플릿의 필터명, 함수명과 경로 오타로 500 오류가 발생할 수 있는 지점을 확인했다.
- 파일 input을 포함한 Form에 multipart 인코딩이 필요한 이유를 정리했다.
- 모든 교차 출처 요청이 preflight를 거친다는 오해를 수정했다.

### 문제의 원인

- `--app-dir`를 하나의 옵션 이름으로 작성하지 않았다.
- route decorator의 Path 오타와 요청 URL이 일치하지 않았다.
- 주소창 요청은 GET이지만 서버에는 같은 Path의 POST만 등록되어 있었다.
- Python 함수가 명시적으로 값을 반환하지 않아 `None`이 JSON `null`로 직렬화되었다.
- Jinja2 표현식과 실제 템플릿 위치가 일치하지 않았다.
- 기본 Form 인코딩은 파일명·콘텐츠 타입·bytes를 파일 part로 표현하지 못한다.
- 단순 요청은 preflight 없이 실제 요청을 보낼 수 있고, `PATCH`, 사용자 정의 Header나 JSON Content-Type 등은 preflight를 유발할 수 있다.

### 해결 원리

> 오류를 상태 코드별로 외우는 것보다 Origin, Method와 Path, Body 인코딩, route 등록, endpoint 반환값과 템플릿 렌더링 순서로 나눠 확인했다. 정적으로 원인을 찾은 항목과 실제 HTTP로 다시 확인한 항목은 구분해야 한다. 오늘은 파일 업로드와 CORS의 개념·설정 확인까지 수행했고 실제 브라우저·서버 재검증은 남아 있다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 오류 메시지와 현재 코드를 함께 보고 최초로 요청 흐름이 어긋나는 위치를 찾았다.
- 계속 유지할 학습 방법: `Method + Path → middleware → Dependency → endpoint → response` 순서로 추적한다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 미들웨어 등록 순서와 요청·응답 실행 순서가 반대로 보이는 점
- 반복해서 실수한 부분: 경로와 템플릿 함수 이름의 작은 오타
- 아직 설명하기 어려운 부분: reverse proxy가 있을 때 실제 클라이언트 주소와 Host 검사를 구성하는 방법
- 아직 설명하기 어려운 부분: `UploadFile`의 임시 보관과 영구 저장 경계, 인증정보를 포함한 CORS 설정

### Try — 다음에 시도할 것

- 다시 공부할 내용: Router-level Dependency와 endpoint parameter Dependency의 선택 기준
- 예제를 보지 않고 작성해볼 코드: router 한 개, 공통 Header 검사, 파일 업로드 endpoint와 CORS 설정
- 다음 학습에서 바꿔볼 방법: 코드를 작성한 뒤 문법 검사와 실제 HTTP 요청 결과를 별도 표로 기록한다.

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

별도의 이해도 평가를 진행하지 않아 체크하지 않았다.

---

## 9. 다음 학습에서 할 일

1. 중복된 주문 목록 route를 하나로 합치고 명시적인 JSON 응답을 반환한다.
2. 개발 환경의 Host 허용 설정을 적용한 뒤 실제 로그로 미들웨어 왕복 순서를 확인한다.
3. Swagger UI에서 공통 Header Dependency와 endpoint 응답을 실제로 검증한다.
4. BackgroundTasks와 StreamingResponse의 사용 목적과 실행 흐름을 코드로 확인한다.
5. 파일 Form을 실제 제출해 `filename`, `content_type`, bytes 크기와 영구 저장 전후를 확인한다.
6. 서로 다른 포트에서 요청을 보내 브라우저 개발자 도구로 OPTIONS와 CORS 응답 Header를 확인한다.

---

## 관련 자료

- [Week 11 학습 기록](../README.md)
