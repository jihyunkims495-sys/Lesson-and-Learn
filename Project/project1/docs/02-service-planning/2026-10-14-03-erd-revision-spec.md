# ONEPIECE ERD 수정 명세

## 문서 정보

- 작성일: 2026-10-14
- 대상: ONEPIECE 쇼핑몰 ERD
- 기존 ERD: ERDCloud `shoppingmall`
- 검토 기준: 튜터 피드백, Product 타입 정합성, Cart 구현, 페이지 체류시간, 구매전환율
- 문서 상태: 튜터 피드백 반영 수정안
- 원칙: 기존 테이블을 보존하면서 수정·추가하고, 삭제는 팀 합의 전 보류함

## 1. 수정 목적

현재 ERD의 기본 커머스 관계를 유지하면서 다음 내용을 보강한다.

1. DB 테이블과 프론트엔드 Product 타입의 필드·자료형을 대응시킨다.
2. 상품·게시글 등 여러 도메인의 파일을 `gid + location` 공통 구조로 관리한다.
3. 상품·옵션·Cart·주문 사이의 PK·FK 관계를 명확히 한다.
4. Cart에 담았을 당시와 주문이 완료됐을 당시의 값을 Snapshot으로 보존한다.
5. 페이지 체류시간과 구매 퍼널을 세션 단위로 측정한다.
6. 가상 고객과 테스트 이벤트를 실제 데이터와 분리한다.

Snapshot은 화면 이미지가 아니라 특정 시점의 데이터를 복사해 보존하는 것을 의미한다.

## 2. 현재 ERD 확인 결과

### 현재 엔티티

```text
categories
products
product_variants
users
orders
order_items
user_events
```

### 현재 관계

```text
categories.parent_id → categories.id
products.category_id → categories.id
product_variants.product_id → products.id
orders.user_id → users.id
order_items.order_id → orders.id
order_items.product_variant_id → product_variants.id
```

### 현재 테이블별 판정

| 테이블 | 판정 | 핵심 보강 |
|---|---|---|
| `categories` | 유지·보강 | 시간 필드 |
| `products` | 수정 | 이미지 배열, 가격 기준, 활성 상태 |
| `product_variants` | 유지·보강 | 추가금·활성 상태·시간 |
| `users` | 구조 결정 | Supabase Auth 사용 시 `profiles` |
| `orders` | 대폭 보강 | 금액·배송·고객 Snapshot |
| `order_items` | 대폭 보강 | 상품·옵션·가격 Snapshot |
| `user_events` | 유지·보강 | FK, JSONB, `is_test`, Cart·Order 연결 |

### 현재 ERD의 주요 누락

- `carts`, `cart_items`가 없다.
- `products.image_url`이 단일 이미지이며, 페이지별 이미지 용도와 다중 파일을 구분할 수 없다.
- 상품·게시글 등에서 재사용할 공통 파일 그룹과 `gid`가 없다.
- 주문 당시 상품명·옵션·이미지가 보존되지 않는다.
- 주문 당시 수령인·주소가 보존되지 않는다.
- `user_events`의 사용자·상품 FK가 명확하지 않다.
- 이벤트에 `is_test`가 없다.
- 세션과 페이지 체류시간 전용 테이블이 없다.
- A/B 실험 Variant를 기록할 구조가 없다.

## 3. 설계 원칙

### 3.1 데이터 층 구분

| 데이터 층 | 의미 | 테이블 |
|---|---|---|
| Master | 현재 최신 상태 | `categories`, `products`, `product_variants`, `profiles` |
| Cart Snapshot | 담았을 당시 참고값 | `cart_items` |
| Order Snapshot | 구매 확정 당시 불변값 | `orders`, `order_items` |
| Event Snapshot | 행동 발생 당시 문맥 | `user_events`, `page_views` |
| Metric Snapshot | 일별 집계 결과 | `funnel_daily_snapshots` |

### 3.2 이름 규칙

- 담기 시점 값: `*_at_added`
- 주문 확정 값: `*_snapshot`
- 이벤트 발생 시점: `occurred_at`
- 생성·수정 시간: `created_at`, `updated_at`
- 테스트 구분: `is_test`

### 3.3 자료형 규칙

| 목적 | PostgreSQL | TypeScript |
|---|---|---|
| 식별자 | `BIGINT` 또는 `UUID` | `number` 또는 `string` |
| 원 단위 가격 | `INT` | `number` |
| 문자열 | `VARCHAR`, `TEXT` | `string` |
| 이미지 목록 | 공통 파일 테이블 조회 결과 | `string[]` |
| 시간 | `TIMESTAMPTZ` | `string` 또는 `Date` |
| 이벤트 속성 | `JSONB` | `Record<string, unknown>` |
| 여부 | `BOOLEAN` | `boolean` |

