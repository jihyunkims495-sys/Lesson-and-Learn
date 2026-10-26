# ONEPIECE Cart Drawer·Mock 데이터·GA4 테스트 환경 — 회의 반영 명세

- 날짜: 2026-10-16 / Asia/Seoul
- 분류: LV.2 / Week 9 / Cart 담당
- 상태: 명세 업데이트 완료 대상, 신규 기능 구현·테스트는 미실행
- 적용 순서: 이 회의 반영본 → 회의 전 명세의 보완 항목. 충돌하는 이전 범위는 이 문서를 우선한다.
- 작성일 기준 GA4 속성·측정 ID는 아직 없음. 우선 외부 전송 없는 로컬 테스트 이벤트 구조부터 진행한다.

## 1. 회의 결정과 오전 목표

| 주제 | 회의 전 계획 | 회의 후 적용 |
| --- | --- | --- |
| 데이터 | Cart 화면 확인용 개별 Mock 추가 | 가상 회원·상품·옵션·Cart의 공통 데이터 계약 정의 |
| 담기 | 상품 상세 연동은 다음 후보 | 실제 담기를 테스트하기 위한 필수 선행 작업 |
| Cart 진입 | Header CART → `/cart` | Header CART → 오른쪽 Drawer → VIEW CART → `/cart` |
| 분석 | 이벤트는 범위 밖 | GA4 표준에 맞는 로컬 테스트 이벤트·시나리오 필수 |
| 실제 GA4 수집 | 없음 | 테스트 속성·측정 ID 준비 후 별도 연결·DebugView 검증 |
| UI | 기존 표시 유지 | 영문 상품명·영문 UI 이름 대문자, 페이지 콘텐츠 좌우 각각 20px, 금액 KRW |

오전의 목표는 '가상 고객이 상품을 고르고 실제 Cart에 담아 Drawer와 전체 Cart로 확인하는 흐름'과 '각 단계의 테스트 이벤트를 확인할 수 있는 구조'를 연결하는 것이다. 실제 결제·회원 인증·운영 전환율 검증은 포함하지 않는다.

GA4 ID가 없으므로 로컬 이벤트 검증 완료와 GA4 실제 연결 완료를 구분한다. 오전에 실제 수집까지 끝났다고 보고하지 않는다. 시간 안에 기능이 남으면 구현한 단계와 남은 단계를 기록한다.

## 2. 지금 확인한 코드·Git 상태

- 작업 기준: 최신 dev를 확인하고 금액 표기 변경과 신규 Cart 기능 작업을 분리한다.
- 금액 표기 변경의 검증과 신규 Cart·Drawer 기능의 검증은 별도 작업으로 구분한다.
- 구현 직전에 통합 브랜치의 최신 변경과 공통 데이터 계약을 다시 확인한다.
- 현재 Mock은 재킷·티셔츠·코트 3개다. 코트와 티셔츠가 같은 Variant ID를 사용해 실제 상품·옵션 계약으로 사용할 수 없다.
- 현재 Product 타입은 `id`, `name`, `size: number`, 이미지 배열, `listPrice`, `salePrice` 등을 가진다. 확정된 Variant 매핑은 없다.
- 상품 상세 `handleAddToCart`는 사이즈 확인 후 성공 문구만 바꾼다. Cart store에 추가하는 코드는 아직 없다.
- Cart와 Header는 같은 Zustand `cartItems`를 읽는다. 수량 증가·감소·삭제 로직은 CartPage에 있다.
- Header CART는 현재 `/cart` Link다. Drawer는 아직 없다.
- 기존 `src/shared/components/ui/dialog.tsx`가 Base UI Dialog를 감싼다. Drawer에 재사용 가능한 기반이며 새로운 라이브러리 설치를 전제로 하지 않는다.
- 소스에서 GA4·gtag 이벤트 연결은 발견되지 않았다. 새로고침 후 상태 복원도 현재 없다.
- Cart main은 아직 `px-12`다. 20px 합의는 `px-5`로 반영해야 한다.

위 내용은 이번 확인 시점의 상태다. 기존 KRW 테스트 통과와 이번 신규 Drawer·이벤트 검증 완료를 구분한다.

## 3. 오늘 필수 To-do 세 묶음

