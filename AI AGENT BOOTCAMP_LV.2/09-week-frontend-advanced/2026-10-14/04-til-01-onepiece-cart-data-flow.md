# TIL | 2026-10-14 | ONEPIECE 장바구니 데이터 흐름 구현

> **장바구니 데이터를 타입부터 화면까지 작은 단위로 연결하고, 실제 `/cart` 응답에서 상품 두 개가 출력되는 것을 확인했다.**

> React 컴포넌트는 데이터를 직접 만들어 쓰기보다 Props로 전달받고, 합계처럼 원본에서 계산할 수 있는 값은 별도 상태로 중복 저장하지 않는 편이 안전하다는 점을 배웠다.

---

## 1. What — 무엇을 배웠는가?

### 핵심 개념

- TypeScript `interface`는 장바구니 상품 객체가 가져야 할 필드와 자료형을 정의하는 데이터 계약이다.
- `id`, `cartId`, `productVariantId`는 모두 숫자지만 각각 장바구니 항목, 장바구니, 상품 옵션을 식별한다.
- 장바구니에 담은 시점의 상품명·가격·옵션·이미지는 Snapshot 값으로 구분할 수 있다.
- Mock Data는 실제 DB를 연결하기 전에 데이터 흐름과 예외 처리를 검증하는 작은 테스트 데이터다.
- React의 Props는 부모 컴포넌트가 가진 데이터를 자식 컴포넌트에 전달한다.
- `map()`은 상품 배열을 화면 목록으로 바꾸고, 고유한 `key`는 React가 목록 항목을 구분하도록 돕는다.
- `reduce()`는 `단가 × 수량` 결과를 누적해 총 상품금액 하나로 만든다.
- ESLint 통과는 정적 검사 오류가 없다는 의미이며, 브라우저에서 기능이 정상 동작한다는 의미와는 다르다.

### 핵심 코드

#### 1. Cart 데이터 계약

```tsx
export interface CartItem {
    id: number;
    cartId: number;
    productVariantId: number;
    quantity: number;
    unitPriceAtAdded: number;
    productNameAtAdded: string;
    optionTextAtAdded: string | null;
    imageUrlAtAdded: string | null;
}
```

#### 2. 소량의 Mock Data

```tsx
import type { CartItem } from '../types/cart.types';

export const mockCartItems: CartItem[] = [
    {
        id: 1,
        cartId: 1,
        productVariantId: 1,
        quantity: 1,
        unitPriceAtAdded: 189000,
        productNameAtAdded: 'ONEPIECE Shell Jacket',
        optionTextAtAdded: 'BLACK / M',
        imageUrlAtAdded: null,
    },
    {
        id: 2,
        cartId: 1,
        productVariantId: 2,
        quantity: 2,
        unitPriceAtAdded: 69000,
        productNameAtAdded: 'ONEPIECE Logo T-Shirt',
        optionTextAtAdded: 'WHITE / L',
        imageUrlAtAdded: null,
    },
];
```

#### 3. Props와 `map()`을 이용한 목록 렌더링

```tsx
interface CartItemListProps {
    items: CartItem[];
}

export default function CartItemList({ items }: CartItemListProps) {
    if (items.length === 0) {
        return <p>장바구니에 담긴 상품이 없습니다.</p>;
    }

    return (
        <ul>
            {items.map((item) => (
                <li key={item.id}>{item.productNameAtAdded}</li>
            ))}
        </ul>
    );
}
```

#### 4. 페이지에서 데이터 연결

```tsx
import CartItemList from '@/domains/cart/components/CartItemList';
import { mockCartItems } from '@/domains/cart/mocks/cart.mock';

export default function CartPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-12">
            <h1 className="mb-8 text-2xl font-semibold">CART</h1>
            <CartItemList items={mockCartItems} />
        </main>
    );
}
```

#### 5. `reduce()`를 이용한 합계 계산

```tsx
const subtotal = items.reduce(
    (total, item) => total + item.unitPriceAtAdded * item.quantity,
    0,
);
```

> 목록과 Cart 페이지는 실제 응답에서 확인했다. `CartSummary` 코드는 ESLint를 통과했지만 아직 Cart 페이지에 연결하지 않았으므로 합계 출력은 완료로 보지 않는다.

### 오늘 수행한 실습