- 가격은 원 단위 정수를 사용한다.
- Supabase에서는 `DATETIME` 대신 `TIMESTAMPTZ`를 사용한다.
- 상품을 운영 기록과 함께 보존하기 위해 물리 삭제보다 `is_active`를 사용한다.

## 4. 기존 테이블 수정 명세

### 4.1 `categories`

```text
id BIGINT PK
parent_id BIGINT FK → categories.id NULL
name VARCHAR(100) NOT NULL
slug VARCHAR(100) UNIQUE NOT NULL
depth SMALLINT NOT NULL
sort_order INT DEFAULT 0
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

- 기존 자기참조 구조를 유지한다.
- `depth`는 1이면 대분류, 2이면 중분류로 사용한다.

### 4.2 `products`

권장 P0 구조:

```text
id BIGINT PK
category_id BIGINT FK → categories.id
name VARCHAR(255) NOT NULL
brand VARCHAR(50) NOT NULL
description TEXT NOT NULL
price INT NOT NULL CHECK price >= 0
is_new BOOLEAN DEFAULT false
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

변경:

```text
image_url VARCHAR(500) → 제거 후 media_groups, media_files로 이전
list_price, sale_price → P0에서는 price로 단순화
```

- 상품 이미지 원본은 `products`에 배열로 중복 저장하지 않는다.
- 화면에서 필요한 `images: string[]`은 `media_groups`와 `media_files`를 조회해 조합한다.
- 단기 Mock Data 단계에서는 프론트엔드 객체에 `images: string[]`을 둘 수 있지만, DB 연결 시 공통 파일 테이블을 데이터 원본으로 사용한다.

할인 기능이 필요해지면 `list_price`, `sale_price`를 다시 분리하고 Product 타입도 같은 기준으로 확장한다.

### 4.3 `product_variants`

```text
id BIGINT PK
product_id BIGINT FK → products.id
sku VARCHAR(100) UNIQUE NOT NULL
color VARCHAR(50) NOT NULL
size VARCHAR(30) NOT NULL
stock_quantity INT DEFAULT 0 CHECK stock_quantity >= 0
additional_price INT DEFAULT 0
sale_status VARCHAR(30) NOT NULL
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

### 4.4 `users` 또는 `profiles`

Supabase Auth 연동 권장안:

```text
profiles
id UUID PK, FK → auth.users.id
name VARCHAR(100)
phone VARCHAR(20)
age_group VARCHAR(10)
fashion_engagement VARCHAR(20)
acquisition_source VARCHAR(30)
status VARCHAR(20)
is_test BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

- 이메일은 기본적으로 `auth.users`에서 관리한다.
- 가상 고객은 `is_test = true`로 구분한다.
- 이번 프로젝트에서 Auth를 연결하지 않으면 기존 `users BIGINT`를 유지할 수 있다.

### 4.5 `orders`

```text
id UUID PK
user_id UUID FK → profiles.id NULL
session_id UUID NULL
order_number VARCHAR(100) UNIQUE NOT NULL
status VARCHAR(30) NOT NULL
purchase_channel VARCHAR(30)
subtotal_amount INT NOT NULL
shipping_fee INT NOT NULL
discount_amount INT DEFAULT 0
total_amount INT NOT NULL
customer_email_snapshot VARCHAR(255)
recipient_name_snapshot VARCHAR(100)
recipient_phone_snapshot VARCHAR(20)
postal_code_snapshot VARCHAR(20)
address1_snapshot VARCHAR(255)
address2_snapshot VARCHAR(255)
ordered_at TIMESTAMPTZ
is_test BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

회원이 주소나 전화번호를 변경해도 기존 주문 배송정보는 수정하지 않는다.

### 4.6 `order_items`

```text
id UUID PK
order_id UUID FK → orders.id
product_id BIGINT FK → products.id NULL
product_variant_id BIGINT FK → product_variants.id NULL
product_name_snapshot VARCHAR(255) NOT NULL
category_name_snapshot VARCHAR(100) NOT NULL
sku_snapshot VARCHAR(100) NOT NULL
color_snapshot VARCHAR(50)
size_snapshot VARCHAR(30)
image_url_snapshot TEXT
unit_price_snapshot INT NOT NULL
quantity INT NOT NULL CHECK quantity > 0
discount_amount_snapshot INT DEFAULT 0
line_total_snapshot INT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

`products`나 `product_variants`가 변경되어도 `_snapshot` 필드는 업데이트하지 않는다.

### 4.7 `user_events`

```text
id UUID PK
session_id UUID FK → analytics_sessions.id
page_view_id UUID FK → page_views.id NULL
user_id UUID FK → profiles.id NULL
anonymous_id VARCHAR(100) NULL
product_id BIGINT FK → products.id NULL
cart_id UUID FK → carts.id NULL
order_id UUID FK → orders.id NULL
event_name VARCHAR(50) NOT NULL
page_path VARCHAR(500) NOT NULL
page_type VARCHAR(30)
occurred_at TIMESTAMPTZ DEFAULT now()
duration_ms INT NULL
device_type VARCHAR(30)
referrer VARCHAR(500)
event_properties JSONB
is_test BOOLEAN DEFAULT false
```

