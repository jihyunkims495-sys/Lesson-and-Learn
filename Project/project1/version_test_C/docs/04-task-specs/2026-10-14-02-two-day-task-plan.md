# ONEPIECE Cart·ERD 2일 작업 명세

## 문서 정보

- 작성일: 2026-10-14
- 작업 기간: 2026-10-14~2026-10-15, 워킹데이 2일
- 작업 브랜치: `feat/cart`
- 기준 브랜치: `dev`
- 작업 원칙: 각 단계를 직접 구현하고 실제 실행 결과를 확인한 뒤 다음 단계로 이동함
- 완료와 미완료를 파일 존재 여부가 아니라 실행 결과로 구분함

## 1. 작업 목표

### 서비스 결과

- 현재 ERD를 상품·Cart·주문·분석 스냅샷 관점으로 보강한다.
- 상품 데이터 계약과 Cart 데이터 계약을 확정한다.
- 산산기어를 참고한 간결한 `/cart` 페이지를 구현한다.
- 수량 변경·삭제·합계·빈 상태를 구현한다.
- 상품 상세부터 Checkout 시작까지의 최소 구매 흐름을 연결한다.
- 페이지 체류시간과 구매전환율을 측정할 이벤트 구조를 설계한다.

### 학습 결과

- JavaScript 객체·배열과 `map`, `filter`, `reduce`를 Cart 기능에 적용한다.
- TypeScript 인터페이스와 Props 타입을 이해한다.
- React 컴포넌트·Props·State·이벤트 핸들러를 이해한다.
- Next.js App Router, Route Group, Server/Client Component 차이를 이해한다.
- ERD → Type → Mock Data → Component → Page의 데이터 흐름을 설명할 수 있다.

## 2. 우선순위

### P0

- ERD의 상품·Cart·주문 스냅샷 구조 확정
- Product 타입과 DB 필드 대응
- CartItem 타입
- 소량 Mock Data
- CartItemList, CartSummary, CartPage
- 수량 변경·삭제·합계·빈 상태
- 브라우저·lint·build 검증

### P1

- 상품 상세의 Add to Cart 연결
- Header Cart 개수
- Cart Drawer
- localStorage 유지
- 이벤트 기록

### P2

- Supabase Cart 영구 저장
- 로그인·비로그인 Cart 병합
- 실제 주문·결제·재고 차감
- A/B 테스트 운영 자동화

## 3. 선행조건과 의존성

| 의존성 | 확인 또는 협의 내용 |
|---|---|
| ERD | PK·FK, Snapshot 필드, `is_test` 기준 |
| 상품 담당자 | Product 필드, 이미지 배열, 가격 필드 |
| 상품 상세 담당자 | Add to Cart 전달 데이터와 호출 위치 |
| Header 담당자 | Cart 개수와 Drawer 추가 시 공용 파일 수정 |
| Checkout 담당자 | `/checkout` 경로와 Cart 전달 범위 |
| 팀 컨벤션 | 최신 `dev`에서 분기, PR base는 `dev` |

공용 파일을 수정하기 전 담당자에게 알리고, Cart PR에는 Cart 작업과 무관한 변경을 포함하지 않는다.

## 4. 오늘 작업

### 목표

데이터 기준을 확정하고 정적 Cart 화면까지 연결한다.

