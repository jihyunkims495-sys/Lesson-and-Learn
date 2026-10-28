# TIL | 2026-10-28 | FastAPI 요청부터 Jinja2·라우터 구조까지

- 과정: AI Agent Bootcamp LV.2 / Week 11

> **같은 브라우저 화면이라도 HTML을 완성하는 위치와 요청을 처리하는 계층은 서로 다르다.**

> 오늘은 FastAPI 요청의 매개변수 검증에서 시작해 Jinja2 서버 렌더링과 APIRouter 기반 구조 분리까지 하나의 실행 흐름으로 연결했다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- Path parameter는 리소스를 식별하고 Query parameter는 검색·필터 같은 부가 조건을 전달한다.
- `Annotated`는 Python 타입과 FastAPI의 검증·문서화 메타데이터를 함께 표현한다.
- Jinja2는 서버가 Python 데이터와 HTML 템플릿을 결합해 완성된 HTML을 만드는 서버 측 템플릿 엔진이다.
- `APIRouter`는 기능별 endpoint를 나누고 `include_router`는 이를 FastAPI 앱에 등록한다.
- API Schema는 ERD를 그대로 복사하는 것이 아니라 요청·응답 계약을 Pydantic 모델로 표현한 것이다.

### 핵심 코드

```python
return templates.TemplateResponse(
    request=request,
    name="practice1.html",
    context=student_context,
)
```

```python
router = APIRouter(prefix="/v1/order", tags=["Orders"])

@router.get("")
async def test1():
    return {"message": "테스트1"}
```

### 오늘 수행한 실습

- Path·Query parameter와 사용자 정의 예외가 있는 식료품 조회 코드를 작성했다.
- Jinja2 변수, 조건문, 반복문, 필터, 주석, `set`, `with`, `do` 문법을 템플릿에 적용했다.
- `TemplateResponse` 호출과 템플릿 경로를 맞췄다.
- 주문 기능을 별도 `APIRouter`로 분리하고 FastAPI 앱에 등록했다.
- 주문 Schema를 작성할 위치와 요청·응답 모델의 역할을 정리했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드:
- 식료품 조회 endpoint와 예외 처리
- Jinja2 endpoint와 템플릿
- 주문 조회용 Router

검증 방법:
- Python 파일 AST 검사
- 템플릿 설정 경로와 실제 파일 위치 비교
- 8000번 포트 LISTEN 여부 확인

확인한 결과:
- 확인한 Python 파일은 AST 검사를 통과했다.
- 현재 템플릿 경로와 파일 위치가 일치한다.
- 8000번 포트에는 실행 중인 서버가 없었다.

미완료:
- 수정 후 HTTP 성공 응답 재검증
- 주문 ERD·API 명세 확정과 Pydantic Schema 작성
- 백그라운드 태스크·파일 스트리밍 실습
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- Path·Query·Schema를 구분하면 입력 위치와 검증 책임이 명확해진다.
- Jinja2를 사용하면 서버의 데이터를 반영한 HTML을 요청마다 만들 수 있다.
- Router와 Schema를 기능별로 나누면 `main.py`가 모든 책임을 떠안지 않고 기능을 독립적으로 관리할 수 있다.
- ERD에서 곧바로 endpoint를 작성하지 않고 API 명세와 Schema를 거치면 저장 구조와 외부 계약을 분리할 수 있다.

### 내 생각

> 개발자가 HTML을 작성한다는 점은 정적 HTML과 Jinja2가 같지만, Jinja2에서는 서버가 요청마다 데이터를 넣어 완성한 HTML만 브라우저에 보낸다는 처리 과정이 다르다. 폴더를 나누는 것만으로 endpoint가 생기는 것도 아니며, Router의 prefix와 데코레이터 경로를 앱에 등록해야 실제 URL이 만들어진다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. 브라우저가 URL과 parameter를 포함한 HTTP 요청을 보낸다.
2. Uvicorn이 요청을 FastAPI 앱에 전달한다.
3. 등록된 Router가 URL과 일치하는 endpoint를 선택한다.
4. FastAPI와 Pydantic이 Path·Query·Body를 검증한다.
5. endpoint가 처리 결과를 JSON으로 반환하거나 Jinja2에 context를 전달한다.
6. Jinja2는 템플릿을 HTML로 완성하고 서버가 응답한다.
7. 브라우저가 받은 HTML을 해석해 화면을 그린다.

### 내 말로 설명하기

> 서버는 요청을 받아 Python 코드를 실행하고 응답을 만드는 쪽이고, 브라우저는 그 응답을 받아 화면으로 보여주는 쪽이다. Jinja2를 사용해도 HTML은 개발자가 작성하지만, 서버가 템플릿 문법과 데이터를 먼저 처리한다는 점이 정적 HTML과 다르다.

---

## 4. 설계·명세 변경 기록

### 변경 전 문제