필수 이벤트:

```text
site_view
product_list_view
product_view
add_to_cart
cart_view
checkout_start
purchase_completed
```

`event_properties`에는 이메일·전화번호·주소를 넣지 않는다.

## 5. 신규 테이블 추가 명세

### 5.1 `media_groups` — 공통 파일 그룹

`gid`는 Group ID이며, 동일한 상품·게시글 등에 속하는 여러 파일을 하나로 묶는 식별자다.

```text
gid UUID PK DEFAULT gen_random_uuid()
resource_type VARCHAR(30) NOT NULL
resource_id VARCHAR(100) NULL
is_temporary BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

필드 의미:

| 필드 | 의미 | 예시 |
|---|---|---|
| `gid` | 동일 대상의 파일 묶음 ID | `550e8400-...` |
| `resource_type` | 파일이 속한 도메인 | `product`, `post`, `review`, `banner` |
| `resource_id` | 대상 레코드의 ID | 상품 `12`, 게시글 `125` |
| `is_temporary` | 저장 전 임시 업로드 여부 | `true`, `false` |

규칙:

- `gid`는 파일 경로나 화면 위치가 아니라 파일 그룹의 식별자다.
- 한 상품에 이미지가 여러 장이어도 동일한 `gid`를 공유한다.
- 게시글 저장 전에 업로드가 필요하면 `resource_id`를 비워 둔 임시 그룹을 먼저 만들고, 게시글 저장 후 연결할 수 있다.
- 대상 레코드와 연결되기 전에는 `is_temporary = true`, 연결 완료 후에는 `false`로 변경한다.
- `resource_type + resource_id`에는 조회용 인덱스를 둔다.
- `resource_id`를 문자열로 두는 이유는 `BIGINT`, `UUID` 등 서로 다른 도메인 PK를 공통으로 수용하기 위해서다.

### 5.2 `media_files` — 공통 이미지·첨부파일

```text
id UUID PK DEFAULT gen_random_uuid()
gid UUID FK → media_groups.gid NOT NULL
location VARCHAR(30) NOT NULL
storage_path TEXT NULL
file_url TEXT NOT NULL
original_name VARCHAR(255) NULL
mime_type VARCHAR(100) NULL
file_size BIGINT NULL CHECK file_size >= 0
alt_text VARCHAR(255) NULL
sort_order INT DEFAULT 0
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

`location`은 실제 폴더 경로가 아니라 파일의 사용 위치·용도다.

| `location` | 사용 목적 |
|---|---|
| `main` | 메인 페이지 대표 이미지 |
| `list` | 상품 목록·ProductCard 이미지 |
| `detail` | 상품 상세 이미지 |
| `thumbnail` | Cart·주문 내역의 작은 이미지 |
| `editor` | 게시글 에디터 본문 이미지 |
| `attach` | 게시글 첨부파일 |

예시:

```text
gid=A, resource_type=product, resource_id=12
  ├─ location=main,   sort_order=1
  ├─ location=list,   sort_order=1
  ├─ location=detail, sort_order=1
  └─ location=detail, sort_order=2

gid=B, resource_type=post, resource_id=125
  ├─ location=editor, sort_order=1
  └─ location=attach, sort_order=1
```

삭제 정책:

- 기본은 `is_active = false`로 비활성화한다.
- 원본 상품·게시글 삭제 시 파일을 즉시 물리 삭제할지는 별도 보관 정책으로 결정한다.
- 주문 상품의 `image_url_snapshot`은 공통 파일이 비활성화되어도 유지한다.

`storage_path`는 Supabase Storage 버킷 내부의 상대 경로이고, `file_url`은 화면에서 사용할 공개 URL 또는 서명 URL이다. 같은 값을 중복 저장하는 필드가 아니다.

### 5.3 `carts`

