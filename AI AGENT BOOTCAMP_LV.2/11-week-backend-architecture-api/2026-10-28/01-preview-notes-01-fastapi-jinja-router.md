# Preview Notes | 2026-10-28 | FastAPI 응답부터 라우터·스트리밍까지

- 과정: AI Agent Bootcamp LV.2 / Week 11
- 예정 범위: 응답 모델·API 문서화, Path·Query·예외 처리, Jinja2·정적 파일, APIRouter·Middleware, 백그라운드 작업·스트리밍

## 1. 학습 목표

- 응답 모델이 외부에 공개할 필드를 제한하는 원리를 설명한다.
- Path parameter와 Query parameter의 역할을 구분한다.
- `Annotated`를 이용해 타입과 API 메타데이터를 함께 선언한다.
- 예외를 HTTP 상태 코드와 일관된 오류 응답으로 변환한다.
- Jinja2가 Python 데이터로 HTML을 완성하는 흐름을 이해한다.
- 기능별 Router와 Schema를 나누는 이유를 이해한다.
- 파일 업로드, 백그라운드 작업, 스트리밍 응답의 사용 목적을 구분한다.

## 2. 전체 연결 구조

```text
클라이언트 요청
→ Uvicorn
→ FastAPI 앱
→ APIRouter
→ Path·Query·Body 검증
→ 업무 처리
→ 응답 모델 또는 Jinja2 템플릿
→ JSON·HTML·Streaming 응답
```

애플리케이션 설계는 다음 순서로 연결할 수 있다.

```text
ERD
→ API 명세
→ 요청·응답 Schema
→ 표현 계층 Router
→ 애플리케이션 등록
```

## 3. 응답 모델과 API 문서화

응답 모델은 서버 내부 객체 전체를 그대로 노출하지 않고 외부 계약에 포함된 필드만 직렬화한다.

```python
class BookResponse(BaseModel):
    title: str
    author: str
    price: int | None = None

@app.get("/books/{book_id}", response_model=BookResponse)
async def get_book(book_id: int):
    ...
```

FastAPI는 타입, Path·Query·Body 선언, Pydantic Schema를 OpenAPI 문서로 변환한다. Swagger UI는 이 명세를 읽어 요청 입력 화면과 응답 구조를 보여준다.

## 4. Path·Query·Annotated

```python
@app.get("/groceries/{item_id}")
async def get_grocery(
    item_id: Annotated[int, Path(description="상품 ID")],
    keyword: Annotated[str | None, Query(description="검색어")] = None,
):
    ...
```

- Path: 어떤 리소스인지 식별한다.
- Query: 검색·필터·정렬·페이지 같은 부가 조건을 전달한다.
- `Annotated`: 실제 타입과 FastAPI의 검증·문서화 정보를 분리해 함께 표현한다.

## 5. 예외 처리

```python
if item_id not in grocery_database:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="식료품을 찾을 수 없습니다.",
    )
```

업무 의미가 있는 오류는 사용자 정의 예외를 만들고 `exception_handler`에서 HTTP 응답으로 변환할 수 있다.

```text
업무 조건 위반
→ 예외 발생
→ 예외 핸들러
→ 상태 코드와 오류 본문 응답
```

## 6. Jinja2와 정적 파일

Jinja2는 서버가 HTML 템플릿과 Python 데이터를 결합하는 서버 측 템플릿 엔진이다.

```python
templates = Jinja2Templates(directory="templates")

return templates.TemplateResponse(
    request=request,
    name="practice1.html",
    context={"name": "Sparta"},
)
```

```jinja2
<p>이름: {{ name }}</p>

{% if age >= 20 %}
  <p>성인</p>
{% endif %}
```

- `{{ ... }}`: 값 출력
- `{% ... %}`: 조건, 반복, 변수 선언
- `{# ... #}`: 템플릿 주석
- 필터: `length`, `join`, `default`, `safe` 등

CSS·JavaScript·이미지 같은 정적 파일은 일반적으로 `StaticFiles`로 URL 경로에 연결한다.

## 7. SSR과 CSR

### SSR

서버가 데이터가 채워진 HTML을 완성해 브라우저에 응답한다. Jinja2가 대표적인 예다.

### CSR

브라우저의 JavaScript가 API 데이터 등을 이용해 화면 구조를 완성한다.

둘 다 최종 결과는 브라우저에 표시되지만 HTML을 완성하는 위치와 시점이 다르다.

## 8. APIRouter와 Middleware

```python
router = APIRouter(
    prefix="/v1/order",
    tags=["Orders"],
)
```

Router는 기능별 endpoint를 묶는다. 최종 URL은 폴더명이 아니라 Router의 `prefix`와 endpoint 데코레이터의 경로를 합쳐 결정된다.

Middleware는 요청이 endpoint에 도달하기 전과 응답이 클라이언트로 돌아가기 전에 공통 처리를 적용한다.

```text
요청 → Middleware → Router → Endpoint
응답 ← Middleware ← Router ← Endpoint
```

로깅, 처리 시간 측정, 신뢰 호스트 확인처럼 애플리케이션 전체에 적용할 책임에 적합하다.

## 9. UploadFile, BackgroundTasks, StreamingResponse

- `UploadFile`: 큰 업로드 파일을 메모리에 한꺼번에 올리지 않고 임시 파일 기반으로 처리한다.
- `BackgroundTasks`: 응답을 보낸 뒤 가벼운 후속 작업을 실행한다.
- `StreamingResponse`: 데이터를 작은 청크 단위로 순차 전송한다.

```text
업로드 요청
→ 파일 검증·저장
→ 작업 상태 PENDING 응답
→ 백그라운드 처리
→ PROCESSING
→ COMPLETED 또는 FAILED
```

단순히 `async def`나 BackgroundTasks를 사용한다고 CPU 연산이 자동으로 빨라지는 것은 아니다. 재시도와 내구성이 필요한 무거운 작업은 별도 작업 큐가 필요할 수 있다.

## 10. 예상 난점

- 개발자가 HTML을 작성한다는 공통점 때문에 정적 HTML과 Jinja2의 처리 흐름을 혼동할 수 있다.
- 템플릿 디렉터리의 파일 시스템 경로와 브라우저 URL 경로는 서로 다르다.
- Middleware와 Router dependency는 적용 범위가 다르다.
- `UploadFile`은 메모리 사용을 줄이지만 파일명·용량·형식 검증을 대신하지 않는다.
- 응답 이후 실행되는 작업은 이미 전송된 HTTP 응답과 실패 상태를 별도로 관리해야 한다.

## 11. 수업 전 확인 항목

1. 응답 모델에서 제외된 내부 필드는 어떤 단계에서 제거되는가?
2. Path와 Query 중 리소스 식별자는 어디에 두어야 하는가?
3. Jinja2 context의 값은 언제 완성된 HTML로 바뀌는가?
4. Router의 prefix와 endpoint 경로는 어떻게 결합되는가?
5. Middleware와 dependency는 어떤 기준으로 선택하는가?
6. Background task가 실패했을 때 작업 상태를 어떻게 기록할 것인가?
7. 단순 파일 다운로드에는 StreamingResponse와 FileResponse 중 무엇이 적합한가?
