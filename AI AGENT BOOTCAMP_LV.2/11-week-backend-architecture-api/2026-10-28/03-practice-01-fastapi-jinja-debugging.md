# Practice | 2026-10-28 | FastAPI·Jinja2 오류 추적

- 학습일: 2026-10-28
- 과정: AI Agent Bootcamp LV.2 / Week 11
- 대상: 실행 환경, Jinja2 템플릿, APIRouter

## 1. uv 옵션 오류

```text
error: unexpected argument '--python3.13' found
tip: a similar argument exists: '--python'
```

`--python3.13`을 하나의 옵션 이름으로 전달한 것이 원인이었다. `--python`은 옵션이고 `3.13`은 별도의 값이다.

```powershell
uv init --python 3.13 <프로젝트경로>
```

수정 명령의 프로젝트 생성 성공 결과는 별도로 확인하지 않았다.

## 2. API 연결 실패

식료품 조회 endpoint는 작성되어 있었지만 8000번 포트에서 요청을 받을 서버가 실행되고 있지 않았다.

```powershell
uv add fastapi uvicorn
uv run uvicorn main:app --app-dir src --reload
```

서버 시작 로그를 확인한 다음 API와 `/docs`를 다시 요청해야 한다.

## 3. Jinja2 설치 출력

Jinja2와 MarkupSafe가 `Installed`로 표시되어 설치는 완료됐다. `Failed to hardlink files; falling back to full copy`는 설치 실패가 아니라 파일 연결 대신 복사 방식을 사용했다는 성능 경고다.

## 4. Internal Server Error 추적

하나의 500 오류 뒤에 여러 문제가 순차적으로 있었다.

### TemplateResponse 오타

```python
templates.TempateResponse(...)
```

```python
templates.TemplateResponse(...)
```

### 템플릿 경로 불일치

템플릿 엔진에 지정한 디렉터리와 실제 HTML 위치가 달랐다. 현재는 실행 파일을 기준으로 템플릿 경로를 만들었다.

```python
CURRENT_DIR = os.path.dirname(__file__)
templates = Jinja2Templates(
    directory=os.path.join(CURRENT_DIR, "templates")
)
```

### Python 들여쓰기 오류

endpoint 함수 본문에 공백 수가 섞여 `IndentationError`가 발생했다. 함수 본문을 공백 4칸으로 통일했다.

### 함수 인자 쉼표 누락

```python
name="practice1.html"
context=student_context
```

```python
name="practice1.html",
context=student_context,
```

### Jinja2 주석 종료 누락

Jinja2 주석은 `{#`로 시작해 `#}`로 끝나야 한다.

```jinja2
{# 올바른 Jinja2 주석 #}
```

### 필터와 변수 오타

```text
defalt   → default
hobbieis → hobbies
```

### None과 default 필터

`nickname`이 존재하지만 값이 `None`인 경우에도 대체 문자열을 표시하려면 두 번째 인자를 사용할 수 있다.

```jinja2
{{ nickname | default('익명', true) }}
```

이 변경은 현재 실습 코드에 반영하지 않았다.

## 5. APIRouter 실습

```python
router = APIRouter(prefix="/v1/order", tags=["Orders"])
```

작성한 endpoint는 다음 URL에 대응한다.

```text
GET /v1/order
GET /v1/order/test
```

Router는 FastAPI 앱에 등록하는 코드까지 작성했다. Python 문법은 통과했지만 Uvicorn과 실제 HTTP 요청으로 라우트 결과를 재검증하지 않았다.

## 6. Schema 실습 상태

```text
ERD 확정
→ API 요청·응답 필드 확정
→ Pydantic Schema 작성
→ Router 입력 타입과 response_model에 연결
```

주문 필드가 확정되지 않아 예시 필드를 실제 구현으로 대신 작성하지 않았다.

## 7. 검증 결과

- 관련 Python 파일은 AST 검사를 통과했다.
- 템플릿 설정 경로와 실제 파일 위치가 일치했다.
- 8000번 포트에는 실행 중인 서버가 없었다.
- 최종 HTTP 성공 응답은 확인하지 못했다.
- 주문 Schema는 미작성 상태다.

## 8. 다음 실행 순서

1. 사용자 정의 예외가 전달 인자를 올바르게 저장하는지 확인한다.
2. `nickname=None` 처리 방식을 결정한다.
3. 프로젝트 의존성을 준비하고 Uvicorn을 실행한다.
4. 식료품 API, Jinja2 화면, 주문 Router, `/docs`를 실제 요청으로 확인한다.
5. 주문 ERD와 API 명세를 근거로 Schema를 작성한다.
