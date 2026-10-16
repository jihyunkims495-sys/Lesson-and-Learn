# Practice | 2026-10-16 | ONEPIECE Cart Drawer와 테스트 데이터 준비

- 학습 구분: LV.2 / Week 9
- 담당: Cart UI와 상태 연결.
- 수행 구분: 코칭을 받아 기능을 구현했고, PR 준비 과정에서 코드 정리와 브라우저·정적 검증을 진행했다. 테스트 데이터는 SQL 실행 지원을 받아 준비했다.

## 1. KRW 공통 표기

가격 포맷 함수의 접미사를 KRW로 수정하고 테스트 기대값을 갱신했다. 상품 목록·상세·Cart에서 같은 함수를 사용한다.

| 입력 | 확인한 출력 |
| ---: | --- |
| 1,500,000 | `1,500,000KRW` |
| 0 | `0KRW` |
| -5,000 | `-5,000KRW` |

가격 테스트 3개가 통과했다. 브라우저에서 목록 가격 158,000KRW, 상세 정가·판매가 158,000KRW·153,260KRW, Cart의 단가와 합계에 KRW 표기가 적용된 것을 확인했다.

## 2. Cart 행동을 Hook으로 분리

실제 구현한 감소·삭제 로직의 발췌다. Hook 내부에서 공통 상태의 `setCartItems`를 가져와 사용한다.

```tsx
function handleDecreaseQuantity(cartItemId: number) {
    setCartItems((previousItems) =>
        previousItems.map((item) =>
            item.id === cartItemId
                ? { ...item, quantity: Math.max(1, item.quantity - 1) }
                : item,
        ),
    );
}

function handleRemoveItem(cartItemId: number) {
    setCartItems((previousItems) =>
        previousItems.filter((item) => item.id !== cartItemId),
    );
}
```

증가 함수는 선택한 항목의 수량을 1 늘린다. 감소는 상태 변경에서도 최소 1개를 보장하고, 삭제는 해당 ID를 제외한 새 배열을 만든다.

## 3. Drawer와 전체 Cart 연결

공통 Header의 CART를 Drawer 트리거로 바꿨다. Drawer에 기존 상품 목록, 공통 행동, 금액 합계와 버튼을 연결했다.

```tsx
<DialogClose
    nativeButton={false}
    render={<Link href="/cart" />}
    className="flex w-full items-center justify-center border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-medium text-black hover:bg-gray-200"
>
    VIEW CART
</DialogClose>
```

위 코드는 실행한 구현의 발췌다. Dialog의 닫기와 Link 이동을 조합하며, 실제 확인에서 Drawer를 닫고 `/cart`로 이동한 뒤 수정 수량이 유지됐다. CHECKOUT은 화면에 배치했지만 결제가 미연결이므로 비활성화했다.

## 4. 브라우저 실제 검증

아래는 Drawer PR 준비 과정에서 실행한 결과다. 오늘 문서 작성 시 재실행한 결과와 혼동하지 않는다.

| 조작 | 실제 결과 |
| --- | --- |
| 목록·상세에서 CART 열기 | 상품 3개, Header 수량 3, 합계 327,000KRW |
| 재킷 수량 1 → 2 | Header 4, 합계 516,000KRW |
| VIEW CART 클릭 | Drawer 닫힘, `/cart` 이동, 재킷 2개와 516,000KRW 유지 |
| 전체 Cart에서 재킷 감소 | Header 3, 합계 327,000KRW; Drawer도 동기화 |
| 수량 1에서 감소 | 감소 버튼 비활성화 |
| 코트 → 티셔츠 → 재킷 삭제 | 합계 258,000 → 189,000 → 0KRW; Header 0과 빈 안내 |
| Escape 입력 | Drawer 닫힘 |
| 화면 390 × 844 | 목록 내부 스크롤, 하단 요약·버튼 표시 |

