# ONEPIECE 팀원 ERD 변경 분석 — 2026-10-20

비교 대상은 기존 shoppingmall과 새 ONEPIECE | Supabase 연동 ERD + Auth다. 두 설계의 테이블·컬럼·NULL·기본값·FK·주석·메모를 대조했다. 페이지 내용, 실제 DB 및 앱 코드는 수정하지 않았다.

## 핵심 판단

새 안은 기존 기능을 모두 유지한 확장판이 아니라, Supabase 인증·상품·회원 장바구니를 1단계로 정리하고 실제 청구 없는 주문 데모를 2단계 제안으로 구분한 축소·재설계안이다. 데이터 구조가 단순해진 부분과 기능 범위가 줄어든 부분을 함께 봐야 한다.

## 구조 개수

| 항목 | 기존 | 새 안 |
|---|---:|---:|
| 서비스 테이블 | 11 | 9 |
| 표시한 Supabase 외부 관리 테이블 | 0 | auth.users 1개 |
| 도표 전체 테이블 | 11 | 10 |
| 컬럼 | 99 | 86 |
| FK 관계선 | 8 | 11 |
| 메모 | 10 | 5 |

없어진 서비스 테이블은 media_groups, media_files, user_events이고, product_images가 새로 생겼다. auth.users는 직접 생성할 새 서비스 테이블이 아니라 Supabase 관리 테이블을 일부 표시한 것이다. 새 메모의 '이전 9개 public 테이블 복원'은 작성자의 설명이며, 비교 기준인 기존 설계에는 실제로 11개 테이블이 있다.

## 1. 인증과 프로필 단순화

- auth.users에 id, email, created_at을 표시하고 profiles.id → auth.users.id를 PK/FK로 연결했다. 기존에는 관계선 없이 Auth 계약 메모에 설명돼 있었다.
- profiles는 id, display_name, created_at, updated_at만 남겼다.
- email, phone, age_group, fashion_engagement, acquisition_source, status, is_test를 제거했다. display_name은 필수에서 NULL 허용으로 바뀌었다.
- 이메일은 Auth가 관리하고 앱의 프로필은 표시 이름만 관리하는 구조다. 반면 회원 상태·연령대·패션 관여도·유입 경로·테스트 여부를 프로필에서 구분할 수 없게 됐다.
- 구매 여부·구매 횟수·첫/재구매 회차 컬럼은 새 안에 없다.

## 2. 상품과 카테고리 계약 변경

### categories

- id / parent_id: BIGINT → VARCHAR(30).
- slug, depth 제거. created_at, updated_at 추가.
- parent_id 자기참조는 유지한다. 메모는 두 단계 사용과 자기참조·순환 금지를 요구한다.
- 계층의 부모 관계로 분류를 표현하되, 숫자 ID에서 문자열 ID로 계약이 바뀌므로 연결되는 products.category_id도 함께 VARCHAR(30)으로 변경됐다.
- ERD에는 카테고리 실제 행 데이터가 없으므로 소분류 시드 값의 동일 여부까지 검증한 것은 아니다.

### products

- 추가: detail, product_care, shipping, status, sort_order, updated_at.
- 제거: description, brand, slug, image_url, media_gid.
- description은 detail로 재구성했고 케어·배송 안내를 별도 필드로 나눴다.
- status는 draft / active / inactive로 문서화됐다. 상품 자체와 상위 카테고리가 활성일 때 공개하도록 명시했다.
- 기존 범용 이미지 그룹 연결을 없애고 새 product_images에서 상품을 직접 참조한다.

## 3. 색상×사이즈 옵션을 사이즈별 옵션으로 변경

- product_variants의 color, size, sale_status 제거.
- size_label, is_active, sort_order, created_at, updated_at 추가.
- 메모·주석은 '색상별 상품 카드 + 사이즈별 옵션'을 전제로 한다. 기존 UNIQUE(product_id, color, size) 개념 대신 UNIQUE(product_id, size_label)를 요구한다.
- 따라서 동일 상품의 색상을 Variant로 구분하던 설계에서, 색상이 다른 것은 상품 자체를 다르게 취급하는 쪽으로 바뀌었다.
- 재고 수량과 활성 여부로 판매 가능 상태를 계산한다. 독립 color 컬럼은 어디에도 없어 색상 값을 구조화해서 조회해야 하는 요구가 있다면 추가 합의가 필요하다.

## 4. 공통 파일 그룹을 상품 이미지로 통합

기존 연결: products.media_gid → media_groups → media_files.

새 연결: product_images.product_id → products.id.

- product_images 컬럼: id, product_id, storage_path, original_name, mime_type, file_size, role, sort_order, alt_text, created_at, updated_at.
- role은 main / detail / model / hover다. 파일명에 Model이 있는지 검사하는 대신 데이터로 이미지 역할을 구분하려는 의도다.
- main / hover는 상품당 최대 1개, storage_path는 UNIQUE로 문서화됐다.
- signed URL을 저장하지 않고 Storage 경로를 저장한다.
- 상품 이미지만 다룰 때 연결 단계가 줄어든다. 프로필·첨부파일 등 다른 도메인에서 재사용하는 공통 파일 그룹 범위는 빠졌다.

## 5. 회원 전용 장바구니와 현재 가격 조회