- `CartItem` 인터페이스에 장바구니 항목 ID, 장바구니 ID, 상품 옵션 ID, 수량과 Snapshot 필드를 정의했다.
- 같은 장바구니에 상품 두 개가 담긴 Mock Data를 만들고 서로 다른 수량을 지정했다.
- `CartItemList`에서 빈 목록 처리와 `map()` 기반 목록 출력을 구현했다.
- `/cart` 페이지가 Mock Data를 `CartItemList`의 Props로 전달하도록 연결했다.
- 실제 `/cart` 응답이 HTTP 200을 반환하고 상품명·옵션·가격을 포함하는 것을 확인했다.
- `CartSummary`에서 `reduce()`로 총 상품금액을 계산하는 코드를 작성하고 ESLint를 통과했다.
- `CartSummary`의 페이지 연결과 327,000원 화면 출력은 다음 작업으로 남겼다.

### 실제 작성한 코드와 검증 상태

| 구분 | 작성 내용 | 검증 상태 |
|---|---|---|
| 데이터 계약 | `CartItem` 인터페이스 | 파일 단위 ESLint 통과 |
| 테스트 데이터 | Cart 상품 2개의 Mock Data | 파일 단위 ESLint 통과 |
| 목록 UI | 빈 상태, `map()`, 고유 `key`, 가격·수량 출력 | ESLint 및 `/cart` 응답 확인 |
| 페이지 연결 | Mock Data를 `CartItemList`에 Props로 전달 | HTTP 200과 상품 2개 출력 확인 |
| 합계 UI | `reduce()` 기반 상품 총액 | ESLint 통과, 페이지 미연결 |

---

## 2. Why — 왜 필요한가?

### 이 개념이 필요한 이유

- 데이터 타입을 먼저 정하면 컴포넌트마다 서로 다른 필드명을 사용하는 문제를 줄일 수 있다.
- 상품 옵션 ID를 별도로 두면 같은 상품의 색상과 사이즈 조합을 구분할 수 있다.
- Snapshot 값은 상품 정보가 나중에 변경되어도 사용자가 장바구니에 담았던 시점의 정보를 표시하는 데 필요하다.
- 작은 Mock Data로 먼저 연결하면 DB 연동 전에 목록 렌더링과 계산 로직을 빠르게 검증할 수 있다.
- 합계를 원본 배열에서 계산하면 상품 목록과 합계 상태가 서로 달라지는 문제를 줄일 수 있다.

### 내 생각

> 처음에는 `id`가 모두 비슷한 숫자로 보여 혼동됐지만, 각 ID가 서로 다른 테이블의 행과 관계를 식별한다는 점을 이해했다. 타입, Mock Data, 컴포넌트, 페이지 순서로 연결하니 장바구니 화면이 한 번에 만들어지는 것이 아니라 데이터가 단계적으로 전달되어 완성된다는 흐름이 보이기 시작했다.

---

## 3. How — 어떻게 작동하는가?

### 작동 과정

1. `CartItem` 인터페이스가 장바구니 상품 한 개의 데이터 구조를 정한다.
2. Mock Data가 `CartItem[]` 형태의 상품 두 개를 만든다.
3. Cart 페이지가 Mock Data를 `items` Props로 전달한다.
4. `CartItemList`가 빈 배열인지 먼저 확인한다.
5. 상품이 있으면 `map()`이 각 상품을 하나의 목록 항목으로 변환한다.
6. `CartSummary`는 같은 상품 배열을 받아 `reduce()`로 총 상품금액을 계산한다.

### 내 말로 설명하기

> Cart 페이지는 데이터를 가지고 있는 부모이고, 목록과 요약 컴포넌트는 데이터를 받아 각자의 역할을 수행하는 자식이다. 목록은 상품을 반복해서 보여주고, 요약은 같은 데이터에서 가격과 수량을 계산한다. 화면에 필요한 데이터의 원본은 하나로 유지하고 컴포넌트별 책임만 나누는 구조다.

---

## 4. ERD와 명세 설계 기록

### ERD를 다시 수정한 이유

처음에는 회원·상품·주문처럼 큰 기능 단위의 테이블 관계를 만드는 데 집중했다. 그러나 실제 화면을 구현하려면 상품의 색상·사이즈, 장바구니에 담은 시점의 정보, 이미지가 노출되는 위치, 테스트 이벤트 구분까지 데이터 구조에서 설명할 수 있어야 했다. 나중에 프론트엔드 타입과 DB를 반복해서 바꾸는 일을 줄이기 위해 구현 직전에 ERD를 다시 구체화했다.

### 수정할 때 중요하게 본 포인트