목록 스크롤 영역은 높이 504px, 스크롤 콘텐츠는 651px로 확인했다. Drawer와 전체 Cart는 같은 상태를 읽지만, 상품 상세에서 새 상품을 담는 연동은 아직 없다.

## 5. 오류와 최소 수정

### Hook에 페이지 JSX가 남은 문제

- 최초 잘못된 상태: 페이지에서 행동 함수를 옮기면서 JSX 반환부까지 `.ts` Hook에 남겼다.
- 직접 원인: 해당 파일에 JSX 문법이 포함되어 `Parsing error: > expected`가 발생했다.
- 최소 수정: JSX를 제거하고 세 행동 함수를 객체로 반환했다. 페이지에 남은 미사용 setter도 제거했다.
- 재실행 결과: 관련 두 파일 ESLint가 통과했다. 이후 Drawer와 전체 Cart의 같은 행동을 브라우저에서 확인했다.

### Header 수량 hydration 불일치

- 사용자 화면에서 서버 3, 클라이언트 2의 수량 차이가 보고됐다.
- 전체 새로고침 후 상품 3개·CART 3·327,000KRW가 나타나며 오류 화면이 사라졌다.
- Mock 초기값 변경과 개발 중 유지된 상태의 차이가 원인 후보지만 확정하지 않았다. 확장 프로그램 문제로 단정하거나 경고를 숨기는 코드를 추가하지 않았다.

### 폭·문자 크기·경계선

- `600x`와 `test-sm` 오타를 유효한 폭·글자 크기 클래스로 정리했다.
- 최종 폭은 데스크톱 최대 700px로 정했다.
- 목록의 하단 선은 Drawer 안에서만 제거해 전체 Cart의 목록 스타일을 보존했다.

## 6. 정적 검사와 빌드 한계

| 검사 | PR 준비 시 결과 |
| --- | --- |
| `npm test` | 가격 포맷 테스트 3개 통과 |
| `npm run lint` | 오류 0, 기존 상품 상세 이미지 경고 2개 |
| `git diff --cached --check` | 통과 |
| `npm run build` | 컴파일 후 TypeScript 검사 실패 |

빌드 실패는 기존에 비어 있던 로그인·체크아웃 관련 경로 4개에서 모듈 오류가 발생했기 때문이다. 상품 상세에서는 공통 Header의 `usePathname`과 Suspense에 관한 prerender 진단도 관찰했다. 전체 TypeScript·빌드 통과로 기록하지 않는다. 병합 후 최신 통합 코드의 빌드는 이번 문서 작업에서 재검증하지 않았다.

## 7. 테스트 데이터 실제 준비 결과

합성 데이터용 스키마에 프로필·상품·옵션·실험·배정 테이블 5개를 생성했다. 테이블 5개 모두 RLS가 활성화된 상태를 검증했다.

| 코호트 | 프로필 수 | A | B |
| --- | ---: | ---: | ---: |
| 비회원 | 25 | 13 | 12 |
| 회원·구매 0회 | 25 | 12 | 13 |
| 회원·구매 1회 | 25 | 13 | 12 |
| 회원·구매 2회 이상 | 25 | 12 | 13 |
| 합계 | 100 | 50 | 50 |

상품은 4개, 제안 옵션은 16개다. 구매 횟수와 재고는 합성 시나리오 값이며 Auth 계정·실제 구매 이력이 아니다. 서비스 ERD의 컬럼과 키가 검증되지 않아 서비스 데이터 모델로 연결하지 않았다.

테스트 서버 배포, GA4 연결, 브라우저 페르소나 실행은 아직 하지 않았다. 장바구니 전환율·퍼널 단계별 이탈률·체류시간 수치는 없다.

## 관련 기록

- [개념 정리](./02-learning-notes-01-onepiece-cart-drawer-and-data-contracts.md)
- [오늘의 TIL](./04-til-01-onepiece-cart-drawer-and-test-design.md)
