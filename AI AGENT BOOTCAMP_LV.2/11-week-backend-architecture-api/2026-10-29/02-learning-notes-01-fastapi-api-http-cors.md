# Learning Notes | FastAPI 요청 흐름과 Web API 기초

> LV.2 · Week 11 · 2026-10-29

## 1. FastAPI와 REST API

FastAPI는 Python으로 Web API를 만들기 위한 웹 프레임워크다. 라우팅, 요청 데이터 검증, 응답 직렬화, 의존성 주입과 OpenAPI 기반 자동 문서화를 제공한다.

REST API는 특정 제품이나 프레임워크가 아니라, 자원을 URI로 표현하고 HTTP Method를 사용해 자원의 상태를 다루는 API 설계 방식이다. 따라서 FastAPI로 REST 원칙을 따르는 API를 구현할 수 있지만 FastAPI와 REST API는 같은 종류의 개념이 아니다.

```text
FastAPI: API를 구현하는 도구
REST: API를 설계하는 방식
```

FastAPI의 `/docs`는 일반 설명서가 아니라 애플리케이션에 등록된 API의 Path, Method, 요청 형식과 응답 형식을 시험할 수 있는 대화형 API 문서다. 이 문서는 OpenAPI 명세를 기반으로 생성된다.

## 2. API와 API 명세

API는 서로 다른 소프트웨어가 정해진 규칙으로 요청과 응답을 주고받기 위한 접점이다. 클라이언트는 서버 내부 구현을 몰라도 공개된 계약에 맞춰 기능을 사용할 수 있다.

API 명세는 그 계약을 사람이 읽고 도구가 활용할 수 있도록 정리한 문서다. 팀이 같은 기능을 같은 방식으로 이해하고, 프론트엔드와 백엔드가 독립적으로 개발하며, 테스트 기준을 세우는 데 사용한다.

| 항목 | 의미 | 작성하는 이유 |
|---|---|---|
| 기능 분류 | 주문, 회원, 게시판처럼 관련 API를 묶은 영역 | API가 많아져도 기능을 빠르게 찾기 위해 |
| 기능명 | API가 수행하는 구체적인 동작 | 사용 목적을 한눈에 전달하기 위해 |
| API Path | 서버에서 자원이 위치한 경로 | 클라이언트가 요청할 주소를 합의하기 위해 |
| HTTP Method | 조회·생성·전체 수정·부분 수정·삭제 등 요청 의도 | 같은 Path에서도 동작을 구분하기 위해 |
| 요청 상세 | Path·Query·Header·Body의 필드, 타입, 필수 여부와 제약 | 올바른 요청을 만들고 입력을 검증하기 위해 |
| 응답 상세 | 상태 코드, 응답 필드, 타입과 오류 형식 | 성공·실패 결과를 일관되게 처리하기 위해 |

endpoint는 Path 하나만을 뜻하지 않는다. 일반적으로 `HTTP Method + Path`의 조합으로 구분한다.

```text
GET /v1/orders       → 주문 목록 조회
POST /v1/orders      → 주문 생성
GET /v1/orders/10    → 10번 주문 상세 조회
PATCH /v1/orders/10  → 10번 주문 일부 변경
```

## 3. URI와 URL

URI는 인터넷의 자원을 식별하는 문자열 전체를 뜻한다. URL은 URI 중에서도 자원의 위치와 접근 방법을 나타낸다.

```text
URI: 자원을 식별하는 더 넓은 개념
URL: 자원이 어디에 있고 어떻게 접근하는지 나타내는 URI
```

예를 들어 `https://example.com/orders/10`은 10번 주문을 식별하면서 프로토콜과 위치도 알려주므로 URI이자 URL이다.

## 4. 서버와 클라이언트

클라이언트는 서비스를 요청하고 결과를 사용하는 쪽이고, 서버는 요청을 받아 처리한 뒤 응답하는 쪽이다. 역할은 프로그램 단위로 정해지므로 하나의 컴퓨터가 상황에 따라 클라이언트와 서버 역할을 모두 수행할 수도 있다.

```text
브라우저 → HTTP 요청 → FastAPI 서버
브라우저 ← HTTP 응답 ← FastAPI 서버
```

## 5. Header와 Body