- Supabase Auth 사용자와 서비스 프로필을 연결할 수 있도록 인증 ID와 서비스 데이터를 구분한다.
- `products`와 `product_variants`를 나눠 같은 상품의 색상·사이즈·재고 조합을 식별한다.
- `carts`와 `cart_items`를 분리해 한 장바구니가 여러 상품 옵션을 가질 수 있게 한다.
- 상품명·옵션·가격·이미지는 장바구니나 주문에 담긴 시점의 Snapshot으로 보존할 수 있게 한다.
- 공통 이미지 자산은 사용 위치를 `main`, `list`, `detail`처럼 구분할 수 있는 구조를 고려한다.
- 대분류와 중분류는 `parent_id`로 연결해 `OUTER → jacket/padding`처럼 계층을 표현한다.
- 구매 퍼널을 검증할 이벤트 데이터에는 테스트 사용 여부를 구분할 수 있는 `is_test`가 필요하다.
- 각 테이블의 `id`는 그 테이블 행의 PK이며, `cart_id`, `product_variant_id`처럼 관계를 나타내는 FK와 역할이 다름을 명확히 한다.
- Supabase를 사용할 때 사용자별 데이터 접근 범위를 제한하는 RLS 정책과 변경 이력을 남기는 SQL migration이 필요하다는 점을 설계 범위에 포함한다.

### 구현에 미치는 영향

ERD의 이름과 자료형은 TypeScript 타입, Mock Data, Supabase 테이블과 맞아야 한다. 오늘 작성한 `CartItem`도 이 관계를 따라 `cartId`, `productVariantId`, Snapshot 필드를 구분했다. 즉, ERD는 보고용 그림이 아니라 프론트엔드가 사용할 데이터 계약의 출발점이다.

### 실무 명세 레퍼런스와 내일의 계획

튜터님이 실제 실무에서 사용했던 명세를 레퍼런스로 제공해 주셨다. 오늘은 기능 구현 순서와 데이터 필드를 정하는 수준이었다면, 내일부터는 화면 목적, 사용자 행동, 데이터 입출력, 예외 상태, 완료 조건과 테스트 방법까지 명세에 더 구체적으로 기록할 예정이다. 레퍼런스 원문을 그대로 옮기기보다 ONEPIECE 프로젝트에 필요한 항목을 해석해 적용한다.

---

## 5. 오늘의 문제 해결

### 문제 상황

- 하려고 했던 것: JSX 안에 장바구니 목록을 설명하는 주석을 작성한다.
- 발생한 문제: 일반 JavaScript 주석 문법을 JSX 태그의 자식 영역에 작성해 ESLint 오류가 발생했다.
- 오류 메시지:

```text
Comments inside children section of tag should be placed inside braces
```

### 문제가 발생한 코드

```tsx
<ul>//장바구니 아이템 목록
```

### 문제의 원인

- JSX 태그 안의 `//`는 주석이 아니라 화면에 표시될 텍스트로 해석된다.
- 주석 내용도 코드가 이미 보여주는 사실을 반복하고 있어 유지할 이유가 부족했다.

### 해결한 코드

```tsx
<ul>
    {items.map((item) => (
        <li key={item.id}>{item.productNameAtAdded}</li>
    ))}
</ul>
```

### 해결 원리

> JSX 내부 주석은 `{/* ... */}` 형식을 사용해야 한다. 다만 주석은 코드가 무엇을 하는지 반복하기보다, 빈 배열을 별도로 처리하는 이유처럼 코드만으로 알기 어려운 의도를 설명할 때 남기는 편이 낫다.

---

## 6. 팀 기획과 협업 회고

팀 기획회의에서는 한 사람이 정한 안을 그대로 나누기보다 각 담당자가 구현 관점에서 의견을 더하며 서비스 방향을 발전시켰다. 페이지 담당이 달라도 상품·Cart·주문·회원 데이터가 연결되기 때문에, 서로의 구현에 필요한 필드와 예외 상태를 함께 이야기한 과정이 좋았다. 특히 구매 퍼널을 짧게 만들고 메인 화면의 정보 피로를 줄이려는 목적이 화면 구성뿐 아니라 ERD와 기능 명세에도 이어져야 한다는 점을 확인했다.

앞으로는 회의 결과를 다음 세 가지로 나누어 기록할 계획이다.

1. 사용자가 겪는 문제와 우리가 검증할 가설
2. 화면·데이터·기능으로 확정된 결정
3. 담당자, 완료 조건, 검증 방법이 포함된 개발 Task

---

## 7. KPT 회고

### Keep — 계속할 것

- 타입 → 소량의 Mock Data → 컴포넌트 → 페이지 순서로 작게 연결한다.
- 파일을 저장한 뒤 해당 파일부터 ESLint로 검사한다.
- 코드 존재와 브라우저에서 확인된 동작을 구분해서 기록한다.
- 주석은 동작을 반복하지 않고 설계 의도와 이유를 설명한다.
- 팀원의 관점을 받아 기획과 데이터 구조를 함께 구체화한다.

### Problem — 개선할 것