### A. 가상 고객·상품·Variant·Cart 데이터 계약

목적: 팀원이 만든 Mock이 같은 상품과 옵션을 가리키고, 테스트 고객과 상품을 서로 구분할 수 있게 한다.

#### A-1. 가상 고객

테스트용 최소 고객 4종을 정의한다. 아래 필드는 제안 계약이며 실제 로그인·인증·주문 이력 조회를 의미하지 않는다.

| 테스트 ID | 구분 | 과거 구매 횟수 | 테스트 목적 |
| --- | --- | ---: | --- |
| `test-guest-001` | 비회원 | 0 | 로그인 없이 탐색·담기 흐름 확인 |
| `test-member-001` | 회원 | 0 | 첫 구매를 가정한 시나리오 |
| `test-member-002` | 회원 | 1 | 구매 1회 경험을 가정한 시나리오 |
| `test-member-003` | 회원 | 2 | 구매 2회 이상을 가정한 시나리오 |

- 최소 필드: `id`, `memberType` (`guest` 또는 `member`), `purchaseCount`, `isTest: true`.
- 구매 횟수는 합성값이며 실제 주문 데이터로부터 계산한 값이라고 표현하지 않는다.
- 이름·전화·주소·비밀번호·실제 이메일은 이 테스트에 필요하지 않아 추가하지 않는다.
- 개발용 고객 선택에서 시나리오를 바꿀 수 있게 하되, 실제 로그인 메뉴의 인증 상태를 흉내 내어 완료로 표시하지 않는다.
- 비회원도 테스트 실행을 구분하는 ID는 갖지만 GA4의 실제 로그인 `user_id`로 보내지 않는다.
- 파일 후보: `src/shared/types/testCustomer.types.ts`, `src/shared/mocks/mockCustomers.ts`.

#### A-2. 상품 기준은 기존 공용 Product

기존 `MOCK_PRODUCTS`와 Product 타입을 공통 기준으로 사용한다. 새로운 Cart 상품 카탈로그를 별도로 복제하지 않는다. 담기 시점에 `salePrice`·상품명·이미지를 Cart Snapshot으로 복사한다.

우선 아래 4개 상품으로 연결한다. 아래 가격은 이번 확인 시점의 기존 상품 Mock 값이다.

| Product ID | 현재 상품명 | salePrice | 대표 이미지 후보 |
| --- | --- | ---: | --- |
| 5 | 블랙 집업 자켓 | 114,460 | `/products/outerJacketBlack.png` |
| 4 | 블랙 반팔 티셔츠 | 56,260 | `/products/topTShirtBlack.png` |
| 1 | 아이보리 싱글 코트 | 153,260 | `/products/outerCoatIvory.png` |
| 8 | 그레이 풀오버 후디 | 86,330 | `/products/topHoodieGray.png` |

- 영문 상품명으로 변경하는 경우 목록·상세·Cart가 같은 공용 이름을 사용하도록 상품 담당자와 맞춘다. 영문은 대문자 규칙을 적용한다.
- 기존 한글 상품명을 Cart만 별도 영문으로 바꿔 동일 상품이 다르게 보이지 않게 한다.
- 대표 이미지는 기존 `images`에서 `location === 'product_main'` 기준으로 선택한다. 실제 파일 경로를 재사용한다.
- 이전 명세의 723,000원 합성 4종 시나리오는 화면 회귀용으로만 보존한다. 이번 실제 담기·퍼널의 기준 가격과 ID로 사용하지 않는다.

#### A-3. Variant와 Cart 계약

