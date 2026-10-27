# TIL | 2026-10-27 | Pydantic 모델 검증과 FastAPI 요청 흐름

- 학습일: 2026-10-27
- 과정: AI Agent Bootcamp LV.2 / Week 11

> **타입 힌트가 데이터의 설계도라면, Pydantic은 그 설계도를 실제 요청에 적용하는 검사기다.**

> Uvicorn·FastAPI·Pydantic·Swagger UI·Postman을 하나의 HTTP 요청 흐름 안에서 구분해 보았다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- Python 타입 힌트는 예상 타입을 표현하고, Pydantic은 외부 입력을 실행 중 변환·검증한다.
- `BaseModel`은 검증 모델의 기반이고 `Field`는 필수 여부, 길이, 숫자 범위 같은 제약을 선언한다.
- `field_validator`는 특정 필드를, `model_validator`는 모델 전체와 여러 필드의 관계를 검사한다.
- Create·Update·Response 스키마는 입력 목적과 외부 공개 범위가 달라 분리한다.
- `model_dump(exclude_unset=True)`는 부분 수정에서 사용자가 실제로 보낸 필드만 추출한다.
- Uvicorn은 서버, FastAPI는 웹 프레임워크, Pydantic은 검증기, Swagger UI와 Postman은 API 요청·응답을 확인하는 도구다.

### 핵심 코드

```python
class BookCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=100)
    author: str = Field(..., min_length=2, max_length=50)
    price: int | None = Field(None, gt=0)

    @field_validator("title", "author")
    @classmethod
    def trim_and_validate(cls, value: str) -> str:
        trimmed_text = value.strip()
        if len(trimmed_text) < 2:
            raise ValueError("공백 없이 2자 이상 입력하세요.")
        return trimmed_text
```

### 오늘 수행한 실습

- `BookCreate`에 문자열 길이와 가격 범위 규칙을 선언했다.
- `field_validator`로 title과 author의 공백을 제거하고 길이를 검사하는 코드를 확인했다.
- before·after `model_validator`에서 로그를 남기는 구조를 작성했다.
- FastAPI `POST /books`에 `payload: BookCreate`를 연결했다.
- Generic `APIResponse[T]`와 `GET /books`의 응답 모델을 구성했다.
- Postman 연결 거절과 Python 들여쓰기 오류를 단계별로 진단했다.

### 실제 작성한 코드와 검증 상태

```text
작성한 코드: BookCreate, BookResponse, APIResponse, POST·GET endpoint, validator
검증 방법: 현재 소스 확인, 포트 확인, Python AST 문법 검사
확인한 결과: main.py와 schemas.py는 현재 저장본에서 문법 검사 통과
미완료: Uvicorn 재실행, Postman·Swagger UI 정상/오류 응답, validator runtime 순서 확인
```

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

외부 사용자는 서버가 예상하지 않은 타입과 값을 보낼 수 있다. 가격 자리에 문자열을 넣거나 제목을 공백으로 보내도 검증이 없다면 잘못된 데이터가 업무 로직과 저장소까지 전달된다.

Pydantic을 사용하면 endpoint마다 반복적인 `if`문을 작성하지 않고도 입력 규칙을 스키마에 모을 수 있다. 또한 같은 스키마 정보가 FastAPI의 OpenAPI 문서와 오류 응답에 연결되어 서버와 클라이언트의 데이터 계약이 명확해진다.

### 내 생각

처음에는 Postman에서 Pydantic을 직접 보는 것처럼 느껴졌지만 역할이 달랐다. Postman은 요청을 보내는 도구이고, Pydantic은 서버 안에서 그 요청을 검사한다. Postman에 보이는 오류 응답은 Pydantic 검증 결과가 HTTP 응답으로 전달된 것이다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. Postman이나 Swagger UI가 JSON 요청을 보낸다.
2. Uvicorn이 요청을 받아 FastAPI 애플리케이션에 전달한다.
3. FastAPI가 method와 path에 맞는 endpoint를 찾는다.
4. Pydantic이 request body를 모델 규칙에 따라 변환·검증한다.
5. 검증이 성공하면 endpoint에 모델 인스턴스를 전달한다.
6. 검증이 실패하면 업무 로직을 실행하지 않고 오류 응답을 만든다.
7. 반환값은 response model을 거쳐 클라이언트에 전달된다.

