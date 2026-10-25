# ONEPIECE 산산기어 Cart 레퍼런스 분해 명세

## 문서 정보

- 작성일: 2026-10-14
- 대상 서비스: ONEPIECE 남성 패션 브랜드 자사몰
- 레퍼런스: SAN SAN GEAR
- 분석 상태: 실제 상품을 담아 Cart Drawer, 전체 Cart, 빈 Cart를 확인함
- 목적: 레퍼런스를 그대로 복제하지 않고 ONEPIECE의 가설과 개발 범위에 맞게 재구성함

## 1. 분석 목적

ONEPIECE는 패션 중·고관여 20~30대 남성을 대상으로 한다. 서비스 가설은 다음과 같다.

- 메인과 구매 과정에 정보가 많을수록 사용자가 피로를 느낄 수 있다.
- 결제까지의 단계가 길수록 구매 전환이 낮아질 수 있다.
- 구매 결정에 필요한 핵심 정보는 유지하면서 불필요한 요소는 줄여야 한다.

따라서 Cart에서는 추천 콘텐츠를 늘리기보다 사용자가 선택한 상품과 옵션을 빠르게 검토하고 Checkout으로 이동할 수 있게 해야 한다.

## 2. 확인 범위

### 직접 확인한 화면

- 상품 상세의 `ADD TO CART`
- 상품 추가 직후 열리는 Cart Drawer
- `/cart` 전체 Cart 페이지
- 상품이 없는 빈 Cart 상태

### 직접 확인한 핵심 정보

- 상품 이미지
- 상품명
- 단가
- 선택 옵션
- 수량 조절
- 상품 삭제
- 합계
- 배송비·세금 안내
- `VIEW CART`, `CHECKOUT`, `Continue shopping`

> 직접 확인한 레퍼런스 동작과 ONEPIECE에 적용할 제안 기능을 구분한다.

## 3. 사용자 흐름

```text
상품 상세
→ 옵션 선택
→ ADD TO CART
→ Cart Drawer에서 즉시 확인
→ VIEW CART
→ 전체 Cart에서 수량·상품 검토
→ CHECKOUT
```

빈 Cart의 흐름은 다음과 같다.

```text
Cart 진입
→ 비어 있음 안내
→ Continue shopping
→ 상품 목록으로 복귀
```

ONEPIECE P0에서는 Cart Drawer보다 전체 Cart 페이지를 먼저 구현한다.

```text
상품 상세
→ Add to Cart
→ /cart
→ Checkout
```

## 4. 화면 및 기능 분해

### 4.1 Cart Drawer

| 영역 | 레퍼런스 기능 | ONEPIECE 판단 |
|---|---|---|
| Header | `YOUR CART`, 닫기 | P1 |
| 상품 | 이미지, 이름, 가격, 옵션 | P1 |
| 수량 | 감소·현재 수량·증가 | P1 |
| 삭제 | 해당 상품 제거 | P1 |
| 합계 | 총 상품금액 | P1 |
| CTA | `VIEW CART`, `CHECKOUT` | P1 |

Cart Drawer는 퍼널을 짧게 만드는 데 효과적이지만 Header 담당자의 코드와 연결되어야 한다. 따라서 `/cart`가 완료된 뒤 팀 협의로 추가한다.

### 4.2 전체 Cart 페이지

| 영역 | 표시 정보 | 필요한 동작 |
|---|---|---|
| 제목 | `YOUR CART` 또는 `CART` | 현재 페이지 인지 |
| 상품 목록 | 이미지, 이름, 색상, 사이즈, 단가 | 상세 페이지 이동 가능 |
| 수량 | 감소, 수량, 증가 | 합계 즉시 갱신 |
| 삭제 | 상품 제거 | 제거 후 빈 상태 처리 |
| 요약 | 상품금액, 배송비, 최종금액 | 상태 변화에 따라 재계산 |
| 안내 | 배송비는 Checkout에서 계산될 수 있음 | 정책 오해 방지 |
| CTA | Checkout | `/checkout`으로 이동 |

### 4.3 빈 Cart

- 장바구니가 비어 있음을 명확히 알린다.
- 오류 화면처럼 보이지 않게 한다.
- `Continue shopping`으로 `/products`에 이동한다.
- 상품 추천은 P0에서 제외한다.