- Variant 최소 필드 후보: `id`, `productId`, `color`, `sizeLabel`.
- Product ID와 Variant ID는 별개다. 다른 상품에 같은 Variant ID를 배정하지 않는다.
- 상세 화면은 현재 숫자형 사이즈 선택을 사용한다. 첫 연결은 화면의 `'1'`, `'2'` 같은 선택값과 대응되는 테스트 Variant를 정의한다. 확정되지 않은 S/M/L 변환은 임의로 만들지 않는다.
- 예시 ID 계약: 상품 5의 BLACK/1 → 10051, BLACK/2 → 10052; 상품 4의 BLACK/2 → 10042; 상품 1의 IVORY/1 → 10011; 상품 8의 GRAY/3 → 10083.
- 모든 Variant의 `productId`는 실제 공용 Mock 상품을 참조해야 한다.
- Cart 항목의 `id`는 행 ID, `productVariantId`는 옵션 ID다. 상세 연결과 이벤트의 상품 식별을 위해 `productId`를 CartItem에 추가하는 변경안을 공유한다.
- 같은 Variant를 다시 담으면 기존 행의 수량이 증가한다. 같은 상품이라도 다른 Variant면 별도 행이다.
- 이름·옵션·가격·이미지의 담기 시점 Snapshot은 유지한다. 합계와 Header 수량은 현재 Cart 배열에서 계산한다.
- 테스트용 담기 시작 상태는 빈 Cart다. 기존 3종 초기값은 UI 회귀 시나리오로 보존하고 퍼널 실행에 미리 담긴 상품으로 사용하지 않는다.

완료 기준: 가상 고객 4종, 상품 4종, Variant 5개와 참조 관계가 문서·타입·Mock에서 일치하고 실제 가격·이미지·옵션으로 담을 수 있는 입력 계약이 정해져야 한다.

### B. 실제 담기 → Cart Drawer → VIEW CART 흐름

#### B-1. 공유 상태와 실제 담기

- 기존 store 파일과 현재 `cartItems`를 재사용한다. 별도의 Drawer 상품 배열을 만들지 않는다.
- 페이지와 Drawer가 함께 사용할 담기·증가·감소·삭제 액션을 한 지점에 둔다. 현재 CartPage 핸들러를 그대로 두고 Drawer에 같은 로직을 복제하지 않는다.
- 옵션 미선택·존재하지 않는 상품/Variant는 안내 후 중단한다. 성공 문구·성공 이벤트는 실제 상태 변경 이후에만 처리한다.
- 최소 수량 1, 단가×수량 합계, 마지막 상품 삭제 시 빈 상태를 유지한다.
- 이번 명세는 담기 후 Drawer를 자동으로 여는 동작을 요구하지 않는다. 현재 성공 안내를 유지하고 Header CART를 눌러 연다.

#### B-2. Header CART

- CART를 누르면 URL 이동 없이 오른쪽 Drawer를 연다. 접근 가능한 버튼 또는 기존 Dialog Trigger로 구현한다.
- 열림 상태는 `isCartOpen`처럼 Boolean 명명 규칙을 따른다. 사용 범위가 Header·Drawer뿐이면 해당 공통 부모에서 관리한다.
- Header 숫자는 기존처럼 전체 수량 합계다.
- 기존 Header의 로고·검색·JOIN·LOGIN·메뉴 동작과 배치를 보존한다.

#### B-3. Drawer

- 기존 Dialog 기반을 검토하여 포커스 이동·키보드 조작·Escape 닫기·포커스 복귀·배경 스크롤 제어를 재사용한다.
- 기존 가운데 정렬 Dialog의 공통 기본값을 전역 변경하지 않는다. CartDrawer 내부에서 오른쪽 패널 위치를 적용한다.
- 제목, 닫기 버튼, 상품 이미지·상품명·옵션·수량·삭제, 상품금액 합계, VIEW CART를 표시한다.
- 상품 행 UI는 기존 CartItemList를 재사용하고 필요할 때만 작은 표시 옵션을 추가한다. 같은 상태를 바꾸는 액션은 페이지와 공유한다.
- VIEW CART는 Next Link로 `/cart`에 이동하면서 Drawer를 닫는다. 현재 수량·상품 목록을 그대로 유지한다.
- 빈 Drawer는 `YOUR CART IS EMPTY.`와 `CONTINUE SHOPPING`을 제공한다. 쇼핑 이동 시 Drawer가 닫힌다.
- 데스크톱은 오른쪽 패널, 모바일은 뷰포트 안에서 내용이 잘리지 않도록 한다. 내부 콘텐츠의 좌우 여백은 각각 20px이며 긴 목록은 패널 안에서 스크롤한다.
- 배경을 덮는 영역과 패널이 고정 Header보다 위에 표시되는지 확인한다.
- UI 영문 이름은 `CART`, `REMOVE`, `VIEW CART`, `CONTINUE SHOPPING` 등 대문자를 사용한다. GA4 이벤트 이름은 표준 소문자 snake_case를 유지한다.
- 금액은 기존 공통 KRW 형식으로 표시한다. 숫자형 데이터에 KRW 문자열을 저장하지 않는다.