```text
id UUID PK
user_id UUID FK → profiles.id NULL
session_id UUID NULL
status VARCHAR(20) NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

규칙:

- `user_id` 또는 `session_id` 중 하나 이상이 존재해야 한다.
- 상태 예시: `active`, `converted`, `abandoned`.

### 5.4 `cart_items`

```text
id UUID PK
cart_id UUID FK → carts.id
product_variant_id BIGINT FK → product_variants.id
quantity INT NOT NULL CHECK quantity > 0
unit_price_at_added INT NOT NULL
product_name_at_added VARCHAR(255) NOT NULL
option_text_at_added VARCHAR(100)
image_url_at_added TEXT
added_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
UNIQUE(cart_id, product_variant_id)
```

Cart Snapshot은 참고값이다. Checkout에서는 현재 가격·판매 상태·재고를 다시 검증한다.

### 5.5 `analytics_sessions`

```text
id UUID PK
user_id UUID FK → profiles.id NULL
anonymous_id VARCHAR(100) NULL
entry_path VARCHAR(500)
device_type VARCHAR(30)
started_at TIMESTAMPTZ DEFAULT now()
last_activity_at TIMESTAMPTZ
ended_at TIMESTAMPTZ NULL
is_test BOOLEAN DEFAULT false
```

### 5.6 `page_views`

```text
id UUID PK
session_id UUID FK → analytics_sessions.id
user_id UUID FK → profiles.id NULL
page_path VARCHAR(500) NOT NULL
page_type VARCHAR(30) NOT NULL
product_id BIGINT FK → products.id NULL
started_at TIMESTAMPTZ DEFAULT now()
ended_at TIMESTAMPTZ NULL
duration_ms INT NULL
is_complete BOOLEAN DEFAULT false
is_test BOOLEAN DEFAULT false
```

브라우저 종료로 이탈 이벤트가 누락될 수 있으므로 `is_complete`로 측정 완료 여부를 구분한다.

### 5.7 `experiments` — P1

```text
id BIGINT PK
experiment_key VARCHAR(100) UNIQUE NOT NULL
name VARCHAR(255) NOT NULL
hypothesis TEXT NOT NULL
status VARCHAR(20) NOT NULL
started_at TIMESTAMPTZ NULL
ended_at TIMESTAMPTZ NULL
```

### 5.8 `experiment_assignments` — P1

```text
id UUID PK
experiment_id BIGINT FK → experiments.id
session_id UUID FK → analytics_sessions.id
variant VARCHAR(20) NOT NULL
assigned_at TIMESTAMPTZ DEFAULT now()
is_test BOOLEAN DEFAULT false
UNIQUE(experiment_id, session_id)
```

### 5.9 `funnel_daily_snapshots` — P1

```text
id BIGINT PK
snapshot_date DATE NOT NULL
experiment_id BIGINT FK → experiments.id NULL
variant VARCHAR(20) NULL
device_type VARCHAR(30) NULL
site_view_sessions INT NOT NULL
product_list_view_sessions INT NOT NULL
product_view_sessions INT NOT NULL
add_to_cart_sessions INT NOT NULL
checkout_start_sessions INT NOT NULL
purchase_sessions INT NOT NULL
average_dwell_ms INT
purchase_conversion_rate NUMERIC(7,4)
metric_version VARCHAR(20) NOT NULL
generated_at TIMESTAMPTZ DEFAULT now()
is_test BOOLEAN DEFAULT false
```

## 6. 관계 명세

```text
categories 1 ── N categories
categories 1 ── N products
products 1 ── N product_variants

media_groups 1 ── N media_files
products 1 ── 0..1 media_groups (resource_type=product, resource_id=products.id)

profiles 1 ── N carts
carts 1 ── N cart_items
product_variants 1 ── N cart_items

profiles 1 ── N orders
orders 1 ── N order_items
products 1 ── N order_items
product_variants 1 ── N order_items

profiles 1 ── N analytics_sessions
analytics_sessions 1 ── N page_views
analytics_sessions 1 ── N user_events
page_views 1 ── N user_events

