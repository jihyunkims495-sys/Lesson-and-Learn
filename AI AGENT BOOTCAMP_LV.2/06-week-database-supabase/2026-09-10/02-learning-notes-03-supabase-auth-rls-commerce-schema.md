# Supabase Auth·RLS·쇼핑몰 테이블 관계 학습 정리

- 학습 날짜: 2026-09-10
- Level / Week: LV.2 / Week 6
- 범위: Supabase SDK, Auth, RLS, Enum, FK, 쇼핑몰 ERD와 CRUD 구조
- 근거: 당일 예습 문서, 수업 중 질문·오류, ERD 이미지, 로컬 CRUD 실습 코드
- 상태: 수업에서 다룬 개념 정리. 실제 Supabase 테이블 저장·정책 적용·CRUD 성공 전체를 확인한 기록은 아니다.

## 1. 프론트엔드·백엔드·데이터베이스

- 프론트엔드는 사용자가 보는 화면과 클라이언트 상호작용을 담당한다.
- 백엔드는 요청 처리, 인증, 권한, 비즈니스 로직을 담당한다.
- 데이터베이스는 실제 데이터를 저장하고 조회·수정·삭제한다.
- SQL로 매출 데이터를 추출하는 일은 목적에 따라 데이터 분석이거나, 화면에 결과를 공급하는 백엔드 기능이 될 수 있다.

Supabase는 PostgreSQL 데이터베이스, 자동 생성 Data API, Authentication, RLS 등을 제공하여 별도 백엔드를 처음부터 모두 만들지 않고 앱의 데이터 계층을 학습할 수 있게 한다.

## 2. SDK와 메서드 체이닝

```python
response = (
    supabase.table("documents")
    .select("*")
    .eq("user_id", user_id)
    .execute()
)
```

- `table()`, `select()`, `eq()`, `execute()`는 데이터 요청을 구성·실행하는 메서드다.
- 앞 메서드가 다음 호출이 가능한 객체를 반환하여 메서드를 이어 쓰는 방식을 메서드 체이닝이라고 한다.
- 조건을 차례로 쌓아 최종 쿼리를 만드는 구조는 쿼리 빌더 또는 빌더 형태로 볼 수 있다.
- `execute()` 전까지 요청을 구성하고, `execute()`에서 실제 요청을 보낸다.

## 3. 계정 생성과 로그인을 반복한 이유

수업에서 계정 생성·로그인·문서 조회를 반복한 목적은 단순 로그인 연습이 아니라 사용자별 데이터 접근을 확인하기 위해서다.

```text
회원가입
→ Auth가 사용자 UUID 생성
→ 로그인으로 현재 사용자 확인
→ 데이터 행에 user_id 저장
→ RLS가 로그인 사용자와 행의 user_id 비교
→ 자기 데이터만 조회·수정·삭제
```

서로 다른 계정으로 같은 조회를 실행하면 RLS가 사용자마다 다른 행을 보여 주거나 차단하는지 확인할 수 있다.

## 4. `auth.users`와 `user_details`

- `auth.users`: Supabase가 관리하는 로그인 계정과 인증 정보
- `public.user_details`: 판매자·구매자 유형, 전화번호, 주소 등 서비스에서 필요한 추가 정보
- `user_details.id`는 `auth.users.id`를 참조하는 UUID PK·FK로 설계한다.

두 테이블을 분리하면 비밀번호와 인증 처리는 Supabase에 맡기고, 서비스에 필요한 회원 정보만 공개 스키마에서 관리할 수 있다.

## 5. Enum과 외래키

Enum은 컬럼에 허용할 값을 미리 제한하는 PostgreSQL 사용자 정의 자료형이다.

```sql
create type public.user_type as enum ('SELLER', 'BUYER');
```

외래키는 다른 테이블에 실제로 존재하는 값만 저장하도록 관계를 강제한다.

```text
products.seller_id → user_details.id
orders.user_id     → user_details.id
```

외래키 양쪽 자료형은 같아야 한다. `user_details.id`가 UUID라면 `seller_id`와 `user_id`도 UUID여야 하며, `int8`은 PostgreSQL의 `bigint`이므로 UUID 외래키에 사용할 수 없다.

## 6. 쇼핑몰 ERD의 관계

```text
auth.users 1 ── 1 user_details
user_details 1 ── N products
user_details 1 ── N orders
orders 1 ── N order_items N ── 1 products
```

- 판매자는 여러 상품을 등록할 수 있다.
- 구매자는 여러 주문을 만들 수 있다.
- 한 주문에 여러 상품이 들어가고 한 상품도 여러 주문에 포함될 수 있어 `order_items`가 중간 테이블 역할을 한다.
- `deleted_at`은 행을 물리적으로 지우지 않고 삭제 상태를 표시하는 소프트 삭제에 사용한다.

## 7. RLS

RLS(Row Level Security)는 로그인한 사용자가 접근할 수 있는 행을 데이터베이스에서 강제하는 보안 기능이다.

```sql
auth.uid() = user_id
```

대표 관계:

- `user_details`: `auth.uid() = id`
- `products`: 판매자 쓰기 작업에서 `auth.uid() = seller_id`
- `orders`: 구매자 작업에서 `auth.uid() = user_id`

애플리케이션 코드의 `.eq("user_id", user.id)`는 정상적인 조회 조건이고, RLS는 조건을 제거한 직접 요청도 막는 데이터베이스 보안 규칙이다.

## 8. 아직 확인이 필요한 부분

- Supabase Table Editor에서 오늘 설계한 모든 테이블과 FK가 최종 저장됐는지 미확인
- Enum과 주문 상태값이 실제 DB에 같은 이름으로 생성됐는지 미확인
- 세 테이블의 RLS 정책과 `authenticated` 권한 적용 여부 미확인
- 작성한 CRUD 코드와 실제 Supabase 프로젝트의 통합 실행 미확인
- `order_items` CRUD는 이번 코드 작성 범위에서 제외

[← Week 6](../README.md)
