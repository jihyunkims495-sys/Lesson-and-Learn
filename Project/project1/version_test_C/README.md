# ONEPIECE

AX 1기 프로젝트(1) - Team E
Next.js 기반 패션 쇼핑몰

<!-- 배포 주소가 있으면 여기에 추가: https://... -->

## 팀원

- @Alexandros509 (최기혁)
- @jihyunkims495-sys (김지현)
- @tuski0 (선병철)
- @yoosangjn-stack (유상진)

## 프로젝트 목표

쇼핑몰 주제를 정하고, Next.js와 Supabase로 상품 탐색부터 주문·결제까지 이어지는 구매 흐름을 구현합니다.

## 주요 기능

| 영역      | 기능                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| 메인      | 브랜드 인덱스 영상, 로고, 헤더 카테고리 드롭다운                                                  |
| 상품 목록 | Supabase 상품 조회, 2단 카테고리 필터, 정렬, 그리드 전환, 카드 호버                               |
| 상품 상세 | Supabase 상세 조회, 이미지 클릭 확대, 사이즈 선택·사이즈 가이드, 추천 상품, 최근 본 상품          |
| 장바구니  | 공통 CART Drawer, 장바구니 페이지, 헤더 수량 표시, 회원 전환 시 초기화                            |
| 주문·결제 | 회원 전용 주문서, 주소 검색, 토스페이먼츠 테스트 결제, Supabase 주문·결제 저장                    |
| 회원      | Supabase 로그인·회원가입, 비밀번호 찾기·재설정, 마이페이지, 주문 내역                             |

## 기술 스택

| 구분       | 사용 기술                                   |
| ---------- | ------------------------------------------- |
| 프레임워크 | Next.js 16 (App Router), React 19           |
| 언어       | TypeScript                                  |
| 스타일     | Tailwind CSS 4, shadcn/ui, lucide-react     |
| 상태 관리  | Zustand                                     |
| 백엔드     | Supabase (Auth, Database, Storage)          |
| 결제       | 토스페이먼츠 SDK v2 (테스트 결제)           |
| 코드 품질  | ESLint, Prettier, Node.js 내장 테스트 러너  |

## 시작하기

### 1. 의존성 설치

```bash
npm ci
```

### 2. 환경 변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