experiments 1 ── N experiment_assignments
analytics_sessions 1 ── N experiment_assignments
experiments 1 ── N funnel_daily_snapshots
```

삭제 정책 권장:

- 상품·회원은 물리 삭제보다 비활성화를 우선한다.
- 분석 FK는 원본 삭제 시 `SET NULL`을 고려한다.
- 주문과 주문상품은 운영 기록이므로 임의 삭제하지 않는다.
- 테스트 데이터 정리는 반드시 `is_test = true` 범위로 제한한다.

## 7. Product 타입 대응

초기 Product 계약:

```text
id: number
categoryId: number
categoryName: string
name: string
brand: string
description: string
price: number
images: string[]
isNew: boolean
```

| Product 필드 | DB 출처 |
|---|---|
| `id` | `products.id` |
| `categoryId` | `products.category_id` |
| `categoryName` | `categories.name` JOIN 결과 |
| `name` | `products.name` |
| `brand` | `products.brand` |
| `description` | `products.description` |
| `price` | `products.price` |
| `images` | `media_files.file_url` 집계 결과 (`resource_type=product`, `location IN ('main', 'list', 'detail')`) |
| `isNew` | `products.is_new` |

구현 순서:

```text
ERD 필드 확정
→ Product 타입 작성
→ 상품 약 4개 Mock Data
→ ProductCard
→ ProductGrid
→ ProductPage
```

## 8. 임팩트 지표 정의

### 8.1 페이지 체류시간

```text
duration_ms = ended_at - started_at
```

- 페이지별 평균은 `page_type` 또는 `page_path`로 묶는다.
- `is_complete = false`인 기록은 별도로 집계한다.
- 테스트 결과는 `is_test = true`로 분리한다.

### 8.2 전체 구매전환율

```text
purchase_completed가 발생한 고유 session 수
÷ site_view가 발생한 고유 session 수
× 100
```

### 8.3 단계별 전환율

```text
상품 상세 진입률 = product_view session ÷ product_list_view session
Cart 추가율 = add_to_cart session ÷ product_view session
Checkout 진입률 = checkout_start session ÷ add_to_cart session
구매 완료율 = purchase_completed session ÷ checkout_start session
```

### 8.4 테스트 해석 원칙

- 가상 고객 결과를 실제 고객 전환율로 표현하지 않는다.
- A/B Variant별 고유 세션을 비교한다.
- 지표 정의가 바뀌면 `metric_version`을 변경한다.
- 표본 수가 적으면 학습용 시뮬레이션으로 명시한다.

## 9. ERDCloud 수정 순서

1. 현재 Snapshot 또는 내보내기로 원본을 보존한다.
2. `media_groups`, `media_files`를 추가하고 `gid` 1:N 관계를 연결한다.
3. `products.image_url`을 공통 파일 구조로 이전하고 가격 구조를 수정한다.
4. 상품용 `location` 값 `main`, `list`, `detail`, `thumbnail`을 등록한다.
5. 게시판 구현 범위가 확정되면 `editor`, `attach`를 추가 적용한다.
6. `product_variants` 상태·시간 필드를 보강한다.
7. `users` 유지 또는 `profiles` 전환을 팀이 결정한다.
8. `orders`에 금액·배송 Snapshot을 추가한다.
9. `order_items`에 상품·옵션·가격 Snapshot을 추가한다.
10. `carts`, `cart_items`를 추가하고 관계선을 연결한다.
11. `analytics_sessions`, `page_views`를 추가한다.
12. `user_events`를 보강하고 FK를 연결한다.
13. P1 실험·일별 Snapshot 테이블을 추가한다.
14. 전체 PK·FK·Nullable·자료형·카디널리티를 다시 확인한다.

## 10. 완료 기준

- [ ] 기존 7개 테이블의 원본 구조가 보존되거나 이력이 남아 있다.
- [ ] 모든 테이블에 PK가 있다.
- [ ] 모든 관계에 FK가 표시된다.
- [ ] 카테고리 자기참조 관계가 있다.
- [ ] 상품과 Variant가 1:N이다.
- [x] `media_groups.gid`가 UUID PK이고 `media_files.gid`가 FK로 연결된다.
- [x] `location`이 파일의 사용 위치·용도로 정의된다.
- [x] 상품 이미지에 `main`, `list`, `detail`, `thumbnail`을 사용할 수 있도록 명세한다.
- [x] 게시판 구현 시 `editor`, `attach`를 사용할 수 있도록 명세한다.
- [ ] Product `images`가 `media_files.file_url`의 정렬된 조회 결과와 대응한다.
- [ ] 가격 필드 의미가 하나로 확정된다.
- [x] Cart가 `product_variant_id`를 참조한다.
- [x] Cart 담기 당시 값이 `*_at_added`로 구분된다.
- [ ] 주문 당시 값이 `*_snapshot`으로 구분된다.
- [ ] 주문 배송정보가 회원 현재정보와 분리된다.
- [x] `user_events.event_properties`가 JSONB다.
- [x] 이벤트에 `session_id`, `occurred_at`, `is_test`가 있다.
- [ ] 페이지 체류시간 필드가 있다.
- [ ] 구매전환율의 분모와 분자가 정의되어 있다.
- [x] 가상 고객·주문·이벤트가 `is_test`로 분리된다.
- [ ] DB 필드와 Product 타입 대응표를 팀원이 설명할 수 있다.
- [x] 실제 ERDCloud 화면에서 테이블과 관계선을 확인한다.

## 11. 2026-10-14 ERDCloud 반영 결과

실제 `shoppingmall` ERD에 다음 내용을 반영했다.

- [x] `media_groups` 엔티티 추가
- [x] `media_groups.gid` UUID PK 추가
- [x] `resource_type`, `resource_id`, `is_temporary`, `created_at`, `updated_at` 추가
- [x] `media_files` 엔티티 추가
- [x] `media_files.id` UUID PK 추가
- [x] `location`, `storage_path`, `file_url`, `sort_order`, `created_at`, `updated_at`, `alt_text`, `original_name` 추가
- [x] `media_groups.gid` → `media_files.gid` 비식별 1:N 관계 연결
- [x] ERDCloud 자동 생성 FK의 물리명을 `gid`로 정리
- [ ] `mime_type`, `file_size`, `is_active`는 실제 파일 업로드 구현 범위가 확정되면 추가
- [ ] `location` 허용값은 DB CHECK 또는 애플리케이션 enum 중 한 방식을 팀이 결정

현재 ERD에는 상품·게시글 등 공통 파일 구조의 핵심인 `gid + location`이 반영되었다. `products.image_url` 제거와 기존 데이터 이전은 팀 코드와 Supabase 마이그레이션 순서를 확정한 뒤 진행한다.

## 12. 2026-10-14 Cart·테스트 데이터·카테고리 추가 반영

실제 `shoppingmall` ERDCloud 화면에서 다음 내용을 추가하고 관계를 확인했다.

- [x] `carts` 테이블 생성
- [x] `carts.id` BIGINT PK 추가
- [x] `carts.user_id` → `profiles.id` FK 관계 연결
- [x] `carts.status`, `carts.is_test`, `created_at`, `updated_at` 추가
- [x] `cart_items` 테이블 생성
- [x] `cart_items.id` BIGINT PK 추가
- [x] `cart_items.cart_id` → `carts.id` FK 관계 연결
- [x] `cart_items.product_variant_id` → `product_variants.id` FK 관계 연결
- [x] `quantity`, `unit_price_at_added`, `created_at`, `updated_at` 추가
- [x] `profiles`, `orders`, `carts`, `user_events`의 테스트 구분명을 `is_test`로 통일
- [x] `user_events.is_test` BOOLEAN 추가
- [x] 테이블별 PK 의미와 FK 참조 관계를 ERD 메모에 기록
- [x] `ETC` 대카테고리 아래 `Shoes`, `Bags`, `Accessories` 중카테고리를 ERD 메모에 기록

### 테스트 데이터 판별 규칙

- 회원, 주문, 장바구니, 행동 이벤트는 각 테이블의 `is_test = true`로 가상 데이터를 구분한다.
- `cart_items`는 `cart_id`로 연결된 `carts.is_test`를 따라 판별한다.
- `order_items`는 `order_id`로 연결된 `orders.is_test`를 따라 판별한다.
- 하위 행마다 `is_test`를 중복 저장하지 않아 상위·하위 값이 어긋나는 문제를 방지한다.

### 카테고리 계층

```text
ETC
├─ Shoes
├─ Bags
└─ Accessories
```

- 대카테고리 `ETC` 행은 `parent_id = NULL`이다.
- 중카테고리 `Shoes`, `Bags`, `Accessories` 행은 `parent_id = ETC.id`다.
- ERDCloud는 테이블 구조를 정의하는 도구이므로 위 값은 메모로 명시했다. 실제 Supabase 데이터 행은 별도의 seed 또는 INSERT 단계에서 생성해야 한다.

## 13. Supabase Auth·GA4 연계용 최종 구현 계약

이 절은 오늘·내일 프론트엔드와 Supabase 구현에 사용하는 최종 기준이다. 앞 절에 남아 있는 UUID 중심의 확장 제안과 충돌할 경우 이 절을 우선한다.

### 13.1 사용자 식별자

```text
auth.users.id UUID
        │ 1:1
        ▼
