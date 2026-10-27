# 2장 1강 학습 정리 - Pydantic과 FastAPI 요청 검증

- 학습일: 2026-10-27
- 과정: AI Agent Bootcamp LV.2 / Week 11
- 실제 수업 범위: 2장 1강 타입 힌트와 Pydantic 모델 검증
- 이해도: 별도 평가를 수행하지 않아 미확인

## 전체 흐름

```text
Postman 또는 Swagger UI
  → Uvicorn
  → FastAPI router
  → Pydantic request schema
  → endpoint와 업무 로직
  → response_model
  → HTTP response
```

Uvicorn은 서버, FastAPI는 요청을 함수와 연결하는 프레임워크, Pydantic은 서버 내부의 데이터 검사기다. Swagger UI와 Postman은 요청을 만들어 서버 응답을 관찰하는 도구다.

## 타입 힌트에서 실행 중 검증으로

Python 타입 힌트는 데이터의 예상 형태를 나타낸다. `list[str]`, `int | None`, `tuple[float, float]`, `int | str`, `Literal[...]`처럼 복합 형태도 표현할 수 있다. 그러나 일반 타입 힌트만으로 외부 JSON을 실행 중 강제 검증하지는 않는다.

Pydantic은 타입 힌트를 바탕으로 다음 작업을 수행한다.

- 입력 필드와 타입 확인
- 허용되는 타입 변환
- 문자열 길이와 숫자 범위 검사
- 중첩 모델의 각 항목 검사
- 사용자 정의 validator 실행
- 검증된 모델을 딕셔너리·JSON으로 직렬화

## 검증 순서

```text
원본 입력
  → model_validator(mode="before")
  → 타입 변환과 Field 제약
  → field_validator
  → model_validator(mode="after")
  → 검증된 모델 인스턴스
```

- before validator는 타입 변환 전 전체 원본 입력을 가공한다.
- field validator는 title처럼 특정 필드를 정제·검사한다.
- after validator는 정가와 할인가처럼 여러 필드의 관계를 검사한다.

## 스키마 분리

| 스키마 | 역할 |
|---|---|
| `BookCreate` | 새 도서 생성 입력 검증 |
| `BookUpdate` | 일부 필드 수정 입력 검증 |
| `BookResponse` | 클라이언트에 보낼 출력 계약 |
| `APIResponse[T]` | 성공 여부·오류·데이터의 공통 응답 구조 |

부분 수정에서는 `model_dump(exclude_unset=True)`로 사용자가 실제 요청에 넣은 필드만 추출한다. 이를 기존 데이터와 합친 뒤 전체 생성 규칙으로 다시 검증하면 수정 후 데이터의 일관성을 확인할 수 있다.

## 현재 코드에서 확인한 구조

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

현재 저장본에는 `POST /books`, `GET /books`, `BookCreate`, `BookResponse`, Generic `APIResponse[T]`가 있다. 두 Python 파일은 AST 문법 검사를 통과했다.

다만 다음은 runtime 재검증이 필요하다.

- before·after validator의 메서드 이름이 동일한 문제
- before validator의 Pydantic v2 서명
- `POST /books`의 명시적인 반환값
- `sucess` 필드 철자
- 가격을 생성 시 선택값으로 둘지 여부
- Uvicorn 실행과 Postman/Swagger UI 응답

## 4계층과의 연결

Pydantic schema와 FastAPI router는 주로 Presentation 계층에 속한다. Application은 사용 사례 흐름을 조율하고, Domain은 업무 규칙을 담당하며, Infrastructure는 DB 같은 외부 기술을 구현한다. 현재 코드는 Pydantic과 router를 배우는 단계이므로 폴더가 여러 개라고 해서 이미 완전한 4계층 구조인 것은 아니다.

## 한 줄 정리

Pydantic은 타입 힌트를 실제 API 입력 검증 규칙으로 실행해 검증된 데이터만 endpoint에 전달한다.

