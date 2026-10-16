# Learning Notes | 2026-10-16 | ONEPIECE Cart Drawer와 테스트 데이터 계약

- 학습 구분: LV.2 / Week 9
- 학습 범위: 공통 상태, Custom Hook, Dialog 조합, 가격 포맷, Mock 데이터와 테스트 해석.

## 1. 화면과 행동의 책임 나누기

`CartItemList`는 상품과 버튼을 표시하고 전달받은 콜백을 호출한다. `useCartActions`는 수량 증가·감소·삭제를 담당한다. `CartDrawer`와 전체 Cart 화면은 이 목록과 행동을 재사용한다.

`useCartActions`는 화면용 JSX 대신 호출할 함수들을 반환한다. JSX를 반환하는 컴포넌트와, 상태를 다루는 Hook의 책임을 구분해야 한다.

버튼 클릭 → 콜백 호출 → 이전 배열로 새 배열 생성 → 공통 상태 갱신 → Header·Drawer·전체 Cart 다시 렌더링 순서로 연결된다. `setCartItems`는 이 프로젝트에서 정의한 Zustand action이다.

## 2. 합계는 원본 상태에서 계산하기

```tsx
const subtotal = cartItems.reduce(
    (total, item) => total + item.unitPriceAtAdded * item.quantity,
    0,
);
```

상품 배열과 합계를 별도 상태로 저장하면 한쪽만 갱신될 수 있다. 상품금액은 단가와 수량으로, Header 수량은 각 상품의 수량 합으로 계산한다. 서로 다른 상품의 개수와 총 수량은 구분한다.

## 3. Drawer의 스크롤 영역 나누기

오늘 구현한 패널은 높이를 화면에 맞추고 세 영역으로 나눈다.

| 영역 | 적용한 기준 |
| --- | --- |
| 제목·닫기 | `shrink-0`으로 영역 유지 |
| 상품 목록 | `min-h-0 flex-1 overflow-y-auto`로 내부 스크롤 |
| 주문 요약·버튼 | `shrink-0`으로 목록과 별도 배치 |

패널에는 `overflow-hidden`을 적용해 목록이 바깥으로 넘치지 않게 했다. 데스크톱 최대 폭은 700px, 모바일은 화면 폭 이내, 내부 여백은 20px로 정리했다.

`VIEW CART`는 Dialog의 닫기 동작과 Next.js Link를 조합한다. 전체 페이지를 새로 불러오지 않는 이동에서는 같은 공통 상태의 수정 결과를 이어서 사용했다. 새로고침 후 영속 저장은 구현하지 않았다.

## 4. 가격 표시와 가격 계산 구분하기

```ts
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price) + 'KRW';
}
```

계산은 숫자로 수행하고 화면에 표시할 때만 문자열로 바꾼다. 공통 함수를 수정하면 이를 사용하는 상품 목록·상세·Cart의 통화 표기를 함께 바꿀 수 있다. 오늘 출력 규칙은 숫자와 KRW 사이에 공백이 없는 형식이다.

## 5. 공용 상품과 Cart Snapshot의 관계

상품 목록·상세·Cart의 상품명·가격·이미지를 각각 손으로 관리하면 같은 상품이 다른 내용으로 보일 수 있다. 공용 상품을 원본으로 삼고, 담을 때 선택한 옵션과 당시 값을 Cart 항목으로 생성하는 방향을 정리했다. 이 연결은 아직 구현하지 않았다.

- 상품 ID는 상품을 식별한다.
- Variant ID는 색상·사이즈 등 특정 옵션을 식별한다.
- Cart 항목 ID는 장바구니 안의 한 항목을 식별한다.
- `unitPriceAtAdded` 등은 담은 시점의 값이다. 기존 Snapshot을 현재 판매가로 무조건 덮어쓰는 정책과는 구분한다.

## 6. 테스트 데이터와 행동 결과 구분하기

Supabase에 비회원·구매 0회 회원·1회 회원·2회 이상 회원을 각 25명으로 나눈 합성 프로필 100개와 실험 배정을 준비했다. 이 프로필은 로그인 계정이나 실제 주문 이력이 아니다. 별도의 행동 실행도 필요하다.

실험용 상품 4개와 제안 옵션 16개를 준비했지만, 서비스 ERD의 컬럼·키와 대조가 끝나지 않아 서비스 연결은 보류했다. 상품 DB 없이 공용 Mock으로도 화면 흐름 테스트를 시작할 수 있다.

AI 브라우저 실행이 성공하거나 중단된 결과는 설정된 과업에서의 결과다. 실제 고객의 구매 의도·피로·전환 개선을 입증한 수치로 해석하지 않는다. 실행 시간에도 모델과 도구 지연이 들어갈 수 있다.

## 관련 기록

- [실습·검증 기록](./03-practice-01-onepiece-cart-drawer-and-test-data.md)
- [오늘의 TIL](./04-til-01-onepiece-cart-drawer-and-test-design.md)