profiles.id UUID PK
        ├─ carts.user_id UUID FK
        ├─ orders.user_id UUID FK
        └─ user_events.user_id UUID FK
```

- Supabase Auth가 인증 계정의 원본이다.
- 공개 스키마의 `profiles.id`는 별도 번호를 만들지 않고 `auth.users.id`와 같은 UUID를 사용한다.
- 기존 ERD의 `users` 테이블명은 `profiles`로 변경했다.
- 비로그인 장바구니·주문은 Supabase Anonymous Auth로 UUID를 먼저 발급하는 방식을 사용한다. 이후 회원 전환 시 동일 사용자의 계정 연결을 고려한다.
- `profiles.email`을 유지하더라도 인증 이메일의 원본은 `auth.users`다. 두 값을 별도로 수정하지 않는다.

### 13.2 내부 ID 고정 정책

| 테이블 | PK | 생성 방식 | 프론트엔드 타입 |
|---|---|---|---|
| `profiles` | `UUID` | Supabase Auth 사용자 ID 재사용 | `string` |
| `categories` | `BIGINT` | Identity | `number` |
| `products` | `BIGINT` | Identity | `number` |
| `product_variants` | `BIGINT` | Identity | `number` |
| `carts` | `BIGINT` | Identity | `number` |
| `cart_items` | `BIGINT` | Identity | `number` |
| `orders` | `BIGINT` | Identity | `number` |
| `order_items` | `BIGINT` | Identity | `number` |
| `user_events` | `BIGINT` | Identity | `number` |
| `media_groups` | `UUID` | `gen_random_uuid()` | `string` |
| `media_files` | `UUID` | `gen_random_uuid()` | `string` |

- BIGINT PK는 PostgreSQL에서 `GENERATED BY DEFAULT AS IDENTITY`로 생성한다.
- 장바구니·주문·이벤트를 UUID로 다시 바꾸지 않는다. 외부에 노출되는 인증 ID와 내부 거래 행 ID의 목적을 분리한다.
- `orders.order_number`는 고객에게 보여주는 업무용 주문번호이며 `orders.id`와 별개다.
- 원 단위 가격은 `INT`, 시간은 `TIMESTAMPTZ`, 확장 속성은 `JSONB`를 사용한다.

### 13.3 GA4와 DB 이벤트의 역할 분리

- GA4는 페이지·퍼널 분석 도구이고, `user_events`는 샘플 데이터 검증과 주문 데이터 대조를 위한 1차 이벤트 원장이다.
- `user_events.anonymous_id`에는 GA4의 `client_id`를 저장한다.
- `user_events.session_id`에는 GA4의 `session_id`를 문자열로 저장한다.
- `user_events.event_properties JSONB`에는 `cart_id`, `order_id`, `value`, `currency`, 실험 Variant 같은 선택 속성을 저장한다.
- 이메일, 전화번호, 주소 등 개인정보는 GA4와 `event_properties`에 넣지 않는다.
- `occurred_at`은 `TIMESTAMPTZ`로 저장한다.
- 샘플·QA 행은 `is_test = true`로 저장하고, 실제 임팩트 지표 쿼리에서는 반드시 제외한다.

필수 이벤트명은 다음 값으로 고정한다.

```text
site_view
product_list_view
product_view
add_to_cart
cart_view
checkout_start
purchase_completed
```

### 13.4 프론트엔드 타입 계약

```ts
type DbId = number;
type AuthUserId = string;
type IsoTimestamp = string;