- carts.user_id가 NULL 허용 → NOT NULL로 바뀌었고 profiles FK가 추가됐다.
- carts.user_id UNIQUE: 로그인 회원당 Cart 한 개. 기존 status / is_test 제거.
- cart_items.unit_price_at_added 제거. 담을 당시 가격을 복제하지 않고 현재 상품을 JOIN하는 설계다.
- Cart의 상품명·옵션·이미지 Snapshot 컬럼도 없다.
- cart_items.product_variant_id → product_variants.id 관계선을 새로 연결했다. 같은 옵션은 UNIQUE(cart_id, product_variant_id)로 수량을 합치도록 문서화했다.
- 비회원 소유자/익명 Cart 식별 컬럼이 없으므로 이 안의 DB Cart는 회원 전용이다. 비로그인 브라우저 임시 Cart까지 불가능하다는 뜻은 아니지만 그 흐름은 설계돼 있지 않다.
- 장바구니 담기에서는 재고를 예약·차감하지 않고 주문 처리 단계에서 검증한다.

## 6. 실제 승인 결제 대신 주문 저장 데모

- orders와 order_items 논리명에 '2단계 제안'이 붙어 있다.
- orders.status는 submitted / cancelled. submitted는 주문 접수 완료이며 실제 결제 승인이 아니라고 명시돼 있다.
- 결제 버튼 → 서버 검증 → 주문 저장 → 완료 화면의 모의 결제다. PG·웹훅·카드정보·payments 테이블은 범위 밖이다.
- 추가: idempotency_key, currency, subtotal_amount, shipping_fee, recipient_name, recipient_phone, postal_code, address_line1/2, shipping_message, created_at, updated_at.
- 제거: customer_email_snapshot, purchase_channel, ordered_at, is_test.
- orders.id가 BIGINT → UUID이며 기본값 gen_random_uuid()를 사용한다. order_items.order_id도 UUID로 변경됐다.
- orders.user_id는 NOT NULL → NULL 허용으로 바뀌었다. 주석상 회원 탈퇴 시 SET NULL로 이력을 보존하려는 의도이며, 주문 생성은 로그인 회원만 가능하다. 비회원 구매 허용을 뜻하지 않는다.
- 서버 가격·재고 재검증, 트랜잭션, 중복 제출 방지, 재시도 시 기존 주문 반환, 취소 재고 복원 1회, 성공/실패 URL만으로 상태 변경 금지를 명시했다.
- 현재 안에는 payment_key / paid_at / 실제 승인 상태 / 구매 회차가 없으므로 승인 완료 기준 구매 횟수를 그대로 계산하는 구조는 아니다.

## 7. 주문 상품 Snapshot 유지와 금액 분리

Snapshot을 없앤 것이 아니라 필드명을 짧게 바꿨다.

| 기존 | 새 안 |
|---|---|
| product_name_snapshot | product_name |
| sku_snapshot | sku |
| option_snapshot | option_text |
| image_url_snapshot | image_storage_path |
| purchase_price | line_total |

- 상품명·SKU·옵션은 NULL 허용에서 필수로 강화됐다. image_storage_path는 NULL을 허용한다.
- discount_amount가 없어졌고 line_total은 unit_price × quantity의 생성 컬럼을 migration에서 적용하도록 권장한다.
- 상품 합계(subtotal_amount), 배송비(shipping_fee), 전체 합계(total_amount)를 분리한다.
- 금액 합계는 BIGINT로 확대됐다. 소액 단가 INTEGER와 누적 합계 BIGINT를 구분한다.

## 8. 분석·실험 범위가 후속으로 이동

- user_events 전체 제거.
- profiles / carts / orders의 is_test 제거.
- 메모는 A/B 이벤트가 필요 없다는 뜻이 아니라 분석 도구를 고른 뒤 별도 설계할 후속 범위라고 설명한다. 실험 ID·배정 저장 규칙이 필요하다는 점도 남겼다.
- GA4를 보내는 데 반드시 DB user_events가 필요한 것은 아니다. 다만 이 ERD 자체에는 이벤트 이름·익명/세션 ID·실험 배정·테스트 분리 계약이 없다.
- 합성 회원과 실제 회원을 함께 사용할 경우 기존 is_test를 대신할 분리 방식이 필요하다.

## 관계선과 구현 규칙

새 안은 auth.users → profiles, profiles → carts, products → product_images, product_variants → cart_items를 명시적으로 연결했다. 기존 media_groups → media_files 관계는 테이블 통합으로 없어졌다. 전체 관계는 8개에서 11개다.

주석·메모의 UNIQUE / 부분 UNIQUE / CHECK / 생성 컬럼 / ON DELETE / RLS는 설계 요구다. ERD의 관계선과 메모만으로 DB에 구현된 것으로 판단하지 않았다. 모든 public 테이블 RLS·GRANT, 본인 데이터 접근, 서버 전용 키 보호도 명시돼 있다.

일반 PK는 여러 테이블에서 BIGINT → INTEGER로 줄였고 orders.id는 UUID로 바꿨다. INT → INTEGER 자체는 PostgreSQL에서 같은 정수형의 표기 차이지만 BIGINT → INTEGER와 BIGINT → UUID는 실제 계약 변경이다.

## 오늘 정한 요구와 대조할 부분

이 비교의 기준은 기존 설계지만, 확정한 요구와 맞지 않는 부분은 구분할 필요가 있다.

1. 비회원 DB Cart/재방문 복원: 새 안에는 없음. 회원 Cart로 한정.
2. 결제 승인 완료·전체 취소 제외 구매 횟수: 새 안은 주문 접수 데모이며 해당 집계 없음.
3. GA4/합성 데이터 비교: 후속 범위로 이동했고 이벤트 원장 및 is_test 제거.
4. 상품·이미지 컬럼 보존: 새 안은 관련 컬럼을 실제로 삭제·재구성하므로 보존 요구와 다름.

따라서 새 안의 단순화를 채택할지는 위 기능 범위 변경과 함께 합의해야 한다. 분석 요청만 수행했으며 어느 안도 수정하지 않았다.