Header는 요청이나 응답에 대한 부가 정보를 담는다. 인증정보, Content-Type, 허용 가능한 응답 형식과 캐시 정책 등이 들어갈 수 있다.

Body는 생성하거나 변경할 실제 데이터를 담는다. JSON, Form 데이터와 파일 등이 Body로 전달된다.

```python
from fastapi import Body, Header


async def change_order(
    status: str = Body(description="변경할 주문 상태"),
    x_token: str | None = Header(default=None),
):
    return {"status": status, "token_received": x_token is not None}
```

## 6. HTTP Method

| Method | 대표 목적 | 특징 |
|---|---|---|
| `GET` | 자원 조회 | 일반적으로 서버 상태를 변경하지 않는다. |
| `POST` | 새 자원 생성 또는 처리 요청 | 같은 요청을 반복하면 결과가 추가로 생길 수 있다. |
| `PUT` | 자원 전체 교체 | 전체 표현을 보내 교체하는 의미로 사용한다. |
| `PATCH` | 자원 일부 변경 | 변경할 필드만 보낼 때 사용한다. |
| `DELETE` | 자원 삭제 | 지정한 자원을 제거한다. |
| `OPTIONS` | 통신 가능 조건 확인 | CORS preflight 등에 사용된다. |

`GET`과 `PUT`은 HTTP Method가 맞다. 같은 Path라도 Method가 다르면 서로 다른 endpoint이며, 등록되지 않은 Method로 요청하면 `405 Method Not Allowed`가 발생할 수 있다.

## 7. APIRouter와 prefix

`APIRouter`는 관련 endpoint를 기능별로 모으는 FastAPI의 라우터다. 주문, 게시판과 회원 기능을 서로 다른 모듈로 나누면 경로와 책임을 관리하기 쉬워진다.

```python
from fastapi import APIRouter

router = APIRouter(prefix="/v1/order", tags=["주문"])


@router.get("")
async def get_orders():
    return []


@router.get("/{order_id}")
async def get_order(order_id: int):
    return {"order_id": order_id}
```

`prefix`는 endpoint 하나가 아니라 해당 라우터의 모든 경로 앞에 공통으로 붙는 경로 조각이다.

```text
prefix "/v1/order" + decorator path ""            → GET /v1/order
prefix "/v1/order" + decorator path "/{order_id}" → GET /v1/order/{order_id}
```

작성한 라우터는 메인 애플리케이션에 등록해야 실제 endpoint가 된다.

```python
from fastapi import FastAPI
from order.presentation.router import router as order_router

app = FastAPI()
app.include_router(order_router)
```

## 8. Dependency의 범위

라우터를 만들기 전에 정의한 함수인지 이후에 정의한 함수인지는 핵심이 아니다. Python에서는 함수가 `Depends()`에 전달되는 시점에 이미 정의되어 있어야 하며, Dependency를 어디에 연결했는지가 실행 범위를 결정한다.

```python
from fastapi import APIRouter, Depends, Header, HTTPException


def verify_request_header(x_token: str | None = Header(default=None)):
    if x_token is None:
        raise HTTPException(status_code=403, detail="요청을 확인할 수 없습니다.")


router = APIRouter(
    prefix="/v1/order",
    dependencies=[Depends(verify_request_header)],
)
```

라우터의 `dependencies`에 연결하면 해당 라우터의 모든 endpoint에서 공통으로 실행한다. 주로 인증, 공통 Header 검사처럼 반환값을 직접 사용하지 않는 검사에 적합하다.

```python
def load_context() -> str:
    return "order-context"


@router.get("")
async def get_orders(context: str = Depends(load_context)):
    return {"context": context, "orders": []}
```

endpoint 매개변수에 연결하면 특정 endpoint에서만 실행하며, Dependency의 반환값을 매개변수로 받아 사용할 수 있다.

## 9. 표현 계층과 Pydantic

표현 계층은 HTTP 요청을 애플리케이션이 사용할 입력으로 바꾸고, 처리 결과를 HTTP 응답으로 표현하는 경계다. FastAPI 프로젝트에서는 router, 요청·응답 Schema와 상태 코드 정의가 이 계층에 포함될 수 있다.