완료 기준: Header 클릭 시 URL 유지 → 오른쪽 Drawer 표시 → 수량·삭제·합계·Header 동기화 → VIEW CART 이동 후 같은 상태 확인 → 닫기·Escape·키보드·모바일 점검을 통과해야 한다.

### C. GA4 표준에 맞는 로컬 테스트 이벤트 구조

#### C-1. 지금 구현할 모드

- `trackEvent` 같은 공통 진입점과 이벤트 타입을 만들고, 로컬 기록 어댑터로 확인한다.
- 현재는 GA4 ID가 없으므로 Google 스크립트·수집 요청을 실행하지 않는다. GA4 ID를 임의로 만들거나 다른 프로젝트의 ID를 재사용하지 않는다.
- 실제 액션과 라우트에서 이벤트가 호출되게 연결한다. 테스트 파일에서 임의 이벤트만 만들어 GA4 연결 성공이라고 기록하지 않는다.
- 회원 시나리오·테스트 실행의 변경은 개발용 UI나 테스트 도구로 분리한다. 일반 서비스 화면에 테스트 설명·고객 선택 메뉴를 노출하지 않는다.
- 고객을 바꿔 독립 시나리오를 시작할 때 새 `testRunId`와 빈 Cart를 사용한다. 시나리오 경계를 명시한다.
- Cart 상태 업데이트 함수는 데이터 변경만 처리한다. 이벤트 발행은 액션의 성공 결과를 확인한 공통 경로에서 한 번 처리한다.

#### C-2. 이벤트 계약

표준 이벤트는 Google의 전자상거래 이벤트 의미를 따른다. 사용자 클릭·실제 상태 변경·화면 도착을 구분한다.

| 이벤트 | 종류 | 발행 시점 | 주요 내용 |
| --- | --- | --- | --- |
| `view_item_list` | 표준 | 상품 목록이 표시됨 | 표시한 상품 목록 |
| `select_item` | 표준 | 목록에서 상품을 선택함 | 선택 상품, 목록 정보 |
| `view_item` | 표준 | 유효한 상품 상세 표시 | 실제 상품 ID·이름·판매가 |
| `cart_add_blocked` | 사용자 정의 | 옵션 누락 등으로 담기 중단 | `reason`, 상품 ID; 성공 이벤트 없음 |
| `add_to_cart` | 표준 | 실제 담기 또는 수량 증가 성공 | 이번에 늘어난 수량·금액 |
| `remove_from_cart` | 표준 | 실제 수량 감소·행 삭제 성공 | 이번에 제거한 수량·금액 |
| `cart_drawer_open` | 사용자 정의 | 닫힌 Drawer가 실제 열림 | `source: header`, 현재 수량·합계 |
| `cart_drawer_close` | 사용자 정의 | 열린 Drawer가 실제 닫힘 | 닫기·Escape·배경·이동 구분 |
| `view_cart_click` | 사용자 정의 | VIEW CART 클릭 | 출발 표면: Drawer |
| `view_cart` | 표준 | `/cart` 페이지가 실제 표시됨 | 현재 Cart 전체 items·합계 |

- 이번 계약에서 Drawer 열기는 `cart_drawer_open`으로 구분하고 `view_cart`는 전체 Cart 페이지 도착에만 쓴다. Drawer와 페이지를 같은 단계로 중복 집계하지 않는다.
- 수량 증가·감소·삭제의 표면은 `cart_surface: drawer | page | product_detail`로 구분한다.
- 금액 필드는 숫자다. `currency: 'KRW'`, `value: 114460`, item의 `price: 114460`, `quantity: 1`처럼 보낸다.
- `items[].item_id`는 안정적인 Product ID의 문자열, `item_variant`는 안정적인 Variant ID와 옵션을 식별할 값으로 정한다. 서로 다른 상품을 같은 ID로 보내지 않는다.
- `view_item`·`view_cart`의 value는 해당 화면 상품 합계, 추가·삭제의 value는 실제 증감분 합계다.
- 이벤트 이름·파라미터는 GA4용 소문자 snake_case, 코드 변수는 기존 camelCase 컨벤션을 따른다.
- CHECKOUT은 아직 UI-only다. 실제 주문 절차를 시작하지 않았으므로 `begin_checkout`·`purchase`를 발행하지 않는다. 이번 테스트에서 결제 전환율을 계산하지 않는다.