type UserEvent = {
  id: DbId;
  userId: AuthUserId | null;
  productId: DbId | null;
  anonymousId: string | null;
  sessionId: string;
  eventName:
    | "site_view"
    | "product_list_view"
    | "product_view"
    | "add_to_cart"
    | "cart_view"
    | "checkout_start"
    | "purchase_completed";
  pagePath: string;
  occurredAt: IsoTimestamp;
  eventProperties: Record<string, unknown>;
  isTest: boolean;
};
```

- UUID는 TypeScript에서 `string`이다.
- 현재 프로젝트 범위의 BIGINT Identity 값은 TypeScript에서 `number`로 사용한다.
- Supabase가 생성한 Database 타입을 데이터 원본으로 사용하고, UI 타입은 필요한 필드만 변환한다.

### 13.5 2026-10-14 ERDCloud 실제 반영

- [x] `users`를 `profiles`로 변경
- [x] `profiles.id`를 `UUID`로 변경
- [x] `carts.user_id`를 `UUID`로 변경
- [x] `orders.user_id`를 `UUID`로 변경
- [x] `user_events.user_id`를 `UUID`로 변경
- [x] `user_events.occurred_at`을 `TIMESTAMPTZ`로 변경
- [x] `user_events.event_properties`를 `JSONB`로 변경
- [x] 기존 `anonymous_id`, `session_id`를 GA4 식별자 매핑에 재사용
- [x] Auth·ID·GA4·테스트 데이터 규칙을 ERD 메모에 기록

### 13.6 구현 전 금지 사항

- `user_id`를 `number`로 선언하지 않는다.
- `auth.users`를 프론트엔드에서 직접 수정하지 않는다.
- 샘플 데이터에 실제 고객 이메일·전화번호·주소를 넣지 않는다.
- 테스트 이벤트를 실제 전환율에 합산하지 않는다.
- GA4 전송 성공만으로 주문 완료를 판단하지 않는다. 주문 성공은 `orders` 생성 결과가 기준이다.

## 14. 상세페이지 변경 대응·RLS·SQL 마이그레이션 계약

### 14.1 상세페이지와 상품 미디어

- 화면 레이아웃을 DB 컬럼으로 고정하지 않는다. 상세페이지 담당자는 컴포넌트 배치와 표시 규칙을 바꿀 수 있다.
- 상세 URL은 변경 가능한 `product_name` 대신 `products.slug`를 사용한다. `slug`는 `UNIQUE NOT NULL` 제약을 적용한다.
- 상품 이미지 묶음은 `products.media_gid -> media_groups.gid`로 연결한다.
- `media_files.location`은 `main`, `list`, `detail`처럼 사용 위치만 나타내고, 상세 이미지의 노출 순서는 `sort_order`로 제어한다.
- 기존 `products.image_url`은 전환 기간에만 유지한다. 프론트엔드 연결이 `media_groups`와 `media_files`로 완료된 뒤 별도 마이그레이션으로 제거한다.
- 이미지 URL이 바뀌어도 과거 주문 화면이 바뀌지 않도록 결제 시점의 대표 이미지는 `order_items.image_url_snapshot`에 저장한다.

### 14.2 주문 스냅샷

`order_items`에는 다음 결제 시점 값을 보존한다.

- `product_name_snapshot VARCHAR(255)`
- `sku_snapshot VARCHAR(100)`
- `option_snapshot VARCHAR(150)`
- `image_url_snapshot TEXT`

`orders`에는 `customer_email_snapshot VARCHAR(255)`을 보존한다. 배송 기능을 구현할 때는 다음 필드를 같은 원칙으로 추가한다.

- `recipient_name_snapshot VARCHAR(100)`
- `recipient_phone_snapshot VARCHAR(30)`
- `postal_code_snapshot VARCHAR(20)`
- `shipping_address_snapshot TEXT`

회원 프로필, 상품명, 옵션, 이미지, 기본 배송지가 변경되어도 이미 완료된 주문의 표시값은 바뀌지 않아야 한다.

### 14.3 RLS 목표 정책

RLS(Row Level Security)는 테이블의 행마다 접근 가능 사용자를 검사하는 PostgreSQL 보안 기능이다. 프론트엔드에서 버튼을 숨기는 것은 보안이 아니므로 Supabase API가 데이터를 반환하거나 변경하기 전에 DB 정책으로 소유권을 검사한다.

| 대상 | 정책 목표 |
|---|---|
| `products`, `categories`, 공개 상품 미디어 | 모든 사용자의 `SELECT` 허용 |
| `profiles` | `auth.uid() = id`인 본인 행만 조회·수정 |
| `carts` | `auth.uid() = user_id`인 본인 장바구니만 접근 |
| `cart_items` | 소속 장바구니의 `user_id`가 `auth.uid()`인 행만 접근 |
| `orders` | `auth.uid() = user_id`인 본인 주문만 조회 |
| `order_items` | 소속 주문의 `user_id`가 `auth.uid()`인 행만 조회 |
| `user_events` | 본인 이벤트 생성, 운영 분석 조회는 서버 전용 |
| 상품·옵션·재고 쓰기 | 관리자 또는 서버 역할만 허용 |

- 익명 구매 흐름도 Supabase Anonymous Auth가 발급한 UUID를 사용해 같은 소유권 규칙을 적용한다.
- `is_test`는 분석 구분 필드이지 접근 제어 수단이 아니다.
- ERD에는 정책 목표만 기록한다. 실제 `ENABLE ROW LEVEL SECURITY`와 `CREATE POLICY`는 SQL 마이그레이션으로 적용하고 테스트한다.

### 14.4 SQL 마이그레이션 운영

SQL 마이그레이션은 DB 구조와 정책의 변경 내용을 실행 순서가 있는 `.sql` 파일로 남기는 방식이다. ERD가 설계도라면 마이그레이션은 실제 DB를 같은 상태로 만드는 공사 기록이다.

권장 순서는 다음과 같다.

1. 테이블·컬럼 생성 또는 변경
2. PK·FK·UNIQUE·CHECK 제약조건
3. 인덱스
4. RLS 활성화와 정책 생성
5. 검증 쿼리

- 팀원은 Supabase 대시보드에서 임의로만 수정하지 않고 동일한 마이그레이션 파일을 순서대로 적용한다.
- 샘플 데이터는 재실행 가능한 seed 파일로 분리하며 `is_test = true`를 사용한다.
- 기존 데이터가 있는 컬럼을 바로 `NOT NULL`로 바꾸지 않는다. 값 채우기, 검증, 제약 적용을 단계별 마이그레이션으로 나눈다.
- ERD 변경만으로 Supabase DB나 RLS 정책이 자동 적용되지는 않는다.

### 14.5 2026-10-14 ERDCloud 추가 반영

- [x] `products.slug VARCHAR(150)` 추가 및 상세 URL 식별자 설명 기록
- [x] `products.media_gid UUID` 추가 및 `media_groups.gid` 연결 목적 기록
- [x] `products.created_at`을 `TIMESTAMPTZ DEFAULT now()`로 변경
- [x] `profiles.name`을 `display_name`으로 명확화
- [x] `profiles.joined_at`을 `created_at TIMESTAMPTZ DEFAULT now()`로 변경
- [x] `orders.ordered_at`을 `TIMESTAMPTZ DEFAULT now()`로 변경
- [x] `order_items` 상품명·SKU·옵션·대표 이미지 스냅샷 추가
- [x] `orders.customer_email_snapshot` 추가
- [x] 상세 미디어, 주문 스냅샷, RLS 목표, SQL 마이그레이션 원칙을 ERD 메모에 기록
- [ ] 배송 수령인·연락처·우편번호·주소 스냅샷은 체크아웃 입력 명세 확정 후 추가
- [ ] 실제 Supabase RLS 정책과 제약조건은 SQL 마이그레이션 작성·실행 후 검증
