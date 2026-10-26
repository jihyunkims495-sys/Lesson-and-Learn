# 토스 테스트 결제와 Supabase 저장

카드·간편결제의 **가상 승인 테스트**를 지원합니다. 테스트 키만 허용하며 실제 금액 청구, 상품 배송, 재고 예약·차감은 하지 않습니다. 가상계좌 입금 처리, 환불, 웹훅 자동 동기화는 이번 범위에 포함하지 않습니다.

## 1. 환경 변수

프로젝트 루트의 `.env.local`에 설정합니다. `.env.example`은 이름을 공유하는 빈 템플릿이며 자동으로 로드되지 않습니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=프로젝트_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=공개_키
# 선택: 비워 두면 토스 공개 테스트 키를 사용합니다.
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

- Supabase 서버 키(`SUPABASE_SECRET_KEY`)는 필요하지 않습니다. 주문·결제 저장은 로그인 회원의 세션으로 실행하고, DB 함수가 `auth.uid()`로 회원을 확인합니다.
- 토스 키는 **설정하지 않아도 됩니다.** 두 값이 비어 있으면 토스 공식 예제([tosspayments-sample](https://github.com/tosspayments/tosspayments-sample))에 공개된 결제위젯 연동 테스트 키(`test_gck_docs_...` / `test_gsk_docs_...`)로 결제합니다. 같은 예제의 API 개별 연동 공개 키(`test_ck_D5GePW...`)는 결제창 호출이 401로 거부되어 쓰지 않습니다. 개발자센터 가입·로그인이 필요 없고 실제 금액은 청구되지 않습니다. 키 값은 `src/domains/orders/server/testPayment.ts`의 `TOSS_PUBLIC_TEST_KEYS`에 있습니다.
- 공개 테스트 키는 누구나 쓰는 공용 상점이므로, 토스 상점 관리자에서 우리 결제 내역만 따로 보려면 [개발자센터](https://developers.tosspayments.com/)에서 받은 내 테스트 키 한 쌍을 두 값에 모두 넣습니다.
- `test_gck_` / `test_gsk_`: 주문서형·결제창형 `widgets.renderPaymentWindow()`.
- `test_ck_` / `test_sk_`: API 개별 연동 `payment.requestPayment()` 통합결제창.
- 토스 시크릿 키에는 `NEXT_PUBLIC_`을 붙이지 않습니다. 키는 소스·채팅·Git에 올리지 않습니다. `.env.local`은 추적에서 제외됩니다.
- 설정 후 개발 서버를 재시작합니다. 배포 환경에서는 호스팅 서비스의 환경 변수에도 별도로 설정해야 합니다.
- HTTP로 연 서버(예: `http://공인IP:3000`)에서도 결제를 시작할 수 있습니다. 결제 요청 번호는 `crypto.randomUUID()`가 없으면 `crypto.getRandomValues()`로 같은 UUID v4 형식을 만듭니다(`createCheckoutRequestId.ts`). 다만 로그인·결제 정보 보호를 위해 배포 서버에는 HTTPS 적용을 권장합니다.

## 2. 데이터베이스 적용

이 저장소의 기존 Supabase 스키마(`profiles`, `products`, `product_variants`, `orders`, `order_items`, `payments`, `payment_transactions`)를 전제로 합니다. 데이터 초기화 SQL이 아닙니다.

Supabase SQL Editor에서 아래 순서로 실행합니다.

1. `supabase/migrations/202610220001_test_checkout.sql`: 주문 준비·결제 키 연결·승인 저장 함수 4개를 추가합니다. 기존 데이터와 본인 조회 RLS를 유지합니다.
2. `supabase/migrations/202610220002_member_test_checkout.sql`: 로그인 회원이 서버 키 없이 호출하는 함수 3개(`prepare_my_test_checkout`, `bind_my_test_payment`, `complete_my_test_payment`)를 추가합니다. 회원 ID는 `auth.uid()`로만 정하고 비회원 호출은 막습니다.
3. `supabase/seed-checkout-demo.sql`: 현재 브라우저 데모 장바구니에 필요한 상품 옵션 3개를 추가합니다. 기존 상품을 재사용하고, 충돌하는 옵션 ID나 다른 상품 가격이 있으면 변경 없이 실패합니다.
4. `supabase/seed-product-variants.sql`: 19개 상품 전체에 사이즈 옵션을 추가합니다. 의류 1/2/3/4, 신발 250/260/270/280, 가방·액세서리 FREE, 옵션별 재고 100개입니다. 위 데모 옵션 3개는 번호를 유지하고 사이즈 이름만 2·3으로 맞춥니다.
5. `supabase/tests/test-checkout.sql`: DB 가격 계산, 타 회원 접근 거부, 금액 변조 거부, 준비·승인 멱등성, 결제 키 변경 방지, 결제/거래 원자적 저장, 재고 유지, 서버 전용 RPC 차단을 확인합니다. 검증용 주문·결제·거래는 전부 `ROLLBACK`합니다. 최소 한 명의 기존 테스트 회원이 필요합니다.

데모 장바구니와 연결되는 옵션:

| 옵션 ID | 기존 상품 ID          | SKU               | 옵션 | 단가      |
| ------- | --------------------- | ----------------- | ---- | --------- |
| 1       | 5, 블랙 집업 자켓     | DEMO-ZIP-JACKET-M | 2    | 114,460원 |
| 2       | 4, 블랙 반팔 티셔츠   | DEMO-TSHIRT-L     | 3    | 56,260원  |
| 3       | 1, 아이보리 싱글 코트 | DEMO-COAT-L       | 3    | 153,260원 |

장바구니는 빈 상태로 시작하며, 상품 상세에서 위 옵션을 담아 테스트합니다. `cart.mock.ts`는 더 이상 기본 장바구니로 쓰지 않습니다. 비회원이 담은 상품은 로그인 후에도 유지되고, 로그아웃하거나 다른 회원으로 바뀌면 장바구니를 비웁니다. 승인 금액의 기준은 항상 **DB의 현재 판매가**입니다. 서버는 브라우저의 상품명·가격을 사용하지 않습니다. 회원 장바구니의 Supabase(`carts`, `cart_items`) 저장은 별도 작업입니다.

## 3. 테스트 방법

1. 테스트 회원으로 로그인합니다. 회원 ID는 서버가 Supabase `auth.getUser()`로 확인하며 브라우저가 지정할 수 없습니다.
2. `/cart` → `/checkout`에서 테스트 배송지와 주문 확인을 입력합니다. 서버가 DB 판매가로 다시 계산한 총액과 화면 총액이 같아야 결제창이 열립니다.
3. 토스 테스트 결제창에서 카드·간편결제 인증을 진행합니다. 실제 개인정보 대신 테스트 배송지를 사용합니다.
4. 성공 리다이렉트 후 서버가 소유권·주문금액·결제 키를 검증하고 승인 API를 호출합니다.
5. 토스 응답의 주문번호·키·KRW 금액·잔액·`DONE`·승인일시·거래 키를 확인한 뒤, 결제 상태와 승인 거래를 **하나의 DB 트랜잭션**으로 저장합니다. DB 저장까지 성공해야 완료 화면을 표시합니다.
6. 완료 화면에서 **주문·결제 내역 보기** 또는 헤더의 **MY PAGE**로 이동합니다. `/mypage`에서 회원 정보와 본인의 최근 주문 50건을 확인하고 결제 상태별로 필터링할 수 있습니다. 기존 `/orders` 주소에서도 내역을 조회할 수 있습니다.
7. 완료 페이지 새로고침·승인 재확인 시 중복 승인 거래나 중복 장바구니 차감이 없어야 합니다. 다른 계정에서는 기존 주문을 승인·조회할 수 없어야 합니다.

테스트 전용 설정이므로 로그인 회원은 자기 주문에 한해 승인 저장 함수를 직접 호출할 수 있습니다. 실제 결제에 쓰려면 서버 전용 키 방식으로 되돌려야 합니다.

토스 승인 후 DB 저장에 실패하면 완료로 표시하지 않습니다. 같은 결제 키와 DB에 보관한 승인 멱등키로 재시도하고, 토스 조회 API로 승인 결과를 복구하여 저장합니다. 승인 여부가 불명확한 상태는 성공/실패로 단정하지 않습니다.

## 저장 구조

| 테이블                 | 저장 시점 / 내용                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orders`               | 결제창을 열기 전: 회원, 주문번호, 배송지, 서버 계산 금액. 주문 상태는 기존 규칙인 `submitted` 유지                                                     |
| `order_items`          | 주문 당시 상품명·옵션·SKU·이미지 경로·단가·수량 스냅샷                                                                                                 |
| `payments`             | 준비 시 `READY`, 인증 키 연결 시 `IN_PROGRESS`, 검증·저장 완료 시 `DONE`. Toss 주문번호/키, 결제수단, 승인일시, 잔액, 거래 키, 영수증 URL, 승인 멱등키 |
| `payment_transactions` | 검증된 승인 한 건을 `APPROVAL` / `DONE`으로 저장. 거래 키와 멱등키 UNIQUE로 중복 방지                                                                  |

결제창을 닫았거나 인증 전에 이탈한 주문도 준비 기록으로 남을 수 있습니다. 실패 리다이렉트의 문자열만 믿고 DB 상태를 변경하지 않습니다. 따라서 현재 내역의 `READY`는 결제 대기, `IN_PROGRESS`는 승인 확인 중으로 표시합니다. 토스 콘솔에서 별도로 수행한 취소나 웹훅에 따른 상태 변경은 자동 반영하지 않습니다.

`checkout_cart()`는 기존 재고 차감·DB 장바구니 삭제 로직이 있어 이번 가상 결제에서는 호출하지 않습니다. 브라우저 장바구니에서 승인된 옵션의 수량만 한 번 제거합니다. 주문 성공 여부는 `orders.status`가 아니라 연결된 `payments.status='DONE'`으로 확인합니다.

## 코드 위치

- `src/shared/lib/supabase/server.ts`: 쿠키 기반 서버 인증 클라이언트
- `src/domains/orders/server/paymentDatabase.ts`: 회원 검증, 회원 세션 RPC 호출·오류 처리
- `src/domains/orders/server/testPayment.ts`: 테스트 키 검증, 주문 준비, 토스 승인·조회
- `src/domains/orders/server/paymentWorkflow.ts`: DB 소유권·금액 검증 → 승인/조회 복구 → DB 저장
- `src/domains/orders/server/testPaymentValidation.ts`: 요청과 토스 응답 검증
- `src/app/api/payments/toss/{prepare,confirm}/route.ts`: 동일 출처 POST, 회원 인증, 캐시 방지
- `src/app/api/orders/route.ts`: 회원 인증과 기존 RLS로 본인 내역 조회
- `src/domains/orders/components/OrderHistory.tsx`: 내역 화면
- `src/domains/account/components/MyPage.tsx`: 회원 정보, 주문 조회, 로그아웃을 제공하는 마이페이지. 비회원에게 로그인 안내를 표시하며 로그인 후 마이페이지로 복귀합니다.

이전 `.local/test-payments/`의 파일은 더 이상 사용하거나 자동 이관하지 않습니다. 남아 있는 파일은 과거 로컬 테스트 기록입니다. 기존 브라우저 주문 쿠키도 사용하지 않습니다.

## 문제 확인

| 증상                     | 확인 내용                                                                       |
| ------------------------ | ------------------------------------------------------------------------------- |
| 로그인 필요              | 같은 호스트의 테스트 회원으로 로그인했는지 확인                                 |
| 결제 마이그레이션 필요   | 위 SQL 마이그레이션 두 개의 적용 여부 확인                                      |
| 주문할 수 없는 상품 옵션 | 데모 옵션 SQL 또는 상품 판매 상태 확인                                          |
| 상품 금액 변경           | DB 가격과 장바구니 표시 금액 확인. 준비 요청은 금액이 다르면 주문을 만들지 않음 |
| 승인 상태 확인 실패      | 완료 화면의 승인 재확인. 새로운 결제보다 기존 결과 복구 우선                    |

공식 자료: [Supabase 서버 인증](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [토스 결제 API](https://docs.tosspayments.com/reference), [토스 멱등키·인증](https://docs.tosspayments.com/reference/using-api/authorization).
