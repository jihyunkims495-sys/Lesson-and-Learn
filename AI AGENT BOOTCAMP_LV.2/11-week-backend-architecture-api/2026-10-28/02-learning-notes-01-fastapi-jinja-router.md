# Learning Notes | 2026-10-28 | FastAPI 요청부터 Jinja2·Router까지

- 학습일: 2026-10-28
- 과정: AI Agent Bootcamp LV.2 / Week 11
- 실제 범위: 응답 모델, Path·Query·예외 처리, Jinja2, APIRouter와 표현 계층 설계

## 1. 오늘 학습의 큰 흐름

```text
브라우저·클라이언트
→ Uvicorn
→ FastAPI 앱
→ Router
→ 입력 검증
→ 처리 로직
→ JSON 또는 HTML 응답
```

후반에는 이 흐름을 한 파일에 모두 두지 않고 다음 순서로 나누는 방법을 연결했다.

```text
ERD 구성
→ API 명세 작성
→ 요청·응답 Schema 설계
→ 표현 계층 Router 작성
→ FastAPI 앱에 Router 등록
```

## 2. Path parameter와 Query parameter

Path parameter는 리소스를 식별하는 URL 경로의 일부다.

```python
@app.get("/groceries/{item_id}")
async def get_grocery(item_id: int):
    ...
```

Query parameter는 검색·필터·정렬·페이지처럼 리소스 조회에 부가 조건을 전달한다.

```python
async def get_grocery(
    item_id: Annotated[int, Path(description="상품 ID")],
    keyword: Annotated[str | None, Query(description="검색어")] = None,
):
    ...
```

`Annotated`에서 `int`는 실제 타입이고 `Path(...)`는 FastAPI가 검증과 OpenAPI 문서화에 사용하는 메타데이터다.

## 3. 예외 처리

존재하지 않는 리소스처럼 일반적인 HTTP 오류는 `HTTPException`으로 표현할 수 있다.

```python
if item_id not in grocery_database:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="식료품을 찾을 수 없습니다.",
    )
```

업무 의미가 있는 오류는 사용자 정의 예외와 예외 핸들러로 분리한다.

```text
업무 조건 확인
→ 사용자 정의 예외 발생
→ exception_handler 실행
→ 일관된 JSON 오류 응답
```

## 4. 서버와 브라우저, SSR과 CSR

- 개발자: HTML 또는 Jinja2 템플릿 작성
- 서버: 요청을 받고 Python 데이터와 템플릿을 결합해 응답 생성
- 브라우저: 받은 HTML을 해석해 DOM과 화면 생성

SSR은 서버가 데이터가 채워진 HTML을 완성한다. CSR은 브라우저의 JavaScript가 데이터를 이용해 화면을 완성한다. 둘 다 최종 화면은 브라우저에 보이지만 HTML을 완성하는 위치와 시점이 다르다.

## 5. Jinja2 렌더링 흐름

```text
GET /practice1
→ endpoint 실행
→ context 생성
→ TemplateResponse 호출
→ Jinja2가 템플릿 처리
→ 완성된 HTML 응답
→ 브라우저 렌더링
```

```python
return templates.TemplateResponse(
    request=request,
    name="practice1.html",
    context=student_context,
)
```

템플릿에서는 다음 문법을 사용했다.

- `{{ value }}`: 값 출력
- `{% if %}`, `{% for %}`: 조건과 반복
- `{# ... #}`: Jinja2 주석
- `| length`, `| join`, `| default`: 필터
- `{% set %}`, `{% with %}`: 변수 선언과 범위
- `{% do %}`: 값을 출력하지 않는 표현식 실행

`safe` 필터는 문자열을 HTML로 해석하게 하므로 신뢰할 수 없는 사용자 입력에는 사용하지 않아야 한다.

## 6. logging, logger, FastAPI 앱

```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")
app = FastAPI()
```

- `basicConfig`: 기본 로그 출력 기준 설정
- `getLogger`: 이름 있는 logger 획득
- `FastAPI`: 라우트와 설정을 담는 애플리케이션 객체 생성

수업용 독립 프로젝트에는 앱 시작점이 각각 필요하다. 규모가 커지면 기본 설정과 앱 생성은 중심 모듈에 두고 하위 모듈은 `logging.getLogger(__name__)`로 분리할 수 있다.

## 7. 트랜잭션

트랜잭션은 여러 데이터 변경을 하나의 논리적 작업으로 묶는다.

```text
모든 작업 성공 → commit
중간 작업 실패 → rollback
```

주문 생성과 재고 차감처럼 일부만 반영되면 데이터가 불일치하는 작업에서 필요하다. HTTP 요청 하나와 데이터베이스 트랜잭션 하나가 항상 같은 것은 아니며 애플리케이션이 범위를 설계해야 한다.

## 8. APIRouter와 표현 계층

```python
router = APIRouter(prefix="/v1/order", tags=["Orders"])

@router.get("")
async def test1():
    return {"message": "테스트1"}

@router.get("/test")
async def test2():
    return {"message": "테스트2"}
```

최종 URL은 폴더 위치가 아니라 `prefix`와 endpoint 경로를 합쳐 결정된다.

```text
/v1/order + ""      → GET /v1/order
/v1/order + "/test" → GET /v1/order/test
```

`app.include_router(router)`가 Router를 실제 FastAPI 앱에 등록한다.

## 9. Schema 작성 기준

Schema는 데이터베이스 테이블을 그대로 복사하는 것이 아니라 API 요청·응답 계약을 Pydantic 모델로 표현한 것이다.

```text
요청 Schema
- 클라이언트가 보내는 필드
- 타입, 필수 여부, 길이·범위 검증

응답 Schema
- 외부에 공개할 필드
- 서버 생성 ID와 처리 상태
- 내부 전용 필드 제외
```

주문 Schema는 확정된 ERD와 API 명세의 필드를 근거로 작성해야 한다. 임의의 필드를 먼저 만들면 데이터 구조와 API 계약이 어긋날 수 있다.

## 10. 검증 상태

- 작성한 Python 파일은 AST 문법 검사를 통과했다.
- Jinja2 템플릿 설정 경로와 파일 위치가 일치하는 것을 확인했다.
- 마무리 점검 시 8000번 포트에 실행 중인 서버가 없었다.
- 수정 후 실제 HTTP 응답과 Jinja2 렌더링 결과는 재검증하지 못했다.
- 주문 Schema는 아직 작성하지 않았다.

## 11. 다음 학습 항목

1. 주문 ERD와 API 명세의 필드를 확정한다.
2. 생성 요청과 응답 Schema를 나누어 작성한다.
3. Router에 요청 타입과 `response_model`을 연결한다.
4. Uvicorn을 실행하고 API·HTML·OpenAPI 문서를 실제 요청으로 검증한다.
5. BackgroundTasks, UploadFile, StreamingResponse를 실제 코드로 학습한다.