- Git 브랜치와 실행 중인 개발 서버의 관계가 익숙하지 않아 다른 브랜치의 화면을 확인하는 과정에서 혼동이 있었다.
- JSX 내부 주석과 일반 TypeScript 주석의 문법 차이를 처음에는 구분하지 못했다.
- Snapshot 필드의 주석이 필드명을 반복하지 않고 보존 이유를 설명하도록 더 다듬을 필요가 있다.
- `CartSummary`는 코드 검사만 통과했고 아직 실제 Cart 페이지에 연결하지 않았다.
- 기능 명세의 완료 조건과 예외 상태가 아직 충분히 구체적이지 않다.

### Try — 다음에 시도할 것

- `CartSummary`를 Cart 페이지에 연결하고 327,000원이 출력되는지 수동 계산과 비교한다.
- 상품 목록을 상태로 관리하고 수량 증가·감소와 삭제 기능을 구현한다.
- 전체 삭제 후 빈 장바구니 안내가 표시되는지 확인한다.
- 디자인 적용 후 실제 상품 이미지와 옵션 정보를 연결한다.
- 실무 명세 레퍼런스를 바탕으로 Cart 기능 명세에 입력·출력·예외·검증 기준을 보강한다.

---

## 8. 이해도 점검

- [ ] 핵심 개념을 내 말로 설명할 수 있다.
- [ ] 예제를 보지 않고 기본 코드를 작성할 수 있다.
- [ ] 코드가 실행되는 순서를 설명할 수 있다.
- [ ] 오늘 발생한 오류의 원인을 설명할 수 있다.

### 현재 이해도

- [ ] ⭐ 아직 거의 이해하지 못했다.
- [ ] ⭐⭐ 일부만 이해했다.
- [ ] ⭐⭐⭐ 설명을 보면 이해하지만 혼자 작성하기 어렵다.
- [ ] ⭐⭐⭐⭐ 대부분 이해했고 간단한 코드를 작성할 수 있다.
- [ ] ⭐⭐⭐⭐⭐ 혼자 작성하고 다른 사람에게 설명할 수 있다.

별도의 이해도 평가를 진행하지 않았으므로 체크하지 않았다.

---

## 9. 다음 학습에서 할 일

1. `CartSummary`를 Cart 페이지에 연결하고 실제 합계를 확인한다.
2. Cart 기능 명세에 사용자 행동, 데이터 입출력, 예외 상태, 완료 조건과 테스트 방법을 작성한다.
3. `useState`로 장바구니 상품 목록을 관리한다.
4. 수량 변경·상품 삭제·빈 상태가 합계와 함께 갱신되는지 검증한다.

---

## 관련 자료

- [Week 9 학습 기록](../README.md)

---

## STAR 문제 해결 기록

### Situation — 상황

장바구니 담당 파일은 준비되어 있었지만 타입, 데이터, 컴포넌트와 페이지 내용이 비어 있어 `/cart` 화면을 렌더링할 수 없는 상태였다.

### Task — 해결 과제

장바구니 상품의 데이터 구조를 확정하고, 작은 Mock Data를 목록 컴포넌트와 페이지에 연결해 실제 화면에서 상품이 출력되는 지점까지 구현해야 했다.

### Action — 실행한 행동

1. ERD의 장바구니 항목과 상품 옵션 관계를 기준으로 `CartItem` 타입을 정의했다.
2. Supabase Auth, 상품 옵션, Cart Snapshot, 공통 이미지 위치, 카테고리 계층, 테스트 이벤트를 중심으로 ERD를 다시 구체화했다.
3. 서로 다른 상품 옵션과 수량을 가진 Mock Data 두 개를 만들었다.
4. Props, 빈 배열 처리, `map()`과 고유 `key`를 적용한 목록 컴포넌트를 작성했다.
5. Cart 페이지에서 Mock Data를 목록 컴포넌트에 전달했다.
6. ESLint와 실제 `/cart` 응답을 나누어 검증했다.
7. 다음 단계의 합계 계산을 위해 `reduce()` 기반 요약 컴포넌트를 작성했다.
8. 팀 기획회의에서 화면과 데이터 요구사항을 함께 발전시키고, 실무 명세 레퍼런스를 다음 작업에 적용하기로 했다.

### Result — 결과

- Cart 관련 타입, Mock Data, 목록, 페이지와 요약 컴포넌트가 각각 ESLint를 통과했다.
- `/cart`가 HTTP 200을 반환하고 상품 두 개의 이름·옵션·가격을 출력했다.
- 목록과 합계가 같은 데이터 원본을 공유하는 구조를 만들었다.
- ERD 변경 기준과 다음 명세 보강 항목을 구현 작업과 연결해 기록했다.
- 요약 컴포넌트의 페이지 연결과 상호작용 기능은 아직 완료하지 않았다.