| 변수                                   | 설명                                   |
| -------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase 프로젝트 URL                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 공개(Publishable) 키          |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY`          | 토스페이먼츠 테스트 클라이언트 키      |
| `TOSS_SECRET_KEY`                      | 토스페이먼츠 테스트 시크릿 키          |

- 토스 키는 같은 상점의 테스트 키 한 쌍을 사용합니다. (주문서형·결제창형 `test_gck_` / `test_gsk_`, API 개별 연동 `test_ck_` / `test_sk_`)
- Supabase 서버 키(`SUPABASE_SECRET_KEY`)는 필요하지 않습니다.
- `.env.local`은 커밋하지 않습니다.

### 3. 데이터베이스 준비

Supabase SQL Editor에서 아래 순서로 진행합니다.

1. `supabase/seed-catalog.sql`: 카테고리·상품·상품 이미지 정보 입력
2. `product-images` Storage 버킷에 상품 이미지 업로드
3. `supabase/verify-catalog.sql`: 입력·업로드 결과 확인
4. `supabase/migrations/202610220001_test_checkout.sql`: 주문 준비·결제 승인 저장 함수 추가
5. `supabase/migrations/202610220002_member_test_checkout.sql`: 로그인 회원용 테스트 결제 함수 추가
6. `supabase/seed-checkout-demo.sql`: 데모용 상품 옵션 추가
7. `supabase/seed-product-variants.sql`: 전체 상품 사이즈 옵션 추가

자세한 내용은 [상품 데이터·이미지 업로드 안내](supabase/UPLOAD_GUIDE.md)와 [토스 테스트 결제 안내](docs/TOSS_TEST_PAYMENT.md)를 참고하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 에 접속합니다.

## 스크립트

| 명령어                 | 설명                                                    |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | 개발 서버 실행                                          |
| `npm run lint`         | ESLint 검사                                             |
| `npm run test`         | `src/**/*.test.ts` 테스트 실행                          |
| `npm run build`        | 프로덕션 빌드 (`prebuild`에서 테스트를 먼저 실행)       |
| `npm run start`        | 빌드 결과 실행                                          |
| `npm run format`       | Prettier로 코드 정리                                    |
| `npm run format:check` | Prettier 형식 검사                                      |

> 테스트가 실패하면 `npm run build`도 실패합니다.

## 페이지 경로

| 경로                                    | 화면                              | 비고           |
| --------------------------------------- | --------------------------------- | -------------- |
| `/`                                     | 메인                              |                |
| `/products`                             | 상품 목록                         |                |
| `/products/[id]`                        | 상품 상세                         |                |
| `/cart`                                 | 장바구니                          |                |
| `/checkout`                             | 주문서                            | 로그인 필요    |
| `/checkout/success`, `/checkout/fail`   | 결제 성공·실패                    |                |
| `/orders`                               | 주문 내역                         | 로그인 필요    |
| `/mypage`                               | 마이페이지                        | 로그인 필요    |
| `/login`, `/signup`                     | 로그인·회원가입                   |                |
| `/forgot-password`, `/reset-password`   | 비밀번호 찾기·재설정              |                |

### API

| 경로                               | 설명                         |
| ---------------------------------- | ---------------------------- |
| `/api/orders`                      | 로그인 회원의 주문 내역 조회 |
| `/api/payments/toss/prepare`       | 결제 전 주문 준비            |
| `/api/payments/toss/confirm`       | 토스 결제 승인 및 저장       |

## 폴더 구조

```text
src/
├── app/                # 라우트 (App Router)
│   ├── (shop)/         # 쇼핑몰 화면
│   └── api/            # API 라우트
├── domains/            # 도메인별 컴포넌트·API·타입·유틸
│   ├── account/        # 마이페이지
│   ├── auth/           # 로그인·회원가입
│   ├── cart/           # 장바구니
│   ├── home/           # 메인
│   ├── orders/         # 주문·결제
│   └── products/       # 상품 목록·상세
└── shared/             # 공통 컴포넌트·Supabase 클라이언트·스토어·유틸

supabase/               # 시드·마이그레이션·검증 SQL, 업로드 안내
docs/                   # 프로젝트 명세
```

## 결제 관련 참고

- 결제는 **토스페이먼츠 테스트 결제**이며 실제 결제가 이루어지지 않습니다.
- 주문·결제는 로그인한 회원의 세션으로 Supabase에 저장되며, 승인 금액은 항상 DB의 현재 판매가를 기준으로 합니다.
- 장바구니는 빈 상태로 시작하며, 로그아웃하거나 다른 회원으로 바뀌면 비워집니다. 장바구니의 DB 저장은 아직 지원하지 않습니다.
- 현재 방식은 테스트 전용입니다. 실제 결제에 사용하려면 서버 전용 키 방식으로 전환해야 합니다.

## 프로젝트 문서

[프로젝트 명세](docs/README.md)는 다음 4개 카테고리로 정리되어 있습니다.

1. [고객 분석](docs/01-customer-analysis/README.md)
2. [서비스 기획](docs/02-service-planning/README.md)
3. [지표 검증](docs/03-metrics-validation/README.md)
4. [Task 명세](docs/04-task-specs/README.md)

## 협업 규칙

### 브랜치

```text
개인 작업 브랜치 → dev (리뷰 후 병합) → main (배포·최종 반영 시 별도 PR)
```

- 개인 작업 브랜치는 최신 `dev`에서 생성합니다.
- 브랜치 이름은 `type/작업목적` 형식을 사용합니다. 예: `feat/product-detail`, `fix/product-id-error`
- 기본 브랜치가 `main`이므로, PR을 만들 때 대상(base)이 `dev`인지 확인합니다.

### 커밋·PR

- 커밋과 PR 제목은 `type: 작업 내용` 형식을 사용합니다. 예: `feat: 상품 목록 페이지 구현`
- type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- PR은 최소 한 명의 팀원 리뷰를 받은 후 병합합니다.
- 공용 파일(`package.json`, `src/app/layout.tsx`, `src/shared/mocks/mockData.ts` 등)을 수정할 때는 팀원에게 먼저 공유하고 PR 본문에 변경 이유를 작성합니다.