#### C-3. 테스트 문맥·중복 방지

- 로컬 기록 공통 문맥: `is_test: true`, `test_run_id`, `test_customer_id`, `customer_segment`, `page_path`, `event_id`, `occurred_at`.
- `event_id`는 로컬 중복 확인용이다. GA4가 모든 같은 ID 이벤트를 자동 제거해 준다고 가정하지 않는다.
- 상품 추가 1회는 성공 이벤트 1회다. 사용자 의도대로 2번 추가한 것은 서로 다른 2회다.
- 재렌더·상태 변경만으로 `view_item`·`view_cart`를 다시 발행하지 않는다. 실제 재방문은 새 화면 방문으로 구분한다.
- Strict Mode에서 Effect가 재실행되어도 같은 화면 방문 이벤트가 중복되지 않도록 발행 지점을 점검한다.
- 시간·실행 ID 생성과 브라우저 저장소 접근은 클라이언트 초기화 이후 처리하고, 서버와 브라우저의 첫 화면이 같은 초기 Cart를 그리게 한다.
- 가상 회원 ID는 이번 테스트의 사용자 정의 파라미터다. 실제 로그인 User-ID 기능에 임의로 넣지 않는다. 실제 이름·이메일·전화나 입력 문구를 이벤트·URL에 싣지 않는다.

#### C-4. '편리함'과 '이탈 구간' 확인 방법

| 질문 | 관찰값 | 해석 범위 |
| --- | --- | --- |
| 상품을 담기까지 얼마나 걸리나 | 같은 실행의 첫 `view_item`부터 첫 성공 `add_to_cart`까지 시간 | 테스트 수행 시간 |
| 어디서 담기가 막히나 | `cart_add_blocked` 횟수·이유 | 옵션 미선택 등 관찰된 문제 |
| 담은 뒤 Cart로 이어지나 | add → drawer open → view cart click → 실제 view cart 순서 | 단계별 도달·누락 확인 |
| Drawer에서 수정이 편한가 | 증가·감소·삭제 시도와 실제 결과, 수행자 메모 | 조작의 정확성·질적 관찰 |
| 어디서 다음 단계가 끊기나 | 실행 종료 후 마지막 도달 이벤트 | 다음 단계 미도달 후보 |

- 테스트 단위는 `test_run_id`다. 같은 실행의 이벤트를 발생 순서대로 비교한다.
- 오전 시나리오는 수행자가 완료 또는 중단을 기록하는 유한한 실행으로 검증한다. 개발자가 의도적으로 멈춘 테스트와 실제 고객의 자발적 이탈을 구분한다.
- 이후 실제 GA4 퍼널은 분석 구간·세션·시간 창을 정한 뒤 해석한다. '다음 이벤트가 없음'만으로 이탈 이유를 확정하지 않는다.
- 소수 팀원·가상 회원 시나리오 결과는 계측 검증 자료다. 실제 고객 전환율·구매 편의성 개선의 근거로 일반화하지 않는다.

## 4. 로컬 검증과 실제 GA4 연결의 완료 단계

| 단계 | 이번 상태·완료 조건 |
| --- | --- |
| 데이터 계약 | 고객·Product·Variant·Cart 참조와 가격·옵션 일치 |
| 서비스 흐름 | 실제 담기·Drawer·VIEW CART·기존 Cart 동작 검증 |
| 로컬 계측 | 표준 형태의 이벤트 순서·파라미터·중복·실패 이벤트 검증, Google Analytics 전송 없음 |
| GA4 설정 | 현재 미준비: 테스트 전용 속성·Web 스트림·측정 ID 확보 |
| 실제 수집 검증 | ID 연결 후 DebugView에서 실제 이벤트 확인. 지금은 완료로 표시하지 않음 |
| 분석 | 테스트 수행 기록으로 단계 누락을 확인. 실제 고객 효과 검증은 별도 |

