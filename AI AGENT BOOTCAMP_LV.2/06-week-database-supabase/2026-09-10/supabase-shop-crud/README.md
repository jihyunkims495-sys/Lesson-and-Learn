# Supabase 쇼핑몰 CRUD 실습

2026-09-10 LV.2 Week 6 수업의 ERD를 기준으로 작성한 Python 예제입니다.

## 구현 범위

- `auth.users`: Supabase Auth의 회원가입·로그인·로그아웃
- `public.user_details`: 로그인 사용자 본인의 회원 상세정보 CRUD
- `public.products`: 판매자 본인의 상품 CRUD
- `public.orders`: 구매자 본인의 주문 CRUD
- 삭제는 ERD의 `deleted_at`을 사용하는 소프트 삭제

`order_items`는 이번 요청의 CRUD 대상에 포함되지 않아 구현하지 않았습니다.

## VS Code에서 실행 준비

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

`.env`에 자신의 Supabase Project URL과 Publishable key를 입력합니다. Secret key와 레거시 `service_role` key는 넣지 않습니다.

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

조회 예제 실행:

```powershell
python main.py
```

`main.py`는 자동으로 데이터를 생성·수정·삭제하지 않고 로그인한 사용자의 회원정보·상품·주문만 조회합니다.

## CRUD 사용 예시

### 회원 상세정보

```python
from src.config import get_supabase_client
from src.user_details_crud import UserDetailsCRUD

client = get_supabase_client()
users = UserDetailsCRUD(client)

users.create(user_type="BUYER", cellphone="010-0000-0000")
users.read_my_profile()
users.update_my_profile(address="서울시", address_sub="상세주소")
users.soft_delete_my_profile()
```

### 상품

```python
from src.products_crud import ProductsCRUD

products = ProductsCRUD(client)

created = products.create("연습 상품", 10000, "CRUD 연습용")
products.read_all()
products.read_my_products()
products.update(created[0]["id"], price=12000)
products.soft_delete(created[0]["id"])
```

### 주문

```python
from src.orders_crud import OrdersCRUD

orders = OrdersCRUD(client)

created = orders.create(
    order_no="20260910-001",
    order_name="주문자",
    order_email="buyer@example.com",
    order_phone="010-0000-0000",
    receiver_name="수령인",
    receiver_phone="010-0000-0000",
    zipcode="00000",
    address="서울시",
    total_price=12000,
)
orders.read_my_orders()
orders.read_one(created[0]["id"])
orders.update(created[0]["id"], order_status="IN_CASH")
orders.soft_delete(created[0]["id"])
```

## 테이블 전제

- `user_details.id`: `uuid`, `auth.users.id`를 참조하는 PK·FK
- `products.id`: `uuid`
- `products.seller_id`: `uuid`, `user_details.id` 참조
- `orders.id`: `uuid`
- `orders.user_id`: `uuid`, `user_details.id` 참조
- `created_at`, `modified_at`, `deleted_at`: `timestamptz`
- `price`, `total_price`: 정수형

실제 컬럼명이 ERD와 다르면 Python 코드의 payload 키도 실제 컬럼명에 맞춰야 합니다.

## RLS 확인

Publishable key로 실행하려면 테이블별 RLS 정책과 `authenticated` 역할의 권한이 필요합니다.

- `user_details`: `auth.uid() = id`
- `products`: 쓰기 작업에서 `auth.uid() = seller_id`
- `orders`: `auth.uid() = user_id`

정책이 없으면 정상적인 코드라도 빈 결과나 권한 오류가 발생할 수 있습니다.

## 검증 명령

```powershell
python -m compileall .
python -m unittest discover -s tests -v
```

실제 Supabase 쓰기 작업은 실행하지 않았습니다.