### 4.4 오류·예외 상태

- 수량은 1보다 작아지지 않는다.
- 수량은 재고보다 커지지 않는다.
- 품절된 옵션은 Checkout 전에 다시 확인한다.
- 가격이 담기 시점과 달라졌다면 사용자가 알 수 있어야 한다.
- 이미지가 없으면 대체 영역과 상품명을 표시한다.

## 5. ONEPIECE 적용 방향

### 정보 우선순위

1. 선택한 상품이 맞는가
2. 색상과 사이즈가 맞는가
3. 수량과 가격이 맞는가
4. 최종 결제 예상금액이 얼마인가
5. 다음 행동이 무엇인가

### 컴포넌트 책임

```text
CartPage
├── CartItemList
│   └── CartItem
│       ├── ProductImage
│       ├── ProductInfo
│       ├── QuantityControl
│       └── RemoveButton
└── CartSummary
    ├── PriceRows
    └── CheckoutButton
```

- `CartPage`: 데이터와 레이아웃을 연결한다.
- `CartItemList`: Cart 상품 목록과 빈 상태를 표시한다.
- `CartItem`: 상품 한 개와 사용자 조작을 담당한다.
- `CartSummary`: 상품금액·배송비·최종금액과 Checkout CTA를 표시한다.

### 상태 흐름

```text
Cart 상태
→ CartItemList에 items 전달
→ 사용자가 수량 변경 또는 삭제
→ Cart 상태 갱신
→ CartSummary가 새로운 합계를 표시
```

### 이벤트 측정

| 이벤트 | 발생 시점 |
|---|---|
| `add_to_cart` | 상품을 Cart에 추가했을 때 |
| `cart_view` | Cart 페이지에 진입했을 때 |
| `cart_quantity_changed` | 수량을 변경했을 때 |
| `remove_from_cart` | 상품을 삭제했을 때 |
| `continue_shopping` | 빈 Cart에서 상품 목록으로 이동했을 때 |
| `checkout_start` | Checkout 버튼을 눌렀을 때 |

## 6. 기능 우선순위

### P0 — 2일 안에 반드시 구현

- `/cart` 페이지
- 상품 이미지·이름·색상·사이즈·가격·수량
- 수량 증가·감소
- 상품 삭제
- 상품금액·배송비·최종금액 계산
- 빈 Cart 상태
- `/products`, `/checkout` 이동
- 반응형 기본 레이아웃
- TypeScript, lint, build 검증

### P1 — P0 완료 후

- Header Cart 개수
- Cart Drawer
- 새로고침 후 Cart 유지
- 퍼널 이벤트 저장
- 가격·재고 변경 안내

### P2 — 현재 범위 제외

- 실제 PG 결제
- 쿠폰·포인트
- 추천 상품
- 로그인 전·후 Cart 자동 병합
- 서버 재고 차감

## 7. 수용 기준

- [ ] 상품이 있으면 이미지·상품명·옵션·단가·수량이 표시된다.
- [ ] `+`를 누르면 재고 범위 안에서 수량이 증가한다.
- [ ] `-`를 눌러도 수량이 1보다 작아지지 않는다.
- [ ] 삭제하면 해당 상품만 제거된다.
- [ ] 수량·삭제 후 합계가 즉시 다시 계산된다.
- [ ] 모든 상품을 삭제하면 빈 Cart가 표시된다.
- [ ] 빈 Cart의 `Continue shopping`이 `/products`로 이동한다.
- [ ] Checkout CTA가 `/checkout`으로 이동한다.
- [ ] 모바일에서 정보와 CTA가 겹치지 않는다.
- [ ] 이벤트 테스트 데이터는 실제 지표와 구분된다.
- [ ] 정상 상태와 빈 상태를 실제 브라우저에서 확인한다.
- [ ] `npm run lint`와 `npm run build` 결과를 확인한다.

## 8. 제외 범위

이 명세는 화면 구조와 Cart 동작의 기준이다. 다음 내용은 별도 담당자 또는 후속 단계에서 결정한다.

- 실제 결제 승인
- 실제 배송비 정책
- 회원 인증과 권한
- 주문 생성 트랜잭션
- 재고 동시성 처리
- 운영 환경 분석 대시보드
