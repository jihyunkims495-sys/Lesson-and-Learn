# Preview Notes | 2026-11-03 | SQLAlchemy 비동기 ORM·관계·쿼리

> LV.2 · Week 12 · 백엔드 아키텍처 & API 설계

## 1. 전체 흐름

SQLAlchemy ORM 학습은 연결 설정에서 끝나지 않는다. Session 안에서 객체를 생성·조회·변경하고, 관계를 로딩하며, 안전한 검색과 Raw SQL까지 다루는 전체 흐름을 이해해야 한다.

```text
FastAPI Request
  → AsyncSession 주입
  → ORM Query 실행
  → ORM Model 또는 Row 반환
  → 필요한 관계 Loading
  → Pydantic Response 변환
  → HTTP Response
```

## 2. 학습 목표

1. AsyncEngine, Connection Pool, AsyncSession과 Transaction의 책임을 구분한다.
2. Declarative 모델과 Pydantic Schema의 역할을 구분한다.
3. `add`, `flush`, `commit`, `refresh`의 실행 순서를 설명한다.
4. `execute`, `scalars`, `scalar`, `get`의 반환 형태를 구분한다.
5. Foreign Key와 `relationship()`의 역할 차이를 이해한다.
6. 단방향 N:1, 양방향 1:N과 N:M 관계를 구분한다.
7. `selectinload`와 `joinedload`의 장단점을 비교한다.
8. 동적 조건, 정렬과 Pagination을 안전하게 구성한다.
9. Raw SQL에서 Bind Parameter가 필요한 이유를 설명한다.
10. Raw DML 이후 Session 상태와 DB 상태의 차이를 이해한다.

## 3. Engine, Pool과 Session

| 구성요소 | 책임 |
|---|---|
| AsyncEngine | DB Dialect와 Connection Pool 관리 |
| Connection Pool | 실제 DB Connection 재사용 |
| AsyncSession Factory | 요청마다 Session 생성 |
| AsyncSession | ORM 객체 상태와 논리적 Transaction 관리 |
| Transaction | 여러 DB 변경의 성공·실패 경계 |

```text
Request A → Session A → Connection 대여 → Commit/Rollback → 반환
Request B → Session B → Connection 대여 → Commit/Rollback → 반환
```

`AsyncSession`은 변경 가능한 상태를 가진 객체이므로 여러 동시 작업에서 하나를 공유하지 않는다. 일반적인 원칙은 작업 하나당 Session 하나다.

### `expire_on_commit=False`

Commit 후 ORM 속성을 다시 읽을 때 자동 만료로 인한 암시적 I/O를 줄일 수 있다. 다만 다른 Transaction에서 변경된 최신 값까지 자동으로 반영되는 것은 아니므로 필요할 때 `refresh()`하거나 다시 조회해야 한다.

### `create_all()`의 범위

`create_all()`은 등록된 Table이 없을 때 생성할 수 있지만 기존 Schema 변경 이력을 관리하는 Migration 도구는 아니다. Column이나 Constraint 변경은 Migration으로 관리한다.

## 4. Declarative 모델과 테이블 옵션

```python
class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    product_code: Mapped[str] = mapped_column(String(50))
    quantity: Mapped[int]

    __table_args__ = (
        UniqueConstraint("order_id", "product_code"),
        Index("ix_order_item_lookup", "order_id", "quantity"),
        CheckConstraint("quantity > 0"),
    )
```

`__table_args__`는 하위 `Table` 객체에 전달할 테이블 수준 설정을 선언한다.

- `UniqueConstraint`: 여러 Column 조합의 중복 방지
- `Index`: 자주 사용하는 조회 조건 보조
- `CheckConstraint`: DB에 저장할 수 있는 값의 조건 제한
- Dictionary 옵션: Schema나 DB별 테이블 옵션 지정

Application 검증은 의미 있는 오류를 제공하고, DB Constraint는 잘못된 데이터가 최종 저장되는 것을 방지한다.

## 5. ORM 모델과 Pydantic Schema

| 모델 | 역할 |
|---|---|
| ORM Model | DB Table, Column과 관계 매핑 |
| Request Schema | 클라이언트 입력 검증 |
| Response Schema | 외부에 공개할 Field 제한 |
| Domain Model | 비즈니스 규칙과 상태 변경 |