- endpoint와 처리 코드가 `main.py`에 모이면 기능이 늘어날수록 찾고 수정하기 어려워진다.
- 데이터베이스 구조와 API 요청·응답 구조를 구분하지 않으면 내부 필드가 그대로 노출될 수 있다.

### 수정할 때 중요하게 본 기준

- 저장 구조, 외부 API 계약, HTTP 입출력 처리를 서로 다른 책임으로 구분한다.
- URL은 폴더명이 아니라 Router 설정으로 결정한다.
- Schema 필드는 추측하지 않고 ERD와 API 명세를 근거로 정한다.

### 수정 내용과 이유

- 주문 기능용 Router 폴더와 Schema 폴더를 분리했다.
- `APIRouter(prefix="/v1/order")`를 만들고 FastAPI 앱에서 `include_router`로 등록했다.
- Schema는 요청 모델과 응답 모델로 분리해 작성하기로 했다.

### 구현에 미치는 영향

- 주문 API의 최종 URL과 문서 그룹이 Router 설정을 따라 생성된다.
- 이후 주문 필드가 확정되면 Schema를 Router의 입력 타입과 `response_model`에 연결해야 한다.

### 실무 레퍼런스에서 배운 점과 다음 적용

- 배운 점: ERD → API 명세 → 표현 계층 Schema → Router 순서로 설계하면 각 단계의 책임을 확인할 수 있다.
- 다음 작업에 적용할 항목: 주문의 확정 필드, 필수 여부, 검증 조건, 공개 응답 필드를 먼저 표로 만든다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: Jinja2로 완성한 HTML을 브라우저에 표시한다.
- 발생한 문제: 브라우저에 `Internal Server Error`가 표시됐다.
- 오류 메시지: 실행 단계마다 Python 문법 오류와 템플릿 오류 후보가 순차적으로 확인됐다.

### 문제가 발생한 코드

```python
templates.TempateResponse(
    name="practice1.html"
    context=student_context
)
```

```jinja2
{# 닫히지 않은 주석 }
{{ nickname | defalt('익명') }}
{{ hobbieis | join(',') }}
```

### 문제의 원인

- `TemplateResponse` 메서드명 오타
- 템플릿 설정 경로와 실제 파일 위치 불일치
- 함수 본문의 들여쓰기 불일치
- 함수 인자 사이 쉼표 누락
- Jinja2 주석 종료자 `#}` 누락
- 필터명과 변수명 오타

### 해결한 코드

```python
return templates.TemplateResponse(
    request=request,
    name="practice1.html",
    context=student_context,
)
```

```jinja2
{# 올바른 Jinja2 주석 #}
{{ nickname | default('익명') }}
{{ hobbies | join(',') }}
```

### 해결 원리

> 500 오류는 브라우저 화면만으로 원인을 알기 어렵다. Python import·문법, 템플릿 경로, Jinja2 파싱, context 데이터 순서로 서버 traceback의 첫 오류부터 수정해야 한다. 현재 파일의 문법과 경로는 정리됐지만 서버가 실행되지 않아 최종 HTTP 성공 여부는 아직 확인하지 못했다.

---

## 7. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 화면에 보이는 500 오류만 보지 않고 서버 코드와 템플릿을 나누어 원인을 확인했다.
- 계속 유지할 학습 방법: 요청 → 서버 → Router → Schema → 응답 순서로 코드 위치와 실행 흐름을 연결한다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 정적 HTML과 Jinja2 결과가 모두 브라우저에 보이기 때문에 처리 주체의 차이가 바로 드러나지 않았다.
- 반복해서 실수한 부분: 메서드명·필터명·변수명 오타와 쉼표·주석 종료 문자가 연속 오류를 만들었다.
- 아직 설명하기 어려운 부분: 확정된 주문 명세를 실제 요청·응답 Schema로 나누는 기준은 구현으로 확인하지 못했다.

### Try — 다음에 시도할 것

- 다시 공부할 내용: 요청 Schema와 응답 Schema의 필드 분리 기준
- 예제를 보지 않고 작성해볼 코드: `APIRouter`, 생성 요청 모델, 응답 모델, `response_model`
- 다음 학습에서 바꿔볼 방법: 서버 실행 전에 Python 문법과 템플릿 경로를 먼저 확인하고, 실행 후에는 첫 traceback부터 한 단계씩 수정한다.

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

1. 주문 ERD와 API 명세의 필드를 확정하고 요청·응답 Schema를 작성한다.
2. Schema를 Router에 연결하고 `/docs`에서 생성된 API 명세를 확인한다.
3. Uvicorn을 실행해 식료품 API, Jinja2 화면, 주문 Router의 HTTP 결과를 검증한다.
4. 백그라운드 작업과 스트리밍 파일 처리를 실제 코드로 학습한다.

---

## 관련 자료

- [FastAPI Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/)
- [FastAPI Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/)
- [FastAPI Templates](https://fastapi.tiangolo.com/advanced/templates/)
- [FastAPI Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/)