Pydantic은 선언된 타입, 필수 여부와 제약조건을 바탕으로 입력 데이터를 파싱하고 검증한다. 그러나 주문 상태가 실제 업무 규칙상 변경 가능한지, 요청자가 자원의 소유자인지 같은 비즈니스 규칙까지 자동으로 판단하지는 않는다.

```text
Pydantic 검증: 타입, 형식, 길이, 범위
비즈니스 검증: 상태 전이, 권한, 재고, 중복 정책
```

## 10. 트랜잭션

트랜잭션은 여러 데이터베이스 작업을 하나의 논리적 작업 단위로 묶는 것이다. 모든 작업이 성공하면 `commit`하고, 중간에 실패하면 `rollback`해 작업 전 상태로 되돌린다.

대표 속성은 ACID로 설명한다.

- Atomicity: 모두 성공하거나 모두 실패한다.
- Consistency: 작업 전후에 데이터 규칙을 지킨다.
- Isolation: 동시에 실행되는 트랜잭션이 서로의 중간 상태를 함부로 보지 않는다.
- Durability: commit된 결과는 장애가 발생해도 보존되어야 한다.

예를 들어 주문 생성과 재고 차감을 하나의 트랜잭션으로 묶으면 주문만 생성되고 재고는 줄지 않는 불일치를 막을 수 있다.

## 11. 정적 자원과 `public`, `StaticFiles`

정적 자원은 요청할 때마다 서버가 새로 계산하지 않고 파일 형태로 제공하는 이미지, CSS, JavaScript와 폰트 등을 말한다.

Next.js의 `public` 폴더는 정적 파일을 브라우저에서 URL로 접근할 수 있게 제공한다. FastAPI와 Jinja2에서는 보통 `StaticFiles`로 특정 디렉터리를 URL 경로에 mount한다.

```python
from fastapi.staticfiles import StaticFiles

app.mount("/static", StaticFiles(directory="static"), name="static")
```

정적 파일 제공과 업로드 파일의 영구 저장은 다른 개념이다. 정적 파일은 서버가 공개해 제공하는 자원이고, 업로드 파일은 사용자가 서버로 보낸 입력 데이터다.

## 12. 파일 업로드와 `python-multipart`

파일 input이 포함된 HTML Form은 `multipart/form-data` 인코딩을 사용한다. 이 방식은 Body를 여러 part로 나누어 텍스트 필드와 파일 bytes, 파일명과 Content-Type을 함께 보낼 수 있다.

```html
<form action="/file" method="post" enctype="multipart/form-data">
  <input type="file" name="file">
  <button type="submit">업로드</button>
</form>
```

`python-multipart`는 FastAPI가 multipart 형식의 요청 Body를 해석할 때 사용하는 패키지다.

```bash
uv add python-multipart
```

```python
from fastapi import FastAPI, UploadFile

app = FastAPI()


@app.post("/file")
async def upload_file(file: UploadFile):
    content = await file.read()
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
    }
```

`UploadFile`로 읽었다고 해서 파일이 자동으로 영구 저장되는 것은 아니다. 보존하려면 저장 위치, 파일명 충돌, 크기 제한과 보안 검사를 포함한 별도 저장 로직이 필요하다.

## 13. Middleware

Middleware는 endpoint보다 바깥에서 요청과 응답을 감싸는 공통 처리 계층이다. 로깅, CORS, 허용 Host 검사와 공통 응답 Header 처리 등에 사용한다.

```python
@app.middleware("http")
async def log_request(request, call_next):
    # endpoint 실행 전
    response = await call_next(request)
    # endpoint 실행 후
    return response
```

여러 미들웨어가 겹치면 요청은 바깥에서 안쪽으로 들어가고, 응답은 반대 방향으로 나온다. FastAPI/Starlette에서 데코레이터로 추가한 사용자 미들웨어는 마지막에 추가된 것이 요청을 먼저 받는 형태가 될 수 있으므로 실제 로그로 순서를 확인하는 것이 좋다.

`TrustedHostMiddleware`의 `allowed_hosts`는 접속자의 IP 허용 목록이 아니라 HTTP `Host` Header의 호스트 이름을 검사한다.

## 14. CORS와 preflight

CORS는 브라우저가 다른 Origin의 서버 응답을 프론트엔드 코드에 공개해도 되는지 통제하는 정책이다. Origin은 프로토콜, 도메인과 포트의 조합이다.