`from_attributes=True`를 사용하면 ORM 객체의 속성에서 Response Schema 값을 읽을 수 있다. 비밀번호 해시처럼 공개하면 안 되는 Field는 Response Schema에서 제외해야 한다.

## 6. 단일 테이블 CRUD

### Create

```text
중복 확인
  → ORM 객체 생성
  → add
  → flush 또는 commit
  → refresh
  → 응답 변환
```

- `add()`: 새 객체를 Session의 추적 대상으로 만든다.
- `flush()`: SQL을 DB로 보내지만 Transaction을 확정하지 않는다.
- `commit()`: Transaction을 확정한다.
- `refresh()`: DB의 현재 값을 다시 읽는다.

중복 Select는 친절한 오류를 만들 수 있지만 동시 요청의 중복 저장을 완전히 막지 못한다. 최종 방어선은 DB의 Unique Constraint와 `IntegrityError` 처리다.

### Read

| 목적 | 일반적인 방식 |
|---|---|
| Primary Key 한 건 | `await session.get(Entity, pk)` |
| Entity 목록 | `(await session.scalars(stmt)).all()` |
| 0개 또는 1개 | `(await session.scalars(stmt)).one_or_none()` |
| 첫 Entity | `(await session.scalars(stmt)).first()` |
| Column·집계 Row | `await session.execute(stmt)` |

`first()`가 SQL에 자동으로 `LIMIT 1`을 추가한다고 가정하지 않는다. DB에서 한 행만 받으려면 Statement에 `.limit(1)`을 명시한다.

### Update와 Delete

Session이 추적하는 객체의 속성을 바꾸면 Flush 시 Dirty Checking으로 `UPDATE`가 생성된다. `delete()`는 객체를 삭제 대상으로 표시하고 Commit 시 반영한다. 자식 데이터 처리 방식은 ORM Cascade와 DB의 `ON DELETE` 설정을 함께 확인해야 한다.

## 7. 관계 매핑

### Foreign Key와 `relationship()`

| 구성 | 역할 |
|---|---|
| `ForeignKey` | DB Row 사이의 참조 무결성 |
| `relationship()` | Python 객체 사이의 탐색과 Loading |

Foreign Key만으로 Python 객체 속성이 자동 생성되지는 않으며, `relationship()`만으로 DB 제약조건이 생기는 것도 아니다.

### 관계 종류

```text
N:1  Post 여러 개 → User 한 명
1:N  User 한 명 → Post 여러 개
N:M  Post 여러 개 ↔ 연결 테이블 ↔ Tag 여러 개
```

양방향 관계는 `back_populates`로 양쪽 속성을 연결한다. N:M 연결 자체에 생성 시각, 작성자나 순서 같은 속성이 필요하면 단순 연결 테이블보다 Association Object를 고려한다.

### Cascade

- ORM Cascade: Session이 객체 삭제와 고아 객체 처리를 수행한다.
- DB Cascade: Foreign Key 규칙에 따라 DB가 자식 Row를 처리한다.

두 설정은 실행 주체와 시점이 다르므로 함께 설계해야 한다.

## 8. 관계 Loading 전략

### `selectinload`

```text
Query 1: 부모 목록 조회
Query 2: 부모 ID 목록으로 자식 일괄 조회
```

1:N과 N:M Collection에서 N+1 문제를 줄이는 일반적인 선택이다.

### `joinedload`

JOIN으로 관련 객체를 한 Result Set에 포함한다. N:1이나 1:1 관계에서 유리할 수 있지만 Collection에 사용하면 부모 Row가 자식 수만큼 중복될 수 있다.

### Async 환경의 Lazy Loading

속성 접근 순간 암시적 Select가 발생하면 명시적 `await` 밖에서 I/O가 실행될 수 있다. Query 시점의 Eager Loading, Async 전용 명시적 접근이나 예상하지 못한 Lazy Load를 막는 전략을 검토한다.

로딩 방식은 관계 이름만 보고 고정하지 않고 Query 수, Row 중복, Collection 크기와 실제 응답 범위에 맞춰 선택한다.

