# Learning Notes | 2026-11-03 | 4계층 아키텍처와 도메인 중심 설계

> LV.2 · Week 12 · 백엔드 아키텍처 & API 설계

## 1. 왜 계층을 분리하는가

4계층을 나누는 목적은 파일 수를 늘리는 것이 아니라 **변경 이유가 다른 코드를 분리하는 것**이다. HTTP 형식이 바뀌거나 데이터베이스를 교체해도 핵심 비즈니스 규칙이 함께 흔들리지 않도록 경계를 만든다.

| 계층 | 핵심 책임 | 포함할 내용 |
|---|---|---|
| Presentation | 외부 요청과 응답 처리 | Router, 요청·응답 DTO, HTTP 오류 변환 |
| Application | 유스케이스 순서 조율 | 조회, 도메인 호출, 저장, 트랜잭션 흐름 |
| Domain | 비즈니스 규칙과 상태 변경 | Entity, Value Object, Aggregate, Port |
| Infrastructure | 외부 기술의 구체 구현 | SQLAlchemy, DB, 암호화, 외부 API Adapter |

의존성은 바깥의 구체 기술이 안쪽의 추상화에 맞추는 방향으로 설계한다. Domain은 FastAPI나 SQLAlchemy를 몰라도 동작할 수 있어야 한다.

## 2. 도메인 모델의 구성요소

- **Entity**: 식별자로 같은 대상을 구분한다. 속성이 바뀌어도 식별자가 같으면 같은 객체다.
- **Value Object**: 별도 식별자보다 값 전체가 중요하다. 유효성 검증과 의미 있는 동작을 함께 둔다.
- **Aggregate**: 하나의 트랜잭션에서 일관성을 함께 지켜야 하는 객체의 경계다.
- **Aggregate Root**: Aggregate 외부에서 접근하는 대표 Entity이며, 내부 상태 변경의 진입점이다.

데이터 필드만 두고 핵심 검증을 Controller나 Service에 흩어 놓으면 **Anemic Domain Model**이 되기 쉽다. 반대로 Entity가 자신의 상태와 관련된 규칙을 스스로 지키면 규칙을 한곳에서 재사용할 수 있다.

```python
class Course:
    def __init__(self, capacity: int, current_students: int = 0):
        self.capacity = capacity
        self.current_students = current_students

    def apply_registration(self) -> None:
        if self.current_students >= self.capacity:
            raise ValueError("정원이 가득 찼습니다.")
        self.current_students += 1
```

`capacity=2`, `current_students=2`라면 등록을 거부하고 인원수는 바뀌지 않는다. 이 규칙이 Domain에 있으면 HTTP 요청뿐 아니라 배치 작업이나 다른 인터페이스에서도 동일하게 적용된다.

## 3. Repository는 변환 경계다

Repository는 단순한 쿼리 모음이 아니다. Infrastructure의 ORM 모델을 순수 Domain 객체로 변환하고, 변경된 Domain 객체를 다시 영속화하는 Adapter 역할을 한다.

```text
SQLAlchemy Model
      ↓ Repository가 변환
Domain Entity
      ↓ Domain Method 실행
변경된 Domain Entity
      ↓ Repository가 저장
Database
```

Application과 Domain이 ORM 객체를 직접 사용하지 않으면 테이블 구조와 세션 처리 방식이 핵심 규칙으로 새어 들어오는 것을 막을 수 있다.

## 4. `__table_args__`의 역할

SQLAlchemy Declarative 모델의 `__table_args__`는 하위 `Table` 객체에 전달할 테이블 수준 설정을 선언한다.

```python
__table_args__ = (
    UniqueConstraint("order_id", "product_code", name="uq_order_item_product"),
    Index("ix_order_item_lookup", "order_id", "quantity"),
    CheckConstraint("quantity > 0", name="ck_order_item_quantity_positive"),
)
```

- `UniqueConstraint`: 여러 컬럼 조합의 중복을 방지한다.
- `Index`: 자주 조회하는 컬럼 조합의 검색을 돕는다.
- `CheckConstraint`: 데이터베이스 수준에서 값의 조건을 강제한다.

Domain 규칙과 DB 제약조건은 경쟁 관계가 아니다. Domain은 의미 있는 오류와 행동을 책임지고, DB 제약조건은 잘못된 데이터가 최종 저장되는 것을 한 번 더 막는다.

## 5. 의존성 와이어링

Domain 또는 Application은 필요한 기능을 Port로 정의하고, Infrastructure는 구체 Adapter를 구현한다. 애플리케이션 시작 지점인 Composition Root가 두 대상을 연결한다.

```text
Router
  → Application Service
    → Domain Entity
    → Repository Port
      ← SQLAlchemy Repository Adapter

Composition Root
  → Port와 실제 Adapter를 연결
```

FastAPI에서는 `Depends`로 연결 지점을 표현하고, `dependency_overrides` 또는 생성 함수를 통해 실제 구현체를 주입할 수 있다. Router는 어떤 DB나 암호화 라이브러리를 쓰는지 몰라도 된다.

## 6. 코드화할 때의 순서

한 번에 전체 폴더를 만들기보다 작은 유스케이스 하나를 아래 순서로 완성한다.

1. 입력, 성공 결과, 실패 조건을 문장으로 적는다.
2. DB 없이 Entity와 Domain Method를 작성한다.
3. Repository Port를 정의한다.
4. Application Service에서 조회 → 규칙 실행 → 저장 순서를 연결한다.
5. 메모리 Adapter로 먼저 흐름을 확인한다.
6. SQLAlchemy Adapter와 ORM 변환을 붙인다.
7. 마지막으로 Router와 의존성 와이어링을 연결한다.

이 순서는 각 계층의 책임을 한 번에 하나씩 확인할 수 있게 해준다.

## 7. 오늘 확인한 범위

- 실제 프로젝트의 계층별 파일과 의존성 연결 구조를 읽고 개념을 연결했다.
- 제공된 실행 로그에서 애플리케이션 startup 완료를 확인했다.
- startup 성공은 서버 기동의 근거이지만 개별 API, DB 쿼리, CRUD와 동시성 동작의 검증 결과는 아니다.
- 구조를 이해한 것과 예제 없이 전체 유스케이스를 독립적으로 구현하는 능력은 구분해야 한다.

## 관련 자료

- [오늘의 TIL](./04-til-01-four-layered-architecture.md)
- [Week 12 학습 기록](../README.md)