```text
http://localhost:3000
http://localhost:8000
```

위 두 주소는 포트가 다르므로 서로 다른 Origin이다.

서버는 허용할 Origin, Method와 Header를 응답 Header로 알린다. 조건에 따라 브라우저는 실제 요청 전에 `OPTIONS` preflight 요청을 보내 서버가 해당 교차 출처 요청을 허용하는지 확인한다. 모든 교차 출처 요청이 preflight를 거치는 것은 아니며 단순 요청 조건을 벗어난 요청에서 필요하다.

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Token"],
)
```

CORS는 주로 브라우저가 적용하는 보안 정책이다. 서버와 서버가 직접 통신할 때 브라우저 CORS 정책이 요청 자체를 막는 것은 아니다.

## 15. 토큰과 VPN

토큰은 사용자의 로그인 상태, 권한 또는 특정 요청의 자격을 서버에 증명하기 위해 전달하는 문자열이다. 보통 Header에 담아 보내며, 서버는 서명, 만료시간과 권한 등을 검증한다. 예제의 고정 문자열 비교는 Dependency 흐름을 이해하기 위한 단순화된 방식이지 운영 환경의 완전한 인증 방식은 아니다.

VPN은 장치와 VPN 서버 사이에 암호화된 통신 경로를 만들고, 인터넷 서비스에 VPN 서버의 IP가 보이게 할 수 있는 네트워크 기술이다. 다른 나라의 VPN 서버를 사용하면 서비스는 그 서버의 IP 위치를 기준으로 접속 국가를 판단할 수 있다.

VPN은 네트워크 경로와 외부 IP를 바꾸지만 다음을 자동으로 해결하지 않는다.

- 브라우저의 CORS 정책
- 서버의 로그인과 권한 검사
- 서비스 이용 약관이나 지역 제한 정책

## 16. 소프트웨어와 하드웨어

하드웨어는 CPU, 메모리, 저장장치와 네트워크 장비처럼 물리적으로 존재하는 장치다. 소프트웨어는 운영체제, 브라우저, FastAPI 애플리케이션처럼 하드웨어에서 실행되는 프로그램과 데이터다.

```text
하드웨어: 계산하고 저장하며 통신하는 물리 장치
소프트웨어: 하드웨어가 무엇을 수행할지 정의하는 명령과 프로그램
```

## 17. 오류를 요청 흐름으로 구분하기

| 현상 | 우선 확인할 부분 |
|---|---|
| `404 Not Found` | 요청 Path와 등록된 route가 일치하는가 |
| `405 Method Not Allowed` | Path는 있지만 요청 Method가 등록되어 있는가 |
| `500 Internal Server Error` | endpoint, 템플릿 렌더링과 서버 로그에서 예외가 발생했는가 |
| Swagger 응답의 `null` | 함수가 명시적으로 값을 반환하지 않아 `None`을 반환했는가 |
| 파일 Form 처리 실패 | `multipart/form-data`, input 이름, `python-multipart`와 endpoint 매개변수가 맞는가 |
| 브라우저 CORS 오류 | Origin, preflight, 허용 Method·Header와 응답 Header가 맞는가 |

문법 검사 통과는 서버 import, Uvicorn 실행과 실제 HTTP 요청 성공을 보장하지 않는다. 정적 검사와 실행 검증을 구분해서 기록해야 한다.

## 핵심 요약

- FastAPI는 구현 도구이고 REST는 API 설계 방식이다.
- endpoint는 `HTTP Method + Path`로 구분한다.
- APIRouter는 기능별 endpoint 묶음이고 prefix는 공통 경로다.
- Dependency는 연결 위치에 따라 전체 router 검사 또는 특정 endpoint의 값 주입에 사용한다.
- Pydantic 입력 검증과 비즈니스 규칙 검증은 역할이 다르다.
- 파일 업로드는 multipart Body를 사용하며 읽기와 영구 저장은 별도 단계다.
- CORS는 브라우저의 교차 출처 정책이고 VPN은 네트워크 경로를 바꾸는 기술이다.
- 오류는 Method와 Path, middleware, Dependency, endpoint, 응답 순서로 추적한다.

[← Week 11 학습 기록](../README.md)