| 순서 | ID | 작업 | 산출물 | 완료 확인 |
|---:|---|---|---|---|
| 1 | ERD-01 | 기존 ERD 테이블·관계 점검 | 현재 구조 목록 | 화면 확인 |
| 2 | ERD-02 | 상품·주문 Snapshot 필드 확정 | ERD 수정안 | PK·FK 검토 |
| 3 | ERD-03 | `carts`, `cart_items` 추가 | Cart 관계 | 관계선 확인 |
| 4 | ERD-04 | 세션·페이지·이벤트 구조 확정 | 분석 관계 | 지표 계산 가능 여부 |
| 5 | DATA-01 | Product 데이터 계약 확정 | `Product` 타입 기준 | ERD 필드 대조 |
| 6 | DATA-02 | CartItem 데이터 계약 확정 | `CartItem` 타입 기준 | Variant 연결 확인 |
| 7 | DATA-03 | 상품 약 4개와 Cart 약 2개 Mock 설계 | 소량 Mock Data | 직접 읽고 검토 |
| 8 | UI-01 | `CartItemList` 정적 UI | 상품 목록 | 브라우저 출력 |
| 9 | UI-02 | `CartSummary` 정적 UI | 가격 요약 | 브라우저 출력 |
| 10 | QA-01 | 당일 오류 점검 | 검증 기록 | 실제 명령 결과 |

### 오늘 학습 포인트

- PK, FK, 1:N 관계
- 현재값과 Snapshot 값의 차이
- TypeScript `interface`
- 배열의 객체를 `.map()`으로 화면에 출력하는 과정
- Props로 데이터 전달하기

## 5. 내일 작업

### 목표

정적 화면을 실제 Cart 동작으로 완성하고 팀 PR이 가능한 상태로 만든다.

| 순서 | ID | 작업 | 산출물 | 완료 확인 |
|---:|---|---|---|---|
| 1 | STATE-01 | `useState`로 Cart 목록 관리 | Cart 상태 | React DevTools 또는 화면 |
| 2 | STATE-02 | 수량 증가·감소 | Quantity 동작 | 경계값 테스트 |
| 3 | STATE-03 | 상품 삭제 | Remove 동작 | 대상만 삭제 |
| 4 | STATE-04 | `reduce()`로 합계 계산 | 합계 로직 | 수동 계산 대조 |
| 5 | STATE-05 | 빈 Cart 상태 | Empty UI | 전체 삭제 후 확인 |
| 6 | FLOW-01 | 상품 상세 Add to Cart 연결 | Detail → Cart | 경로·옵션 확인 |
| 7 | FLOW-02 | Checkout 이동 연결 | Cart → Checkout | 라우팅 확인 |
| 8 | UI-03 | 모바일·데스크톱 정리 | 반응형 Cart | 뷰포트 확인 |
| 9 | EVENT-01 | 핵심 이벤트 연결 | 테스트 이벤트 | `is_test` 확인 |
| 10 | QA-02 | 정상·빈·오류 상태 점검 | 테스트 결과 | 브라우저·콘솔 |
| 11 | QA-03 | lint·build | 명령 결과 | Exit code 0 |
| 12 | GIT-01 | Cart PR 준비 | PR 설명·스크린샷 | 리뷰 요청 |

### 내일 학습 포인트

- React State와 리렌더링
- 상태를 직접 수정하지 않는 이유
- `map()`을 사용한 항목 변경
- `filter()`를 사용한 삭제
- `reduce()`를 사용한 합계 계산
- 이벤트 핸들러와 Client Component
- 페이지 간 상태 공유

## 6. 개발 Task 목록

| ID | 우선순위 | Task | 선행 Task |
|---|---|---|---|
| ERD-01 | P0 | 기존 7개 테이블 점검 | 없음 |
| ERD-02 | P0 | 상품·주문 Snapshot 보강 | ERD-01 |
| ERD-03 | P0 | Cart 테이블과 관계 추가 | ERD-01 |
| ERD-04 | P0 | 이벤트·체류시간 구조 보강 | ERD-01 |
| DATA-01 | P0 | Product 타입 확정 | ERD-02 |
| DATA-02 | P0 | CartItem 타입 확정 | DATA-01, ERD-03 |
| DATA-03 | P0 | 소량 Mock Data | DATA-01, DATA-02 |
| UI-01 | P0 | CartItemList | DATA-03 |
| UI-02 | P0 | CartSummary | DATA-03 |
| UI-03 | P0 | CartPage | UI-01, UI-02 |
| STATE-01 | P0 | Cart 상태 | UI-03 |
| STATE-02 | P0 | 수량 변경 | STATE-01 |
| STATE-03 | P0 | 삭제 | STATE-01 |
| STATE-04 | P0 | 합계 | STATE-01 |
| STATE-05 | P0 | 빈 상태 | STATE-03 |
| FLOW-01 | P1 | 상품 상세 연결 | STATE-01, 담당자 협의 |
| FLOW-02 | P0 | Checkout 이동 | UI-03 |
| EVENT-01 | P1 | 퍼널 이벤트 | ERD-04, STATE-01 |
| QA-01 | P0 | 브라우저·콘솔 | 각 구현 직후 |
| QA-02 | P0 | lint·build | 전체 P0 |
| GIT-01 | P0 | PR | QA-02 |