## 9. 조건, 정렬과 Pagination

```python
conditions = []

if keyword:
    conditions.append(Post.title.icontains(keyword))
if author_id:
    conditions.append(Post.author_id == author_id)

stmt = select(Post).where(*conditions)
```

- 입력된 조건만 목록에 추가한다.
- 사용자 입력을 SQL 문자열에 직접 붙이지 않는다.
- 정렬 Field는 허용 목록을 ORM Column에 매핑한다.
- Pagination에는 안정적인 `ORDER BY`를 둔다.
- 같은 정렬값이 존재할 수 있으므로 Primary Key 같은 고유 Tie-breaker를 함께 사용한다.

Offset이 커지면 앞 Row를 많이 건너뛰어야 하므로 대용량 데이터에서는 Cursor 또는 Keyset Pagination을 비교한다.

## 10. Raw SQL

```python
query = text("""
    SELECT id, email
    FROM users
    WHERE id = :user_id
""")

result = await session.execute(query, {"user_id": user_id})
```

Bind Parameter는 SQL 구조와 값을 분리해 Injection을 막고 Driver가 값을 안전하게 전달하도록 한다.

Raw `UPDATE`나 `DELETE`를 실행하면 Session이 추적 중인 ORM 객체와 DB 상태가 달라질 수 있다. 이후 객체 사용 여부에 따라 `refresh`, `expire`, 명시적 재조회 또는 새 Session을 선택한다.

## 11. 예상 난점

1. Engine, Connection과 Session을 같은 객체로 이해하기
2. `add()`가 곧 영구 저장이라고 생각하기
3. `commit()`과 `refresh()`의 역할을 혼동하기
4. Foreign Key와 `relationship()`을 같은 기능으로 보기
5. ORM Cascade와 DB Cascade를 같은 설정으로 보기
6. 관계 Loading 전략을 관계 종류별 절대 규칙으로 외우기
7. Async 환경에서 암시적 I/O가 발생하는 시점을 놓치기
8. Offset Pagination에 안정적인 정렬 기준을 두지 않기
9. Raw SQL에 사용자 입력을 문자열로 결합하기
10. Raw DML 후 ORM 객체가 오래된 상태일 수 있다는 점을 놓치기

## 12. 예정 실습

- 객체의 `new → pending → persistent` 상태 변화를 확인한다.
- `add`, `flush`, `commit`, `refresh` 전후 값을 비교한다.
- User와 Post 관계에서 Foreign Key Row와 객체 관계를 각각 확인한다.
- `selectinload`와 `joinedload`가 생성하는 SQL과 Result 모양을 비교한다.
- 동적 검색 조건과 정렬 허용 목록을 구현한다.
- Bind Parameter와 문자열 결합 Raw SQL을 비교한다.
- Raw Update 후 기존 객체, Refresh 결과와 새 Session 조회 결과를 비교한다.

## 13. 수업 전 확인 질문

1. 요청마다 별도 `AsyncSession`을 사용해야 하는 이유는 무엇인가?
2. `add`, `flush`, `commit`, `refresh`는 각각 언제 필요한가?
3. `__table_args__`에 선언할 수 있는 설정에는 무엇이 있는가?
4. 중복 조회가 있어도 DB Unique Constraint가 필요한 이유는 무엇인가?
5. `execute(select(User))`와 `scalars(select(User))`의 반환 모양은 어떻게 다른가?
6. Foreign Key와 `relationship()`은 각각 무엇을 담당하는가?
7. `selectinload`가 두 번 조회하면서도 N+1을 줄이는 이유는 무엇인가?
8. Collection에 `joinedload`를 사용하면 어떤 중복이 생길 수 있는가?
9. Pagination에 고유한 Tie-breaker가 필요한 이유는 무엇인가?
10. Raw SQL Bind Parameter가 문자열 결합보다 안전한 이유는 무엇인가?

## 관련 자료

- [오늘의 Learning Notes](./02-learning-notes-01-four-layered-architecture.md)
- [오늘의 TIL](./04-til-01-four-layered-architecture.md)
- [Week 12 학습 기록](../README.md)