### 내 말로 설명하기

Schema는 서버가 받을 데이터의 양식이고 Pydantic은 그 양식을 검사하는 문지기다. `field_validator`는 방 하나를 검사하고 `model_validator`는 방 여러 개의 관계를 함께 검사한다고 생각할 수 있다.

---

## 4. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: FastAPI 서버에 Postman 요청을 보내고 Pydantic 검증 결과 확인
- 발생한 문제: 8000번 서버에 연결되지 않거나 Python 문법 오류가 발생함
- 오류 메시지:

```text
Error: connect ECONNREFUSED 127.0.0.1:8000
IndentationError: unexpected indent
IndentationError: unindent does not match any outer indentation level
SyntaxError: unterminated string literal
```

### 문제의 원인

- import 경로의 `presentation` 철자가 틀려 FastAPI 앱이 로드되지 않았고, 서버 포트가 열리지 않아 Postman 연결이 거절됐다.
- 주석 처리되지 않은 들여쓴 한 줄과 클래스 내부의 서로 다른 공백 수가 두 들여쓰기 오류를 만들었다.
- 문자열 종료 오류는 현재 저장본에서는 재현되지 않아 저장 전 상태 또는 reload 시점의 이전 코드 가능성만 남았다.

### 해결 원리

HTTP 클라이언트 오류만 보는 대신 다음 순서로 확인해야 한다.

```text
포트가 열렸는가?
  → 앱 import가 성공했는가?
  → Python 문법이 올바른가?
  → endpoint가 실행됐는가?
  → 입력 검증과 응답이 의도대로인가?
```

현재 import 철자와 들여쓰기는 수정된 형태이며 Python 문법 검사는 통과했다. 서버 재실행과 HTTP 응답은 아직 확인하지 않았으므로 완전히 해결됐다고 단정하지 않는다.

---

## 5. KPT 회고

### Keep — 계속할 것

- 오늘 잘한 점: 모르는 용어를 그냥 넘기지 않고 각 도구가 요청 흐름의 어느 위치에 있는지 질문했다.
- 계속 유지할 학습 방법: 오류를 포트·import·문법·endpoint·검증 단계로 나눠 확인한다.

### Problem — 개선할 것

- 이해하기 어려웠던 부분: 비슷해 보이는 schema·Pydantic·Swagger UI·Postman의 역할 구분
- 반복해서 실수한 부분: Python 블록의 들여쓰기와 편집 중 주석 범위
- 아직 설명하기 어려운 부분: before·field·after validator의 실제 실행 순서와 메서드 형태

### Try — 다음에 시도할 것

- 다시 공부할 내용: Create·Update·Response 스키마 분리와 `exclude_unset`
- 예제를 보지 않고 작성해볼 코드: 간단한 `BookCreate`와 title 정제 validator
- 다음 학습에서 바꿔볼 방법: validator마다 로그를 남기고 요청 하나가 통과하는 순서를 직접 확인한다.

---

## 6. 이해도 점검

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

평가 문제나 사용자 설명 확인을 수행하지 않았으므로 체크하지 않았다.

---

## 7. 다음 학습에서 할 일

1. before·field·after validator의 함수 이름과 서명을 정리하고 로그로 실행 순서를 확인한다.
2. Uvicorn을 실행한 뒤 Postman 또는 Swagger UI에서 정상 요청과 오류 요청을 비교한다.
3. POST의 반환값, 공통 응답 필드 철자, 가격 필수 여부를 정리한다.