## 7. 학습 목표

### JavaScript

- 객체가 상품 한 개를 표현한다.
- 배열이 Cart 상품 목록을 표현한다.
- `map()`은 목록 출력과 특정 항목 변경에 사용한다.
- `filter()`는 항목 삭제에 사용한다.
- `reduce()`는 총금액 계산에 사용한다.
- 전개 연산자로 기존 상태를 훼손하지 않고 새 값을 만든다.

### TypeScript

- Product와 ProductVariant와 CartItem의 책임을 구분한다.
- Props의 입력 타입을 명확히 정의한다.
- 필수값과 Nullable 값을 구분한다.

### React

- 컴포넌트를 책임 단위로 나눈다.
- 부모 상태를 Props로 자식에게 전달한다.
- 사용자 클릭을 이벤트 핸들러로 상태에 반영한다.
- State에서 계산 가능한 합계를 중복 저장하지 않는다.

### Next.js

- `(shop)`은 URL에 나타나지 않는 Route Group이다.
- `/cart`는 `app/(shop)/cart/page.tsx`가 담당한다.
- 클릭·State가 필요한 컴포넌트에만 `"use client"`를 사용한다.
- 페이지 이동은 `Link`를 우선 사용한다.

## 8. 협업 및 Git 규칙

```text
origin/dev
→ dev
→ feat/cart
→ Pull Request base: dev
→ 리뷰
→ dev 병합
```

- 한 PR에는 Cart 작업 목적 하나만 담는다.
- `git add .`보다 Cart 대상 파일을 명시적으로 Stage한다.
- Header·Layout 같은 공용 파일은 수정 전 팀에 공유한다.
- Commit은 실제로 확인된 작은 작업 단위로 만든다.
- 예시: `feat: 장바구니 상품 목록 UI 추가`

## 9. 완료 기준

- [ ] ERD와 Product 타입의 필드·자료형이 대응한다.
- [ ] ERD에 Cart와 Snapshot 관계가 표시된다.
- [ ] 상품 약 4개로 먼저 검증한다.
- [ ] Cart 상품 약 2개로 목록과 합계를 검증한다.
- [ ] 정상 Cart가 브라우저에 표시된다.
- [ ] 빈 Cart가 브라우저에 표시된다.
- [ ] 수량·삭제·합계가 정상 동작한다.
- [ ] 고유 `key`가 적용된다.
- [ ] 이미지 `src`, `alt`, 크기가 확인된다.
- [ ] 브라우저 콘솔 오류가 없다.
- [ ] `npm run lint` 결과가 확인된다.
- [ ] `npm run build` 결과가 확인된다.
- [ ] PR에 변경 내용과 확인 방법이 작성된다.
- [ ] 팀원의 리뷰 후 `dev`에 병합된다.

## 10. 범위 제외

- 실제 결제 승인
- 실제 고객 전환율 주장
- 운영 Supabase 데이터 대량 적재
- 쿠폰·포인트·리뷰·찜
- 대량 상품 데이터
- 테스트하지 않은 기능을 완료로 기록하는 것