실제 연결 시에는 테스트 속성을 우선 사용하고 공개 측정 ID 환경변수 설정과 어댑터만 연결한다. Google 스크립트는 기존 Next Script 가이드를 따라 한 번 로드하며, SPA 페이지 조회 자동·수동 발행이 겹치지 않게 한다. ID·속성·전송 대상이 확인되기 전에는 외부 수집을 시작하지 않는다.

DebugView용 `debug_mode: true`와 `is_test: true`는 테스트 표시다. 이 값만으로 운영 보고서에서 자동 제외되지 않는다. 운영 속성 필터 설정 변경은 이번 작업에 포함하지 않으며, 테스트 속성 준비 후 분리 상태를 확인한다.

## 5. 파일별 담당 범위와 공유 대상

| 파일 후보 | 목적 | 협업 사항 |
| --- | --- | --- |
| `src/shared/types/testCustomer.types.ts` | 가상 고객 타입 | 테스트 계약 공유 |
| `src/shared/mocks/mockCustomers.ts` | 고객 4종 | 실제 개인정보 없음 |
| `src/domains/products/types/productVariant.types.ts` | 옵션 타입 | 상품 상세 담당자와 계약 |
| `src/domains/products/mocks/productVariants.ts` | 상품 ID·사이즈 대응 | 공용 상품과 일치 |
| `src/domains/cart/types/cart.types.ts` | 상품 ID·Variant·Snapshot 계약 | 기존 참조 유지 |
| `src/shared/store/useCounterStore.ts` | 공통 담기·수량·삭제 액션 | Header·상세·Cart 영향 공유 |
| `src/domains/products/components/ProductDetail.tsx` | 실제 담기·실패 안내 | 상품 상세 담당자와 경계 공유 |
| `src/domains/cart/components/CartDrawer.tsx` | 오른쪽 Cart 패널 | 신규 Cart 컴포넌트 |
| `src/shared/components/Header.tsx` | CART Trigger·열림 상태 | 공용 Header 변경 공유 |
| `src/domains/cart/components/CartItemList.tsx` | 페이지·Drawer 행 재사용 | 기존 표시·조작 보존 |
| `src/app/(shop)/cart/page.tsx` | store 액션·20px·도착 이벤트 | 현재 작업 보존 |
| `src/shared/analytics/analytics.types.ts` | 표준·사용자 정의 이벤트 타입 | 이벤트 계약 공유 |
| `src/shared/analytics/trackEvent.ts` | 로컬 어댑터·검증·전송 경계 | ID 없으면 수집 요청 없음 |
| `src/shared/analytics/analytics.test.ts` | 파라미터·호출 횟수·금액 검증 | 기존 Node 테스트 구성 재사용 |

파일명·세부 분리는 구현 단계에서 현재 구조에 맞춰 최소화한다. 한 번에 이 파일들을 모두 생성하지 않는다. 이미 있는 auth 타입을 읽고 중복 여부를 먼저 확인한다. 가상 고객은 실제 인증 타입과 역할이 다르다.

공용 상품 Mock·Product 타입·Header·store·레이아웃은 실제 수정 범위와 영향을 팀에 공유한다. 기존 Dialog 구현을 바꾸는 대신 Drawer에서 조합한다. 외부 SDK·새 테스트 프레임워크는 기본안에 추가하지 않는다. 실제 GA 스크립트를 배치할 공통 레이아웃 변경은 ID 연결 단계에서 공유한다.

## 6. 수용 테스트

아래 결과는 모두 아직 미실행이다. 자동 테스트와 브라우저 검증을 구분해 실제 출력·조작 결과를 채운다.

| ID | 검증 | 기대 결과 |
| --- | --- | --- |
| M01 | 고객 4종과 Variant 참조 검사 | 합성 고객 구분, 없는 상품·중복 Variant 참조 없음 |
| M02 | 빈 Cart에서 상품 5 / Variant 10051 추가 | 1행·수량1·114,460KRW·Header1, add 이벤트1 |
| M03 | 상품 4 / Variant 10042를 두 번 추가 | 총2행·수량3·226,980KRW·Header3, 추가2회 기록 |
| M04 | 상품 5 / 다른 Variant 10052 추가 | 총3행·수량4·341,440KRW·Header4 |
| M05 | 옵션 미선택으로 담기 | Cart 불변, blocked1, 성공 이벤트0 |
| M06 | Header CART 클릭 | URL 유지, 오른쪽 Drawer 열림, open1 |
| M07 | Drawer 수량·삭제 | 페이지와 동일 액션, Header·요약 일치 |
| M08 | 티셔츠 2개 행 삭제 | 남은 재킷2개·228,920KRW·Header2, remove quantity2 |
| M09 | VIEW CART 클릭 | Drawer 닫힘, `/cart` 도착, 목록·옵션·수량 유지 |
| M10 | 마지막 상품 삭제·처음부터 빈 Cart | 빈 안내·쇼핑 복귀 정상, Header0 |
| M11 | 닫기·Escape·배경·키보드 | 포커스 복귀, 배경 스크롤 회복 |
| M12 | 모바일375·태블릿768·데스크톱1280 | 패널·본문 넘침·겹침 없음, 콘텐츠 좌우20px |
| M13 | 리렌더·Strict Mode·정상 재방문 | 불필요한 중복 없음, 실제 재방문은 구분 |
| M14 | 고객·실행 변경 | 새 실행과 빈 Cart, 이전 실행 로그와 구분 |
| M15 | 이벤트 금액·통화·ID | 숫자값·KRW·Product/Variant·증감 수량 일치 |
| M16 | GA4 ID 미설정 상태 | 로컬 기록만 발생, Analytics 수집 요청0 |
| M17 | 상세에서 중단하는 시나리오 | 마지막 view_item, 후속 단계 미도달로 기록 |
| M18 | 전체 도달 시나리오 | 목록→상세→실제 담기→Drawer→전체 Cart 이벤트 순서 확인 |

별도 후속 G01: 실제 테스트 ID 연결 후 DebugView 수신·중복·테스트 속성 분리 확인. ID 미준비 상태에서는 보류이며 완료 수에 넣지 않는다.

검사 명령: `npm run test`, `npm run lint`, `npm run build`, `git diff --check`, `git status --short --branch`, `git diff --stat`. 기존 빈 로그인·Checkout 라우트의 빌드 차단은 담당자에게 공유하고 이번 변경으로 생긴 실패와 구분한다.

## 7. 구현 순서와 첫 단계

1. 진행 중인 Cart 변경을 보존하고 변경 범위를 확인한다.
2. dev 갱신 → Cart 기능별 개인 브랜치 생성 → 필요한 Cart 변경만 적용한다. 서로 다른 작업의 커밋을 중복 포함하지 않는다. 선행 금액 표기 변경이 미반영이면 해당 의존성을 기록한다.
3. 고객·Product·Variant 계약과 최소 Mock부터 직접 작성·확인한다.
4. 실제 담기 액션과 상세 연결을 검증한다.
5. Header Trigger·Drawer·VIEW CART를 연결한다.
6. 로컬 이벤트 어댑터와 각 발행 지점을 연결하고 M01~M18을 검증한다.
7. GA4 속성 준비 후 실제 연결·DebugView를 별도 검증한다.

개인 PR에 다른 목적의 작업이 섞이지 않도록 준비하고, 파일 하나·행동 하나씩 구현한 뒤 실제 결과를 확인한다.

## 8. 보존·보류 항목과 결과 기록

- 누락 이미지·긴 상품명·행별 금액·영문 대문자 등 오전 수용 기준은 회귀 항목으로 유지하되, 위 새 흐름을 먼저 연결한다.
- Persist·실제 로그인·회원 Cart 분리·DB 저장·재고 상한·결제·배송 정책·A/B 테스트는 이번 오전 필수에 포함하지 않는다.
- 고객 테스트 선택은 관찰 시나리오이며 실제 로그인이나 계정별 보안 격리를 구현한 것이 아니다.
- 테스트 수행 중 현재 가상 고객·test_run_id·시작 상품·예상 값·실제 값·이벤트 순서·최초 오류·최소 수정·재실행 결과·보류 이유를 기록한다.
